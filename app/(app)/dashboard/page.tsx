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
import { cn, fetchWithCache } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

      // Fetch all active revisions directly by manually joining questions
      const { data: progressList, error: progressErr } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("completed", true)
        .not("next_revision_due", "is", null)
        .order("next_revision_due", { ascending: true });

      let revData: any[] = [];
      if (!progressErr && progressList && progressList.length > 0) {
        const questionIds = progressList.map((row: any) => row.question_id);
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("ID, Title, Difficulty, Link, Topics")
          .in("ID", questionIds);
        
        if (!questionsError && questionsData) {
          const questionsMap = new Map(questionsData.map((q: any) => [q.ID, q]));
          revData = progressList
            .map((row: any) => {
              const q = questionsMap.get(row.question_id);
              if (!q) return null;
              return {
                ...row,
                questions: q
              };
            })
            .filter(Boolean);
        }
      }

      const now = new Date();
      const due = revData.filter((item: any) => new Date(item.next_revision_due) <= now);
      const upcoming = revData.filter((item: any) => new Date(item.next_revision_due) > now);
      setRevisionQueue(due);
      setUpcomingQueue(upcoming);
      
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

        if (!questionsError && questionsData) {
          const questionsMap = new Map(questionsData.map((q: any) => [q.ID, q]));
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
      }
      setSolvedList(solved);

      // 3. Compute streaks
      let currentStreak = 0;
      let longestStreak = 0;
      const { data: streakData, error: streakError } = await supabase
        .rpc("calculate_user_streaks", { target_user_id: userId });

      if (!streakError && streakData && streakData.length > 0) {
        currentStreak = streakData[0].res_current_streak || 0;
        longestStreak = streakData[0].res_max_streak || 0;
      }
      setCurrentStreak(currentStreak);
      setLongestStreak(longestStreak);

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

      // 5. Fetch official Daily LeetCode Problem from Alfa API
      let quest = null;
      try {
        const res = await fetch("https://alfa-leetcode-api.onrender.com/daily").then(r => r.ok ? r.json() : null);
        if (res && res.questionTitle) {
          // Find matching question in database by title
          const { data: qMatch } = await supabase
            .from("questions")
            .select("ID, Title, Difficulty, Link, Topics")
            .eq("Title", res.questionTitle)
            .maybeSingle();

          if (qMatch) {
            quest = qMatch;
          } else {
            quest = {
              ID: 9999, // Fallback ID for non-roadmap daily quest
              Title: res.questionTitle,
              Difficulty: res.difficulty || "Medium",
              Link: res.questionLink,
              Topics: "LeetCode Daily"
            };
          }
        }
      } catch (dailyErr) {
        console.warn("Failed to fetch official daily, falling back:", dailyErr);
      }

      // If official daily fetching failed or was empty, fall back to weakest topic question
      if (!quest) {
        const solvedIdsSet = new Set(solved.map(q => q.ID));
        const { data: topicQuestions } = await supabase
          .from("questions")
          .select("ID, Title, Difficulty, Link, Topics")
          .ilike("Topics", `%${computedWeakest}%`)
          .limit(50);

        if (topicQuestions) {
          quest = topicQuestions.find(q => !solvedIdsSet.has(q.ID));
        }

        if (!quest) {
          const { data: generalQuestions } = await supabase
            .from("general_questions" as any)
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
      }
      setDailyQuest(quest);

      // Fetch leetcode username from profiles
      let leetcodeUser = "";
      try {
        const { data: dbProfile } = await supabase
          .from("profiles")
          .select("leetcode_username")
          .eq("id", userId)
          .maybeSingle();
        if (dbProfile?.leetcode_username) {
          leetcodeUser = dbProfile.leetcode_username;
        } else {
          leetcodeUser = user?.user_metadata?.leetcode_username || "";
        }
      } catch (dbErr) {
        console.warn("DB profiles check failed:", dbErr);
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

  useEffect(() => {
    loadDashboardData();

    window.addEventListener("question-solved", loadDashboardData);
    return () => {
      window.removeEventListener("question-solved", loadDashboardData);
    };
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
        {/* Card 1: Daily LeetCode Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className={cn(
            "border backdrop-blur-[12px] p-6 rounded-xl flex flex-col justify-between transition-all duration-300 min-h-[220px]",
            isDailyQuestSolved 
              ? "bg-[#111111]/30 border-[#2D2D2D]/60 opacity-50 grayscale select-none hover:shadow-none" 
              : "bg-[#111111]/72 border-[#2D2D2D] hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)]"
          )}
        >
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-mono text-[9px] text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 tracking-wider font-bold">DAILY MISSION</span>
              <span className="material-symbols-outlined text-primary text-lg">target</span>
            </div>

            {dailyQuest ? (
              <div className="space-y-3">
                <h3 className="font-headline-md text-sm font-bold text-on-surface truncate">{dailyQuest.Title}</h3>
                <div className="flex gap-2">
                  <Badge
                    tone={
                      dailyQuest.Difficulty.toLowerCase() === "easy" ? "secondary" :
                      dailyQuest.Difficulty.toLowerCase() === "medium" ? "tertiary" : "danger"
                    }
                  >
                    {dailyQuest.Difficulty.toUpperCase()}
                  </Badge>
                  <span className="text-[9px] text-muted self-center uppercase truncate">{dailyQuest.Topics?.split(",")[0] || "LeetCode"}</span>
                </div>
                <p className="font-body-sm text-[11px] text-on-surface-variant leading-relaxed">
                  Solve on LeetCode, then record reflections in your journal notebook.
                </p>
              </div>
            ) : (
              <div className="py-4 text-center text-muted font-mono text-[10px]">
                NO ACTIVE DAILY CHALLENGE
              </div>
            )}
          </div>

          {dailyQuest && (
            <div className="grid grid-cols-2 gap-2 mt-4 pt-2 border-t border-white/5">
              {isDailyQuestSolved ? (
                <div className="col-span-2 text-center py-2 text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 bg-emerald-500/5 border border-emerald-500/10 rounded">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  MISSION ACCOMPLISHED
                </div>
              ) : (
                <>
                  <a
                    href={dailyQuest.Link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1 text-black text-[11px] bg-primary px-3 py-2 rounded font-bold cursor-pointer hover:bg-[#FFE14D] transition-all uppercase tracking-wider text-center"
                  >
                    SOLVE <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                      detail: {
                        questionId: dailyQuest.ID,
                        title: dailyQuest.Title,
                        difficulty: dailyQuest.Difficulty,
                        link: dailyQuest.Link,
                        mode: "priming"
                      }
                    }))}
                    className="flex items-center justify-center gap-1 text-white text-[11px] border border-[#2D2D2D] px-3 py-2 rounded font-bold cursor-pointer hover:bg-white/5 transition-all uppercase tracking-wider text-center"
                  >
                    LOG SOLVE
                  </button>
                </>
              )}
            </div>
          )}
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
                { id: "revisions", label: `REVISION QUEUE (${revisionQueue.length})`, icon: "sync" },
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
                        <span>Due Today ({revisionQueue.length})</span>
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
                                  <h4 className="font-headline-md text-xs font-semibold tracking-wide text-text truncate group-hover:text-primary transition-colors">
                                    {q.Title}
                                  </h4>
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
                        Upcoming Schedule ({upcomingQueue.length})
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


    </AppShell>
  );
}
