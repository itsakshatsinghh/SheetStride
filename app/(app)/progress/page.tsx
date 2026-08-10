"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { Heatmap } from "@/components/shared/heatmap";
import { CalendarHUD } from "@/components/shared/calendar-hud";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Folder, ChevronDown, ChevronUp, Clock } from "lucide-react";

// Helper function to map LeetCode questions to standard patterns
function getPatternName(q: any, sheetMap: Map<number, string>): string {
  if (sheetMap.has(q.ID)) {
    return sheetMap.get(q.ID)!;
  }
  
  const topics = q.Topics || "";
  const topicsLower = topics.toLowerCase();
  
  if (topicsLower.includes("sliding window")) return "Sliding Window";
  if (topicsLower.includes("two pointer") || topicsLower.includes("two-pointer")) return "Two Pointers";
  if (topicsLower.includes("binary search")) return "Binary Search";
  if (topicsLower.includes("tree")) return "Trees";
  if (topicsLower.includes("graph")) return "Graphs";
  if (topicsLower.includes("heap") || topicsLower.includes("priority queue")) return "Heap";
  if (topicsLower.includes("backtracking")) return "Backtracking";
  if (topicsLower.includes("dynamic programming") || topicsLower.includes("dp")) return "DP";
  if (topicsLower.includes("linked list")) return "Linked List";
  if (topicsLower.includes("stack")) return "Stack";
  if (topicsLower.includes("queue")) return "Queue";
  
  if (topics) {
    const firstTopic = topics.split(",")[0].trim();
    return firstTopic || "Miscellaneous";
  }
  
  return "Miscellaneous";
}

