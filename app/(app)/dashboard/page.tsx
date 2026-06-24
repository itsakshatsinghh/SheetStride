"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { CheckCircle2, Trophy, Zap, Waypoints, Loader2, ExternalLink, Terminal, Shield, Network, RefreshCw, Coffee, Linkedin, Instagram } from "lucide-react";
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

function ParallaxText() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  
  // Transform scroll position to horizontal translation offsets
  const xLeftScroll = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const xRightScroll = useTransform(scrollYProgress, [0, 1], [-50, 50]);
  
  const springLeft = useSpring(xLeftScroll, { stiffness: 80, damping: 25, restDelta: 0.001 });
  const springRight = useSpring(xRightScroll, { stiffness: 80, damping: 25, restDelta: 0.001 });

  const topicsRow1 = ["ARRAY", "STRING", "HASH TABLE", "DYNAMIC PROGRAMMING", "BINARY SEARCH", "STACK", "QUEUE"];
  const topicsRow2 = ["LINKED LIST", "TREE", "GRAPH", "HEAP", "BACKTRACKING", "GREEDY", "BIT MANIPULATION"];

  return (
    <div ref={containerRef} className="py-4 overflow-hidden flex flex-col gap-3 select-none pointer-events-none opacity-[0.14] my-4 border-y border-[#2D2D2D]/20">
      {/* Row 1 moving Left */}
      <div className="w-full overflow-hidden">
        <motion.div style={{ x: springLeft }} className="w-full">
          <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
            className="flex whitespace-nowrap gap-16 font-mono text-[20px] sm:text-[28px] font-extrabold tracking-[0.35em] text-[#FFD400]"
          >
            {[...topicsRow1, ...topicsRow1].map((topic, i) => (
              <span key={i} className="flex items-center gap-6">
                {topic} <span className="text-[12px] opacity-60">✦</span>
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Row 2 moving Right */}
      <div className="w-full overflow-hidden">
        <motion.div style={{ x: springRight }} className="w-full">
          <motion.div 
            animate={{ x: ["-50%", "0%"] }}
            transition={{ repeat: Infinity, ease: "linear", duration: 30 }}
            className="flex whitespace-nowrap gap-16 font-mono text-[20px] sm:text-[28px] font-extrabold tracking-[0.35em] text-outline"
          >
            {[...topicsRow2, ...topicsRow2].map((topic, i) => (
              <span key={i} className="flex items-center gap-6">
                {topic} <span className="text-[12px] opacity-60">✦</span>
              </span>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
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

  // Interactive console states
  const [activeTab, setActiveTab] = useState<"proficiency" | "logs" | "diagnostics">("proficiency");
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([
    "SYS_BOOT: Cognitive matrix online.",
    "DB_CONN: Established in 12ms.",
    "SECURITY: Integrity checks passed [100%]"
  ]);

  useEffect(() => {
    if (activeTab !== "diagnostics") return;
    const interval = setInterval(() => {
      const messages = [
        "KERN_PING: Latency checks verified at 24ms.",
        "CACHE_SWAP: Flushed 14kb unused heuristics.",
        "SECTOR_SYNC: Solved cluster progress indexed.",
        "STATUS: Cognitive buffer optimization complete.",
        "HEURISTIC: Weakest link mapped to " + weakestTopic.toUpperCase(),
        "INTEGRITY: Neural feedback loop is stable."
      ];
      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      const timestamp = new Date().toLocaleTimeString();
      setDiagnosticLogs(prev => [`[${timestamp}] ${randomMsg}`, ...prev.slice(0, 4)]);
    }, 3000);
    return () => clearInterval(interval);
  }, [activeTab, weakestTopic]);

  async function loadDashboardData() {
    if (!user) return;
    const userId = user.id;

    try {
      setLoading(true);
      
      // 1. Fetch total counts from database
      const { count: countAll } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true });
      if (countAll !== null) setTotalQuestions(countAll);

      // 2. Fetch user's solved questions from user_progress
      const { data: userProgress, error: progressError } = await supabase
        .from("user_progress")
        .select(`
          question_id,
          "completed-at"
        `)
        .eq("user_id", userId)
        .order("completed-at", { ascending: true });

      if (progressError) throw progressError;

      let solved: SolvedQuestion[] = [];
      if (userProgress && userProgress.length > 0) {
        const questionIds = userProgress.map((row: any) => row.question_id);
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("ID, Title, Difficulty, Topics")
          .in("ID", questionIds);

        if (questionsError) throw questionsError;

        const questionsMap = new Map(questionsData?.map((q: any) => [q.ID, q]));
        solved = userProgress
          .map((row: any) => {
            const q = questionsMap.get(row.question_id);
            if (!q) return null;
            return {
              ID: q.ID,
              Title: q.Title,
              Difficulty: q.Difficulty,
              Topics: q.Topics
            };
          })
          .filter(Boolean) as SolvedQuestion[];
      }
      
      setSolvedList(solved);

      // 3. Compute streaks using database RPC function with correct parameter name target_user_id
      const { data: streakData, error: streakError } = await supabase
        .rpc("calculate_user_streaks", { target_user_id: userId });

      if (!streakError && streakData && streakData.length > 0) {
        setCurrentStreak(streakData[0].res_current_streak || 0);
        setLongestStreak(streakData[0].res_max_streak || 0);
      } else {
        // Fallbacks in case RPC fails or returns empty
        setCurrentStreak(0);
        setLongestStreak(0);
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
        .insert({ 
          user_id: userId, 
          question_id: qId,
          completed: true,
          "completed-at": new Date().toISOString()
        });
      if (error) throw error;

      timestamps[qId] = new Date().toISOString();
      localStorage.setItem("solved_questions_timestamps", JSON.stringify(timestamps));
      
      // Dispatch solve event to update heatmap
      window.dispatchEvent(new Event("question-solved"));

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
          className="lg:col-span-8 bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-stack-lg rounded-lg relative overflow-hidden group transition-all duration-300 hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)]"
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
                  <div className="w-full bg-[#181818] h-1.5 mt-2 rounded-full overflow-hidden relative">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full bg-primary"
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
              whileHover={{ y: -2, scale: 1.01, borderColor: "#FFD400", boxShadow: "0 0 24px rgba(255,212,0,0.12)" }}
              className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-stack-md rounded-lg flex items-center justify-between group transition-all"
            >
              <div>
                <p className="font-mono-label text-mono-label text-muted uppercase">{stat.label}</p>
                <h2 className={cn(
                  "font-mono-stats text-mono-stats",
                  stat.tone === "secondary" ? "text-secondary" : stat.tone === "tertiary" ? "text-tertiary" : "text-[#FFD400]"
                )}>
                  <CountUp end={stat.value} suffix={stat.suffix} />
                </h2>
              </div>
              <span className={cn(
                "material-symbols-outlined text-4xl opacity-50 transition-opacity group-hover:opacity-80",
                stat.tone === "secondary" ? "text-secondary" : stat.tone === "tertiary" ? "text-tertiary" : "text-[#FFD400]"
              )}>
                {i === 0 ? "data_exploration" : i === 1 ? "local_fire_department" : "workspace_premium"}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Scroll-Linked Parallax Topics Ticker */}
      <ParallaxText />

      {/* Contribution Heatmap Map Section */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-stack-lg rounded-lg transition-all duration-300 hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)]"
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
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Daily Mission */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="lg:col-span-4 bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-stack-lg rounded-lg mission-pulse flex flex-col justify-between transition-all duration-300 hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)]"
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
                    className="w-full flex items-center justify-center gap-2 text-on-surface-variant text-body-sm border border-[#2D2D2D] p-3 rounded-lg hover:bg-surface-variant/10 cursor-pointer transition-all uppercase"
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

        {/* Interactive console card (8 Columns wide) */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="lg:col-span-8 bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-stack-lg rounded-lg flex flex-col justify-between transition-all duration-300 hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)] min-h-[460px]"
        >
          <div>
            {/* Header: Tab Triggers with spring-animated layoutId background slider */}
            <div className="flex border-b border-[#2D2D2D] pb-3 mb-6 overflow-x-auto gap-2 select-none custom-scrollbar">
              {[
                { id: "proficiency", label: "TOPIC PROFICIENCY", icon: "schema" },
                { id: "logs", label: "RECENT SOLVES", icon: "history" },
                { id: "diagnostics", label: "SYSTEM DIAGNOSTICS", icon: "terminal" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="relative px-4 py-2 font-mono-label text-[10px] sm:text-[11px] uppercase tracking-widest cursor-pointer select-none transition-colors duration-200"
                >
                  <span className={cn(
                    "relative z-10 flex items-center gap-1.5 font-bold",
                    activeTab === tab.id ? "text-primary" : "text-outline hover:text-on-surface"
                  )}>
                    <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                    {tab.label}
                  </span>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="activeDashboardTab"
                      className="absolute inset-0 bg-[#ffd400]/5 border-b-2 border-b-primary rounded-t"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content viewer */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="flex-1"
              >
                {activeTab === "proficiency" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {topicProgress.map((topic) => {
                      const queryTopic = TOPIC_QUERY_MAP[topic.name] || "";
                      const href = queryTopic ? `/questions?topic=${encodeURIComponent(queryTopic)}` : "/questions";
                      
                      return (
                        <Link key={topic.name} href={href} className="block group/topic">
                          <div className="space-y-2">
                            <div className="flex justify-between font-mono-label text-mono-label">
                              <span className="text-on-surface group-hover/topic:text-primary transition-colors text-xs">{topic.name}</span>
                              <span className="text-secondary text-xs">{topic.value}%</span>
                            </div>
                            <div className="w-full bg-[#181818] h-1.5 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${topic.value}%` }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                                className="h-full bg-primary"
                              />
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {activeTab === "logs" && (
                  <div className="space-y-4">
                    {recentLogs.length === 0 ? (
                      <div className="py-12 text-center text-muted font-display-arcade text-xs">
                        NO_SUBMISSIONS_LOGGED
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentLogs.map((log, idx) => (
                          <div key={idx} className="flex items-start gap-3 group bg-[#090909]/40 border border-[#2D2D2D] p-3 rounded-lg hover:border-primary/45 transition-colors">
                            <div className={cn(
                              "w-2.5 h-2.5 mt-1 rounded-full shrink-0",
                              log.tone === "secondary" ? "bg-secondary shadow-[0_0_8px_#4de082]" : 
                              log.tone === "tertiary" ? "bg-tertiary shadow-[0_0_8px_#f9cb13]" : "bg-danger shadow-[0_0_8px_#ffb4ab]"
                            )} />
                            <div className="min-w-0 flex-1">
                              <p className="font-body-sm text-xs text-on-surface truncate group-hover:text-primary transition-colors">{log.title}</p>
                              <span className="font-mono-label text-[9px] text-outline uppercase tracking-wider">{log.time} | {log.difficulty}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "diagnostics" && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-mono text-xs">
                    {/* Diagnostic metrics */}
                    <div className="md:col-span-5 grid grid-cols-2 gap-3">
                      <div className="bg-[#090909]/50 border border-[#2D2D2D] p-3 rounded-lg flex flex-col justify-between">
                        <span className="text-[9px] text-outline uppercase tracking-wider flex items-center gap-1.5"><Network className="w-3.5 h-3.5 text-primary" /> HOST_PING</span>
                        <span className="text-secondary font-bold text-sm">24 ms</span>
                      </div>
                      <div className="bg-[#090909]/50 border border-[#2D2D2D] p-3 rounded-lg flex flex-col justify-between">
                        <span className="text-[9px] text-outline uppercase tracking-wider flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-secondary" /> INTEGRITY</span>
                        <span className="text-secondary font-bold text-sm">100%</span>
                      </div>
                      <div className="bg-[#090909]/50 border border-[#2D2D2D] p-3 rounded-lg flex flex-col justify-between col-span-2">
                        <span className="text-[9px] text-outline uppercase tracking-wider flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-tertiary" /> SYS_ACCURACY</span>
                        <span className="text-primary font-bold text-sm">94.2% (TOP_5%)</span>
                      </div>
                    </div>

                    {/* Live log stream */}
                    <div className="md:col-span-7 bg-[#090909] border border-[#2D2D2D] rounded-lg p-4 font-mono text-[10px] text-outline-variant space-y-2 select-text max-h-[160px] overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-center border-b border-[#2D2D2D] pb-1.5 mb-2 select-none text-[9px] text-outline">
                        <span>LIVE TERMINAL FEED</span>
                        <span className="animate-pulse flex items-center gap-1 text-secondary"><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> ONLINE</span>
                      </div>
                      {diagnosticLogs.map((log, index) => (
                        <div key={index} className={cn(
                          "truncate font-mono",
                          index === 0 ? "text-primary font-bold" : "text-outline/70"
                        )}>
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-6 pt-4 border-t border-outline-variant/30 flex justify-between items-center text-[10px] font-mono-label text-outline/50">
            <span>CONSOLE CLUSTER: ACTIVE</span>
            <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin text-primary" /> REAL-TIME MONITORING</span>
          </div>
        </motion.div>
      </section>

      {/* Footer metadata */}
      <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#2D2D2D] py-8 opacity-50 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="font-display-arcade text-primary text-sm tracking-wider">SHEETSTRIDE</span>
          <span className="text-[9px] font-mono-label text-outline/50">// TERMINAL ACTIVE</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 font-mono-label text-xs">
          <a 
            href="https://rzp.io/rzp/sheetstride" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 hover:text-primary transition-colors group"
          >
            <Coffee className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
            <span>COFFEE</span>
          </a>
          <a 
            href="https://linkedin.com/in/iakshatsingh" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 hover:text-primary transition-colors group"
          >
            <Linkedin className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>LINKEDIN</span>
          </a>
          <a 
            href="https://instagram.com/iakshattsingh" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 hover:text-primary transition-colors group"
          >
            <Instagram className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>INSTAGRAM</span>
          </a>
        </div>
      </footer>


    </AppShell>
  );
}
