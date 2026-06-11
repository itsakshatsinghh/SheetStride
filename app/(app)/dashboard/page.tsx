"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Trophy, Zap, Waypoints, Loader2, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Heatmap } from "@/components/shared/heatmap";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
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

const TOPIC_QUERY_MAP: { [key: string]: string } = {
  "ARRAY & HASHING": "Array",
  "STRINGS": "String",
  "LINKED_LISTS": "Linked List",
  "TREES & GRAPHS": "Tree",
  "DYNAMIC_PROG": "Dynamic Programming",
  "BINARY_SEARCH": "Binary Search"
};

interface SolvedQuestion {
  ID: number;
  Title: string;
  Difficulty: string;
  Topics: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [solvedList, setSolvedList] = useState<SolvedQuestion[]>([]);
  
  // Total question counts from Supabase DB
  const [totalQuestions, setTotalQuestions] = useState(3647);
  const [totalEasy, setTotalEasy] = useState(1000);
  const [totalMedium, setTotalMedium] = useState(1800);
  const [totalHard, setTotalHard] = useState(847);
  
  // Streak metrics
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Daily Mission states
  const [dailyQuest, setDailyQuest] = useState<any>(null);
  const [weakestTopic, setWeakestTopic] = useState("Array");

  async function loadDashboardData() {
    if (!user) return;
    const userId = user.id;

    try {
      setLoading(true);
      
      // 1. Fetch total counts from database
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

      // 2. Fetch user's solved questions using join
      const { data: userProgress, error } = await supabase
        .from("user_progress")
        .select("questions (ID, Title, Difficulty, Topics)")
        .eq("user_id", userId);

      if (error) throw error;

      const solved: SolvedQuestion[] = 
        userProgress?.map((row: any) => row.questions).filter(Boolean) || [];
      
      setSolvedList(solved);

      // 3. Compute streaks from local storage timestamps mapping
      const storedTimestamps = localStorage.getItem("solved_questions_timestamps");
      if (storedTimestamps) {
        try {
          const timestamps = JSON.parse(storedTimestamps) as { [qId: string]: string };
          const dates = Object.values(timestamps)
            .map(isoStr => isoStr.slice(0, 10))
            .filter((value, index, self) => self.indexOf(value) === index) // unique dates
            .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // descending order (newest first)

          if (dates.length > 0) {
            let current = 0;
            let longest = 0;
            let tempStreak = 0;
            
            const todayStr = new Date().toISOString().slice(0, 10);
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().slice(0, 10);

            // Check if user solved today or yesterday to continue current streak
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

            // Compute longest streak
            if (dates.length > 0) {
              tempStreak = 1;
              longest = 1;
              for (let i = 1; i < dates.length; i++) {
                const date1 = new Date(dates[i - 1]);
                const date2 = new Date(dates[i]);
                const diffTime = Math.abs(date1.getTime() - date2.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                if (diffDays === 1) {
                  tempStreak++;
                } else if (diffDays > 1) {
                  longest = Math.max(longest, tempStreak);
                  tempStreak = 1;
                }
              }
              longest = Math.max(longest, tempStreak);
            }

            setCurrentStreak(current);
            setLongestStreak(longest);
          }
        } catch (e) {
          console.error("Failed to parse solved questions timestamps for streak:", e);
        }
      } else {
        // Default fallbacks if no timestamps in local storage yet (use mock seeds)
        setCurrentStreak(5);
        setLongestStreak(12);
      }

      // 4. Calculate weakest topic and fetch Daily Mission question
      const topicStatsMap: { [key: string]: number } = {};
      solved.forEach((q) => {
        if (q.Topics) {
          q.Topics.split(",").forEach((t) => {
            const cleanTopic = t.trim();
            topicStatsMap[cleanTopic] = (topicStatsMap[cleanTopic] || 0) + 1;
          });
        }
      });

      const TOPIC_DENOMINATORS: { [key: string]: number } = {
        "Array": 500,
        "String": 300,
        "Hash Table": 250,
        "Dynamic Programming": 350,
        "Tree": 200,
        "Graph": 150,
        "Binary Search": 130,
        "Linked List": 90
      };

      let computedWeakest = "Array";
      let lowestRatio = 1.0;
      Object.entries(TOPIC_DENOMINATORS).forEach(([topic, total]) => {
        const solvedCount = topicStatsMap[topic] || 0;
        const ratio = solvedCount / total;
        if (ratio < lowestRatio) {
          lowestRatio = ratio;
          computedWeakest = topic;
        }
      });
      setWeakestTopic(computedWeakest);

      // Fetch unsolved questions in weakest topic
      const solvedIdsSet = new Set(solved.map(q => q.ID));
      const { data: topicQuestions } = await supabase
        .from("questions")
        .select("ID, Title, Difficulty, Link, Topics")
        .ilike("Topics", `%${computedWeakest}%`)
        .limit(50);

      let quest = null;
      if (topicQuestions) {
        quest = topicQuestions.find(q => !solvedIdsSet.has(q.ID));
      }

      // Fallback
      if (!quest) {
        const { data: generalQuestions } = await supabase
          .from("general_questions" as any) // fallback table or questions fallback
          .select("ID, Title, Difficulty, Link, Topics")
          .limit(100);

        if (!generalQuestions) {
          const { data: altQuestions } = await supabase
            .from("questions")
            .select("ID, Title, Difficulty, Link, Topics")
            .limit(100);
          quest = altQuestions?.find(q => !solvedIdsSet.has(q.ID));
        } else {
          quest = generalQuestions.find(q => !solvedIdsSet.has(q.ID));
        }
      }
      setDailyQuest(quest);

    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const handleToggleDailyMission = async () => {
    if (!user || !dailyQuest) return;
    const userId = user.id;
    const qId = dailyQuest.ID;
    const timestamps = JSON.parse(localStorage.getItem("solved_questions_timestamps") || "{}");

    try {
      const { error } = await supabase
        .from("user_progress")
        .insert({ user_id: userId, question_id: qId });
      if (error) throw error;

      timestamps[qId] = new Date().toISOString();
      localStorage.setItem("solved_questions_timestamps", JSON.stringify(timestamps));
      
      // Reload dashboard data dynamically
      await loadDashboardData();
    } catch (err) {
      console.error("Failed to log Daily Mission solve state:", err);
    }
  };

  // Derived metrics
  const solvedCount = solvedList.length;
  const progressPercent = totalQuestions > 0 ? Math.round((solvedCount / totalQuestions) * 100) : 0;
  
  const easySolved = solvedList.filter(q => q.Difficulty.toLowerCase() === "easy").length;
  const mediumSolved = solvedList.filter(q => q.Difficulty.toLowerCase() === "medium").length;
  const hardSolved = solvedList.filter(q => q.Difficulty.toLowerCase() === "hard").length;

  const easyPercent = totalEasy > 0 ? Math.round((easySolved / totalEasy) * 100) : 0;
  const mediumPercent = totalMedium > 0 ? Math.round((mediumSolved / totalMedium) * 100) : 0;
  const hardPercent = totalHard > 0 ? Math.round((hardSolved / totalHard) * 100) : 0;

  // Calculate topic counts
  const getTopicProgress = () => {
    const topicMap: { [topic: string]: number } = {};
    solvedList.forEach((q) => {
      if (q.Topics) {
        q.Topics.split(",").forEach((t) => {
          const cleanTopic = t.trim().toUpperCase();
          topicMap[cleanTopic] = (topicMap[cleanTopic] || 0) + 1;
        });
      }
    });

    const standardTopics = [
      { name: "ARRAY & HASHING", count: topicMap["ARRAY"] || topicMap["HASH TABLE"] || 0 },
      { name: "STRINGS", count: topicMap["STRING"] || 0 },
      { name: "LINKED LISTS", count: topicMap["LINKED LIST"] || 0 },
      { name: "TREES & GRAPHS", count: (topicMap["TREE"] || 0) + (topicMap["GRAPH"] || 0) },
      { name: "DYNAMIC PROG", count: topicMap["DYNAMIC PROGRAMMING"] || topicMap["DP"] || 0 },
      { name: "BINARY SEARCH", count: topicMap["BINARY SEARCH"] || 0 }
    ];

    const maxCount = Math.max(...standardTopics.map(t => t.count)) || 1;
    return standardTopics.map(t => ({
      name: t.name,
      value: Math.min(100, Math.round((t.count / maxCount) * 100))
    }));
  };

  const topicProgress = getTopicProgress();

  // Stats boxes mapping
  const stats = [
    { label: "GLOBAL PROGRESS", value: progressPercent, subtext: "System completion", tone: "primary", suffix: "%" },
    { label: "CURRENT STREAK", value: currentStreak, subtext: "Consecutive solves", tone: "secondary", suffix: " DAYS" },
    { label: "LONGEST STREAK", value: longestStreak, subtext: "Personal record", tone: "tertiary", suffix: " DAYS" }
  ];

  // Slice last 4 solved questions for recent log
  const recentLogs = solvedList.slice(-4).reverse().map((q, idx) => {
    const tones: { [key: string]: string } = { easy: "secondary", medium: "tertiary", hard: "danger" };
    const relativeTimes = ["2 HOURS AGO", "5 HOURS AGO", "YESTERDAY", "2 DAYS AGO"];
    
    return {
      title: q.Title,
      difficulty: q.Difficulty.toUpperCase(),
      time: relativeTimes[idx] || "RECENTLY",
      tone: tones[q.Difficulty.toLowerCase()] || "primary"
    };
  });

  // const level = `LEVEL ${Math.floor(solvedCount / 10) + 1} CODER`;

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
        staggerChildren: 0.1
      }
    }
  };