// Helper function to map LeetCode questions to standard roadmap topics
function getTopicFolderName(q: any, sheetTopicMap: Map<number, string>): string {
  if (sheetTopicMap.has(q.ID)) {
    return sheetTopicMap.get(q.ID)!;
  }
  
  const topics = q.Topics || "";
  const topicsLower = topics.toLowerCase();
  
  if (topicsLower.includes("sliding window")) return "II. Sliding Window Patterns";
  if (topicsLower.includes("two pointer") || topicsLower.includes("two-pointer")) return "I. Two Pointer Patterns";
  if (topicsLower.includes("binary search")) return "IX. Binary Search Patterns";
  if (topicsLower.includes("tree")) return "III. Tree Traversal Patterns (DFS & BFS)";
  if (topicsLower.includes("graph")) return "IV. Graph Traversal Patterns (DFS & BFS)";
  if (topicsLower.includes("heap") || topicsLower.includes("priority queue")) return "VI. Heap (Priority Queue) Patterns";
  if (topicsLower.includes("backtracking")) return "VII. Backtracking Patterns";
  if (topicsLower.includes("greedy")) return "VIII. Greedy Patterns";
  if (topicsLower.includes("dynamic programming") || topicsLower.includes("dp")) return "V. Dynamic Programming (DP) Patterns";
  if (topicsLower.includes("stack")) return "X. Stack Patterns";
  if (topicsLower.includes("bit manipulation") || topicsLower.includes("bit")) return "XI. Bit Manipulation Patterns";
  if (topicsLower.includes("linked list") || topicsLower.includes("linked-list")) return "XII. Linked List Manipulation Patterns";
  if (topicsLower.includes("array") || topicsLower.includes("matrix")) return "XIII. Array/Matrix Manipulation Patterns";
  if (topicsLower.includes("string")) return "XIV. String Manipulation Patterns";
  if (topicsLower.includes("design")) return "XV. Design Patterns";
  
  return "General Practice / LeetCode Universe";
}

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
  const [revisionQueue, setRevisionQueue] = useState<any[]>([]);
  const [upcomingQueue, setUpcomingQueue] = useState<any[]>([]);
  const [revisionsClearedToday, setRevisionsClearedToday] = useState(0);

  // Track revision tabs: "due" or "upcoming"
  const [activeRevTab, setActiveRevTab] = useState<"due" | "upcoming">("due");
  const [expandedPatterns, setExpandedPatterns] = useState<{ [key: string]: boolean }>({});

  async function loadProgressData() {
    if (!user) return;
    const userId = user.id;
    
    try {
      setLoading(true);

      // Fetch total counts from Supabase
      const { count: countAll } = await supabase
        .from("questions")
        .select("*", { count: "exact", head: true });
      if (countAll !== null) setTotalQuestions(countAll);

      // Fetch user progress from user_progress
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

      // Fetch user streaks
      const { data: streakData, error: streakError } = await supabase
        .rpc("calculate_user_streaks", { target_user_id: userId });

      let currentStreakVal = 0;
      if (!streakError && streakData && streakData.length > 0) {
        currentStreakVal = streakData[0].res_current_streak || 0;
      }
      setCurrentStreak(currentStreakVal);

      // Fetch revisions directly (live query by manually joining questions)
      const { data: progressList, error: progressErr } = await supabase
        .from("user_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("completed", true)
        .not("next_revision_due", "is", null)
        .order("next_revision_due", { ascending: true });

      let revData: any[] = [];
      if (!progressErr && progressList && progressList.length > 0) {
        // Fetch sheet questions mappings
        const { data: sheetQData } = await supabase
          .from("sheet_questions")
          .select('"question ID", "Pattern name", "topic name"');
        
        const sheetPatternMap = new Map<number, string>();
        const sheetTopicMap = new Map<number, string>();
        if (sheetQData) {
          sheetQData.forEach((row: any) => {
            const qId = row["question ID"];
            const pattern = row["Pattern name"];
            const topicName = row["topic name"];
            if (qId && pattern) {
              sheetPatternMap.set(qId, pattern);
            }
            if (qId && topicName) {
              sheetTopicMap.set(qId, topicName);
            }
          });
        }

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
              
              const patternName = getPatternName(q, sheetPatternMap);
              const topicName = getTopicFolderName(q, sheetTopicMap);
              return {
                ...row,
                questions: q,
                pattern_name: patternName,
                topic_name: topicName
              };
            })
            .filter(Boolean);
        }
      }

      const now = new Date();
      const todayStr = now.toDateString();
      const clearedToday = progressList?.filter((row: any) => 
        row.last_revised_at && new Date(row.last_revised_at).toDateString() === todayStr
      ).length || 0;
      setRevisionsClearedToday(clearedToday);

      const due = revData.filter((item: any) => item.questions && new Date(item.next_revision_due) <= now);
      const upcoming = revData.filter((item: any) => item.questions && new Date(item.next_revision_due) > now);
      setRevisionQueue(due.slice(0, 5));
      setUpcomingQueue(upcoming);

    } catch (err) {
      console.error("Failed to load progress data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProgressData();
    window.addEventListener("question-solved", loadProgressData);
    return () => {
      window.removeEventListener("question-solved", loadProgressData);
    };
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
      <AppShell className="space-y-stack-lg max-w-container-max mx-auto px-gutter" gridBackground>
        {/* Header section */}
        <section className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-6">
          <div className="space-y-2">
            <Skeleton className="h-9 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-36" />
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <div className="lg:col-span-8 space-y-gutter">
            <div className="bg-[#111111]/72 border border-[#2D2D2D] p-6 rounded-xl min-h-[300px] flex flex-col justify-between">
              <div className="space-y-4">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96" />
              </div>
              <Skeleton className="h-8 w-full rounded" />
            </div>
            <div className="bg-[#111111]/72 border border-[#2D2D2D] p-6 rounded-xl min-h-[250px]">
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-gutter">
            <div className="bg-[#111111]/72 border border-[#2D2D2D] p-6 rounded-xl min-h-[220px] flex flex-col justify-between">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-28 w-28 rounded-full mx-auto" />
            </div>
            <div className="bg-[#111111]/72 border border-[#2D2D2D] p-6 rounded-xl min-h-[100px]">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-6 w-16" />
            </div>
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

  // Helper to check if a question is due today (not overdue)
  const isDueToday = (item: any) => {
    const now = new Date();
    const d = new Date(item.next_revision_due);
    if (d > now) return false;
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays === 0 || d.toDateString() === now.toDateString();
  };

  // Helper to get oldest overdue days
  const getOldestOverdueDays = (items: any[]) => {
    const now = new Date();
    let maxDays = 0;
    items.forEach(item => {
      const d = new Date(item.next_revision_due);
      if (d < now) {
        const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > maxDays) maxDays = diffDays;
      }
    });
    return maxDays;
  };

  // Group revisions by topic folder
  const getGroupedRevisions = (queue: any[]) => {
    const groupsMap = new Map<string, any[]>();
    queue.forEach(item => {
      const t = item.topic_name || "General Practice / LeetCode Universe";
      if (!groupsMap.has(t)) {
        groupsMap.set(t, []);
      }
      groupsMap.get(t)!.push(item);
    });

    const now = new Date();
    const groups: {
      topicName: string;
      items: any[];
      easyCount: number;
      mediumCount: number;
      hardCount: number;
      overdueCount: number;
      oldestOverdueDays: number;
      estimatedTimeMin: number;
      hasTodayDue: boolean;
      masteryStatus: "Strong" | "Good" | "Needs Practice";
    }[] = [];

    groupsMap.forEach((items, topicName) => {
      let easy = 0;
      let medium = 0;
      let hard = 0;
      let overdue = 0;
      let totalRevisionCount = 0;

      items.forEach(item => {
        const diff = (item.questions?.Difficulty || "").toLowerCase();
        if (diff === "easy") easy++;
        else if (diff === "medium") medium++;
        else if (diff === "hard") hard++;

        if (new Date(item.next_revision_due) <= now) {
          overdue++;
        }

        totalRevisionCount += item.revision_count || 0;
      });

      const avgRev = items.length > 0 ? totalRevisionCount / items.length : 0;
      let mastery: "Strong" | "Good" | "Needs Practice" = "Needs Practice";
      if (avgRev >= 4) mastery = "Strong";
      else if (avgRev >= 2) mastery = "Good";

      const time = (easy * 3) + (medium * 5) + (hard * 8);
      const oldestOverdue = getOldestOverdueDays(items);
      const todayDue = items.some(isDueToday);

      groups.push({
        topicName,
        items,
        easyCount: easy,
        mediumCount: medium,
        hardCount: hard,
        overdueCount: overdue,
        oldestOverdueDays: oldestOverdue,
        estimatedTimeMin: time,
        hasTodayDue: todayDue,
        masteryStatus: mastery
      });
    });

    // Sort priority:
    // 1. Topic folder containing today's due reviews (hasTodayDue)
    // 2. Most overdue (oldestOverdueDays descending)
    // 3. Highest number of due questions (items.length descending)
    // 4. Alphabetically
    groups.sort((a, b) => {
      if (a.hasTodayDue !== b.hasTodayDue) {
        return a.hasTodayDue ? -1 : 1;
      }
      if (a.oldestOverdueDays !== b.oldestOverdueDays) {
        return b.oldestOverdueDays - a.oldestOverdueDays;
      }
      if (a.items.length !== b.items.length) {
        return b.items.length - a.items.length;
      }
      return a.topicName.localeCompare(b.topicName);
    });

    return groups;
  };

  const groupedRevisions = getGroupedRevisions(activeRevTab === "due" ? revisionQueue : upcomingQueue);

  const togglePattern = (patternName: string) => {
    setExpandedPatterns(prev => ({
      ...prev,
      [patternName]: !prev[patternName]
    }));
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
            onClick={loadProgressData} 
            className="bg-primary text-on-primary px-4 py-2 rounded-lg font-mono-label text-mono-label flex items-center gap-2 hover:shadow-[0_0_15px_rgba(255,212,0,0.4)] transition-all active:scale-95 font-bold"
          >
            <span className="material-symbols-outlined text-sm">refresh</span> Rebuild_Metrics
          </button>
        </div>
      </section>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
        {/* LEFT COLUMN: Revision Engine & DSA Module Distribution (8 cols) */}
        <div className="lg:col-span-8 space-y-gutter">
          {/* Spaced repetition queue card */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-6 rounded-xl flex flex-col justify-between transition-all duration-300 hover:border-[#FFD400] hover:shadow-[0_0_20px_rgba(255,212,0,0.07)]"
          >
            <div>
              {/* Task 2: Daily Revision Goal Tracker */}
              <div className="mb-4 p-3.5 bg-[#0C0C0D] border border-[#2D2D2D] rounded-xl flex items-center justify-between gap-4 font-mono select-none">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-lg border flex items-center justify-center font-bold text-xs transition-all shrink-0",
                    revisionsClearedToday >= 1 
                      ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.15)]"
                      : "bg-[#FFC700]/10 border-[#FFC700]/30 text-[#FFC700]"
                  )}>
                    {revisionsClearedToday >= 1 ? "✓" : "○"}
                  </div>
                  <div>
                    <span className="text-[9px] text-outline font-bold uppercase block tracking-wider font-mono-label">One-In, One-Out Rhythm</span>
                    <h4 className="font-bold text-white text-xs tracking-wide">
                      Daily Revision Goal: <span className={revisionsClearedToday >= 1 ? "text-emerald-400 font-extrabold" : "text-[#FFC700] font-extrabold"}>[{revisionsClearedToday} / 1]</span> Cleared
                    </h4>
                  </div>
                </div>
                <div className="text-right hidden sm:block font-mono text-[9px] text-outline">
                  <span className="text-outline/70 font-semibold block uppercase">Token System</span>
                  <span className="text-primary/90 font-bold">Max 5 Visible Items</span>
                </div>
              </div>

              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2D2D2D] pb-4 mb-4 select-none">
                <div className="space-y-1">
                  <h2 className="font-headline-md text-card-title text-on-surface font-bold uppercase tracking-wide flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FFC700] animate-pulse shadow-[0_0_8px_#FFC700]" />
                    Spaced Repetition Engine
                  </h2>
                  <p className="font-body-lg text-badge-sm text-outline uppercase font-semibold">
                    {activeRevTab === "due" 
                      ? `Today you're revising ${groupedRevisions.length} ${groupedRevisions.length === 1 ? "pattern" : "patterns"}.` 
                      : `Upcoming revisions grouped into ${groupedRevisions.length} ${groupedRevisions.length === 1 ? "pattern folder" : "pattern folders"}.`
                    }
                  </p>
                </div>
                <div className="flex bg-black/40 border border-[#2D2D2D] p-0.5 rounded font-mono-label text-badge-sm select-none shrink-0 self-start sm:self-center">
                  <button 
                    onClick={() => setActiveRevTab("due")}
                    className={cn(
                      "px-3 py-1.5 rounded-sm uppercase tracking-wider font-extrabold transition-all cursor-pointer",
                      activeRevTab === "due" ? "bg-primary text-black" : "text-outline hover:text-white"
                    )}
                  >
                    DUE ({revisionQueue.length})
                  </button>
                  <button 
                    onClick={() => setActiveRevTab("upcoming")}
                    className={cn(
                      "px-3 py-1.5 rounded-sm uppercase tracking-wider font-extrabold transition-all cursor-pointer",
                      activeRevTab === "upcoming" ? "bg-[#FFD400]/10 text-primary" : "text-outline hover:text-white"
                    )}
                  >
                    UPCOMING ({upcomingQueue.length})
                  </button>
                </div>
              </header>

              {/* Revision Queue List (Pattern-grouped cards) */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                {groupedRevisions.length === 0 ? (
                  <div className="py-12 text-center text-outline/60 font-body-lg text-body-sm italic select-none">
                    {activeRevTab === "due" ? "No revisions due today. You are caught up!" : "No upcoming revisions scheduled."}
                  </div>
                ) : (
                  groupedRevisions.map((group) => {
                    const isExpanded = !!expandedPatterns[group.topicName];
                    const totalQuestions = group.items.length;
                    const easyPct = (group.easyCount / totalQuestions) * 100;
                    const mediumPct = (group.mediumCount / totalQuestions) * 100;
                    const hardPct = (group.hardCount / totalQuestions) * 100;

                    return (
                      <div 
                        key={group.topicName} 
                        className="bg-[#0A0A0A]/40 border border-[#2D2D2D] rounded-xl hover:border-primary/20 transition-all overflow-hidden"
                      >
                        {/* Card Header Section */}
                        <div 
                          onClick={() => togglePattern(group.topicName)}
                          className="p-5 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0E0E0F]/60 hover:bg-[#111112]/80 transition-colors select-none"
                        >
                          <div className="space-y-2.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Folder className="w-4 h-4 text-primary shrink-0" />
                              <h3 className="font-headline-md text-sm font-bold text-white">
                                {group.topicName}
                              </h3>
                              <span className="text-[9px] font-mono border border-border px-1.5 py-0.5 rounded text-outline uppercase font-semibold">
                                {totalQuestions} {totalQuestions === 1 ? "Question" : "Questions"}
                              </span>
                              {/* Mastery rating */}
                              <span className={cn(
                                "text-[8px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider",
                                group.masteryStatus === "Strong" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                                group.masteryStatus === "Good" ? "bg-primary/10 text-primary border border-primary/20" :
                                "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              )}>
                                {group.masteryStatus}
                              </span>
                            </div>

                            {/* Multi-colored difficulty segments progress bar */}
                            <div className="h-1.5 w-full md:max-w-xs bg-[#1A1A1E] rounded-full overflow-hidden flex select-none">
                              {group.easyCount > 0 && (
                                <div className="bg-emerald-500 h-full animate-pulse-subtle" style={{ width: `${easyPct}%` }} title={`Easy: ${group.easyCount}`} />
                              )}
                              {group.mediumCount > 0 && (
                                <div className="bg-primary h-full animate-pulse-subtle" style={{ width: `${mediumPct}%` }} title={`Medium: ${group.mediumCount}`} />
                              )}
                              {group.hardCount > 0 && (
                                <div className="bg-red-500 h-full animate-pulse-subtle" style={{ width: `${hardPct}%` }} title={`Hard: ${group.hardCount}`} />
                              )}
                            </div>

                            {/* Metadata Row */}
                            <div className="flex flex-wrap items-center gap-3 text-badge-sm font-mono-label text-outline/80">
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-400 font-bold">EASY {group.easyCount}</span>
                                <span className="text-outline/30">•</span>
                                <span className="text-primary font-bold">MED {group.mediumCount}</span>
                                <span className="text-outline/30">•</span>
                                <span className="text-red-400 font-bold">HARD {group.hardCount}</span>
                              </div>

                              <span className="text-outline/40">|</span>

                              {activeRevTab === "due" ? (
                                <>
                                  {group.overdueCount > 0 ? (
                                    <span className="text-red-400 font-semibold uppercase">
                                      Overdue {group.overdueCount} {group.overdueCount === 1 ? "Question" : "Questions"}
                                    </span>
                                  ) : (
                                    <span className="text-secondary font-semibold uppercase">Due Today</span>
                                  )}
                                  {group.oldestOverdueDays > 0 && (
                                    <>
                                      <span className="text-outline/40">•</span>
                                      <span className="text-outline uppercase">Oldest Due {group.oldestOverdueDays}d ago</span>
                                    </>
                                  )}
                                </>
                              ) : (
                                <span className="text-secondary font-semibold uppercase">
                                  Next in {Math.ceil((new Date(group.items[0].next_revision_due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}d
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 shrink-0 select-none">
                            {/* Estimated revision time */}
                            <div className="flex items-center gap-1 text-badge-sm font-mono-label text-outline bg-black/30 border border-border/40 px-2 py-1.5 rounded-lg">
                              <Clock className="w-3.5 h-3.5 text-outline/60" />
                              <span>≈ {group.estimatedTimeMin} min</span>
                            </div>

                            {/* Continue Revision button */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                togglePattern(group.topicName);
                              }}
                              className={cn(
                                "px-3 py-1.5 border rounded-lg text-badge-sm font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer",
                                isExpanded 
                                  ? "border-border hover:border-outline text-outline hover:text-white" 
                                  : "border-primary bg-primary text-black hover:bg-[#FFE14D]"
                              )}
                            >
                              <span>{isExpanded ? "Collapse" : "Continue"}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Questions List */}
                        {isExpanded && (
                          <div className="border-t border-[#2D2D2D] bg-[#070707]/30 p-4 space-y-2.5">
                            {group.items.map((item) => {
                              const daysOverdue = Math.floor((new Date().getTime() - new Date(item.next_revision_due).getTime()) / (1000 * 60 * 60 * 24));
                              const daysLeft = Math.ceil((new Date(item.next_revision_due).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                              return (
                                <div 
                                  key={item.id} 
                                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-[#0A0A0A]/40 border border-[#2D2D2D]/60 rounded-lg hover:border-primary/30 transition-all group"
                                >
                                  <div className="space-y-1 flex-1 min-w-0">
                                    <button
                                      onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                                        detail: {
                                          questionId: item.questions.ID,
                                          title: item.questions.Title,
                                          difficulty: item.questions.Difficulty,
                                          link: item.questions.Link,
                                          mode: "description"
                                        }
                                      }))}
                                      className="font-body-lg text-body-sm font-bold text-white text-left truncate group-hover:text-primary transition-colors cursor-pointer block"
                                    >
                                      {item.questions.Title}
                                    </button>
                                    <div className="flex gap-2 items-center flex-wrap select-none">
                                      <span className={cn(
                                        "text-badge-sm font-mono-label border px-1.5 py-0.5 rounded font-bold uppercase",
                                        item.questions.Difficulty.toLowerCase() === "easy" ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" :
                                        item.questions.Difficulty.toLowerCase() === "medium" ? "border-primary/20 text-primary bg-primary/5" : "border-red-500/20 text-red-400 bg-red-500/5"
                                      )}>
                                        {item.questions.Difficulty}
                                      </span>
                                      <span className="text-badge-sm font-mono-label text-outline uppercase truncate max-w-[150px]">
                                        {item.questions.Topics?.split(",")[0]}
                                      </span>
                                      {activeRevTab === "due" ? (
                                        <span className={cn(
                                          "text-badge-sm font-mono-label font-semibold uppercase",
                                          daysOverdue > 0 ? "text-red-400/90" : "text-secondary"
                                        )}>
                                          {daysOverdue > 0 ? `Overdue by ${daysOverdue}d` : "Due Now"}
                                        </span>
                                      ) : (
                                        <span className="text-badge-sm font-mono-label text-secondary font-semibold uppercase">
                                          Due in {daysLeft} {daysLeft === 1 ? "day" : "days"}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {activeRevTab === "due" ? (
                                    <button
                                      onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                                        detail: {
                                          questionId: item.questions.ID,
                                          title: item.questions.Title,
                                          difficulty: item.questions.Difficulty,
                                          link: item.questions.Link,
                                          mode: "priming"
                                        }
                                      }))}
                                      className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 text-black text-badge-sm bg-primary border border-primary px-3 py-1.5 rounded font-bold hover:bg-[#FFE14D] transition-all uppercase tracking-wider text-center cursor-pointer"
                                    >
                                      REVISE <span className="material-symbols-outlined text-[12px]">sync</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                                        detail: {
                                          questionId: item.questions.ID,
                                          title: item.questions.Title,
                                          difficulty: item.questions.Difficulty,
                                          link: item.questions.Link,
                                          mode: "review"
                                        }
                                      }))}
                                      className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-1.5 text-white text-badge-sm border border-[#2D2D2D] hover:bg-white/5 px-3 py-1.5 rounded font-bold transition-all uppercase tracking-wider text-center cursor-pointer"
                                    >
                                      PRACTICE EARLY
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>

          {/* DSA Module Distribution Table */}
          <motion.section 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] rounded-xl overflow-hidden hover:border-[#FFD400] transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,212,0,0.07)]"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D2D2D] bg-[#111111]/50 select-none">
              <span className="font-headline-md text-xs text-on-surface font-bold uppercase tracking-wide flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#ff6b00]" />
                DSA Module Distribution
              </span>
              <span className="font-mono-label text-[9px] text-outline uppercase tracking-wider">Telemetry Core</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#2D2D2D] bg-[#111111]/50 select-none font-mono text-[9px] text-outline uppercase tracking-wider">
                    <th className="px-6 py-3.5 font-bold">Module</th>
                    <th className="px-6 py-3.5 font-bold">Progress Index</th>
                    <th className="px-6 py-3.5 text-right font-bold">Solved Ratio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#2D2D2D]/30">
                  {topicDistribution.map((row) => (
                    <tr key={row.label} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 text-xs font-bold font-mono">
                        <Link href={`/questions?topic=${encodeURIComponent(row.label)}`} className="text-white hover:text-primary transition-colors block">
                          {row.label.toUpperCase()}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-1.5 bg-[#1C1C1E] rounded-full overflow-hidden flex-1 max-w-[240px]">
                            <div className="h-full bg-primary" style={{ width: `${row.progress}%` }} />
                          </div>
                          <span className="font-mono text-[10px] text-outline font-bold">{row.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-[10px] text-white font-bold">{row.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        </div>

        {/* RIGHT COLUMN: Topic Mastery Chart, XP Streak & Statistics Deck (4 cols) */}
        <div className="lg:col-span-4 space-y-gutter">
          {/* Topic Mastery Donut */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-6 rounded-xl flex flex-col transition-all duration-300 hover:border-[#FFD400] hover:shadow-[0_0_20px_rgba(255,212,0,0.07)]"
          >
            <h2 className="font-mono-label text-mono-label uppercase text-outline mb-4 flex items-center gap-2 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4de082] animate-pulse shadow-[0_0_8px_#4de082]" />
              Topic_Mastery_Index
            </h2>
            <div className="flex items-center justify-center relative py-4">
              <svg className="w-36 h-36 transform -rotate-90">
                <circle cx="72" cy="72" fill="transparent" r="62" stroke="#232325" strokeWidth="10"></circle>
                <circle 
                  cx="72" 
                  cy="72" 
                  fill="transparent" 
                  r="62" 
                  stroke="#4de082" 
                  strokeDasharray="390" 
                  strokeDashoffset={390 - (390 * completionPercent) / 100} 
                  strokeLinecap="round" 
                  strokeWidth="10"
                  className="transition-all duration-1000"
                ></circle>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono text-3xl font-extrabold text-white tracking-tighter">
                  <CountUp end={Math.round(completionPercent)} suffix="%" />
                </span>
                <span className="font-mono-label text-[8px] text-outline uppercase tracking-wider mt-0.5">Global Index</span>
              </div>
            </div>
            <div className="space-y-2 mt-4 border-t border-[#2D2D2D] pt-3">
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-mono-label text-outline uppercase font-semibold">Easy Mastery</span>
                <span className="font-mono text-secondary font-bold bg-[#4de082]/10 border border-[#4de082]/20 px-1.5 py-0.5 rounded">{easyPercent}%</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-mono-label text-outline uppercase font-semibold">Medium Mastery</span>
                <span className="font-mono text-primary font-bold bg-[#FFC700]/10 border border-[#FFC700]/20 px-1.5 py-0.5 rounded">{mediumPercent}%</span>
              </div>
              <div className="flex justify-between items-center text-[10px]">
                <span className="font-mono-label text-outline uppercase font-semibold">Hard Mastery</span>
                <span className="font-mono text-error font-bold bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">{hardPercent}%</span>
              </div>
            </div>
          </motion.div>

          {/* System Telemetry Deck */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-6 rounded-xl space-y-6 transition-all duration-300 hover:border-[#FFD400] hover:shadow-[0_0_20px_rgba(255,212,0,0.07)]"
          >
            <h2 className="font-mono-label text-mono-label uppercase text-outline flex items-center gap-2 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FFC700] animate-pulse shadow-[0_0_8px_#FFC700]" />
              System_Telemetry_Logs
            </h2>
            
            <div className="grid grid-cols-1 gap-4">
              {/* Telemetry 1: Streak */}
              <div className="bg-[#0A0A0A]/40 border border-[#2D2D2D] p-4 rounded-lg flex items-center justify-between relative overflow-hidden group hover:border-[#FFD400]/40 transition-all">
                <div className="space-y-1">
                  <span className="font-mono-label text-[9px] text-outline uppercase block">Current XP Streak</span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-xl text-primary font-bold">{currentStreak}</span>
                    <span className="font-mono-label text-[8px] text-outline uppercase font-semibold">Days Active</span>
                  </div>
                </div>
                <div className="w-20 bg-[#1A1A1A] h-1 rounded-full overflow-hidden shrink-0">
                  <div className="h-full bg-primary" style={{ width: `${Math.min(100, (currentStreak / 30) * 100)}%` }} />
                </div>
              </div>

              {/* Telemetry 2: Weakest Node */}
              <div className="bg-[#0A0A0A]/40 border border-[#2D2D2D] p-4 rounded-lg flex items-center justify-between group hover:border-[#FFD400]/40 border-l-2 border-l-error transition-all">
                <div className="space-y-1">
                  <span className="font-mono-label text-[9px] text-outline uppercase block">Weakest DSA Node</span>
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wide">{weakest}</span>
                </div>
                <span className="material-symbols-outlined text-error opacity-60 text-base shrink-0">warning</span>
              </div>

              {/* Telemetry 3: Peak Activity */}
              <div className="bg-[#0A0A0A]/40 border border-[#2D2D2D] p-4 rounded-lg flex items-center justify-between group hover:border-[#FFD400]/40 border-l-2 border-l-secondary transition-all">
                <div className="space-y-1">
                  <span className="font-mono-label text-[9px] text-outline uppercase block">Peak Activity Cycle</span>
                  <span className="font-mono text-xs font-bold text-white uppercase tracking-wide">{peakActivity}</span>
                </div>
                <span className="material-symbols-outlined text-secondary opacity-60 text-base shrink-0">bolt</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* BOTTOM ROW: Shorter, compact Activity Heatmap and Distribution */}
      <div className="space-y-6 pt-6">
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-5 rounded-xl relative overflow-hidden transition-all duration-300 hover:border-[#FFD400]"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-mono-label text-[10px] uppercase text-outline flex items-center gap-2">
              <span className="material-symbols-outlined text-secondary text-sm">grid_view</span> Consistency Map
            </h2>
            <div className="flex items-center gap-1.5 text-[9px] font-mono-label text-outline select-none">
              <span>Less</span>
              <div className="w-2.5 h-2.5 bg-surface-container-lowest rounded-sm"></div>
              <div className="w-2.5 h-2.5 bg-primary/20 rounded-sm"></div>
              <div className="w-2.5 h-2.5 bg-primary/50 rounded-sm"></div>
              <div className="w-2.5 h-2.5 bg-primary rounded-sm"></div>
              <span>More</span>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar pb-1">
            <Heatmap mode="dashboard" />
          </div>
        </motion.div>

        {/* Scheduling CalendarHUD */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <CalendarHUD />
        </motion.div>

        {/* Weekly Throughput & Difficulty bar metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-5 rounded-xl transition-all duration-300 hover:border-[#FFD400]"
          >
            <h2 className="font-mono-label text-[10px] uppercase text-outline mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">analytics</span> Weekly Throughput
            </h2>
            <div className="h-40 flex items-end justify-between gap-3 px-2">
              {barHeights.map((bar) => (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-2">
                  <div 
                    className={cn(
                      "w-full rounded-t transition-all duration-500",
                      bar.day === "Thu" 
                        ? "bg-primary shadow-[0_0_15px_rgba(255,212,0,0.25)]" 
                        : "bg-primary/20 hover:bg-primary"
                    )} 
                    style={{ height: bar.height }}
                  />
                  <span className={cn("font-mono text-[9px] uppercase", bar.day === "Thu" ? "text-primary font-bold" : "text-outline")}>
                    {bar.day}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-5 rounded-xl transition-all duration-300 hover:border-[#FFD400] flex flex-col justify-between"
          >
            <h2 className="font-mono-label text-[10px] uppercase text-outline mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-outline text-sm">bar_chart</span> Difficulty Distribution
            </h2>
            <div className="space-y-3.5 flex-1 flex flex-col justify-center">
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] uppercase">
                  <span className="text-secondary font-bold">Easy Solved</span>
                  <span className="text-on-surface font-bold">{easySolved}/{totalEasy}</span>
                </div>
                <div className="h-1.5 bg-[#181818] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${easyPercent}%` }} 
                    className="h-full bg-secondary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] uppercase">
                  <span className="text-primary font-bold">Medium Solved</span>
                  <span className="text-on-surface font-bold">{mediumSolved}/{totalMedium}</span>
                </div>
                <div className="h-1.5 bg-[#181818] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${mediumPercent}%` }} 
                    className="h-full bg-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between font-mono text-[10px] uppercase">
                  <span className="text-error font-bold">Hard Solved</span>
                  <span className="text-on-surface font-bold">{hardSolved}/{totalHard}</span>
                </div>
                <div className="h-1.5 bg-[#181818] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${hardPercent}%` }} 
                    className="h-full bg-error"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer info footnote */}
      <footer className="border-t border-[#2D2D2D] py-stack-md mt-12 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 text-xs">
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
