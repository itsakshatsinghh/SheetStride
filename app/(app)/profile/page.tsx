"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app/shell";
import { Topbar } from "@/components/app/topbar";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

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
}

export default function ProfilePage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [solvedList, setSolvedList] = useState<SolvedQuestion[]>([]);
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

        // Fetch user's progress
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
                date: new Date(isoStr),
                isoStr
              };
            });

            // Sort newest first
            entries.sort((a, b) => b.date.getTime() - a.date.getTime());

            // Build dynamic activity log table rows (limit to 10 entries)
            entries.slice(0, 10).forEach((entry) => {
              const formattedTime = entry.isoStr.replace("T", " ").slice(0, 19);
              logs.push({
                timestamp: formattedTime,
                event: "SOLVE",
                description: `Resolved "${entry.title}"`,
                status: "SUCCESS",
                tone: "secondary"
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
        }

        // Add account milestone logs
        const joinDate = userCreatedAt ? new Date(userCreatedAt) : new Date();
        logs.push({
          timestamp: joinDate.toISOString().replace("T", " ").slice(0, 19),
          event: "MILESTONE",
          description: "Terminal initialized. Session established.",
          status: "STABLE",
          tone: "primary"
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
  
  // Dynamic Name and Join Date
  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "OPERATOR";
  
  const rawJoinDate = user?.created_at ? new Date(user.created_at) : new Date();
  const formattedJoinMonth = rawJoinDate.toLocaleString("default", { month: "long" }).toUpperCase();
  const joinedText = `JOINED: ${formattedJoinMonth} ${rawJoinDate.getFullYear()}`;
  
  const avatarUrl = user?.user_metadata?.avatar_url;
  const level = Math.floor(solvedCount / 10) + 1;

  // Favorite Topic logic
  const getFavoriteTopic = () => {
    if (solvedList.length === 0) return { name: "NONE", count: 0 };
    
    const topicMap: { [topic: string]: number } = {};
    solvedList.forEach((q) => {
      if (q.Topics) {
        q.Topics.split(",").forEach((t) => {
          const cleanTopic = t.trim().toUpperCase();
          topicMap[cleanTopic] = (topicMap[cleanTopic] || 0) + 1;
        });
      }
    });

    let favTopic = "Array";
    let maxCount = 0;
    Object.entries(topicMap).forEach(([name, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favTopic = name;
      }
    });

    return {
      name: favTopic,
      count: maxCount
    };
  };

  const favoriteTopic = getFavoriteTopic();

  // Dynamic Achievements states
  const achievements = [
    {
      title: "FIRST QUESTION",
      text: "The terminal has recognized your presence. Initialization complete.",
      tone: "primary",
      active: solvedCount >= 1
    },
    {
      title: "10 DAY STREAK",
      text: "Consistency is the key to mastering the algorithm. Machine mode enabled.",
      tone: "secondary",
      active: longestStreak >= 10
    },
    {
      title: "50 SOLVED",
      text: "System capacity expanded. Fifty logic gates successfully navigated.",
      tone: "tertiary",
      active: solvedCount >= 50
    }
  ];

  if (loading) {
    return (
      <AppShell className="max-w-shell mx-auto">
        <div className="flex h-[70vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-primary">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="font-display text-label-caps tracking-[0.2em]">DECRYPTING_USER_PROFILE...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      className="terminal-grid"
      topbar={<Topbar showSearchField={false} commandLabel="CMD + K" userAvatarUrl={avatarUrl} />}
      gridBackground
    >
      <div className="scanline" />
      <div className="max-w-shell mx-auto">
        <section className="mb-6 grid grid-cols-1 gap-gutter lg:grid-cols-12">
          <Card className="relative overflow-hidden p-8 lg:col-span-8 bg-[#191c1e]">
            <div className="absolute right-4 top-4 font-data text-data-lg text-primary opacity-10">
              ID_{user?.id?.slice(0, 5).toUpperCase() || "00824"}
            </div>
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <div className="relative">
                {avatarUrl ? (
                  <img
                    alt={displayName}
                    className="h-40 w-40 border border-border object-cover grayscale hover:grayscale-0 transition-all duration-300"
                    src={avatarUrl}
                  />
                ) : (
                  <div className="h-40 w-40 border border-primary bg-surface-dim flex flex-col items-center justify-center font-display text-primary text-headline-lg font-bold">
                    <span>S_</span>
                    <span className="text-[10px] text-muted tracking-widest mt-2">NO_AVATAR</span>
                  </div>
                )}
                <div className="absolute -bottom-3 -right-3 bg-secondary px-3 py-3 text-[8px] text-background font-bold font-display">
                  LEVEL {level}
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-display text-headline-lg uppercase text-primary leading-tight">
                  {displayName}
                </h1>
                <p className="mt-4 text-body-lg text-muted">{joinedText}</p>
                <div className="mt-8 flex flex-wrap justify-center gap-4 md:justify-start">
                  <span className="border border-border bg-[#282A2C] px-4 py-2 text-label-caps text-secondary font-bold">
                    #SYSTEM_ARCHITECT
                  </span>
                  <span className="border border-border bg-[#282A2C] px-4 py-2 text-label-caps text-primary font-bold">
                    #ALGO_CRUSHER
                  </span>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:col-span-4">
            <Card className="p-6 bg-[#191c1e]">
              <p className="text-label-caps text-muted">TOTAL SOLVED</p>
              <h2 className="mt-4 font-data text-data-lg text-primary">{solvedCount}</h2>
              <div className="mt-4 h-1 bg-border">
                <div 
                  className="h-full bg-primary" 
                  style={{ width: `${Math.min(100, Math.round((solvedCount / 450) * 100))}%` }} 
                />
              </div>
            </Card>
            <Card className="p-6 bg-[#191c1e]">
              <p className="text-label-caps text-muted">STREAK</p>
              <h2 className="mt-4 font-data text-[56px] leading-none text-secondary">
                {currentStreak}D
              </h2>
              <p className="mt-2 text-[9px] text-secondary">PERSONAL BEST: {longestStreak}D</p>
            </Card>
            <Card className="col-span-2 p-6 bg-[#191c1e]">
              <p className="mb-4 text-label-caps text-muted font-bold">FAVORITE TOPIC</p>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-body-lg text-[18px] leading-normal font-bold text-text uppercase">
                    {favoriteTopic.name}
                  </h3>
                  <p className="text-[10px] text-muted">{favoriteTopic.count} PROBLEMS SOLVED</p>
                </div>
                <span className="text-muted font-bold">&gt;</span>
              </div>
            </Card>

          </div>
        </section>

        {/* ACHIEVEMENTS */}
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-4">
            <h2 className="font-display text-headline-sm">UNLOCKED_ACHIEVEMENTS</h2>
            <div className="h-px flex-1 bg-outline" />
          </div>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
            {achievements.map((achievement) => (
              <Card 
                key={achievement.title} 
                className={`p-8 text-center transition-all ${
                  achievement.active 
                    ? "bg-surface-dim hover:border-primary-strong border-outline/80 opacity-100" 
                    : "bg-[#191c1e]/40 border-outline/20 opacity-40 grayscale select-none"
                }`}
              >
                <div className={`mx-auto mb-6 h-16 w-16 rounded-full flex items-center justify-center border font-display text-[20px] font-bold ${
                  achievement.active 
                    ? "bg-[#323537] border-primary text-primary" 
                    : "bg-[#1d2022] border-outline/25 text-muted"
                }`}>
                  {achievement.active ? "★" : "🔒"}
                </div>
                <h3 className="text-body-lg font-bold uppercase leading-normal">{achievement.title}</h3>
                <p className="mt-4 text-[10px] leading-relaxed text-muted">{achievement.text}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* ACTIVITY LOG */}
        <section>
          <div className="mb-4 flex items-center gap-4">
            <h2 className="font-display text-headline-sm">ACTIVITY_LOG</h2>
            <div className="h-px flex-1 bg-outline" />
          </div>
          <Card className="overflow-hidden bg-[#191c1e]">
            <table className="w-full text-left">
              <thead className="border-b border-outline bg-surface-dim">
                <tr>
                  <th className="p-4 text-label-caps text-muted">TIMESTAMP</th>
                  <th className="p-4 text-label-caps text-muted">EVENT_TYPE</th>
                  <th className="p-4 text-label-caps text-muted">DESCRIPTION</th>
                  <th className="p-4 text-right text-label-caps text-muted">STATUS</th>
                </tr>
              </thead>
              <tbody>
                {activityLogs.map((row, idx) => (
                  <tr key={`${row.timestamp}-${idx}`} className="border-b border-border hover:bg-surface-dim/80 transition-colors">
                    <td className="p-4 text-body-md text-muted font-body">{row.timestamp}</td>
                    <td className="p-4">
                      <span
                        className={`font-bold ${
                          row.tone === "secondary"
                            ? "text-secondary"
                            : row.tone === "tertiary"
                              ? "text-tertiary"
                              : "text-primary"
                        }`}
                      >
                        {row.event}
                      </span>
                    </td>
                    <td className="p-4 text-body-lg text-text font-bold">{row.description}</td>
                    <td
                      className={`p-4 text-right text-label-caps font-bold ${
                        row.tone === "secondary"
                          ? "text-secondary"
                          : row.tone === "tertiary"
                            ? "text-tertiary"
                            : "text-primary"
                      }`}
                    >
                      {row.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t border-outline bg-surface-dim p-4 text-center text-label-caps text-primary cursor-pointer hover:bg-surface-high transition-colors font-bold">
              LOAD FULL LOG CLUSTER...
            </div>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}
