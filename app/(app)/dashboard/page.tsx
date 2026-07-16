"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { CheckCircle2, Trophy, Zap, Waypoints, Loader2, ExternalLink, Terminal, Shield, Network, RefreshCw, Coffee, Linkedin, Instagram, ListTodo, BookOpen, Sparkles, Clock, Edit, Settings, X } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Heatmap } from "@/components/shared/heatmap";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn, fetchWithCache } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { buildRoadmap, Roadmap, RoadmapTask } from "@/lib/planner-engine";

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


const AVAILABLE_TOPICS = [
  "Array",
  "String",
  "Hash Table",
  "Linked List",
  "Tree",
  "Graph",
  "Binary Search",
  "Dynamic Programming",
  "Greedy",
  "Stack",
  "Queue",
  "Heap",
  "Backtracking",
  "Bit Manipulation"
];

function getDeterministicPick<T>(arr: T[], seedStr: string): T | null {
  if (arr.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % arr.length;
  return arr[index];
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

  // Revision Queue states
  const [revisionQueue, setRevisionQueue] = useState<any[]>([]);
  const [upcomingQueue, setUpcomingQueue] = useState<any[]>([]);

  // LeetCode Stats states
  const [leetcodeStats, setLeetcodeStats] = useState<any>(null);
  const [leetcodeLoading, setLeetcodeLoading] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState("");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [upcomingContest, setUpcomingContest] = useState<any>(null);

  // Interactive console states
  const [activeTab, setActiveTab] = useState<"revisions" | "proficiency" | "logs" | "diagnostics">("revisions");
  const [diagnosticLogs, setDiagnosticLogs] = useState<string[]>([
    "SYS_BOOT: Workspace ready.",
    "DB_CONN: Established.",
    "PLANNER: Core decisions compiled."
  ]);

  // Study Planner States
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [userXP, setUserXP] = useState(0);
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [todaysMission, setTodaysMission] = useState<RoadmapTask[]>([]);
  const [studyMode, setStudyMode] = useState<"learn" | "balanced" | "review">("balanced");
  const [dailyLoad, setDailyLoad] = useState<"light" | "balanced" | "intensive">("balanced");
  const [studyBalance, setStudyBalance] = useState({ learning: 0, practice: 0, review: 0 });
  const [focusDistribution, setFocusDistribution] = useState<{ topic: string; percentage: number }[]>([]);
  const [weeklyActivities, setWeeklyActivities] = useState(0);
  const [weeklyTopTopic, setWeeklyTopTopic] = useState("Trees");

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedMode = localStorage.getItem("sheetstride-study-mode");
      if (savedMode && ["learn", "balanced", "review"].includes(savedMode)) {
        setStudyMode(savedMode as any);
      }
      const savedLoad = localStorage.getItem("sheetstride-daily-load");
      if (savedLoad && ["light", "balanced", "intensive"].includes(savedLoad)) {
        setDailyLoad(savedLoad as any);
      }
    }
  }, []);

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

      // Determine current preferences (from state or fallback)
      let currentMode: "learn" | "balanced" | "review" = studyMode;
      let currentLoad: "light" | "balanced" | "intensive" = dailyLoad;
      
      const metadata = user.user_metadata || {};
      const savedMode = metadata["sheetstride-study-mode"] || localStorage.getItem("sheetstride-study-mode");
      if (savedMode && ["learn", "balanced", "review"].includes(savedMode)) {
        currentMode = savedMode as any;
      }
      const savedLoad = metadata["sheetstride-daily-load"] || localStorage.getItem("sheetstride-daily-load");
      if (savedLoad && ["light", "balanced", "intensive"].includes(savedLoad)) {
        currentLoad = savedLoad as any;
      }

      // Compile roadmap contract using isolated engine
      const roadmap = await buildRoadmap(userId, supabase, {
        studyMode: currentMode,
        dailyLoad: currentLoad
      });

      // Update state indicators directly from compiled roadmap contract
      setTodaysMission(roadmap.items);
      setStudyBalance(roadmap.studyBalance);
      setWeeklyActivities(roadmap.weeklyActivities);
      setWeeklyTopTopic(roadmap.weeklyTopTopic);
      setWeakestTopic(roadmap.weakestTopic);
      setDailyQuest(roadmap.dailyQuest);
      setRevisionQueue(roadmap.revisionQueue);
      setUpcomingQueue(roadmap.upcomingQueue);
      setCurrentStreak(roadmap.currentStreak);
      setLongestStreak(roadmap.longestStreak);
      setUserXP(roadmap.userXP);
      setFocusTopics(roadmap.focusTopics);

      // If user profile leetcode integration is set up, load LeetCode summary stats
      let leetcodeUser = "";
      try {
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("leetcode_username")
          .eq("id", userId)
          .maybeSingle();
        if (dbProfile) {
          leetcodeUser = dbProfile.leetcode_username || "";
        }
      } catch (e) {}
      if (!leetcodeUser) {
        leetcodeUser = user?.user_metadata?.leetcode_username || "";
      }
      setLeetcodeUsername(leetcodeUser);
      if (leetcodeUser) {
        await fetchLeetcodeStats(leetcodeUser);
      }

    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveFocusTopics = async (updatedTopics: string[]) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ focus_topics: updatedTopics })
        .eq("id", user.id);

      if (!error) {
        setFocusTopics(updatedTopics);
        await loadDashboardData();
      }
    } catch (err) {
      console.error("Failed to save focus topics:", err);
    }
  };

  const handleUpdateStudyMode = async (mode: "learn" | "balanced" | "review") => {
    setStudyMode(mode);
    localStorage.setItem("sheetstride-study-mode", mode);
    try {
      await supabase.auth.updateUser({
        data: {
          "sheetstride-study-mode": mode
        }
      });
    } catch (e) {
      console.warn("Failed to sync study-mode preference to database:", e);
    }
  };

  const handleUpdateDailyLoad = async (load: "light" | "balanced" | "intensive") => {
    setDailyLoad(load);
    localStorage.setItem("sheetstride-daily-load", load);
    try {
      await supabase.auth.updateUser({
        data: {
          "sheetstride-daily-load": load
        }
      });
    } catch (e) {
      console.warn("Failed to sync daily-load preference to database:", e);
    }
  };

  const fetchLeetcodeStats = async (username: string) => {
    if (!username) return;
    try {
      setLeetcodeLoading(true);
      setLeetcodeError("");
      const cleanUsername = username.trim().replace(/^@/, "");
      const baseUrl = "https://alfa-leetcode-api.onrender.com";
      const resProfile = await fetch(`${baseUrl}/${cleanUsername}/profile`).then(r => r.ok ? r.json() : null);
      if (!resProfile || resProfile.errors) {
        throw new Error("Could not load LeetCode statistics.");
      }
      
      const statsData = {
        profile: {
          ranking: resProfile.ranking
        },
        solved: {
          solvedProblem: resProfile.totalSolved,
          easySolved: resProfile.easySolved,
          mediumSolved: resProfile.mediumSolved,
          hardSolved: resProfile.hardSolved
        },
        ranking: resProfile.ranking
      };
      setLeetcodeStats(statsData);
    } catch (err: any) {
      console.error("Failed to fetch LeetCode stats on dashboard:", err);
      setLeetcodeError("Unavailable");
    } finally {
      setLeetcodeLoading(false);
    }
  };

  // Load preferences from Supabase Auth metadata when user session hydrates
  useEffect(() => {
    if (user) {
      const metadata = user.user_metadata || {};
      const savedMode = metadata["sheetstride-study-mode"];
      if (savedMode && ["learn", "balanced", "review"].includes(savedMode)) {
        setStudyMode(savedMode as any);
      }
      const savedLoad = metadata["sheetstride-daily-load"];
      if (savedLoad && ["light", "balanced", "intensive"].includes(savedLoad)) {
        setDailyLoad(savedLoad as any);
      }
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();

    window.addEventListener("question-solved", loadDashboardData);
    return () => {
      window.removeEventListener("question-solved", loadDashboardData);
    };
  }, [user, studyMode, dailyLoad]);

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

  // Live LeetCode stats breakdown metrics
  const easyCount = leetcodeStats?.solved?.easySolved || 0;
  const medCount = leetcodeStats?.solved?.mediumSolved || 0;
  const hardCount = leetcodeStats?.solved?.hardSolved || 0;
  const totalLiveSolved = leetcodeStats?.solved?.solvedProblem || leetcodeStats?.solved?.totalSolved || (easyCount + medCount + hardCount) || 0;

  const totalSegments = (easyCount + medCount + hardCount) || 1;
  const easyPct = (easyCount / totalSegments) * 100;
  const medPct = (medCount / totalSegments) * 100;
  const hardPct = (hardCount / totalSegments) * 100;

  const getContestTimeLeft = (startTime: any) => {
    if (!startTime) return "TBD";
    const startMs = typeof startTime === "number" ? startTime * 1000 : new Date(startTime).getTime();
    const diff = startMs - Date.now();
    if (diff <= 0) return "ACTIVE";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) {
      return `${days}D ${hours % 24}H`;
    }
    return `${hours}H ${Math.floor((diff / (1000 * 60)) % 60)}M`;
  };

  const isDailyQuestSolved = dailyQuest ? solvedList.some(q => q.Title.toLowerCase() === dailyQuest.Title.toLowerCase()) : false;

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
    { label: "REVISIONS DUE", value: revisionQueue.length, subtext: "Pending practice loops", tone: "primary", suffix: " TASKS" },
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
      <AppShell className="space-y-stack-lg max-w-container-max mx-auto px-gutter" gridBackground>
        {/* Hero section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter pt-6">
          {/* Main Hero Card Skeleton */}
          <div className="lg:col-span-8 bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-stack-lg rounded-lg relative overflow-hidden">
            <header className="flex justify-between items-start mb-stack-lg">
              <div className="space-y-2 w-full max-w-md">
                <Skeleton className="h-4 w-24 bg-primary/10" />
                <Skeleton className="h-8 w-64" />
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-lg relative z-10">
              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Skeleton className="h-4 w-28" />
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats metrics block */}
          <div className="lg:col-span-4 grid grid-rows-3 gap-stack-md">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-stack-md rounded-lg flex items-center justify-between"
              >
                <div className="space-y-2">
                  <Skeleton className="h-3.5 w-32" />
                  <Skeleton className="h-9 w-24" />
                </div>
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        {/* Scroll-Linked Ticker Shimmer */}
        <div className="py-4 border-y border-[#2D2D2D]/20 my-4">
          <Skeleton className="h-8 w-full" />
        </div>

        {/* Heatmap Row Skeleton */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-12 bg-[#111111]/72 border border-[#2D2D2D] p-6 rounded-xl min-h-[180px]">
            <header className="flex justify-between items-start mb-4">
              <div className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </header>
            <div className="flex flex-wrap gap-1.5 justify-between py-2">
              {Array.from({ length: 42 }).map((_, idx) => (
                <Skeleton key={idx} className="w-5 h-5 sm:w-6 sm:h-6 rounded-sm flex-shrink-0" />
              ))}
            </div>
          </div>
        </section>

        {/* Dynamic Cards Deck Skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111111]/72 border border-[#2D2D2D] p-6 rounded-xl flex flex-col justify-between min-h-[220px]">
              <div className="space-y-4">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-8 w-full rounded" />
            </div>
          ))}
        </section>

        {/* Interactive console card */}
        <section className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-stack-lg rounded-lg flex flex-col justify-between min-h-[460px]">
          <div>
            <div className="flex border-b border-[#2D2D2D] pb-3 mb-6 gap-4 overflow-x-auto">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-28 sm:w-36 flex-shrink-0" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-5 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="border border-[#2D2D2D] p-4 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-8 w-16 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
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

  const completedTasks = todaysMission.filter(t => t.completed).length;
  const totalTasks = todaysMission.length || 1;
  const missionPercent = Math.round((completedTasks / totalTasks) * 100);
  const isRoadmapComplete = todaysMission.length > 0 && todaysMission.every(t => t.completed);

  const welcomeText = user ? (
    <>
      Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Operator"}.
      {" "}Your current focus is <span className="text-primary font-bold">{focusTopics[0] || weakestTopic}</span>.
      {" "}{todaysMission.filter((t) => t.type === "revise").length} review{todaysMission.filter((t) => t.type === "revise").length === 1 ? " is" : "s are"} ready today, along with{" "}
      {todaysMission.filter((t) => t.type === "solve").length} new practice opportunit{todaysMission.filter((t) => t.type === "solve").length === 1 ? "y" : "ies"}.
    </>
  ) : (
    "Your current roadmap plan is loaded."
  );

  const renderFocusHealthBlocks = (topic: string) => {
    const completedCount = solvedList.filter((q) => 
      (q.Topics && q.Topics.toLowerCase().includes(topic.toLowerCase()))
    ).length;
    const targetCount = 20;
    const filledCount = Math.min(targetCount, completedCount);
    const emptyCount = Math.max(0, targetCount - filledCount);
    
    const blocksStr = "■".repeat(filledCount) + "□".repeat(emptyCount);
    return {
      blocks: blocksStr,
      completed: completedCount,
      target: targetCount
    };
  };

  return (
    <AppShell className="space-y-stack-lg max-w-container-max mx-auto px-gutter" gridBackground>
      
      {/* Interactive Learning Journey Pipeline HUD */}
      <div className="border border-[#222]/80 bg-[#0C0C0C]/80 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] select-none shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[14px]">explore</span>
          <span className="text-outline uppercase tracking-wider font-bold">Journey status:</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-outline">
          {/* Step 1: Learn */}
          <Link href="/patterns" className="hover:text-primary transition-all flex items-center gap-1 group">
            <span className="text-secondary">✓</span>
            <span className="font-bold uppercase tracking-wider group-hover:underline">Learn</span>
          </Link>
          
          <span className="text-[#2D2D2D] select-none">──►</span>

          {/* Step 2: Recognize */}
          <Link href="/practice" className="hover:text-primary transition-all flex items-center gap-1 group">
            <span className={cn(completedTasks > 0 ? "text-secondary" : "text-[#555]")}>
              {completedTasks > 0 ? "✓" : "▶"}
            </span>
            <span className={cn("font-bold uppercase tracking-wider group-hover:underline", completedTasks > 0 ? "text-outline" : "text-primary font-extrabold")}>Recognize</span>
          </Link>

          <span className="text-[#2D2D2D] select-none">──►</span>

          {/* Step 3: Solve */}
          <a href="#today-roadmap" className="hover:text-primary transition-all flex items-center gap-1 group">
            <span className={cn(isRoadmapComplete ? "text-secondary" : "text-[#555]")}>
              {isRoadmapComplete ? "✓" : "▶"}
            </span>
            <span className={cn("font-bold uppercase tracking-wider group-hover:underline", isRoadmapComplete ? "text-outline" : "text-primary font-extrabold")}>Solve</span>
          </a>

          <span className="text-[#2D2D2D] select-none">──►</span>

          {/* Step 4: Reflect */}
          <button
            onClick={() => {
              const solvedTask = todaysMission.find(t => t.completed && t.question);
              if (solvedTask && solvedTask.question) {
                window.dispatchEvent(new CustomEvent("open-question-drawer", {
                  detail: {
                    questionId: solvedTask.question.ID,
                    title: solvedTask.question.Title,
                    difficulty: solvedTask.question.Difficulty,
                    link: solvedTask.question.Link,
                    mode: "reflection"
                  }
                }));
              } else {
                window.dispatchEvent(new CustomEvent("open-notebook-explorer"));
              }
            }}
            className="hover:text-primary transition-all flex items-center gap-1 group cursor-pointer text-outline bg-transparent border-none p-0"
          >
            <span className="text-[#555]">○</span>
            <span className="font-bold uppercase tracking-wider group-hover:underline">Reflect</span>
          </button>

          <span className="text-[#2D2D2D] select-none">──►</span>

          {/* Step 5: Review */}
          <a href="#review-section" className="hover:text-primary transition-all flex items-center gap-1 group">
            <span className="text-[#555]">○</span>
            <span className="font-bold uppercase tracking-wider group-hover:underline">Review</span>
          </a>
        </div>
      </div>

      {/* Hero section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <motion.div 
          id="today-roadmap"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-8 bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-stack-lg rounded-lg relative overflow-hidden group transition-all duration-300 hover:bg-[#181818]/92 hover:border-primary/20 hover:-translate-y-[2px]"
        >
          <header className="flex justify-between items-start mb-stack-lg border-b border-[#2D2D2D] pb-3">
            <div>
              <span className="font-mono-label text-mono-label text-primary uppercase mb-1 block">Study Workspace</span>
              <h1 className="font-headline-lg text-lg uppercase tracking-tight text-on-surface font-bold">
                TODAY'S ROADMAP: <span className="text-secondary">{completedTasks}/{totalTasks} COMPLETED</span>
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFocusModal(true)}
                className="p-1.5 hover:bg-white/5 border border-[#222] hover:border-primary/50 text-outline hover:text-primary rounded font-mono text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
              >
                <Settings className="h-3 w-3" /> Adjust Config
              </button>
            </div>
          </header>

          <div className="mb-4 text-xs font-body text-outline leading-relaxed border-b border-[#2D2D2D]/60 pb-3 font-medium">
            {welcomeText}
          </div>

          {isRoadmapComplete ? (
            /* Premium Summary Wrap Up Card */
            <div className="space-y-6 py-4 select-none">
              <div className="text-center space-y-2 max-w-md mx-auto">
                <div className="inline-flex p-3 bg-secondary/10 rounded-full border border-secondary/20 mb-2">
                  <CheckCircle2 className="h-8 w-8 text-secondary animate-pulse" />
                </div>
                <h2 className="font-display font-semibold text-base text-secondary uppercase tracking-wider">
                  Excellent work.
                </h2>
                <h3 className="font-headline-md text-sm text-text font-bold uppercase tracking-wider">
                  Today's roadmap is complete.
                </h3>
                <p className="font-body text-xs text-outline leading-relaxed">
                  Tomorrow's planner will be generated based on today's progress. Your cognitive memory bank is refreshed.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0C0C0C]/60 border border-[#222]/80 p-4 rounded-xl font-mono text-[10px]">
                <div className="space-y-1">
                  <span className="text-outline/50 block text-[8px] uppercase tracking-wider font-bold">Questions Solved</span>
                  <span className="text-text font-bold text-xs">
                    {todaysMission.filter((t) => t.type === "solve" && t.completed).length} / {todaysMission.filter((t) => t.type === "solve").length}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-outline/50 block text-[8px] uppercase tracking-wider font-bold">Reviews Finished</span>
                  <span className="text-text font-bold text-xs">
                    {todaysMission.filter((t) => t.type === "revise" && t.completed).length} / {todaysMission.filter((t) => t.type === "revise").length}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-outline/50 block text-[8px] uppercase tracking-wider font-bold">Drills Run</span>
                  <span className="text-text font-bold text-xs">
                    {todaysMission.filter((t) => t.type === "drill" && t.completed).length} / {todaysMission.filter((t) => t.type === "drill").length}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-outline/50 block text-[8px] uppercase tracking-wider font-bold">Active Focus</span>
                  <span className="text-text font-bold text-xs truncate block max-w-full" title={focusTopics.join(", ") || weakestTopic}>
                    {focusTopics[0] || weakestTopic}
                  </span>
                </div>
              </div>

              <div className="text-center font-mono text-[10px] text-outline/45 uppercase tracking-wider font-bold">
                You're done for today. See you tomorrow.
              </div>
            </div>
          ) : (
            /* Regular Checklist View */
            <div className="space-y-3 relative z-10">
              {todaysMission.map((task) => (
                <div 
                  key={task.id}
                  className={cn(
                    "p-3 rounded-lg border flex items-center justify-between gap-4 transition-all",
                    task.completed 
                      ? "bg-[#061009]/20 border-secondary/20 opacity-75" 
                      : "bg-[#0C0C0C]/50 border-[#222]/85 hover:border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button 
                      disabled
                      className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        task.completed 
                          ? "border-secondary bg-secondary/10 text-secondary" 
                          : "border-[#2D2D2D] text-transparent"
                      )}
                    >
                      <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={cn(
                          "text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded font-mono leading-none border",
                          task.type === "learn" && "bg-blue-500/5 border-blue-500/20 text-blue-400",
                          task.type === "drill" && "bg-purple-500/5 border-purple-500/20 text-purple-400",
                          task.type === "solve" && "bg-primary/5 border-primary/20 text-primary",
                          task.type === "revise" && "bg-orange-500/5 border-orange-500/20 text-orange-400"
                        )}>
                          {task.type}
                        </span>
                        {task.question?.Difficulty && (
                          <span className={cn(
                            "text-[8px] font-bold uppercase font-mono leading-none tracking-wider",
                            task.question.Difficulty.toLowerCase() === "easy" && "text-emerald-400",
                            task.question.Difficulty.toLowerCase() === "medium" && "text-primary",
                            task.question.Difficulty.toLowerCase() === "hard" && "text-danger"
                          )}>
                            {task.question.Difficulty}
                          </span>
                        )}

                        {/* Interactive Explanation Tooltip indicator */}
                        <div className="relative group/explain select-none flex items-center">
                          <span className="material-symbols-outlined text-outline/45 hover:text-primary text-[11px] cursor-pointer">info</span>
                          <div className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 bg-[#161616] border border-[#2D2D2D] text-outline text-[9px] font-mono p-2 rounded shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/explain:opacity-100 transition-opacity z-50">
                            {task.type === "revise" && "Revision Ready // Overdue Spaced Repetition queue"}
                            {task.type === "solve" && `Matches chosen study focus topic: ${focusTopics[0] || weakestTopic}`}
                            {task.type === "drill" && "Practice diagnostic session matching weakest pattern zones"}
                          </div>
                        </div>
                      </div>

                      {task.type === "solve" || task.type === "revise" ? (
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                            detail: {
                              questionId: task.question?.ID,
                              title: task.question?.Title,
                              difficulty: task.question?.Difficulty,
                              link: task.question?.Link,
                              mode: task.type === "revise" ? "reflection" : "description"
                            }
                          }))}
                          className={cn(
                            "text-xs font-semibold text-text hover:text-primary hover:underline transition-all text-left truncate block w-full bg-transparent border-none p-0 cursor-pointer",
                            task.completed && "line-through text-outline/40 font-normal hover:text-outline/40"
                          )}
                        >
                          {task.label}
                        </button>
                      ) : task.type === "drill" ? (
                        <Link
                          href={`/practice?mode=drill&drill_pattern=${task.topic?.toLowerCase().replace(/ /g, "-")}`}
                          className={cn(
                            "text-xs font-semibold text-text hover:text-primary hover:underline transition-all text-left truncate block w-full",
                            task.completed && "line-through text-outline/40 font-normal hover:text-outline/40"
                          )}
                        >
                          {task.label}
                        </Link>
                      ) : (
                        <Link
                          href="/patterns"
                          className={cn(
                            "text-xs font-semibold text-text hover:text-primary hover:underline transition-all text-left truncate block w-full",
                            task.completed && "line-through text-outline/40 font-normal hover:text-outline/40"
                          )}
                        >
                          {task.label}
                        </Link>
                      )}
                    </div>
                  </div>

                  {task.question?.Link && !task.completed && (
                    <a 
                      href={task.question.Link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 border border-[#222] hover:border-primary/50 rounded text-outline/65 hover:text-primary transition-colors flex-shrink-0"
                      title="Solve on LeetCode"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="w-full bg-[#181818] h-1.5 mt-5 rounded-full overflow-hidden relative border border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${missionPercent}%` }}
              transition={{ duration: 1.0, ease: "easeOut" }}
              className="h-full bg-secondary"
            />
          </div>
        </motion.div>

        {/* Stats metrics block */}
        <motion.div 
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="lg:col-span-4 flex flex-col gap-4"
        >
          {/* Card 1: Focus Health & Targets */}
          <motion.div 
            variants={revealItem}
            onClick={() => setShowFocusModal(true)}
            whileHover={{ y: -2, scale: 1.01, borderColor: "#FFD400", boxShadow: "0 0 24px rgba(255,212,0,0.12)" }}
            className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-5 rounded-lg group transition-all cursor-pointer space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-2">
              <span className="font-mono-label text-mono-label text-muted uppercase">MONTHLY FOCUS HEALTH</span>
              <span className="material-symbols-outlined text-[16px] text-primary">analytics</span>
            </div>
            
            {focusTopics.length > 0 ? (
              <div className="space-y-3 font-mono text-[10px]">
                {focusTopics.slice(0, 2).map((topic) => {
                  const health = renderFocusHealthBlocks(topic);
                  return (
                    <div key={topic} className="space-y-1">
                      <div className="flex justify-between font-bold text-outline">
                        <span>{topic.toUpperCase()}</span>
                        <span>{health.completed} / {health.target} SOLVED</span>
                      </div>
                      <div className="text-primary tracking-wider truncate text-xs leading-none">
                        {health.blocks}
                      </div>
                    </div>
                  );
                })}
                <p className="text-[9px] text-outline/50 italic pt-1">Tap to modify monthly focuses.</p>
              </div>
            ) : (
              <div className="py-4 text-center font-mono text-[10px] text-outline/45 space-y-2">
                <div>NO FOCUS TOPICS CONFIGURED</div>
                <button className="px-3 py-1 bg-primary text-black font-bold uppercase text-[9px] rounded">Set Focus</button>
              </div>
            )}
          </motion.div>

          {/* Card 2: Study Balance Engine Heuristics */}
          <motion.div 
            variants={revealItem}
            whileHover={{ y: -2, scale: 1.01, borderColor: "#FFD400", boxShadow: "0 0 24px rgba(255,212,0,0.12)" }}
            className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-5 rounded-lg transition-all space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-2">
              <span className="font-mono-label text-mono-label text-muted uppercase">STUDY BALANCE</span>
              <span className="material-symbols-outlined text-[16px] text-secondary">donut_large</span>
            </div>
            
            <div className="space-y-2 font-mono text-[9px]">
              <div className="space-y-1">
                <div className="flex justify-between text-outline">
                  <span>LEARN (SOLVES)</span>
                  <span>{studyBalance.learning}</span>
                </div>
                <div className="h-1.5 w-full bg-[#181818] rounded overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (studyBalance.learning / 20) * 100)}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-outline">
                  <span>PRACTICE (DRILLS)</span>
                  <span>{studyBalance.practice}</span>
                </div>
                <div className="h-1.5 w-full bg-[#181818] rounded overflow-hidden">
                  <div className="h-full bg-secondary" style={{ width: `${Math.min(100, (studyBalance.practice / 10) * 100)}%` }} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-outline">
                  <span>RETAIN (REVISIONS)</span>
                  <span>{studyBalance.review}</span>
                </div>
                <div className="h-1.5 w-full bg-[#181818] rounded overflow-hidden">
                  <div className="h-full bg-tertiary" style={{ width: `${Math.min(100, (studyBalance.review / 20) * 100)}%` }} />
                </div>
              </div>

              {/* Dynamic Heuristic Advisory Box */}
              <div className="bg-[#0C0C0C]/80 border border-[#222]/80 p-2.5 rounded text-[9px] leading-relaxed text-outline/80 mt-2">
                {studyBalance.learning > 10 && studyBalance.review === 0 ? (
                  <span className="text-[#FFB347]">
                    ⚠️ You've focused heavily on new problems. Consider spending some time reviewing previous work this week.
                  </span>
                ) : (
                  <span>
                    Your study distribution is balanced. Keep up the consistent practice cycles!
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          {/* Card 3: Weekly Reflection */}
          <motion.div 
            variants={revealItem}
            whileHover={{ y: -2, scale: 1.01, borderColor: "#FFD400", boxShadow: "0 0 24px rgba(255,212,0,0.12)" }}
            className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-5 rounded-lg transition-all space-y-3"
          >
            <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-2">
              <span className="font-mono-label text-mono-label text-muted uppercase">THIS WEEK'S REFLECTION</span>
              <span className="material-symbols-outlined text-[16px] text-tertiary">history_edu</span>
            </div>
            
            <div className="space-y-2 font-mono text-[9px] text-outline leading-relaxed">
              <div>
                ● You completed <span className="text-text font-bold">{weeklyActivities}</span> learning activities.
              </div>
              <div>
                ● Focus Topic: <span className="text-primary font-bold">{weeklyTopTopic}</span>.
              </div>
              <div>
                ● Recognition improved in: <span className="text-secondary font-bold">Sliding Window</span>.
              </div>
              <div className="border-t border-[#222]/60 pt-2 text-[8px] text-outline/50 uppercase tracking-wider">
                Keep practicing: <span className="text-primary">Greedy</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <ParallaxText />

      {/* Contribution Heatmap Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* Contribution Heatmap */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="lg:col-span-12 bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-6 rounded-xl transition-all duration-300 hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)] flex flex-col justify-between"
        >
          <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
            <div>
              <h2 className="font-headline-md text-base text-on-surface font-bold uppercase tracking-wide">Contribution Map</h2>
              <p className="font-body-sm text-[11px] text-on-surface-variant">Consistency tracker across learning cycles.</p>
            </div>
            <div className="flex items-center gap-2 font-mono text-[9px] text-outline">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="w-2.5 h-2.5 rounded-sm bg-surface-container-lowest"></div>
                <div className="w-2.5 h-2.5 bg-primary/20 rounded-sm"></div>
                <div className="w-2.5 h-2.5 bg-primary/40 rounded-sm"></div>
                <div className="w-2.5 h-2.5 bg-primary/60 rounded-sm"></div>
                <div className="w-2.5 h-2.5 bg-primary rounded-sm"></div>
              </div>
              <span>More</span>
            </div>
          </header>
          {/* Heatmap renderer */}
          <div className="overflow-x-auto custom-scrollbar pb-1">
            <Heatmap mode="dashboard" />
          </div>
        </motion.div>
      </section>

      {/* Dynamic Widget Grid (Daily Challenge, Company Curricula, LeetCode Live Stats) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        {/* Card 1: Practice Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-6 rounded-xl flex flex-col justify-between transition-all duration-300 hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)] min-h-[220px]"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 tracking-wider font-bold">PRACTICE CENTER</span>
              <span className="material-symbols-outlined text-primary text-lg">target</span>
            </div>

            <div className="space-y-3">
              <h3 className="font-headline-md text-sm font-bold text-on-surface">Practice Studio</h3>
              <p className="font-body-sm text-[11px] text-on-surface-variant leading-relaxed">
                Practice pattern recognition diagnostics or compile customized daily session sets matching your target tracks.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-white/5">
            <Link
              href="/practice"
              className="w-full flex items-center justify-center gap-1.5 text-black text-[11px] bg-[#FFD400] px-3 py-2 rounded font-bold hover:bg-[#FFE14D] transition-all uppercase tracking-wider text-center"
            >
              LAUNCH SESSION
            </Link>
          </div>
        </motion.div>

        {/* Card 2: Company Curriculum Sheets */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-6 rounded-xl flex flex-col justify-between transition-all duration-300 hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)] min-h-[220px]"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] text-tertiary bg-tertiary/10 px-2 py-0.5 rounded border border-tertiary/20 tracking-wider font-bold">CORPORATE ROADS</span>
              <span className="material-symbols-outlined text-tertiary text-lg">schema</span>
            </div>

            <div className="space-y-3">
              <h3 className="font-headline-md text-sm font-bold text-on-surface">Company Curricula</h3>
              <p className="font-body-sm text-[11px] text-on-surface-variant leading-relaxed">
                Unlock targeted sheets mapped from over 463 companies, compiled from recent interviews.
              </p>
              <div className="flex flex-wrap gap-1 select-none">
                {["Google", "Meta", "Amazon", "Citadel", "HFTs"].map(comp => (
                  <span key={comp} className="text-[8px] font-mono border border-white/5 px-1.5 py-0.5 rounded bg-white/2 text-white/50">{comp}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-2 border-t border-white/5">
            <Link
              href="/questions/company-sheets"
              className="w-full flex items-center justify-center gap-1.5 text-black text-[11px] bg-[#FFD400] px-3 py-2 rounded font-bold hover:bg-[#FFE14D] transition-all uppercase tracking-wider text-center"
            >
              EXPLORE SHEETS
            </Link>
          </div>
        </motion.div>

        {/* Card 3: Expanded LeetCode Live Stats */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-6 rounded-xl flex flex-col justify-between transition-all duration-300 hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)] min-h-[220px]"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] text-secondary bg-secondary/10 px-2 py-0.5 rounded border border-secondary/20 tracking-wider font-bold">LIVE METRICS</span>
              <span className="material-symbols-outlined text-secondary text-lg animate-pulse">donut_large</span>
            </div>

            {leetcodeUsername ? (
              <div className="space-y-3">
                {/* Stats Numbers */}
                <div className="flex justify-between items-baseline">
                  <h3 className="font-mono text-xs text-white truncate font-bold">@{leetcodeUsername}</h3>
                  <span className="font-mono text-xs font-bold text-white">
                    {totalLiveSolved} <span className="text-[9px] font-normal text-muted">solved</span>
                  </span>
                </div>

                {/* Comparative Ratio Bar Graph */}
                <div className="space-y-1.5">
                  <div className="h-2.5 w-full rounded-full bg-[#1A1A1A] flex overflow-hidden border border-white/5 shadow-inner">
                    <div 
                      className="bg-emerald-500 transition-all duration-500" 
                      style={{ width: `${easyPct}%` }}
                      title={`Easy: ${easyCount} (${Math.round(easyPct)}%)`}
                    />
                    <div 
                      className="bg-[#FFD400] transition-all duration-500" 
                      style={{ width: `${medPct}%` }}
                      title={`Medium: ${medCount} (${Math.round(medPct)}%)`}
                    />
                    <div 
                      className="bg-red-500 transition-all duration-500" 
                      style={{ width: `${hardPct}%` }}
                      title={`Hard: ${hardCount} (${Math.round(hardPct)}%)`}
                    />
                  </div>
                  {/* Legend / Info Split */}
                  <div className="flex justify-between text-[8px] font-mono text-outline select-none">
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> E ({Math.round(easyPct)}%)</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#FFD400]" /> M ({Math.round(medPct)}%)</span>
                    <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> H ({Math.round(hardPct)}%)</span>
                  </div>
                </div>

                {/* Detailed counts */}
                <div className="grid grid-cols-3 gap-1.5 text-[9px] text-center font-mono select-none">
                  <div className="bg-emerald-500/5 border border-emerald-500/15 p-1.5 rounded">
                    <span className="text-emerald-400 block font-bold text-[8px] tracking-wider">EASY</span>
                    <span className="text-white font-bold">{easyCount}</span>
                  </div>
                  <div className="bg-[#FFD400]/5 border border-[#FFD400]/15 p-1.5 rounded">
                    <span className="text-[#FFD400] block font-bold text-[8px] tracking-wider">MED</span>
                    <span className="text-white font-bold">{medCount}</span>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/15 p-1.5 rounded">
                    <span className="text-red-400 block font-bold text-[8px] tracking-wider">HARD</span>
                    <span className="text-white font-bold">{hardCount}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-headline-md text-xs font-bold text-on-surface">Sync LeetCode Profile</h3>
                <p className="font-body-sm text-[10px] text-on-surface-variant leading-relaxed">
                  Connect your LeetCode username in Profile settings to view live statistics on your HUD dashboard.
                </p>
                <Link
                  href="/profile"
                  className="w-full flex items-center justify-center gap-1.5 text-white text-[11px] border border-[#2D2D2D] px-3 py-2 rounded font-bold hover:bg-white/5 transition-all uppercase tracking-wider text-center"
                >
                  CONNECT ACCOUNT
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Interactive console card (Full width) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.4 }}
          className="lg:col-span-12 bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-stack-lg rounded-lg flex flex-col justify-between transition-all duration-300 hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)] min-h-[460px]"
        >
          <div>
            {/* Header: Tab Triggers with spring-animated layoutId background slider */}
            <div className="flex border-b border-[#2D2D2D] pb-3 mb-6 overflow-x-auto gap-2 select-none custom-scrollbar">
              {[
                { id: "revisions", label: `REVIEW SCHEDULE (${revisionQueue.length})`, icon: "sync" },
                { id: "proficiency", label: "TOPIC PROFICIENCY", icon: "schema" },
                { id: "logs", label: "RECENT SOLVES", icon: "history" }
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
                {activeTab === "revisions" && (
                  <div className="space-y-6">
                    {/* Due today */}
                    <div>
                      <h3 className="font-mono text-[10px] text-[#FFC700] uppercase font-bold tracking-widest mb-3 border-b border-[#2D2D2D] pb-1.5 flex justify-between items-center select-none">
                        <span>Overdue Reviews ({revisionQueue.length})</span>
                        {revisionQueue.length > 0 && <span className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_8px_#4de082] animate-pulse" />}
                      </h3>
                      {revisionQueue.length === 0 ? (
                        <div className="py-6 text-center text-outline/60 font-body-sm text-xs italic">
                          No revisions due today. You are caught up!
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {revisionQueue.map((item: any) => {
                            const q = item.questions;
                            if (!q) return null;
                            return (
                              <div key={item.question_id} className="flex items-center justify-between group bg-[#090909]/40 border border-[#2D2D2D] p-4 rounded-xl hover:border-primary/45 transition-all">
                                <div className="min-w-0 flex-1 pr-3">
                                  <div className="flex items-center gap-2 select-none mb-1">
                                    <span className="font-mono text-[9px] text-outline">#{q.ID}</span>
                                    <span className={cn(
                                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                      q.Difficulty.toLowerCase() === "easy" && "bg-secondary/10 text-secondary border border-secondary/20",
                                      q.Difficulty.toLowerCase() === "medium" && "bg-tertiary/10 text-tertiary border border-tertiary/20",
                                      q.Difficulty.toLowerCase() === "hard" && "bg-danger/10 text-[#FF8A80] border border-danger/20"
                                    )}>
                                      {q.Difficulty}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                                      detail: {
                                        questionId: q.ID,
                                        title: q.Title,
                                        difficulty: q.Difficulty,
                                        link: q.Link,
                                        mode: "description"
                                      }
                                    }))}
                                    className="font-headline-md text-xs font-semibold tracking-wide text-text hover:text-primary transition-colors cursor-pointer text-left truncate block w-full"
                                  >
                                    {q.Title}
                                  </button>
                                  <span className="font-mono text-[9px] text-outline uppercase block mt-1">
                                    Interval: {item.current_interval_days} Days
                                  </span>
                                </div>
                                <button
                                  onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                                    detail: {
                                      questionId: q.ID,
                                      title: q.Title,
                                      difficulty: q.Difficulty,
                                      link: q.Link,
                                      mode: "priming"
                                    }
                                  }))}
                                  className="bg-[#FFC700] hover:bg-[#FFE14D] text-[#000000] font-bold font-mono text-[10px] px-3.5 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                >
                                  REVISE
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Upcoming schedule */}
                    <div>
                      <h3 className="font-mono text-[10px] text-outline uppercase font-bold tracking-widest mb-3 border-b border-[#2D2D2D] pb-1.5 select-none">
                        Upcoming Reviews ({upcomingQueue.length})
                      </h3>
                      {upcomingQueue.length === 0 ? (
                        <div className="py-6 text-center text-outline/40 font-body-sm text-xs italic">
                          No upcoming revisions scheduled.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {upcomingQueue.map((item: any) => {
                            const q = item.questions;
                            if (!q) return null;
                            const daysLeft = Math.ceil((new Date(item.next_revision_due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                            return (
                              <div key={item.question_id} className="flex items-center justify-between group bg-[#090909]/20 border border-[#2D2D2D]/60 p-4 rounded-xl hover:border-outline transition-all opacity-85 hover:opacity-100">
                                <div className="min-w-0 flex-1 pr-3">
                                  <div className="flex items-center gap-2 select-none mb-1">
                                    <span className="font-mono text-[9px] text-outline">#{q.ID}</span>
                                    <span className={cn(
                                      "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                      q.Difficulty.toLowerCase() === "easy" && "bg-secondary/10 text-secondary border border-secondary/20",
                                      q.Difficulty.toLowerCase() === "medium" && "bg-tertiary/10 text-tertiary border border-tertiary/20",
                                      q.Difficulty.toLowerCase() === "hard" && "bg-danger/10 text-[#FF8A80] border border-danger/20"
                                    )}>
                                      {q.Difficulty}
                                    </span>
                                  </div>
                                  <h4 className="font-headline-md text-xs font-semibold tracking-wide text-outline-variant truncate group-hover:text-text transition-colors">
                                    {q.Title}
                                  </h4>
                                  <span className="font-mono text-[9px] text-outline uppercase block mt-1">
                                    Interval: {item.current_interval_days} Days
                                  </span>
                                </div>
                                <div className="font-mono text-[10px] text-outline bg-surface-container-high/40 border border-[#2D2D2D] px-3 py-1.5 rounded-lg select-none">
                                  DUE IN {daysLeft <= 0 ? 1 : daysLeft} {daysLeft === 1 ? "DAY" : "DAYS"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

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

              </motion.div>
            </AnimatePresence>
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


      {/* Focus Topics Configuration Dialog Modal */}
      <AnimatePresence>
        {showFocusModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-mono">
            <div className="absolute inset-0" onClick={() => setShowFocusModal(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-lg bg-[#111111] border border-[#2D2D2D] hover:border-primary/20 rounded-xl overflow-hidden p-6 shadow-2xl space-y-5 z-[101] max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex justify-between items-start border-b border-[#2D2D2D] pb-3">
                <div>
                  <h3 className="font-display text-sm font-bold text-text uppercase tracking-wider">Planner Settings</h3>
                  <p className="font-body text-[10px] text-outline mt-0.5">Customize your target focus, workload capacity, and review heuristics.</p>
                </div>
                <button
                  onClick={() => setShowFocusModal(false)}
                  className="p-1 hover:bg-white/5 rounded text-outline hover:text-text cursor-pointer transition-colors border-none bg-transparent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* 1. Monthly Focus Topics */}
              <div className="space-y-2">
                <span className="block text-[10px] text-primary uppercase font-bold tracking-wider">1 // Focus Topics</span>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-1">
                  {AVAILABLE_TOPICS.map((topic) => {
                    const isChecked = focusTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        onClick={() => {
                          const updated = isChecked
                            ? focusTopics.filter((t) => t !== topic)
                            : [...focusTopics, topic];
                          handleSaveFocusTopics(updated);
                        }}
                        className={cn(
                          "px-3 py-1.5 border rounded font-mono text-[10px] text-left uppercase transition-all cursor-pointer select-none",
                          isChecked
                            ? "bg-primary/5 border-primary text-primary font-bold shadow-[0_0_8px_rgba(255,212,0,0.05)]"
                            : "bg-[#0C0C0C] border-[#222] text-outline/65 hover:border-outline hover:text-text"
                        )}
                      >
                        {topic}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Study Mode & Preferred Load */}
              <div className="grid grid-cols-2 gap-4 border-t border-[#2D2D2D]/60 pt-3">
                <div className="space-y-2">
                  <span className="block text-[10px] text-primary uppercase font-bold tracking-wider">2 // Study Mode</span>
                  <div className="flex flex-col gap-1.5">
                    {([
                      { id: "learn", label: "Learn (Favors New)" },
                      { id: "balanced", label: "Balanced" },
                      { id: "review", label: "Review (Favors SR)" }
                    ] as const).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => handleUpdateStudyMode(m.id)}
                        className={cn(
                          "px-2.5 py-1.5 border text-left rounded text-[10px] font-bold uppercase transition-all cursor-pointer select-none",
                          studyMode === m.id
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-[#0C0C0C] border-[#222] text-outline hover:border-outline hover:text-text"
                        )}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="block text-[10px] text-primary uppercase font-bold tracking-wider">3 // Preferred Load</span>
                  <div className="flex flex-col gap-1.5">
                    {([
                      { id: "light", label: "Light (3 Tasks)" },
                      { id: "balanced", label: "Balanced (5 Tasks)" },
                      { id: "intensive", label: "Intensive (8 Tasks)" }
                    ] as const).map((l) => (
                      <button
                        key={l.id}
                        onClick={() => handleUpdateDailyLoad(l.id)}
                        className={cn(
                          "px-2.5 py-1.5 border text-left rounded text-[10px] font-bold uppercase transition-all cursor-pointer select-none",
                          dailyLoad === l.id
                            ? "bg-primary/10 border-primary text-primary"
                            : "bg-[#0C0C0C] border-[#222] text-outline hover:border-outline hover:text-text"
                        )}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. Planner Rules */}
              <div className="border-t border-[#2D2D2D]/60 pt-3 space-y-2 select-none">
                <span className="block text-[10px] text-primary uppercase font-bold tracking-wider">4 // Planner Rules</span>
                <div className="bg-[#0C0C0C]/80 border border-[#222]/80 p-3 rounded-lg space-y-1.5 font-mono text-[9px] text-outline/85 leading-relaxed">
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span>✓</span> <span>Prioritize overdue spaced revisions</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span>✓</span> <span>Align tasks to monthly active focuses</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span>✓</span> <span>Mix learning, recognition practice, and retention</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-secondary">
                    <span>✓</span> <span>Cap workload according to load targets</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#2D2D2D]">
                <button
                  onClick={() => setShowFocusModal(false)}
                  className="px-4 py-2 bg-primary hover:bg-primary-strong text-black font-mono text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer border-none"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </AppShell>
  );
}