  const revealItem = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  };

  return (
    <AppShell className="space-y-stack-lg max-w-container-max mx-auto px-gutter" gridBackground>
      
      {/* Hero section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-8 bg-[#1C1C1C] border border-[#2B2B2B] p-stack-lg rounded-lg relative overflow-hidden group hover:translate-y-[-4px] transition-all duration-300 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
        >
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
            <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
          </div>

          <header className="flex justify-between items-start mb-stack-lg">
            <div>
              <span className="font-mono-label text-mono-label text-primary uppercase mb-2 block">Mission Hub</span>
              <h1 className="font-headline-lg text-headline-lg uppercase tracking-tight text-on-surface">
                MISSION STATUS: <span className="text-secondary">ACTIVE</span>
              </h1>
            </div>
            <div className="text-right select-none hidden sm:block">
              <span className="font-mono-label text-mono-label text-outline flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">info</span> System v2.0.0
              </span>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg relative z-10">
            <div className="space-y-stack-sm">
              <p className="font-mono-label text-mono-label text-outline uppercase">Current Track</p>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <span className="material-symbols-outlined text-primary">dynamic_form</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md uppercase">Patterns Mastered</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{solvedCount} solved</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-stack-sm">
              <p className="font-mono-label text-mono-label text-outline uppercase">Next Milestone</p>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-tertiary/10 rounded-lg border border-tertiary/20">
                  <span className="material-symbols-outlined text-tertiary">military_tech</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline-md text-headline-md">Top 1% Global Rank</h3>
                  <div className="w-full bg-surface-container-lowest h-1.5 mt-2 rounded-full overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-primary to-secondary"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats metrics block */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="lg:col-span-4 grid grid-rows-3 gap-stack-md"
        >
          {stats.map((stat, i) => (
            <motion.div 
              key={stat.label}
              variants={revealItem}
              whileHover={{ y: -2, scale: 1.01, borderColor: "rgba(178,210,255,0.4)" }}
              className="bg-[#1C1C1C] border border-[#2B2B2B] p-stack-md rounded-lg flex items-center justify-between group transition-all"
            >
              <div>
                <p className="font-mono-label text-mono-label text-outline uppercase">{stat.label}</p>
                <h2 className={cn(
                  "font-mono-stats text-mono-stats",
                  stat.tone === "secondary" ? "text-secondary" : stat.tone === "tertiary" ? "text-tertiary" : "text-on-surface"
                )}>
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </h2>
              </div>
              <span className={cn(
                "material-symbols-outlined text-4xl opacity-50 transition-opacity group-hover:opacity-80",
                stat.tone === "secondary" ? "text-secondary" : stat.tone === "tertiary" ? "text-tertiary" : "text-primary"
              )}>
                {i === 0 ? "data_exploration" : i === 1 ? "local_fire_department" : "workspace_premium"}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Contribution Heatmap Map Section */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="bg-[#1C1C1C] border border-[#2B2B2B] p-stack-lg rounded-lg shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
      >
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Contribution Map</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Visualizing problem solving consistency across the cycles.</p>
          </div>
          <div className="flex items-center gap-2 font-mono-label text-mono-label text-outline">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-surface-container-lowest"></div>
              <div className="w-3 h-3 bg-primary/20 rounded-sm"></div>
              <div className="w-3 h-3 bg-primary/40 rounded-sm"></div>
              <div className="w-3 h-3 bg-primary/60 rounded-sm"></div>
              <div className="w-3 h-3 bg-primary rounded-sm"></div>
            </div>
            <span>More</span>
          </div>
        </header>

        {/* Heatmap renderer */}
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <Heatmap mode="dashboard" />
        </div>
      </motion.section>

      {/* Bottom widgets grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        {/* Daily Mission */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="lg:col-span-1 bg-[#1C1C1C] border border-[#2B2B2B] p-stack-lg rounded-lg mission-pulse flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-6">
              <span className="font-mono-label text-mono-label text-primary bg-primary/10 px-2 py-1 rounded">PRIORITY: OMEGA</span>
              <span className="material-symbols-outlined text-primary">target</span>
            </div>
            
            {dailyQuest ? (
              <div className="space-y-4">
                <h2 className="font-headline-md text-headline-md text-on-surface line-clamp-1">{dailyQuest.Title}</h2>
                <div className="flex gap-2">
                  <Badge 
                    tone={
                      dailyQuest.Difficulty.toLowerCase() === "easy" ? "secondary" : 
                      dailyQuest.Difficulty.toLowerCase() === "medium" ? "tertiary" : "danger"
                    }
                  >
                    {dailyQuest.Difficulty.toUpperCase()}
                  </Badge>
                  <span className="text-[10px] text-muted self-center uppercase truncate">{dailyQuest.Topics?.split(",")[0]}</span>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Resolve this logic gate to expand your cognitive index. Selected topic: <strong className="text-secondary">{weakestTopic.toUpperCase()}</strong>.
                </p>
                
                <div className="space-y-3 pt-4">
                  <a 
                    href={dailyQuest.Link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-2 text-on-secondary text-body-sm bg-secondary p-3 rounded-lg font-bold cursor-pointer hover:brightness-110 active:scale-95 transition-all text-center uppercase"
                  >
                    <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                    INITIATE PROBLEM SOLVING
                  </a>
                  <button 
                    onClick={handleToggleDailyMission}
                    className="w-full flex items-center justify-center gap-2 text-on-surface-variant text-body-sm border border-[#2B2B2B] p-3 rounded-lg hover:bg-surface-variant/10 cursor-pointer transition-all uppercase"
                  >
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                    MARK AS RESOLVED
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted font-display-arcade text-xs">
                ALL SYSTEMS CLEAR
              </div>
            )}
          </div>
          <div className="mt-8 flex items-center justify-between border-t border-outline-variant/30 pt-4">
            <span className="font-mono-label text-mono-label text-outline">REWARD: 500 XP</span>
            <span className="material-symbols-outlined text-tertiary">workspace_premium</span>
          </div>
        </motion.div>

        {/* Topic Proficiency */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="lg:col-span-1 bg-[#1C1C1C] border border-[#2B2B2B] p-stack-lg rounded-lg shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] hover:translate-y-[-4px] transition-all"
        >
          <h2 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">schema</span>
            TOPIC PROFICIENCY
          </h2>
          
          <div className="space-y-6">
            {topicProgress.map((topic) => {
              const queryTopic = TOPIC_QUERY_MAP[topic.name] || "";
              const href = queryTopic ? `/questions?topic=${encodeURIComponent(queryTopic)}` : "/questions";
              
              return (
                <Link key={topic.name} href={href} className="block group/topic">
                  <div className="space-y-2">
                    <div className="flex justify-between font-mono-label text-mono-label">
                      <span className="text-on-surface group-hover/topic:text-primary transition-colors">{topic.name}</span>
                      <span className="text-secondary">{topic.value}%</span>
                    </div>
                    <div className="w-full bg-surface-container-lowest h-1.5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.value}%` }}
                        transition={{ duration: 1.0, ease: "easeOut" }}
                        className="h-full bg-primary"
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </motion.div>

        {/* Recent logs activity list */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="lg:col-span-1 bg-[#1C1C1C] border border-[#2B2B2B] p-stack-lg rounded-lg shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]"
        >
          <h2 className="font-headline-md text-headline-md mb-6 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">history</span>
            RECENT LOGS
          </h2>

          <div className="space-y-4">
            {recentLogs.length === 0 ? (
              <div className="py-12 text-center text-muted font-display-arcade text-xs">
                NO_SUBMISSIONS_LOGGED
              </div>
            ) : (
              recentLogs.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 group">
                  <div className={cn(
                    "w-2 h-2 mt-2 rounded-full",
                    log.tone === "secondary" ? "bg-secondary shadow-[0_0_8px_#4de082]" : 
                    log.tone === "tertiary" ? "bg-tertiary shadow-[0_0_8px_#f9cb13]" : "bg-danger shadow-[0_0_8px_#ffb4ab]"
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="font-body-sm text-body-sm text-on-surface truncate group-hover:text-primary transition-colors">{log.title}</p>
                    <span className="font-mono-label text-[10px] text-outline uppercase">{log.time} | {log.difficulty}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </section>

      {/* Footer metadata */}
      <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#2B2B2B] py-8 opacity-50 md:flex-row">
        <p className="font-mono-label text-xs">TERMINAL SESSION ID: SS-v2.0.0-{user?.id?.slice(0, 8).toUpperCase()}</p>
        <div className="flex gap-6 font-mono-label text-xs">
          <a href="#" className="hover:text-primary transition-colors">DOCS</a>
          <a href="#" className="hover:text-primary transition-colors">SUPPORT</a>
          <a href="#" className="hover:text-primary transition-colors">GITHUB</a>
        </div>
      </footer>

    </AppShell>
  );
}
