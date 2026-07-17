"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Zap, Loader2, ExternalLink, Coffee, Linkedin, Instagram, Sparkles, Settings, X, ArrowRight, BookOpen, Award, Activity, ChevronRight, Calendar } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { cn, fetchWithCache } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { buildRoadmap, RoadmapTask } from "@/lib/planner-engine";

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

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [solvedList, setSolvedList] = useState<SolvedQuestion[]>([]);
  
  // Streak metrics
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Daily Mission states
  const [dailyQuest, setDailyQuest] = useState<any>(null);
  const [weakestTopic, setWeakestTopic] = useState("Array");

  // Revision states
  const [revisionQueue, setRevisionQueue] = useState<any[]>([]);

  // Interactive console states
  const [showFocusModal, setShowFocusModal] = useState(false);
  const [todaysMission, setTodaysMission] = useState<RoadmapTask[]>([]);
  const [studyMode, setStudyMode] = useState<"learn" | "balanced" | "review">("balanced");
  const [dailyLoad, setDailyLoad] = useState<"light" | "balanced" | "intensive">("balanced");
  const [weeklyActivities, setWeeklyActivities] = useState(0);
  const [weeklyTopTopic, setWeeklyTopTopic] = useState("Trees");
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [focusDuration, setFocusDuration] = useState<string>("7");
  const [focusDifficulty, setFocusDifficulty] = useState<string>("mix");
  const [focusSource, setFocusSource] = useState<string>("core");
  const [focusReviewDensity, setFocusReviewDensity] = useState<string>("balanced");
  const [focusStartDate, setFocusStartDate] = useState<string>("");

  // Temporary console modal states (saved on modal Done / close)
  const [tempFocusTopics, setTempFocusTopics] = useState<string[]>([]);
  const [tempDuration, setTempDuration] = useState<string>("7");
  const [tempDifficulty, setTempDifficulty] = useState<string>("mix");
  const [tempSource, setTempSource] = useState<string>("core");
  const [tempReviewDensity, setTempReviewDensity] = useState<string>("balanced");
  const [tempStudyMode, setTempStudyMode] = useState<"learn" | "balanced" | "review">("balanced");
  const [tempDailyLoad, setTempDailyLoad] = useState<"light" | "balanced" | "intensive">("balanced");
  
  // Added diagnostic, resume, and blueprint states
  const [practiceAccuracy, setPracticeAccuracy] = useState<number | null>(null);
  const [savedBlueprintsCount, setSavedBlueprintsCount] = useState<number>(0);
  const [confusedPattern, setConfusedPattern] = useState<string | null>(null);
  const [recentBlueprints, setRecentBlueprints] = useState<any[]>([]);
  const [blueprintsLoading, setBlueprintsLoading] = useState(false);
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  
  const [resumeSession, setResumeSession] = useState<{
    lastPattern?: { slug: string; name: string } | null;
    lastQuestion?: { id: number; title: string; difficulty: string; link: string } | null;
    lastCompany?: { slug: string; name: string } | null;
    lastBlueprint?: { id: number; title: string; difficulty: string; link: string } | null;
  }>({});

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
      
      const savedDuration = localStorage.getItem("sheetstride-focus-duration");
      if (savedDuration) setFocusDuration(savedDuration);
      
      const savedDifficulty = localStorage.getItem("sheetstride-focus-difficulty");
      if (savedDifficulty) setFocusDifficulty(savedDifficulty);
      
      const savedSource = localStorage.getItem("sheetstride-focus-source");
      if (savedSource) setFocusSource(savedSource);
      
      const savedDensity = localStorage.getItem("sheetstride-focus-density");
      if (savedDensity) setFocusReviewDensity(savedDensity);

      const savedStartDate = localStorage.getItem("sheetstride-focus-start-date");
      if (savedStartDate) setFocusStartDate(savedStartDate);
      
      const savedTopicsVal = localStorage.getItem("sheetstride-focus-topics");
      if (savedTopicsVal) {
        try {
          const parsed = JSON.parse(savedTopicsVal);
          if (Array.isArray(parsed)) {
            setFocusTopics(parsed);
          }
        } catch (e) {}
      }
    }
  }, []);

  // Poll resume items from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const lastPat = localStorage.getItem("sheetstride-last-pattern");
      const lastPatName = localStorage.getItem("sheetstride-last-pattern-name");
      const lastQuestId = localStorage.getItem("sheetstride-last-question");
      const lastQuestTitle = localStorage.getItem("sheetstride-last-question-title");
      const lastQuestDiff = localStorage.getItem("sheetstride-last-question-difficulty");
      const lastQuestLink = localStorage.getItem("sheetstride-last-question-link");
      const lastComp = localStorage.getItem("sheetstride-last-company");
      const lastCompName = localStorage.getItem("sheetstride-last-company-name");
      const lastBpId = localStorage.getItem("sheetstride-last-blueprint");
      const lastBpTitle = localStorage.getItem("sheetstride-last-blueprint-title");
      const lastBpDiff = localStorage.getItem("sheetstride-last-blueprint-difficulty");
      const lastBpLink = localStorage.getItem("sheetstride-last-blueprint-link");

      setResumeSession({
        lastPattern: lastPat && lastPatName ? { slug: lastPat, name: lastPatName } : null,
        lastQuestion: lastQuestId && lastQuestTitle ? {
          id: Number(lastQuestId),
          title: lastQuestTitle,
          difficulty: lastQuestDiff || "Medium",
          link: lastQuestLink || ""
        } : null,
        lastCompany: lastComp && lastCompName ? { slug: lastComp, name: lastCompName } : null,
        lastBlueprint: lastBpId && lastBpTitle ? {
          id: Number(lastBpId),
          title: lastBpTitle,
          difficulty: lastBpDiff || "Medium",
          link: lastBpLink || ""
        } : null
      });
    }
  }, []);

  async function loadDashboardData() {
    if (!user) return;
    const userId = user.id;

    try {
      setLoading(true);

      // Determine current preferences (from state or fallback)
      let currentMode: "learn" | "balanced" | "review" = studyMode;
      let currentLoad: "light" | "balanced" | "intensive" = dailyLoad;
      let currentDuration = focusDuration;
      let currentDifficulty = focusDifficulty;
      let currentSource = focusSource;
      let currentDensity = focusReviewDensity;
      let currentTopics = focusTopics;
      
      const metadata = user.user_metadata || {};
      const savedMode = metadata["sheetstride-study-mode"] || localStorage.getItem("sheetstride-study-mode");
      if (savedMode && ["learn", "balanced", "review"].includes(savedMode)) {
        currentMode = savedMode as any;
      }
      const savedLoad = metadata["sheetstride-daily-load"] || localStorage.getItem("sheetstride-daily-load");
      if (savedLoad && ["light", "balanced", "intensive"].includes(savedLoad)) {
        currentLoad = savedLoad as any;
      }

      const savedDuration = metadata["sheetstride-focus-duration"] || localStorage.getItem("sheetstride-focus-duration");
      if (savedDuration) currentDuration = savedDuration;

      const savedDifficulty = metadata["sheetstride-focus-difficulty"] || localStorage.getItem("sheetstride-focus-difficulty");
      if (savedDifficulty) currentDifficulty = savedDifficulty;

      const savedSource = metadata["sheetstride-focus-source"] || localStorage.getItem("sheetstride-focus-source");
      if (savedSource) currentSource = savedSource;

      const savedDensity = metadata["sheetstride-focus-density"] || localStorage.getItem("sheetstride-focus-density");
      if (savedDensity) currentDensity = savedDensity;

      const savedStartDate = metadata["sheetstride-focus-start-date"] || localStorage.getItem("sheetstride-focus-start-date");
      if (savedStartDate) {
        setFocusStartDate(savedStartDate);
      }

      const savedTopicsVal = metadata["sheetstride-focus-topics"] || localStorage.getItem("sheetstride-focus-topics");
      if (savedTopicsVal) {
        try {
          const parsed = typeof savedTopicsVal === "string" ? JSON.parse(savedTopicsVal) : savedTopicsVal;
          if (Array.isArray(parsed)) {
            currentTopics = parsed;
          }
        } catch (e) {
          console.warn("Failed to parse focus topics:", e);
        }
      }

      // Compile roadmap contract using isolated engine
      const roadmap = await buildRoadmap(userId, supabase, {
        studyMode: currentMode,
        dailyLoad: currentLoad,
        focusDifficulty: currentDifficulty,
        focusSource: currentSource,
        focusReviewDensity: currentDensity,
        focusTopics: currentTopics
      });

      // Update state indicators directly from compiled roadmap contract
      setTodaysMission(roadmap.items);
      setWeeklyActivities(roadmap.weeklyActivities);
      setWeeklyTopTopic(roadmap.weeklyTopTopic);
      setWeakestTopic(roadmap.weakestTopic);
      setDailyQuest(roadmap.dailyQuest);
      setRevisionQueue(roadmap.revisionQueue);
      setCurrentStreak(roadmap.currentStreak);
      setLongestStreak(roadmap.longestStreak);
      setFocusTopics(roadmap.focusTopics);
      setFocusDuration(currentDuration);
      setFocusDifficulty(currentDifficulty);
      setFocusSource(currentSource);
      setFocusReviewDensity(currentDensity);

      // Fetch solvedList questions to populate client counts
      const { data: userProgress, error: progressError } = await supabase
        .from("user_progress")
        .select("question_id")
        .eq("user_id", userId)
        .eq("completed", true);

      if (!progressError && userProgress && userProgress.length > 0) {
        const questionIds = userProgress.map((row: any) => row.question_id);
        const { data: questionsData } = await supabase
          .from("questions")
          .select("ID, Title, Difficulty, Topics")
          .in("ID", questionIds);
        
        if (questionsData) {
          setSolvedList(questionsData as SolvedQuestion[]);
        }
      } else {
        setSolvedList([]);
      }

      // Fetch LeetCode username
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

      // Fetch practice accuracy from drill_history
      try {
        const { data: drills } = await supabase
          .from("drill_history")
          .select("is_correct")
          .eq("user_id", userId);
        
        if (drills && drills.length > 0) {
          const correct = drills.filter((d: any) => d.is_correct).length;
          setPracticeAccuracy(Math.round((correct / drills.length) * 100));
        } else {
          setPracticeAccuracy(null);
        }
      } catch (err) {
        console.warn("Failed to calculate drill accuracy:", err);
      }

      // Fetch count of saved blueprints
      try {
        const { count, error } = await supabase
          .from("user_notebooks")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);
        if (!error && count !== null) {
          setSavedBlueprintsCount(count);
        }
      } catch (e) {}

      // Calculate confused pattern pairs
      try {
        const { data: incorrectDrills } = await supabase
          .from("drill_history")
          .select("selected_pattern, correct_pattern")
          .eq("user_id", userId)
          .eq("is_correct", false);

        if (incorrectDrills && incorrectDrills.length > 0) {
          const confusionMap: Record<string, number> = {};
          incorrectDrills.forEach((d: any) => {
            if (d.selected_pattern && d.correct_pattern) {
              const pair = [d.selected_pattern, d.correct_pattern].sort().join(" vs ");
              confusionMap[pair] = (confusionMap[pair] || 0) + 1;
            }
          });
          const sortedPairs = Object.entries(confusionMap).sort((a, b) => b[1] - a[1]);
          if (sortedPairs.length > 0) {
            setConfusedPattern(sortedPairs[0][0]);
          } else {
            setConfusedPattern(null);
          }
        } else {
          setConfusedPattern(null);
        }
      } catch (e) {
        console.warn("Failed to calculate pattern overlaps:", e);
      }

      // Fetch user's recent blueprints from user_notebooks
      try {
        setBlueprintsLoading(true);
        const { data: dbBlueprints, error: bpError } = await supabase
          .from("user_notebooks")
          .select("question_id, updated_at, biggest_takeaway")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false })
          .limit(2);

        if (!bpError && dbBlueprints && dbBlueprints.length > 0) {
          const bpQuestionIds = dbBlueprints.map(b => b.question_id);
          const { data: qData, error: qErr } = await supabase
            .from("questions")
            .select("ID, Title, Difficulty, Link")
            .in("ID", bpQuestionIds);

          if (!qErr && qData) {
            const qMap = new Map(qData.map(q => [q.ID, q]));
            const resolvedBps = dbBlueprints.map(b => ({
              ...b,
              question: qMap.get(b.question_id)
            })).filter(b => b.question);
            setRecentBlueprints(resolvedBps);
          } else {
            setRecentBlueprints([]);
          }
        } else {
          setRecentBlueprints([]);
        }
      } catch (err) {
        console.warn("Failed to fetch recent blueprints:", err);
      } finally {
        setBlueprintsLoading(false);
      }

    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveAllPlannerSettings = async () => {
    // 1. Optimistically update all primary states
    setFocusTopics(tempFocusTopics);
    setFocusDuration(tempDuration);
    setFocusDifficulty(tempDifficulty);
    setFocusSource(tempSource);
    setFocusReviewDensity(tempReviewDensity);
    setStudyMode(tempStudyMode);
    setDailyLoad(tempDailyLoad);

    const todayISO = new Date().toISOString();
    
    // Check if topics actually changed to decide if we reset cycle start date
    const topicsChanged = JSON.stringify(tempFocusTopics) !== JSON.stringify(focusTopics);
    if (topicsChanged) {
      setFocusStartDate(todayISO);
      localStorage.setItem("sheetstride-focus-start-date", todayISO);
    }

    // 2. Persist everything to localStorage
    localStorage.setItem("sheetstride-focus-topics", JSON.stringify(tempFocusTopics));
    localStorage.setItem("sheetstride-focus-duration", tempDuration);
    localStorage.setItem("sheetstride-focus-difficulty", tempDifficulty);
    localStorage.setItem("sheetstride-focus-source", tempSource);
    localStorage.setItem("sheetstride-focus-density", tempReviewDensity);
    localStorage.setItem("sheetstride-study-mode", tempStudyMode);
    localStorage.setItem("sheetstride-daily-load", tempDailyLoad);

    // 3. Persist everything to auth metadata in one single call!
    try {
      const authUpdates: any = {
        "sheetstride-focus-topics": tempFocusTopics,
        "sheetstride-focus-duration": tempDuration,
        "sheetstride-focus-difficulty": tempDifficulty,
        "sheetstride-focus-source": tempSource,
        "sheetstride-focus-density": tempReviewDensity,
        "sheetstride-study-mode": tempStudyMode,
        "sheetstride-daily-load": tempDailyLoad
      };
      if (topicsChanged) {
        authUpdates["sheetstride-focus-start-date"] = todayISO;
      }
      await supabase.auth.updateUser({
        data: authUpdates
      });
    } catch (authErr) {
      console.warn("Failed to sync planner settings to auth metadata:", authErr);
    }

    // 4. Background upsert profiles
    try {
      await supabase
        .from("profiles")
        .upsert({ 
          id: user?.id, 
          focus_topics: tempFocusTopics 
        });
    } catch (err) {
      console.warn("Profiles database upsert skipped (table may not exist):", err);
    }

    // 5. Close modal
    setShowFocusModal(false);
    
    // 6. Reload data exactly once!
    await loadDashboardData();
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

      const savedDuration = metadata["sheetstride-focus-duration"];
      if (savedDuration) setFocusDuration(savedDuration);

      const savedDifficulty = metadata["sheetstride-focus-difficulty"];
      if (savedDifficulty) setFocusDifficulty(savedDifficulty);

      const savedSource = metadata["sheetstride-focus-source"];
      if (savedSource) setFocusSource(savedSource);

      const savedDensity = metadata["sheetstride-focus-density"];
      if (savedDensity) setFocusReviewDensity(savedDensity);

      const savedStartDate = metadata["sheetstride-focus-start-date"];
      if (savedStartDate) setFocusStartDate(savedStartDate);

      const savedTopicsVal = metadata["sheetstride-focus-topics"] || localStorage.getItem("sheetstride-focus-topics");
      if (savedTopicsVal) {
        try {
          const parsed = typeof savedTopicsVal === "string" ? JSON.parse(savedTopicsVal) : savedTopicsVal;
          if (Array.isArray(parsed)) {
            setFocusTopics(parsed);
          }
        } catch (e) {
          console.warn("Failed to parse focus topics in useEffect:", e);
        }
      }
    }
  }, [user]);

  useEffect(() => {
    loadDashboardData();

    window.addEventListener("question-solved", loadDashboardData);
    return () => {
      window.removeEventListener("question-solved", loadDashboardData);
    };
  }, [user, studyMode, dailyLoad, focusDuration, focusDifficulty, focusSource, focusReviewDensity, focusTopics]);

  // Synchronize temporary states when modal opens
  useEffect(() => {
    if (showFocusModal) {
      setTempFocusTopics(focusTopics);
      setTempDuration(focusDuration);
      setTempDifficulty(focusDifficulty);
      setTempSource(focusSource);
      setTempReviewDensity(focusReviewDensity);
      setTempStudyMode(studyMode);
      setTempDailyLoad(dailyLoad);
    }
  }, [showFocusModal, focusTopics, focusDuration, focusDifficulty, focusSource, focusReviewDensity, studyMode, dailyLoad]);

  const completedTasks = todaysMission.filter(t => t.completed).length;
  const totalTasks = todaysMission.length || 1;
  const missionPercent = Math.round((completedTasks / totalTasks) * 100);
  const isRoadmapComplete = todaysMission.length > 0 && todaysMission.every(t => t.completed);

  const getFocusCycleText = () => {
    if (!focusStartDate) return "";
    const start = new Date(focusStartDate);
    const today = new Date();
    start.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - start.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24))) + 1;
    const duration = parseInt(focusDuration) || 7;
    if (diffDays > duration) {
      return "Expired - Reset Focus";
    }
    return `Day ${diffDays} of ${duration}`;
  };

  const welcomeText = user ? (
    <>
      Welcome back, {user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Operator"}.
      {" "}Your current focus is <span className="text-primary font-bold">{focusTopics[0] || weakestTopic}</span>
      {focusStartDate && <span className="text-outline/80 text-[10px] ml-1">({getFocusCycleText()})</span>}.
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

  if (loading) {
    return (
      <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-6">
          <div className="lg:col-span-8 bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-6 rounded-xl space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#111111]/72 border border-[#2D2D2D] p-6 rounded-xl space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="bg-[#111111]/72 border border-[#2D2D2D] p-6 rounded-xl space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      
      {/* 2-Column Professional Operating Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pt-6 font-body">
        
        {/* Left Column (Primary Workspace - 60% Width / 7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Zone 1: Daily Study Roadmap */}
          <motion.div 
            id="today-roadmap"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-[#111111]/70 border border-[#2D2D2D] backdrop-blur-md p-6 rounded-xl relative overflow-hidden group transition-all duration-300 hover:bg-[#151515]/90 hover:border-primary/20"
          >
            <header className="flex justify-between items-start mb-4 border-b border-[#2D2D2D]/60 pb-3">
              <div>
                <span className="font-mono-label text-[10px] text-primary uppercase mb-1 block">Active Plan</span>
                <h1 className="font-headline-sm text-base uppercase tracking-tight text-on-surface font-bold">
                  Daily Study Roadmap: <span className="text-secondary">{completedTasks}/{totalTasks} COMPLETED</span>
                </h1>
              </div>
              <button
                onClick={() => setShowFocusModal(true)}
                className="px-2.5 py-1.5 border border-[#2D2D2D] hover:border-primary/50 text-outline hover:text-primary rounded font-mono text-[9px] uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all bg-[#0A0A0A]/40"
              >
                <Settings className="h-3 w-3" /> Adjust Config
              </button>
            </header>

            <div className="mb-4 text-xs font-body text-outline leading-relaxed border-b border-[#2D2D2D]/40 pb-3 font-medium">
              {welcomeText}
            </div>

            {isRoadmapComplete ? (
              <div className="space-y-6 py-4 select-none">
                <div className="text-center space-y-2 max-w-md mx-auto">
                  <div className="inline-flex p-3 bg-secondary/10 rounded-full border border-secondary/20 mb-2">
                    <CheckCircle2 className="h-8 w-8 text-secondary animate-pulse" />
                  </div>
                  <h2 className="font-display font-semibold text-sm text-secondary uppercase tracking-wider">
                    Excellent progress today.
                  </h2>
                  <p className="font-body text-xs text-outline leading-relaxed">
                    Your daily study roadmap is complete. Tomorrow's task sequence will be generated automatically based on your active focus targets.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0C0C0C]/60 border border-[#222]/80 p-4 rounded-xl font-mono text-[9px]">
                  <div className="space-y-1">
                    <span className="text-outline/50 block text-[8px] uppercase tracking-wider font-bold">Solved</span>
                    <span className="text-text font-bold text-xs">
                      {todaysMission.filter((t) => t.type === "solve" && t.completed).length} / {todaysMission.filter((t) => t.type === "solve").length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-outline/50 block text-[8px] uppercase tracking-wider font-bold">Revised</span>
                    <span className="text-text font-bold text-xs">
                      {todaysMission.filter((t) => t.type === "revise" && t.completed).length} / {todaysMission.filter((t) => t.type === "revise").length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-outline/50 block text-[8px] uppercase tracking-wider font-bold">Drilled</span>
                    <span className="text-text font-bold text-xs">
                      {todaysMission.filter((t) => t.type === "drill" && t.completed).length} / {todaysMission.filter((t) => t.type === "drill").length}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-outline/50 block text-[8px] uppercase tracking-wider font-bold">Topic Focus</span>
                    <span className="text-text font-bold text-xs truncate block max-w-full" title={focusTopics.join(", ") || weakestTopic}>
                      {focusTopics[0] || weakestTopic}
                      {focusStartDate && <span className="text-outline text-[9px] block font-normal font-mono">({getFocusCycleText()})</span>}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 relative z-10 font-body">
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
                        <span className="material-symbols-outlined text-[12px] font-bold">check</span>
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
                        </div>

                        {task.type === "solve" || task.type === "revise" ? (
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                              detail: {
                                questionId: task.question?.ID,
                                title: task.question?.Title,
                                difficulty: task.question?.Difficulty,
                                link: task.question?.Link,
                                mode: task.type === "revise" ? "priming" : "description"
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
                        className="p-1.5 border border-[#222] hover:border-primary/50 rounded text-outline/65 hover:text-primary transition-colors flex-shrink-0"
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

          {/* Zone 3: Resume Session Widget */}
          {(resumeSession.lastPattern || resumeSession.lastQuestion || resumeSession.lastCompany || resumeSession.lastBlueprint) && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="bg-[#111111]/70 border border-[#2D2D2D] p-6 rounded-xl space-y-4 backdrop-blur-md transition-all duration-300 hover:bg-[#151515]/90 hover:border-primary/20"
            >
              <header className="border-b border-[#2D2D2D]/60 pb-3">
                <span className="font-mono-label text-[10px] text-primary uppercase mb-1 block">Continuity</span>
                <h2 className="font-headline-sm text-sm uppercase tracking-tight text-on-surface font-bold">Resume Session</h2>
              </header>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {resumeSession.lastPattern && (
                  <Link 
                    href={`/patterns/${resumeSession.lastPattern.slug}`}
                    className="bg-[#0C0C0C]/50 hover:bg-[#151515]/80 border border-[#2D2D2D]/80 hover:border-primary/40 p-4 rounded-xl flex items-center justify-between group transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-primary font-mono block mb-1">Pattern</span>
                      <p className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">{resumeSession.lastPattern.name}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-outline group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                )}
                {resumeSession.lastBlueprint && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                      detail: {
                        questionId: resumeSession.lastBlueprint?.id,
                        title: resumeSession.lastBlueprint?.title,
                        difficulty: resumeSession.lastBlueprint?.difficulty,
                        link: resumeSession.lastBlueprint?.link,
                        mode: "notebook"
                      }
                    }))}
                    className="bg-[#0C0C0C]/50 hover:bg-[#151515]/80 border border-[#2D2D2D]/80 hover:border-primary/40 p-4 rounded-xl flex items-center justify-between group text-left transition-all cursor-pointer border-none"
                  >
                    <div className="min-w-0 pr-2 flex-1">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-secondary font-mono block mb-1">Blueprint</span>
                      <p className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">{resumeSession.lastBlueprint.title}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-outline group-hover:text-primary transition-colors shrink-0" />
                  </button>
                )}
                {resumeSession.lastQuestion && (
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                      detail: {
                        questionId: resumeSession.lastQuestion?.id,
                        title: resumeSession.lastQuestion?.title,
                        difficulty: resumeSession.lastQuestion?.difficulty,
                        link: resumeSession.lastQuestion?.link,
                        mode: "description"
                      }
                    }))}
                    className="bg-[#0C0C0C]/50 hover:bg-[#151515]/80 border border-[#2D2D2D]/80 hover:border-primary/40 p-4 rounded-xl flex items-center justify-between group text-left transition-all cursor-pointer border-none"
                  >
                    <div className="min-w-0 pr-2 flex-1">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-tertiary font-mono block mb-1">Question</span>
                      <p className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">{resumeSession.lastQuestion.title}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-outline group-hover:text-primary transition-colors shrink-0" />
                  </button>
                )}
                {resumeSession.lastCompany && (
                  <Link 
                    href={`/questions/company-sheets/${resumeSession.lastCompany.slug}`}
                    className="bg-[#0C0C0C]/50 hover:bg-[#151515]/80 border border-[#2D2D2D]/80 hover:border-primary/40 p-4 rounded-xl flex items-center justify-between group transition-all"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-outline font-mono block mb-1">Company</span>
                      <p className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">{resumeSession.lastCompany.name}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-outline group-hover:text-primary transition-colors shrink-0" />
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          {/* Recently Saved Blueprints Drafts Summary */}
          {recentBlueprints.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.4 }}
              className="bg-[#111111]/70 border border-[#2D2D2D] p-6 rounded-xl space-y-4 backdrop-blur-md transition-all duration-300 hover:bg-[#151515]/90 hover:border-primary/20"
            >
              <header className="border-b border-[#2D2D2D]/60 pb-3 flex justify-between items-center">
                <div>
                  <span className="font-mono-label text-[10px] text-secondary uppercase mb-1 block">Knowledge Library</span>
                  <h2 className="font-headline-sm text-sm uppercase tracking-tight text-on-surface font-bold">Recent Solution Blueprints</h2>
                </div>
              </header>
              <div className="space-y-3">
                {recentBlueprints.map((bp) => (
                  <div 
                    key={bp.question_id}
                    onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                      detail: {
                        questionId: bp.question.ID,
                        title: bp.question.Title,
                        difficulty: bp.question.Difficulty,
                        link: bp.question.Link,
                        mode: "notebook"
                      }
                    }))}
                    className="p-3 bg-[#0C0C0C]/50 hover:bg-[#121212] border border-[#2D2D2D]/85 hover:border-primary/30 rounded-lg flex items-center justify-between gap-4 transition-all cursor-pointer group"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[8px] text-outline">#{bp.question.ID}</span>
                        <span className={cn(
                          "text-[8px] font-bold font-mono px-1.5 py-0.5 rounded uppercase leading-none border",
                          bp.question.Difficulty.toLowerCase() === "easy" && "bg-secondary/5 border-secondary/15 text-secondary",
                          bp.question.Difficulty.toLowerCase() === "medium" && "bg-primary/5 border-primary/15 text-primary",
                          bp.question.Difficulty.toLowerCase() === "hard" && "bg-danger/5 border-danger/15 text-danger"
                        )}>
                          {bp.question.Difficulty}
                        </span>
                      </div>
                      <h4 className="text-xs font-semibold text-text truncate group-hover:text-primary transition-colors">{bp.question.Title}</h4>
                      {bp.biggest_takeaway && (
                        <p className="text-[10px] text-outline/70 truncate mt-1 italic">"{bp.biggest_takeaway}"</p>
                      )}
                    </div>
                    <BookOpen className="h-4 w-4 text-outline group-hover:text-primary transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </div>

        {/* Right Column (Sidebar - 40% Width / 5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Zone 2: Preparation Summary */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="bg-[#111111]/70 border border-[#2D2D2D] p-6 rounded-xl space-y-4 backdrop-blur-md transition-all duration-300 hover:bg-[#151515]/90 hover:border-primary/20"
          >
            <header className="border-b border-[#2D2D2D]/60 pb-3">
              <span className="font-mono-label text-[10px] text-primary uppercase mb-1 block">Preparation Summary</span>
              <h2 className="font-headline-sm text-sm uppercase tracking-tight text-on-surface font-bold">Plan Diagnostics</h2>
            </header>
            
            <div className="space-y-4 font-mono text-[10px] text-outline">
              <div className="flex justify-between items-center border-b border-[#2D2D2D]/20 pb-2.5">
                <span className="uppercase font-bold text-outline-variant font-body">Active focus</span>
                <span className="text-primary font-bold uppercase truncate max-w-[200px]" title={focusTopics.join(", ") || weakestTopic}>
                  {focusTopics[0] || weakestTopic}
                  {focusStartDate && <span className="text-outline text-[8px] ml-1 font-normal font-mono">({getFocusCycleText()})</span>}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-[#2D2D2D]/20 pb-2.5">
                <span className="uppercase font-bold text-outline-variant font-body">Plan Progress</span>
                <span className="text-text font-bold">
                  {completedTasks} / {totalTasks} COMPLETED
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-[#2D2D2D]/20 pb-2.5">
                <span className="uppercase font-bold text-outline-variant font-body">Drill Accuracy</span>
                <span className="text-secondary font-bold">
                  {practiceAccuracy !== null ? `${practiceAccuracy}% CORRECT` : "100% CORRECT"}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-[#2D2D2D]/20 pb-2.5">
                <span className="uppercase font-bold text-outline-variant font-body">Next Review</span>
                {revisionQueue.length > 0 ? (
                  <span className="text-amber-500 font-bold">
                    {revisionQueue.length} OVERDUE
                  </span>
                ) : (
                  <span className="text-secondary font-bold">ALL CAUGHT UP</span>
                )}
              </div>

              <div className="flex justify-between items-center pb-1">
                <span className="uppercase font-bold text-outline-variant font-body">Saved Blueprints</span>
                <span className="text-text font-bold">
                  {savedBlueprintsCount} CREATED
                </span>
              </div>
            </div>
          </motion.div>

          {/* Zone 4: Quick Access Shortcuts */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="bg-[#111111]/70 border border-[#2D2D2D] p-6 rounded-xl space-y-4 backdrop-blur-md transition-all duration-300 hover:bg-[#151515]/90 hover:border-primary/20"
          >
            <header className="border-b border-[#2D2D2D]/60 pb-3">
              <span className="font-mono-label text-[10px] text-primary uppercase mb-1 block">Shortcuts</span>
              <h2 className="font-headline-sm text-sm uppercase tracking-tight text-on-surface font-bold">Quick Access</h2>
            </header>
            
            <div className="grid grid-cols-2 gap-3 text-center">
              <Link
                href="/patterns"
                className="border border-[#2D2D2D] hover:border-primary/45 bg-[#0C0C0C]/40 hover:bg-[#151515] py-2.5 px-3 rounded font-mono text-[9px] uppercase tracking-wider font-bold text-outline hover:text-primary transition-all"
              >
                Pattern Atlas
              </Link>
              <Link
                href="/practice"
                className="border border-[#2D2D2D] hover:border-primary/45 bg-[#0C0C0C]/40 hover:bg-[#151515] py-2.5 px-3 rounded font-mono text-[9px] uppercase tracking-wider font-bold text-outline hover:text-primary transition-all"
              >
                Practice Studio
              </Link>
              <Link
                href="/questions"
                className="border border-[#2D2D2D] hover:border-primary/45 bg-[#0C0C0C]/40 hover:bg-[#151515] py-2.5 px-3 rounded font-mono text-[9px] uppercase tracking-wider font-bold text-outline hover:text-primary transition-all"
              >
                Question Catalog
              </Link>
              <Link
                href="/questions/company-sheets"
                className="border border-[#2D2D2D] hover:border-primary/45 bg-[#0C0C0C]/40 hover:bg-[#151515] py-2.5 px-3 rounded font-mono text-[9px] uppercase tracking-wider font-bold text-outline hover:text-primary transition-all"
              >
                Company Sheets
              </Link>
              <Link
                href="/progress"
                className="border border-[#2D2D2D] hover:border-primary/45 bg-[#0C0C0C]/40 hover:bg-[#151515] py-2.5 px-3 rounded font-mono text-[9px] uppercase tracking-wider font-bold text-outline hover:text-primary transition-all"
              >
                Revision Queue
              </Link>
              <Link
                href="/progress"
                className="border border-[#2D2D2D] hover:border-primary/45 bg-[#0C0C0C]/40 hover:bg-[#151515] py-2.5 px-3 rounded font-mono text-[9px] uppercase tracking-wider font-bold text-outline hover:text-primary transition-all"
              >
                Blueprint Library
              </Link>
            </div>
          </motion.div>

          {/* Zone 5: Preparation Insights */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="bg-[#111111]/70 border border-[#2D2D2D] p-6 rounded-xl space-y-4 backdrop-blur-md transition-all duration-300 hover:bg-[#151515]/90 hover:border-primary/20"
          >
            <header className="border-b border-[#2D2D2D]/60 pb-3">
              <span className="font-mono-label text-[10px] text-primary uppercase mb-1 block">Analysis & Insights</span>
              <h2 className="font-headline-sm text-sm uppercase tracking-tight text-on-surface font-bold">Preparation Insights</h2>
            </header>
            
            <div className="space-y-3.5 font-mono text-[9px] text-outline leading-relaxed">
              {confusedPattern ? (
                <div className="flex gap-2.5 items-start border-b border-[#2D2D2D]/10 pb-2.5">
                  <span className="text-amber-500 font-bold shrink-0">⚠️</span>
                  <div>
                    <span className="text-text font-bold uppercase block mb-0.5 font-body">Overlap Confusion Detected</span>
                    <span>You make pattern-recognition errors between <span className="text-primary font-bold">{confusedPattern.toUpperCase()}</span>. Review both blueprints to resolve overlapping triggers.</span>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2.5 items-start border-b border-[#2D2D2D]/10 pb-2.5">
                  <span className="text-secondary font-bold shrink-0">✓</span>
                  <div>
                    <span className="text-text font-bold uppercase block mb-0.5 font-body">Recognition Steady</span>
                    <span>No major pattern overlap confusion detected. Practice diagnostic accuracy is optimal.</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 items-start border-b border-[#2D2D2D]/10 pb-2.5">
                <Activity className="h-4.5 w-4.5 text-primary shrink-0" />
                <div>
                  <span className="text-text font-bold uppercase block mb-0.5 font-body">Weekly Accomplishments</span>
                  <span>You completed <span className="text-secondary font-bold">{weeklyActivities}</span> learning activities this week. Top topic is <span className="text-primary font-bold">{weeklyTopTopic}</span>.</span>
                </div>
              </div>

              <div className="flex gap-2.5 items-start pb-1">
                <Calendar className="h-4.5 w-4.5 text-secondary shrink-0" />
                <div>
                  <span className="text-text font-bold uppercase block mb-0.5 font-body">Solve Streaks</span>
                  <span>Your current streak is <span className="text-secondary font-bold">{currentStreak} days</span> (personal record: {longestStreak} days). Keep it active.</span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

      </div>

      {/* Footer metadata */}
      <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#2D2D2D] py-8 opacity-50 md:flex-row text-xs font-body">
        <div className="flex items-center gap-2">
          <span className="font-display-arcade text-primary text-sm tracking-wider">SHEETSTRIDE</span>
          <span className="text-[9px] font-mono-label text-outline/50">// WORKSPACE ACTIVE</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 font-mono-label text-xs">
          <a 
            href="https://rzp.io/rzp/sheetstride" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-1.5 hover:text-primary transition-colors group"
          >
            <Coffee className="w-3.5 h-3.5 text-primary group-hover:scale-110 transition-transform" />
            <span>SUPPORT US</span>
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
            <div className="absolute inset-0" onClick={handleSaveAllPlannerSettings} />
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
                  onClick={handleSaveAllPlannerSettings}
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
                    const isChecked = tempFocusTopics.includes(topic);
                    return (
                      <button
                        key={topic}
                        onClick={() => {
                          const updated = isChecked
                            ? tempFocusTopics.filter((t) => t !== topic)
                            : [...tempFocusTopics, topic];
                          setTempFocusTopics(updated);
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
                        onClick={() => setTempStudyMode(m.id)}
                        className={cn(
                          "px-2.5 py-1.5 border text-left rounded text-[10px] font-bold uppercase transition-all cursor-pointer select-none",
                          tempStudyMode === m.id
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
                        onClick={() => setTempDailyLoad(l.id)}
                        className={cn(
                          "px-2.5 py-1.5 border text-left rounded text-[10px] font-bold uppercase transition-all cursor-pointer select-none",
                          tempDailyLoad === l.id
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

              {/* 4. Focus Schedule Configurations */}
              <div className="border-t border-[#2D2D2D]/60 pt-3 space-y-4 select-none">
                <span className="block text-[10px] text-primary uppercase font-bold tracking-wider">4 // Focus Scheduler Tuning</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Q1: Focus Duration */}
                  <div className="space-y-1.5">
                    <span className="block text-[8px] text-outline uppercase font-bold tracking-wide">Duration // Continue selected topics</span>
                    <div className="flex gap-1 flex-wrap">
                      {([
                        { id: "7", label: "7d" },
                        { id: "14", label: "14d" },
                        { id: "21", label: "21d" },
                        { id: "30", label: "30d" }
                      ] as const).map((d) => (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => setTempDuration(d.id)}
                          className={cn(
                            "px-2 py-1 border rounded text-[9px] font-bold transition-all cursor-pointer flex-1 text-center min-w-[36px]",
                            tempDuration === d.id
                              ? "bg-primary/15 border-primary text-primary"
                              : "bg-[#0C0C0C] border-[#222] text-outline/70 hover:border-outline hover:text-text"
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q2: Target Difficulty */}
                  <div className="space-y-1.5">
                    <span className="block text-[8px] text-outline uppercase font-bold tracking-wide">Difficulty // Focus questions level</span>
                    <div className="flex gap-1 flex-wrap">
                      {([
                        { id: "mix", label: "Mix" },
                        { id: "easy", label: "Easy" },
                        { id: "medium", label: "Med" },
                        { id: "hard", label: "Hard" }
                      ] as const).map((diff) => (
                        <button
                          key={diff.id}
                          type="button"
                          onClick={() => setTempDifficulty(diff.id)}
                          className={cn(
                            "px-2 py-1 border rounded text-[9px] font-bold transition-all cursor-pointer flex-1 text-center min-w-[36px]",
                            tempDifficulty === diff.id
                              ? "bg-primary/15 border-primary text-primary"
                              : "bg-[#0C0C0C] border-[#222] text-outline/70 hover:border-outline hover:text-text"
                          )}
                        >
                          {diff.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#2D2D2D]/30 pt-3">
                  {/* Q3: Question Source */}
                  <div className="space-y-1.5">
                    <span className="block text-[8px] text-outline uppercase font-bold tracking-wide">Source // Recommend questions from</span>
                    <div className="flex gap-1 flex-wrap">
                      {([
                        { id: "core", label: "Core" },
                        { id: "company", label: "Company" },
                        { id: "leetcode", label: "LeetCode" }
                      ] as const).map((src) => (
                        <button
                          key={src.id}
                          type="button"
                          onClick={() => setTempSource(src.id)}
                          className={cn(
                            "px-2 py-1 border rounded text-[9px] font-bold transition-all cursor-pointer flex-1 text-center min-w-[48px]",
                            tempSource === src.id
                              ? "bg-primary/15 border-primary text-primary"
                              : "bg-[#0C0C0C] border-[#222] text-outline/70 hover:border-outline hover:text-text"
                          )}
                        >
                          {src.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q4: Review Density */}
                  <div className="space-y-1.5">
                    <span className="block text-[8px] text-outline uppercase font-bold tracking-wide">Revisions // Workload scheduling density</span>
                    <div className="flex gap-1 flex-wrap">
                      {([
                        { id: "light", label: "Light" },
                        { id: "balanced", label: "Balanced" },
                        { id: "strict", label: "Strict" }
                      ] as const).map((den) => (
                        <button
                          key={den.id}
                          type="button"
                          onClick={() => setTempReviewDensity(den.id)}
                          className={cn(
                            "px-2 py-1 border rounded text-[9px] font-bold transition-all cursor-pointer flex-1 text-center min-w-[48px]",
                            tempReviewDensity === den.id
                              ? "bg-primary/15 border-primary text-primary"
                              : "bg-[#0C0C0C] border-[#222] text-outline/70 hover:border-outline hover:text-text"
                          )}
                        >
                          {den.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-[#2D2D2D]">
                <button
                  onClick={handleSaveAllPlannerSettings}
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
