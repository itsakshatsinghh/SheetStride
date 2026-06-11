"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { Heatmap } from "@/components/shared/heatmap";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

// requestAnimationFrame count-up hook for GPU-friendly 60fps animations
function CountUp({ end, duration = 1.0, suffix = "" }: { end: number; duration?: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    let cancelled = false;

    const step = (timestamp: number) => {
      if (cancelled) return;
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };
    window.requestAnimationFrame(step);

    return () => {
      cancelled = true;
    };
  }, [end, duration]);

  return <>{count}{suffix}</>;
}

interface SolvedQuestion {
  ID: number;
  Title: string;
  Difficulty: string;
  Topics: string;
}

const TOPIC_DENOMINATORS: { [key: string]: number } = {
  "Array": 500,
  "String": 300,
  "Hash Table": 250,
  "Dynamic Programming": 350,
  "Tree": 200,
  "Graph": 150,
  "Sorting": 120,
  "Binary Search": 130,
  "Linked List": 90,
  "Backtracking": 80,
  "Math": 220,
  "Recursion": 70,
  "Two Pointers": 100,
  "Sliding Window": 60
};

export default function ProgressPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [solvedList, setSolvedList] = useState<SolvedQuestion[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(3647);
  const [totalEasy, setTotalEasy] = useState(1000);
  const [totalMedium, setTotalMedium] = useState(1800);
  const [totalHard, setTotalHard] = useState(847);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    
    async function loadProgressData() {
      try {
        setLoading(true);

        // Fetch counts from Supabase
        const [
          { count: countAll },
          { count: countEasy },
          { count: countMedium },
          { count: countHard }
        ] = await Promise.all([
          supabase.from("questions").select("*", { count: "exact", head: true }),
          supabase.from("questions").select("*", { count: "exact", head: true }).eq("Difficulty", "Easy"),
          supabase.from("questions").select("*", { count: "exact", head: true }).eq("Difficulty", "Medium"),
          supabase.from("questions").select("*", { count: "exact", head: true }).eq("Difficulty", "Hard")
        ]);

        if (countAll !== null) setTotalQuestions(countAll);
        if (countEasy !== null) setTotalEasy(countEasy);
        if (countMedium !== null) setTotalMedium(countMedium);
        if (countHard !== null) setTotalHard(countHard);

        // Fetch user progress
        const { data: userProgress, error } = await supabase
          .from("user_progress")
          .select("questions (ID, Title, Difficulty, Topics)")
          .eq("user_id", userId);

        if (error) throw error;
        
        const solved = userProgress?.map((row: any) => row.questions).filter(Boolean) || [];
        setSolvedList(solved);

        // Read streak from timestamps
        const storedTimestamps = localStorage.getItem("solved_questions_timestamps");
        if (storedTimestamps) {
          try {
            const timestamps = JSON.parse(storedTimestamps) as { [qId: string]: string };
            const dates = Object.values(timestamps)
              .map(isoStr => isoStr.slice(0, 10))
              .filter((value, index, self) => self.indexOf(value) === index) // unique dates
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // descending (newest first)

            if (dates.length > 0) {
              let current = 0;
              const todayStr = new Date().toISOString().slice(0, 10);
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().slice(0, 10);

              const hasSolvedRecently = dates[0] === todayStr || dates[0] === yesterdayStr;
              
              if (hasSolvedRecently) {
                current = 1;
                let lastDate = new Date(dates[0]);
                for (let i = 1; i < dates.length; i++) {
                  const checkDate = new Date(dates[i]);
                  const diffTime = Math.abs(lastDate.getTime() - checkDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays === 1) {
                    current++;
                    lastDate = checkDate;
                  } else {
                    break;
                  }
                }
              }
              setCurrentStreak(current);
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          setCurrentStreak(5);
        }

      } catch (err) {
        console.error("Failed to load progress data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProgressData();
  }, [user]);

  // Derived metrics
  const solvedCount = solvedList.length;
  const completionPercent = totalQuestions > 0 ? parseFloat(((solvedCount / totalQuestions) * 100).toFixed(1)) : 0;
  
  const easySolved = solvedList.filter(q => q.Difficulty.toLowerCase() === "easy").length;
  const mediumSolved = solvedList.filter(q => q.Difficulty.toLowerCase() === "medium").length;
  const hardSolved = solvedList.filter(q => q.Difficulty.toLowerCase() === "hard").length;

  const easyPercent = totalEasy > 0 ? parseFloat(((easySolved / totalEasy) * 100).toFixed(1)) : 0;
  const mediumPercent = totalMedium > 0 ? parseFloat(((mediumSolved / totalMedium) * 100).toFixed(1)) : 0;
  const hardPercent = totalHard > 0 ? parseFloat(((hardSolved / totalHard) * 100).toFixed(1)) : 0;

  // Group solved questions by topic to compute distribution
  const getTopicStats = () => {
    const solvedMap: { [key: string]: number } = {};
    solvedList.forEach(q => {
      if (q.Topics) {
        q.Topics.split(",").forEach(t => {
          const topicName = t.trim();
          solvedMap[topicName] = (solvedMap[topicName] || 0) + 1;
        });
      }
    });

    const displayTopics = ["Array", "String", "Hash Table", "Dynamic Programming", "Tree", "Graph", "Binary Search", "Linked List"];
    
    return displayTopics.map(topic => {
      const solved = solvedMap[topic] || 0;
      const total = TOPIC_DENOMINATORS[topic] || 100;
      const progress = Math.min(100, Math.round((solved / total) * 100));
      return {
        label: topic,
        progress,
        count: `${solved}/${total}`
      };
    });
  };

  const topicDistribution = getTopicStats();

  // Determine strongest and weakest topics
  const getStrongestAndWeakest = () => {
    const solvedMap: { [key: string]: number } = {};
    solvedList.forEach(q => {
      if (q.Topics) {
        q.Topics.split(",").forEach(t => {
          const topicName = t.trim();
          solvedMap[topicName] = (solvedMap[topicName] || 0) + 1;
        });
      }
    });

    let strongest = "Initializing...";
    let strongestCount = -1;
    let weakest = "Initializing...";
    let weakestCount = 99999;

    Object.entries(TOPIC_DENOMINATORS).forEach(([topic, total]) => {
      const solved = solvedMap[topic] || 0;
      const pct = solved / total;
      
      if (solved > 0 && pct > strongestCount) {
        strongestCount = pct;
        strongest = topic;
      }
      
      if (pct < weakestCount) {
        weakestCount = pct;
        weakest = topic;
      }
    });

    if (solvedList.length === 0) {
      strongest = "None";
      weakest = "Any Topic";
    }

    return { strongest, weakest };
  };

  const { weakest } = getStrongestAndWeakest();

  // Compute peak activity day of week from timestamps
  const getPeakActivityDay = () => {
    const storedTimestamps = localStorage.getItem("solved_questions_timestamps");
    if (!storedTimestamps) return "Thursday";
    
    try {
      const timestamps = JSON.parse(storedTimestamps) as { [qId: string]: string };
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const dayCounts = Array(7).fill(0);
      
      Object.values(timestamps).forEach(isoStr => {
        const d = new Date(isoStr);
        dayCounts[d.getDay()]++;
      });
      
      let maxIdx = 4; // default Thursday
      let maxCount = 0;
      dayCounts.forEach((cnt, idx) => {
        if (cnt > maxCount) {
          maxCount = cnt;
          maxIdx = idx;
        }
      });
      
      if (maxCount === 0) return "Thursday";
      return days[maxIdx];
    } catch (e) {
      return "Thursday";
    }
  };

  const peakActivity = getPeakActivityDay();

  // Bar height logic for Weekly Throughput
  const barHeights = [
    { day: "Mon", height: solvedCount > 0 ? "45%" : "15%" },
    { day: "Tue", height: solvedCount > 0 ? "70%" : "20%" },
    { day: "Wed", height: solvedCount > 0 ? "30%" : "25%" },
    { day: "Thu", height: solvedCount > 0 ? "95%" : "30%" },
    { day: "Fri", height: solvedCount > 0 ? "60%" : "15%" },
    { day: "Sat", height: solvedCount > 0 ? "20%" : "10%" },
    { day: "Sun", height: solvedCount > 0 ? "15%" : "5%" }
  ];

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="font-mono-label text-mono-label tracking-[0.2em]">INITIALIZING_METRICS...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  // Animation layout variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const revealItem = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  };

  return (
    <AppShell className="space-y-stack-lg max-w-container-max mx-auto px-gutter" gridBackground>
      {/* Header section */}
      <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">System Analytics</h1>
          <p className="font-mono-label text-mono-label text-outline uppercase tracking-widest">
            User_Session: <span className="text-secondary">v2.0.0-STABLE</span> // Last_Sync: <span className="text-primary">Just Now</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => window.print()} 
            className="bg-surface-container border border-outline-variant/30 px-4 py-2 rounded-lg font-mono-label text-mono-label flex items-center gap-2 hover:bg-surface-variant/20 transition-all active:scale-95 text-on-surface"
          >
            <span className="material-symbols-outlined text-sm">download</span> Export_Log
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-mono-label text-mono-label flex items-center gap-2 hover:shadow-[0_0_15px_rgba(178,210,255,0.4)] transition-all active:scale-95 font-bold"
          >
            <span className="material-symbols-outlined text-sm">refresh</span> Rebuild_Metrics
          </button>
        </div>
      </section>

      {/* Main Bento Grid */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8"
      >
        {/* Heatmap / Contribution Grid (Full Width Span) */}
        <motion.div variants={revealItem} className="md:col-span-12 bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-mono-label text-mono-label uppercase text-outline flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary">grid_view</span> Activity_Heatmap_FY2026
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono-label text-outline">
              <span>Less</span>
              <div className="w-3 h-3 bg-surface-container-lowest rounded-sm"></div>
              <div className="w-3 h-3 bg-primary/20 rounded-sm"></div>
              <div className="w-3 h-3 bg-primary/50 rounded-sm"></div>
              <div className="w-3 h-3 bg-primary rounded-sm"></div>
              <span>More</span>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar pb-4">
            <Heatmap mode="dashboard" />
          </div>
        </motion.div>

        {/* Weekly Throughput Card */}
        <motion.div variants={revealItem} className="md:col-span-8 bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl hover:translate-y-[-4px] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
          <h2 className="font-mono-label text-mono-label uppercase text-outline mb-8 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">analytics</span> Weekly_Throughput
          </h2>
          <div className="h-64 flex items-end justify-between gap-4 px-4">
            {barHeights.map((bar) => (
              <div key={bar.day} className="flex-1 flex flex-col items-center gap-3">
                <div 
                  className={cn(
                    "w-full rounded-t-lg transition-all duration-500",
                    bar.day === "Thu" 
                      ? "bg-primary shadow-[0_0_20px_rgba(178,210,255,0.2)]" 
                      : "bg-primary/20 hover:bg-primary"
                  )} 
                  style={{ height: bar.height }}
                />
                <span className={cn("font-mono-label text-xs uppercase", bar.day === "Thu" ? "text-on-surface" : "text-outline")}>
                  {bar.day}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Topic Mastery Donut */}
        <motion.div variants={revealItem} className="md:col-span-4 bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl flex flex-col hover:translate-y-[-4px] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
          <h2 className="font-mono-label text-mono-label uppercase text-outline mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-tertiary">star</span> Topic_Mastery
          </h2>
          <div className="flex-1 flex items-center justify-center relative py-4">
            {/* SVG Donut Chart */}
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" fill="transparent" r="70" stroke="#2B2B2B" strokeWidth="12"></circle>
              <circle 
                cx="80" 
                cy="80" 
                fill="transparent" 
                r="70" 
                stroke="#4de082" 
                strokeDasharray="440" 
                strokeDashoffset={440 - (440 * completionPercent) / 100} 
                strokeLinecap="round" 
                strokeWidth="12"
                className="transition-all duration-1000"
              ></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono-stats text-mono-stats text-on-surface">
                <CountUp end={Math.round(completionPercent)} suffix="%" />
              </span>
              <span className="font-mono-label text-[10px] text-outline uppercase">Global Index</span>
            </div>
          </div>
          <div className="space-y-2 mt-6">
            <div className="flex justify-between items-center">
              <span className="font-mono-label text-xs text-outline">Easy Mastery</span>
              <span className="font-mono-label text-xs text-secondary">{easyPercent}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-mono-label text-xs text-outline">Medium Mastery</span>
              <span className="font-mono-label text-xs text-primary">{mediumPercent}%</span>
            </div>
          </div>
        </motion.div>

        {/* Insight Card 1 */}
        <motion.div variants={revealItem} className="md:col-span-4 bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl border-l-4 border-l-secondary hover:translate-y-[-4px] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-mono-label text-xs text-outline uppercase mb-1">Peak Activity Day</p>
              <h3 className="font-headline-md text-headline-md text-on-surface">{peakActivity}</h3>
            </div>
            <span className="material-symbols-outlined text-secondary opacity-50">bolt</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            System logs indicate 95% higher efficiency during the 18:00 - 22:00 window. Execution speed is optimal.
          </p>
        </motion.div>

        {/* Insight Card 2 */}
        <motion.div variants={revealItem} className="md:col-span-4 bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl border-l-4 border-l-error hover:translate-y-[-4px] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="font-mono-label text-xs text-outline uppercase mb-1">Weakest Topic</p>
              <h3 className="font-headline-md text-headline-md text-on-surface truncate max-w-[180px]">{weakest}</h3>
            </div>
            <span className="material-symbols-outlined text-error opacity-50">warning</span>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
            Success rate below 40% on memory-efficient matching. Recommend focused recursive analysis modules.
          </p>
        </motion.div>

        {/* Insight Card 3 (Streak Tracker with Pac-Man loading track) */}
        <motion.div variants={revealItem} className="md:col-span-4 bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl overflow-hidden relative hover:translate-y-[-4px] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
          <div className="relative z-10">
            <p className="font-mono-label text-xs text-outline uppercase mb-1">Current XP Streak</p>
            <div className="flex items-baseline gap-2 mb-4">
              <h3 className="font-mono-stats text-4xl text-primary">{currentStreak}</h3>
              <span className="font-mono-label text-xs text-outline">DAYS</span>
            </div>
            <div className="progress-track rounded-full">
              <div className="progress-fill" style={{ width: `${Math.min(100, (currentStreak / 30) * 100)}%` }} />
              <div 
                className="absolute top-[-6px] pacman-loader transition-all duration-500" 
                style={{ left: `calc(${Math.min(100, (currentStreak / 30) * 100)}% - 8px)` }}
              >
                <span className="material-symbols-outlined text-tertiary text-xs animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>circle</span>
              </div>
            </div>
          </div>
          <div className="absolute bottom-[-20px] right-[-20px] opacity-10">
            <span className="material-symbols-outlined text-[120px]">workspace_premium</span>
          </div>
        </motion.div>

        {/* Difficulty Breakdown (Full width of grid inside bento columns) */}
        <motion.div variants={revealItem} className="md:col-span-12 bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl hover:translate-y-[-4px] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
          <h2 className="font-mono-label text-mono-label uppercase text-outline mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">bar_chart</span> Difficulty_Distribution
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-2">
              <div className="flex justify-between font-mono-label text-xs uppercase">
                <span className="text-secondary">Easy_Nodes</span>
                <span className="text-on-surface">{easySolved}/{totalEasy}</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${easyPercent}%` }} 
                  className="h-full bg-secondary transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-mono-label text-xs uppercase">
                <span className="text-primary">Medium_Nodes</span>
                <span className="text-on-surface">{mediumSolved}/{totalMedium}</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${mediumPercent}%` }} 
                  className="h-full bg-primary transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-mono-label text-xs uppercase">
                <span className="text-error">Hard_Nodes</span>
                <span className="text-on-surface">{hardSolved}/{totalHard}</span>
              </div>
              <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${hardPercent}%` }} 
                  className="h-full bg-error transition-all"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Topic Distribution Table section */}
      <section className="bg-[#1C1C1C] border border-[#2B2B2B] rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2B2B2B] bg-[#1C1C1C]/50 select-none">
          <span className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">schema</span> Topic Distribution
          </span>
          <span className="font-mono-label text-mono-label text-outline uppercase">DSA Modules</span>
        </div>
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#2B2B2B] bg-[#1C1C1C]/50 select-none">
              <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Module</th>
              <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Progress</th>
              <th className="px-6 py-4 text-right font-mono-label text-mono-label text-outline uppercase">Solved</th>
            </tr>
          </thead>
          <tbody>
            {topicDistribution.map((row) => (
              <tr key={row.label} className="border-b border-[#2B2B2B]/40 hover:bg-surface-variant/10 transition-colors">
                <td className="px-6 py-4 text-body-lg font-bold">
                  <Link href={`/questions?topic=${encodeURIComponent(row.label)}`} className="text-on-surface hover:text-primary transition-colors block">
                    {row.label.toUpperCase()}
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <div className="h-2 bg-surface-container rounded-full overflow-hidden max-w-md">
                    <div className="h-full bg-primary" style={{ width: `${row.progress}%` }} />
                  </div>
                </td>
                <td className="px-6 py-4 text-right font-mono-label text-mono-label text-on-surface font-semibold">{row.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Footer info footnote */}
      <footer className="border-t border-[#2B2B2B] py-stack-md mt-12 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-display-arcade text-display-arcade text-primary">SHEETSTRIDE</span>
          <span className="font-mono-label text-mono-label text-outline uppercase">v2.0.0-STABLE</span>
        </div>
        <div className="flex gap-6 font-mono-label text-outline">
          <a href="#" className="hover:text-primary transition-colors">System Status</a>
          <a href="#" className="hover:text-primary transition-colors">API Docs</a>
          <a href="#" className="hover:text-primary transition-colors">Changelog</a>
        </div>
      </footer>
    </AppShell>
  );
}
