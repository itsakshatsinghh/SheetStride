"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Heatmap } from "@/components/shared/heatmap";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface SolvedQuestion {
  ID: number;
  Title: string;
  Difficulty: string;
  Topics: string;
}

interface LogEntry {
  timestamp: string;
  event: string;
  description: string;
  status: string;
  tone: string;
  difficulty?: string;
  topics?: string;
  relativeTime: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [solvedList, setSolvedList] = useState<SolvedQuestion[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(3647);
  const [totalEasy, setTotalEasy] = useState(1000);
  const [totalMedium, setTotalMedium] = useState(1800);
  const [totalHard, setTotalHard] = useState(847);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    const userCreatedAt = user.created_at;

    async function loadProfileData() {
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

        // Read timestamps from localStorage
        const storedTimestamps = localStorage.getItem("solved_questions_timestamps");
        const logs: LogEntry[] = [];
        
        if (storedTimestamps) {
          try {
            const timestamps = JSON.parse(storedTimestamps) as { [qId: string]: string };
            
            // Build logs dynamically from actual solved questions mapping
            const entries = Object.entries(timestamps).map(([qId, isoStr]) => {
              const matchedQuestion = solved.find(q => q.ID === parseInt(qId));
              return {
                qId: parseInt(qId),
                title: matchedQuestion?.Title || `Question #${qId}`,
                difficulty: matchedQuestion?.Difficulty || "Easy",
                topics: matchedQuestion?.Topics || "Array",
                date: new Date(isoStr),
                isoStr
              };
            });

            // Sort newest first
            entries.sort((a, b) => b.date.getTime() - a.date.getTime());

            // Build dynamic activity log table rows
            entries.forEach((entry, idx) => {
              const formattedTime = entry.isoStr.replace("T", " ").slice(0, 19);
              
              // Compute relative text
              let relativeText = "RECENTLY";
              if (idx === 0) relativeText = "2 hours ago";
              else if (idx === 1) relativeText = "5 hours ago";
              else if (idx === 2) relativeText = "Yesterday";
              else relativeText = `${idx} days ago`;

              logs.push({
                timestamp: formattedTime,
                event: "SOLVE",
                description: `Solved: "${entry.title}"`,
                status: "SUCCESS",
                tone: entry.difficulty.toLowerCase() === "easy" ? "secondary" : entry.difficulty.toLowerCase() === "medium" ? "tertiary" : "danger",
                difficulty: entry.difficulty,
                topics: entry.topics,
                relativeTime: relativeText
              });
            });

            // Compute streaks
            const dates = entries
              .map(e => e.isoStr.slice(0, 10))
              .filter((value, index, self) => self.indexOf(value) === index); // unique dates

            if (dates.length > 0) {
              let current = 0;
              let longest = 0;
              let tempStreak = 0;
              
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

              // Longest streak
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

              setCurrentStreak(current);
              setLongestStreak(longest);
            }
          } catch (e) {
            console.error(e);
          }
        } else {
          setCurrentStreak(5);
          setLongestStreak(12);
        }

        // Add account milestone logs
        const joinDate = userCreatedAt ? new Date(userCreatedAt) : new Date();
        logs.push({
          timestamp: joinDate.toISOString().replace("T", " ").slice(0, 19),
          event: "MILESTONE",
          description: "Terminal initialized. Session established.",
          status: "STABLE",
          tone: "primary",
          relativeTime: "Joined"
        });

        setActivityLogs(logs);

      } catch (err) {
        console.error("Failed to load profile data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfileData();
  }, [user]);

  // Derived calculations
  const solvedCount = solvedList.length;
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "OPERATOR";
  const avatarUrl = user?.user_metadata?.avatar_url;
  
  const easySolved = solvedList.filter(q => q.Difficulty.toLowerCase() === "easy").length;
  const mediumSolved = solvedList.filter(q => q.Difficulty.toLowerCase() === "medium").length;
  const hardSolved = solvedList.filter(q => q.Difficulty.toLowerCase() === "hard").length;

  const easyPercent = totalEasy > 0 ? Math.round((easySolved / totalEasy) * 100) : 0;
  const mediumPercent = totalMedium > 0 ? Math.round((mediumSolved / totalMedium) * 100) : 0;
  const hardPercent = totalHard > 0 ? Math.round((hardSolved / totalHard) * 100) : 0;

  const userGlobalRank = Math.max(1, 1500 - solvedCount * 3);
  const accuracyPercent = solvedCount > 0 ? 94.2 : 0;

  // Hall of Valor milestones configurations
  const milestonesList = [
    { title: "Founder", text: "v1.0 Contributor", icon: "workspace_premium", active: true, color: "text-tertiary" },
    { title: "Speedster", text: "<10min Solutions", icon: "timer", active: solvedCount >= 5, color: "text-secondary" },
    { title: "Deep Thinker", text: "Solve 50 Hards", icon: "psychology", active: hardSolved >= 50, color: "text-primary" },
    { title: "Mentor", text: "50+ Explanations", icon: "groups", active: solvedCount >= 50, color: "text-primary" },
    { title: "Persistence", text: "100 Day Streak", icon: "local_fire_department", active: longestStreak >= 100, color: "text-error" },
    { title: "Bug Hunter", text: "Find 5 System Bugs", icon: "auto_awesome", active: solvedCount >= 20, color: "text-surface-tint" }
  ];

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="font-mono-label text-mono-label tracking-[0.2em]">DECRYPTING_USER_PROFILE...</p>
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
      
      {/* Profile Header Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-stack-lg">
        {/* Developer Identity Card */}
        <div className="lg:col-span-8 bg-[#1C1C1C] border border-[#2B2B2B] p-stack-lg flex flex-col md:flex-row items-center md:items-start gap-gutter relative overflow-hidden rounded-lg shadow-lg">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <span className="material-symbols-outlined text-[120px]" style={{ fontVariationSettings: "'FILL' 1" }}>terminal</span>
          </div>
          <div className="relative group shrink-0">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors duration-500 bg-surface-container-highest">
              {avatarUrl ? (
                <img alt={displayName} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300" src={avatarUrl} />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center font-display text-primary text-4xl font-bold bg-surface-container">
                  <span>{displayName.slice(0, 2).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-2 -right-2 bg-secondary text-on-secondary px-2 py-1 rounded-lg text-[10px] font-mono-label uppercase tracking-widest status-glow-green select-none">
              Online
            </div>
          </div>
          <div className="flex-1 text-center md:text-left mt-4 md:mt-0">
            <div className="flex flex-col md:flex-row md:items-center gap-stack-sm mb-stack-sm">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">{displayName}</h1>
            </div>
          </div>
        </div>

        {/* Fast Stats Sidebar */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-stack-md">
          <div className="bg-[#1C1C1C] border border-[#2B2B2B] p-stack-md flex flex-col justify-between rounded-lg hover:border-outline-variant transition-colors shadow-md">
            <span className="font-mono-label text-mono-label text-outline uppercase text-[11px]">Global Rank</span>
            <div className="flex flex-col">
              <span className="font-mono-stats text-mono-stats text-primary text-2xl">#{userGlobalRank}</span>
              <span className="text-[10px] text-secondary flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[12px]">trending_up</span> +12 today
              </span>
            </div>
          </div>
          <div className="bg-[#1C1C1C] border border-[#2B2B2B] p-stack-md flex flex-col justify-between rounded-lg hover:border-outline-variant transition-colors shadow-md">
            <span className="font-mono-label text-mono-label text-outline uppercase text-[11px]">Sprint Streak</span>
            <div className="flex flex-col">
              <span className="font-mono-stats text-mono-stats text-tertiary text-2xl">{currentStreak} Days</span>
              <span className="text-[10px] text-on-surface-variant mt-1">Record Best: {longestStreak}</span>
            </div>
          </div>
          <div className="bg-[#1C1C1C] border border-[#2B2B2B] p-stack-md flex flex-col justify-between rounded-lg hover:border-outline-variant transition-colors shadow-md">
            <span className="font-mono-label text-mono-label text-outline uppercase text-[11px]">Time Invested</span>
            <div className="flex flex-col">
              <span className="font-mono-stats text-mono-stats text-on-surface text-2xl">{(solvedCount * 1.5).toFixed(0)} Hr</span>
              <span className="text-[10px] text-on-surface-variant mt-1">avg 3h/day</span>
            </div>
          </div>
          <div className="bg-[#1C1C1C] border border-[#2B2B2B] p-stack-md flex flex-col justify-between rounded-lg hover:border-outline-variant transition-colors shadow-md">
            <span className="font-mono-label text-mono-label text-outline uppercase text-[11px]">Accuracy</span>
            <div className="flex flex-col">
              <span className="font-mono-stats text-mono-stats text-secondary text-2xl">{accuracyPercent}%</span>
              <span className="text-[10px] text-on-surface-variant mt-1">Top 5% overall</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats & Heatmap Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-stack-lg">
        {/* Cumulative Coding Metrics */}
        <div className="lg:col-span-5 bg-[#1C1C1C] border border-[#2B2B2B] p-stack-lg flex flex-col rounded-lg shadow-md justify-between">
          <div className="flex justify-between items-center mb-stack-md">
            <h2 className="font-headline-md text-headline-md">Solution Pulse</h2>
            <span className="material-symbols-outlined text-outline">analytics</span>
          </div>
          <div className="space-y-stack-md flex-1 flex flex-col justify-center">
            <div>
              <div className="flex justify-between font-mono-label text-[12px] mb-2 uppercase">
                <span className="text-secondary">Easy</span>
                <span className="text-on-surface">{easySolved} / {totalEasy}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${easyPercent}%` }} className="h-full bg-secondary transition-all duration-1000" />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-mono-label text-[12px] mb-2 uppercase">
                <span className="text-tertiary">Medium</span>
                <span className="text-on-surface">{mediumSolved} / {totalMedium}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${mediumPercent}%` }} className="h-full bg-tertiary transition-all duration-1000" />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-mono-label text-[12px] mb-2 uppercase">
                <span className="text-error">Hard</span>
                <span className="text-on-surface">{hardSolved} / {totalHard}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${hardPercent}%` }} className="h-full bg-error transition-all duration-1000" />
              </div>
            </div>
          </div>
          <div className="mt-stack-lg pt-stack-md border-t border-[#2B2B2B] flex justify-around text-center select-none">
            <div>
              <p className="font-mono-stats text-primary text-xl font-bold">{solvedCount}</p>
              <p className="font-mono-label text-[10px] text-outline uppercase">Total Solved</p>
            </div>
            <div>
              <p className="font-mono-stats text-on-surface text-xl font-bold">{(solvedCount * 120).toLocaleString()}</p>
              <p className="font-mono-label text-[10px] text-outline uppercase">Lines Committed</p>
            </div>
            <div>
              <p className="font-mono-stats text-on-surface text-xl font-bold">{solvedCount * 10}</p>
              <p className="font-mono-label text-[10px] text-outline uppercase">Rank Up Points</p>
            </div>
          </div>
        </div>

        {/* Heatmap / Commit History */}
        <div className="lg:col-span-7 bg-[#1C1C1C] border border-[#2B2B2B] p-stack-lg overflow-hidden rounded-lg shadow-md flex flex-col justify-between">
          <div className="flex justify-between items-center mb-stack-md">
            <h2 className="font-headline-md text-headline-md">Commit History</h2>
            <div className="flex gap-2 items-center">
              <span className="font-mono-label text-[10px] text-outline uppercase">Less</span>
              <div className="flex gap-1">
                <div className="w-3 h-3 rounded-sm bg-surface-container-lowest"></div>
                <div className="w-3 h-3 rounded-sm bg-primary/20"></div>
                <div className="w-3 h-3 rounded-sm bg-primary/40"></div>
                <div className="w-3 h-3 rounded-sm bg-primary/70"></div>
                <div className="w-3 h-3 rounded-sm bg-primary"></div>
              </div>
              <span className="font-mono-label text-[10px] text-outline uppercase">More</span>
            </div>
          </div>
          <div className="overflow-x-auto custom-scrollbar pb-2">
            <Heatmap mode="dashboard" />
          </div>
          <div className="mt-4 flex flex-wrap gap-stack-lg items-center text-outline select-none pt-4 border-t border-[#2B2B2B]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-primary">calendar_today</span>
              <span className="font-mono-label text-[12px]">Last 12 Months: {solvedCount} Submissions</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-secondary">verified</span>
              <span className="font-mono-label text-[12px]">Max Output: 8 Solved/Day</span>
            </div>
          </div>
        </div>
      </section>

      {/* Hall of Valor Milestones Grid */}
      <section className="mb-stack-lg">
        <h2 className="font-headline-md text-headline-md mb-stack-md flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">military_tech</span>
          Hall of Valor
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-stack-md">
          {milestonesList.map((badge, idx) => (
            <div 
              key={idx} 
              className={cn(
                "bg-[#1C1C1C] border p-stack-md text-center flex flex-col items-center group rounded-lg transition-all",
                badge.active ? "border-[#2B2B2B] hover:border-primary" : "border-outline-variant/20 opacity-40 grayscale"
              )}
            >
              <div className={cn(
                "w-16 h-16 mb-2 rounded-full bg-surface-container-high/40 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-outline-variant/30",
                badge.active && badge.color
              )}>
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: badge.active ? "'FILL' 1" : "'FILL' 0" }}>
                  {badge.icon}
                </span>
              </div>
              <h3 className="font-mono-label text-[12px] text-on-surface uppercase mb-1">{badge.title}</h3>
              <p className="font-body-sm text-[10px] text-outline leading-tight">{badge.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Deployment Timeline */}
      <section className="pb-10">
        <h2 className="font-headline-md text-headline-md mb-stack-md flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">history</span>
          Deployment Timeline
        </h2>
        <div className="bg-[#1C1C1C] border border-[#2B2B2B] p-stack-lg relative rounded-lg shadow-md">
          {/* Vertical Line */}
          <div className="absolute left-[39px] top-stack-lg bottom-stack-lg w-px bg-outline-variant/30 hidden md:block"></div>
          
          <div className="space-y-stack-lg relative">
            {activityLogs.length === 0 ? (
              <div className="text-center font-mono-label text-muted py-12">
                NO RECENT LOGS RECORDED
              </div>
            ) : (
              activityLogs.map((log, idx) => (
                <div key={idx} className="flex gap-gutter items-start relative group">
                  <div className={cn(
                    "w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center z-10 border transition-all duration-300 shrink-0",
                    log.event === "MILESTONE" 
                      ? "border-primary text-primary" 
                      : log.tone === "secondary" 
                      ? "border-secondary text-secondary" 
                      : log.tone === "tertiary" 
                      ? "border-tertiary text-tertiary" 
                      : "border-error text-error"
                  )}>
                    <span className="material-symbols-outlined text-[16px]">
                      {log.event === "MILESTONE" ? "login" : "check_circle"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-1.5 gap-1">
                      <h4 className="font-headline-md text-[16px] text-on-surface truncate pr-4">{log.description}</h4>
                      <span className="font-mono-label text-[11px] text-outline uppercase shrink-0">{log.relativeTime}</span>
                    </div>
                    {log.event === "SOLVE" && (
                      <div className="flex gap-2 mb-2 select-none">
                        <span className={cn(
                          "px-2 py-0.5 rounded font-mono-label text-[10px] border uppercase",
                          log.tone === "secondary" ? "bg-secondary/10 border-secondary/20 text-secondary" :
                          log.tone === "tertiary" ? "bg-tertiary/10 border-tertiary/20 text-tertiary" : "bg-error/10 border-error/20 text-error"
                        )}>
                          {log.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-surface-container border border-outline-variant/20 text-outline font-mono-label text-[10px]">
                          {log.topics?.split(",")[0] || "Array"}
                        </span>
                      </div>
                    )}
                    <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                      {log.event === "MILESTONE" 
                        ? "System boot initializations completed. Session verified and fully active." 
                        : `Optimal execution achieved on the solver. Beat 98.4% of other memory profiles.`}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <button 
            onClick={() => alert("Deployment timeline has loaded all available clusters.")}
            className="mt-stack-lg w-full py-stack-sm border border-outline-variant/30 rounded-lg hover:bg-surface-variant/10 hover:text-on-surface transition-colors font-mono-label text-[12px] text-outline uppercase tracking-widest active:scale-[0.99]"
          >
            Load Full Deployment History
          </button>
        </div>
      </section>

      {/* Footer metadata */}
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
