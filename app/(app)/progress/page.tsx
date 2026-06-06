"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Heatmap } from "@/components/shared/heatmap";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface SolvedQuestion {
  ID: number;
  Title: string;
  Difficulty: string;
  Topics: string;
}

// Approximate total questions in common topics in LeetCode / database
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

        // Fetch counts
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

  const { strongest, weakest } = getStrongestAndWeakest();

  // Compute peak activity day of week from timestamps
  const getPeakActivityDay = () => {
    const storedTimestamps = localStorage.getItem("solved_questions_timestamps");
    if (!storedTimestamps) return "Wednesdays, 21:00";
    
    try {
      const timestamps = JSON.parse(storedTimestamps) as { [qId: string]: string };
      const days = ["Sundays", "Mondays", "Tuesdays", "Wednesdays", "Thursdays", "Fridays", "Saturdays"];
      const dayCounts = Array(7).fill(0);
      
      Object.values(timestamps).forEach(isoStr => {
        const d = new Date(isoStr);
        dayCounts[d.getDay()]++;
      });
      
      let maxIdx = 3; // default Wednesday
      let maxCount = 0;
      dayCounts.forEach((cnt, idx) => {
        if (cnt > maxCount) {
          maxCount = cnt;
          maxIdx = idx;
        }
      });
      
      if (maxCount === 0) return "Wednesdays, 21:00";
      return `${days[maxIdx]}, Active Solves`;
    } catch (e) {
      return "Wednesdays, 21:00";
    }
  };

  const peakActivity = getPeakActivityDay();

  const insights = [
    { title: "STRONGEST_TOPIC", value: strongest, subvalue: solvedList.length > 0 ? "HIGHEST RELATIVE ACCURACY" : "NO QUESTIONS SOLVED", tone: "secondary" },
    { title: "WEAKEST_TOPIC", value: weakest, subvalue: "FOCUS RECOMMENDED", tone: "danger" },
    { title: "PEAK_ACTIVITY", value: peakActivity, subvalue: "OPTIMIZED LEARN WINDOW", tone: "primary" }
  ];

  const difficultyBreakdown = [
    { label: "LEVEL: EASY", count: `${easySolved}/${totalEasy}`, value: easyPercent, tone: "secondary" },
    { label: "LEVEL: MEDIUM", count: `${mediumSolved}/${totalMedium}`, value: mediumPercent, tone: "tertiary" },
    { label: "LEVEL: HARD", count: `${hardSolved}/${totalHard}`, value: hardPercent, tone: "danger" }
  ];

  const ranking = `TOP ${Math.max(1, Math.round(100 - (solvedCount / totalQuestions) * 100))}%`;

  if (loading) {
    return (
      <AppShell className="max-w-shell mx-auto">
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="font-display text-label-caps tracking-[0.2em]">LOADING_ANALYTICS_MODULE...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell className="max-w-shell mx-auto relative" topbar={null}>
      <div className="pointer-events-none fixed inset-0 -z-10 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(#60A5FA 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }} />
      <section className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="font-display text-headline-lg text-text">ANALYTICS_REPORT</h1>
          <p className="mt-2 text-body-lg text-muted">
            Real-time performance tracking and skill acquisition metrics.
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={() => window.print()} className="hover:bg-surface-high border-outline">EXPORT_PRINT</Button>
          <Button variant="primary" onClick={() => window.location.reload()}>RECALCULATE_STATS</Button>
        </div>
      </section>

      <section className="mb-gutter grid grid-cols-1 gap-gutter md:grid-cols-12">
        <Card className="relative overflow-hidden bg-[#191c1e] p-6 md:col-span-8">
          <div className="absolute right-4 top-4 text-primary/10">
            <div className="h-20 w-20 border-[8px] border-current" />
          </div>
          <div className="relative z-10">
            <span className="mb-4 block text-label-caps text-primary">TOTAL_COMPLETION_INDEX</span>
            <div className="mb-6 flex items-end gap-4">
              <span className="font-data text-data-lg leading-none text-text">
                {completionPercent}
                <span className="text-primary">%</span>
              </span>
              <span className="text-body-lg text-secondary">+{completionPercent}%</span>
            </div>
            <div className="mb-5 flex h-10 border border-outline bg-[#323537]">
              <div className="h-full border-r-2 border-surface bg-primary" style={{ width: `${Math.round(easyPercent * 0.35)}%` }} />
              <div className="h-full border-r-2 border-surface bg-primary" style={{ width: `${Math.round(mediumPercent * 0.5)}%` }} />
              <div className="h-full border-r-2 border-surface bg-primary/60" style={{ width: `${Math.round(hardPercent * 0.15)}%` }} />
              <div className="h-full bg-[#323537]" style={{ width: `${100 - Math.round(easyPercent * 0.35 + mediumPercent * 0.5 + hardPercent * 0.15)}%` }} />
            </div>
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <div>
                <p className="mb-1 text-label-caps text-muted">SOLVED</p>
                <p className="font-data text-data-md">{solvedCount}/{totalQuestions}</p>
              </div>
              <div>
                <p className="mb-1 text-label-caps text-muted">STREAK</p>
                <p className="font-data text-data-md text-tertiary">{currentStreak} DAYS</p>
              </div>
              <div>
                <p className="mb-1 text-label-caps text-muted">AVG_TIME</p>
                <p className="font-data text-data-md">22.4m</p>
              </div>
              <div>
                <p className="mb-1 text-label-caps text-muted">RANKING</p>
                <p className="font-data text-data-md">{ranking}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="flex flex-col bg-[#191c1e] md:col-span-4">
          <CardHeader className="bg-[#1d2022]">SYSTEM_INSIGHTS</CardHeader>
          <div className="space-y-8 p-6">
            {insights.map((item) => (
              <div key={item.title}>
                <div className="mb-2 flex items-center gap-2 text-label-caps">
                  <span
                    className={
                      item.tone === "secondary"
                        ? "text-secondary"
                        : item.tone === "danger"
                          ? "text-danger"
                          : "text-primary"
                    }
                  >
                    {item.title}
                  </span>
                </div>
                <p className="text-body-lg text-[18px] leading-9 text-text">{item.value}</p>
                <p
                  className={`text-[10px] ${
                    item.tone === "secondary"
                      ? "text-secondary"
                      : item.tone === "danger"
                        ? "text-danger"
                        : "text-muted"
                  }`}
                >
                  {item.subvalue}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="mb-gutter grid grid-cols-1 gap-gutter md:grid-cols-12">
        <Card className="bg-[#191c1e] p-6 md:col-span-6">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-label-caps text-text">SOLVE_FREQUENCY_7D</h2>
            <div className="flex gap-2">
              <span className="h-4 w-4 bg-primary" />
              <span className="h-4 w-4 bg-secondary" />
            </div>
          </div>
          <div className="flex h-64 items-end justify-between gap-3 px-2">
            {[
              { day: "MON", value: solvedCount > 0 ? 30 : 10, color: "bg-primary/30" },
              { day: "TUE", value: solvedCount > 0 ? 55 : 20, color: "bg-primary/30" },
              { day: "WED", value: solvedCount > 0 ? 80 : 40, color: "bg-primary" },
              { day: "THU", value: solvedCount > 0 ? 40 : 25, color: "bg-primary/30" },
              { day: "FRI", value: solvedCount > 0 ? 65 : 30, color: "bg-primary/30" },
              { day: "SAT", value: solvedCount > 0 ? 35 : 15, color: "bg-secondary" },
              { day: "SUN", value: solvedCount > 0 ? 20 : 10, color: "bg-secondary" }
            ].map((bar) => (
              <div key={bar.day} className="flex flex-1 flex-col items-center gap-3">
                <div className={`w-full ${bar.color}`} style={{ height: `${bar.value}%` }} />
                <span className="text-label-caps text-muted">{bar.day}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden bg-[#191c1e] p-6 md:col-span-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-label-caps text-text">CONTRIBUTION_MAP</h2>
            <span className="text-label-caps text-muted">YEAR 2026</span>
          </div>
          <Heatmap mode="progress" columns={12} rows={4} />
          <div className="mt-6 flex items-center justify-between text-label-caps text-muted">
            <span>PREV_QUARTER</span>
            <div className="flex items-center gap-1">
              <span>Less</span>
              <div className="h-2 w-2 bg-outline/20" />
              <div className="h-2 w-2 bg-primary/40" />
              <div className="h-2 w-2 bg-primary/70" />
              <div className="h-2 w-2 bg-primary" />
              <span>More</span>
            </div>
            <span>CURRENT_WEEK</span>
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-gutter lg:grid-cols-2">
        <Card className="overflow-hidden bg-[#191c1e]">
          <CardHeader className="flex items-center justify-between">
            <span>TOPIC_DISTRIBUTION</span>
            <span className="text-muted">=</span>
          </CardHeader>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline bg-surface">
                <th className="px-6 py-4 text-label-caps text-muted">MODULE</th>
                <th className="px-6 py-4 text-label-caps text-muted">PROGRESS</th>
                <th className="px-6 py-4 text-right text-label-caps text-muted">COUNT</th>
              </tr>
            </thead>
            <tbody>
              {topicDistribution.map((row) => (
                <tr key={row.label} className="border-b border-outline/30 hover:bg-[#282A2C]">
                  <td className="px-6 py-5 text-body-lg text-text font-bold">{row.label.toUpperCase()}</td>
                  <td className="px-6 py-5">
                    <div className="h-2 border border-outline bg-[#323537]">
                      <div className="h-full bg-primary" style={{ width: `${row.progress}%` }} />
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right font-data text-data-md">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="overflow-hidden bg-[#191c1e]">
          <CardHeader className="flex items-center justify-between">
            <span>DIFFICULTY_BREAKDOWN</span>
            <span className="text-muted">=</span>
          </CardHeader>
          <div className="space-y-10 p-6">
            {difficultyBreakdown.map((row) => (
              <div key={row.label} className="space-y-2">
                <div className="flex items-end justify-between">
                  <span
                    className={`text-label-caps ${
                      row.tone === "secondary"
                        ? "text-secondary"
                        : row.tone === "tertiary"
                          ? "text-tertiary"
                          : "text-danger"
                    }`}
                  >
                    {row.label}
                  </span>
                  <span className="font-data text-data-md">{row.count}</span>
                </div>
                <div className="h-5 border border-outline bg-[#323537]">
                  <div
                    className={
                      row.tone === "secondary"
                        ? "h-full bg-secondary"
                        : row.tone === "tertiary"
                          ? "h-full bg-tertiary"
                          : "h-full bg-danger"
                    }
                    style={{ width: `${row.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}
