"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Trophy, Zap, Waypoints, Loader2, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Card, CardHeader } from "@/components/ui/card";
import { Heatmap } from "@/components/shared/heatmap";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statIcons = [CheckCircle2, Zap, Trophy, Waypoints];

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
  
  // Total question counts from DB
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
          .from("questions")
          .select("ID, Title, Difficulty, Link, Topics")
          .limit(100);
        if (generalQuestions) {
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

    // Compute relative percentage based on solved items
    const maxCount = Math.max(...standardTopics.map(t => t.count)) || 1;
    return standardTopics.map(t => ({
      name: t.name,
      value: Math.min(100, Math.round((t.count / maxCount) * 100))
    }));
  };

  const topicProgress = getTopicProgress();

  // Stats boxes mapping
  const stats = [
    { label: "RESOLVED", value: `${solvedCount}`, subtext: "Questions Solved", tone: "primary" },
    { label: "CURRENT", value: `${currentStreak} DAYS`, subtext: "Current Streak", tone: "secondary" },
    { label: "ALL TIME", value: `${longestStreak} DAYS`, subtext: "Longest Streak", tone: "tertiary" },
    { label: "COMPLETION", value: `${progressPercent}%`, subtext: "Global Index", tone: "primary" }
  ];

  const difficultyData = [
    { label: "EASY", solved: `${easySolved}/${totalEasy}`, value: easyPercent, tone: "secondary" },
    { label: "MEDIUM", solved: `${mediumSolved}/${totalMedium}`, value: mediumPercent, tone: "tertiary" },
    { label: "HARD", solved: `${hardSolved}/${totalHard}`, value: hardPercent, tone: "danger" }
  ];

  // Slice last 4 solved questions for recent log
  const recentLogs = solvedList.slice(-4).reverse().map((q, idx) => {
    const tones: { [key: string]: string } = { easy: "secondary", medium: "tertiary", hard: "danger" };
    const diffChar: { [key: string]: string } = { easy: "E", medium: "M", hard: "H" };
    const relativeTimes = ["2 HOURS AGO", "5 HOURS AGO", "YESTERDAY", "2 DAYS AGO"];
    
    return {
      difficulty: diffChar[q.Difficulty.toLowerCase()] || "Q",
      tone: tones[q.Difficulty.toLowerCase()] || "primary",
      title: q.Title,
      time: relativeTimes[idx] || "RECENTLY",
      state: "success"
    };
  });

  const level = `LEVEL ${Math.floor(solvedCount / 10) + 1} CODER`;

  if (loading) {
    return (
      <AppShell className="max-w-shell mx-auto">
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="font-display text-label-caps tracking-[0.2em]">INITIALIZING_METRICS...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell className="max-w-shell mx-auto">
      <section className="mb-gutter grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <Card className="flex flex-col justify-between gap-6 p-6 md:flex-row md:items-center lg:col-span-8 bg-[#191c1e] hover-glow-card border-outline">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 border border-primary px-2 py-1 text-label-caps uppercase text-primary">
              <span className="h-2 w-2 rounded-full bg-secondary animate-dot-pulse" />
              SYSTEM STATUS: ACTIVE
            </div>
            <h1 className="font-display text-display-hero leading-[1.4] text-text">
              {level}
            </h1>
            <div className="flex items-end gap-4">
              <span className="font-data text-data-lg text-primary">{solvedCount}/{totalQuestions}</span>
              <span className="pb-2 text-body-lg text-muted">PROBLEMS_SOLVED</span>
            </div>
          </div>
          <div className="w-full md:max-w-[370px]">
            <div className="mb-3 flex justify-between text-headline-sm text-muted">
              <span>GLOBAL_PROGRESS</span>
              <span className="text-primary">{progressPercent}%</span>
            </div>
            <div className="relative h-5 overflow-hidden bg-border">
              <div className="h-full bg-primary-strong" style={{ width: `${progressPercent}%` }} />
              <div className="pointer-events-none absolute inset-0 flex justify-between">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-full w-px bg-background/50" />
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* DAILY MISSION CARD */}
        <Card className={cn(
          "flex flex-col justify-between p-6 lg:col-span-4 bg-[#191c1e] hover-glow-card border-outline",
          dailyQuest && "animate-alert-glow border-primary-strong/40"
        )}>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-label-caps text-primary flex items-center gap-1.5 font-bold">
                <span className="h-2 w-2 rounded-full bg-primary-strong animate-dot-pulse" />
                DAILY_MISSION_MODULE
              </span>
              <span className="text-[9px] text-muted font-bold">PRIORITY_HIGH</span>
            </div>
            
            {dailyQuest ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-body text-body-md font-bold text-text hover:text-primary transition-colors line-clamp-1">
                    <a href={dailyQuest.Link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5">
                      {dailyQuest.Title} <ExternalLink className="h-3 w-3 inline opacity-70" />
                    </a>
                  </h3>
                  <div className="mt-2 flex gap-2">
                    <Badge tone={
                      dailyQuest.Difficulty.toLowerCase() === "easy" ? "secondary" : 
                      dailyQuest.Difficulty.toLowerCase() === "medium" ? "tertiary" : "danger"
                    }>
                      {dailyQuest.Difficulty.toUpperCase()}
                    </Badge>
                    <span className="text-[10px] text-muted self-center uppercase truncate">{dailyQuest.Topics?.split(",")[0]}</span>
                  </div>
                </div>
                
                <p className="text-[11px] leading-relaxed text-muted font-body">
                  Resolve this logic gate to expand your cognitive index. Selected topic: <strong className="text-secondary">{weakestTopic.toUpperCase()}</strong>.
                </p>
              </div>
            ) : (
              <div className="py-6 text-center text-muted text-body-md font-display">
                ALL SYSTEMS CLEAR
              </div>
            )}
          </div>
          
          {dailyQuest && (
            <button
              onClick={handleToggleDailyMission}
              className="mt-6 flex h-10 w-full items-center justify-center border border-primary-strong/40 bg-primary/5 text-label-caps text-primary-strong hover:bg-primary-strong hover:text-background transition-all font-bold"
            >
              MARK AS RESOLVED
            </button>
          )}
        </Card>
      </section>

      <section className="mb-gutter grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = statIcons[index];
          const tone =
            stat.tone === "secondary"
              ? "group-hover:text-secondary"
              : stat.tone === "tertiary"
                ? "group-hover:text-tertiary"
                : "group-hover:text-primary";
          
          const isCurrentStreak = stat.label === "CURRENT" && currentStreak > 0;

          return (
            <Card 
              key={stat.label} 
              className={cn(
                "group p-6 hover-glow-card border-outline",
                isCurrentStreak && "animate-fire-glow border-secondary/40 bg-secondary/[0.02]"
              )}
            >
              <div className="mb-8 flex items-center justify-between">
                <Icon className={cn("h-6 w-6 text-muted", tone, isCurrentStreak && "text-secondary animate-pulse")} strokeWidth={1.8} />
                <span className="text-label-caps text-muted flex items-center gap-1 font-bold">
                  {isCurrentStreak && <span className="inline-block h-2 w-2 rounded-full bg-secondary animate-ping" />}
                  {stat.label}
                </span>
              </div>
              <div className={cn("font-data text-data-lg leading-none text-text", isCurrentStreak && "text-secondary")}>{stat.value}</div>
              <div className="mt-3 text-body-lg text-muted">{stat.subtext}</div>
            </Card>
          );
        })}
      </section>

      <section className="mb-gutter grid grid-cols-1 gap-gutter xl:grid-cols-3">
        <Card className="xl:col-span-2 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-headline-sm">CONTRIBUTION MAP</h2>
            <div className="flex items-center gap-2 text-label-caps text-muted">
              <span>Less</span>
              <div className="flex gap-1">
                <div className="h-3 w-3 border border-background/20 bg-[#151515]" />
                <div className="h-3 w-3 bg-primary/20" />
                <div className="h-3 w-3 bg-primary/40" />
                <div className="h-3 w-3 bg-primary/60" />
                <div className="h-3 w-3 bg-primary" />
              </div>
              <span>More</span>
            </div>
          </div>
          <div className="overflow-x-auto pb-4">
            <Heatmap mode="dashboard" />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-8 font-display text-headline-sm">DIFFICULTY_LEVELS</h2>
          <div className="space-y-8">
            {difficultyData.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between font-display text-headline-sm">
                  <span
                    className={
                      item.tone === "secondary"
                        ? "text-secondary"
                        : item.tone === "tertiary"
                          ? "text-tertiary"
                          : "text-danger"
                    }
                  >
                    {item.label}
                  </span>
                  <span className="text-text">{item.solved}</span>
                </div>
                <div className="h-3 bg-border">
                  <div
                    className={
                      item.tone === "secondary"
                        ? "h-full bg-secondary"
                        : item.tone === "tertiary"
                          ? "h-full bg-tertiary"
                          : "h-full bg-danger"
                    }
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-gutter xl:grid-cols-3">
        <Card className="overflow-hidden xl:col-span-2">
          <CardHeader>TOPIC_MATRICES</CardHeader>
          <div className="grid grid-cols-1 gap-x-12 gap-y-8 p-6 md:grid-cols-2">
            {topicProgress.map((topic) => {
              const queryTopic = TOPIC_QUERY_MAP[topic.name] || "";
              const href = queryTopic ? `/questions?topic=${encodeURIComponent(queryTopic)}` : "/questions";
              return (
                <Link key={topic.name} href={href} className="group/topic block cursor-pointer">
                  <div className="mb-2 flex justify-between text-label-caps text-muted group-hover/topic:text-primary transition-colors">
                    <span>{topic.name}</span>
                    <span>{topic.value}%</span>
                  </div>
                  <div className="h-1 bg-border overflow-hidden">
                    <div className="h-full bg-primary-strong group-hover/topic:bg-primary transition-all duration-300" style={{ width: `${topic.value}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader>RECENT_LOGS</CardHeader>
          <div className="space-y-4 p-4">
            {recentLogs.length === 0 ? (
              <div className="p-8 text-center text-muted font-display text-body-md">
                NO_SUBMISSIONS_LOGGED
              </div>
            ) : (
              recentLogs.map((item, index) => (
                <div
                  key={`${item.title}-${index}`}
                  className="flex items-center gap-3 p-3 hover:bg-[#282A2C]"
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center border text-[10px] ${
                      item.tone === "secondary"
                        ? "border-secondary text-secondary bg-secondary/10"
                        : item.tone === "tertiary"
                          ? "border-tertiary text-tertiary bg-tertiary/10"
                          : "border-danger text-danger bg-danger/10"
                    }`}
                  >
                    {item.difficulty}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-lg text-text truncate font-bold">{item.title}</p>
                    <p className="text-[9px] text-muted">{item.time}</p>
                  </div>
                  <CheckCircle2
                    className="h-4 w-4 text-secondary"
                    strokeWidth={2}
                  />
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      <footer className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-outline py-8 opacity-50 md:flex-row">
        <p className="text-label-caps">TERMINAL SESSION ID: 88A4-5F22-PX11</p>
        <div className="flex gap-6 text-label-caps">
          <span>DOCS</span>
          <span>SUPPORT</span>
          <span>GITHUB</span>
        </div>
      </footer>
    </AppShell>
  );
}
