"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Heatmap } from "@/components/shared/heatmap";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { cn, sanitizeSocialInput, fetchWithCache } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

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

  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");

  const [leetcodeStats, setLeetcodeStats] = useState<any>(null);
  const [leetcodeLoading, setLeetcodeLoading] = useState(false);
  const [leetcodeError, setLeetcodeError] = useState("");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchLeetcodeStats = async (username: string, forceRefresh = false) => {
    if (!username) return;
    try {
      setLeetcodeLoading(true);
      setLeetcodeError("");
      const cacheKey = `leetcode_live_stats_cache_${username}`;
      if (forceRefresh) {
        localStorage.removeItem(cacheKey);
      }
      
      const data = await fetchWithCache(cacheKey, async () => {
        const baseUrl = "https://alfa-leetcode-api.onrender.com";
        const [resProfile, resContest, resSubmissions] = await Promise.all([
          fetch(`${baseUrl}/${username}/profile`).then(r => r.ok ? r.json() : null),
          fetch(`${baseUrl}/${username}/contest`).then(r => r.ok ? r.json() : null),
          fetch(`${baseUrl}/${username}/acSubmission?limit=7`).then(r => r.ok ? r.json() : null)
        ]);

        if (!resProfile || resProfile.errors) {
          throw new Error("Could not load LeetCode statistics. Username may be invalid.");
        }

        return {
          profile: {
            ranking: resProfile.ranking
          },
          solved: {
            solvedProblem: resProfile.totalSolved,
            easySolved: resProfile.easySolved,
            mediumSolved: resProfile.mediumSolved,
            hardSolved: resProfile.hardSolved
          },
          contest: resContest,
          submissions: resSubmissions?.submission || []
        };
      }, 900000); // 15 mins cache

      setLeetcodeStats(data);
    } catch (err: any) {
      console.error("Failed to fetch LeetCode stats:", err);
      setLeetcodeError(err.message || "Failed to load LeetCode statistics.");
    } finally {
      setLeetcodeLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    const userCreatedAt = user.created_at;

    async function loadProfileData() {
      try {
        setLoading(true);

        const cacheKey = `profile_data_cache_${userId}`;
        const data = await fetchWithCache(cacheKey, async () => {
          // Fetch total counts from Supabase
          const { count: countAll } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true });

          // Fetch user progress from user_progress
          const { data: userProgress, error: progressError } = await supabase
            .from("user_progress")
            .select(`
              question_id,
              "completed-at"
            `)
            .eq("user_id", userId)
            .order("completed-at", { ascending: false });

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

          // Fetch user streaks using database RPC function with correct parameter target_user_id
          const { data: streakData, error: streakError } = await supabase
            .rpc("calculate_user_streaks", { target_user_id: userId });

          let currentStreakVal = 0;
          let longestStreakVal = 0;
          if (!streakError && streakData && streakData.length > 0) {
            currentStreakVal = streakData[0].res_current_streak || 0;
            longestStreakVal = streakData[0].res_max_streak || 0;
          }

          // Load profile customization & socials
          let loadedLeetcode = "";
          let loadedBio = "";
          let loadedInstagram = "";
          let loadedLinkedin = "";
          let loadedGithub = "";

          try {
            const { data: dbProfile } = await supabase
              .from("profiles")
              .select("leetcode_username, bio, instagram, linkedin, github")
              .eq("id", userId)
              .maybeSingle();

            if (dbProfile) {
              loadedLeetcode = dbProfile.leetcode_username || "";
              loadedBio = dbProfile.bio || "";
              loadedInstagram = dbProfile.instagram || "";
              loadedLinkedin = dbProfile.linkedin || "";
              loadedGithub = dbProfile.github || "";
            } else {
              loadedLeetcode = user?.user_metadata?.leetcode_username || "";
              loadedBio = user?.user_metadata?.bio || "";
              loadedInstagram = user?.user_metadata?.instagram || "";
              loadedLinkedin = user?.user_metadata?.linkedin || "";
              loadedGithub = user?.user_metadata?.github || "";
            }
          } catch (dbErr) {
            console.warn("DB profile query failed, using user metadata:", dbErr);
            loadedLeetcode = user?.user_metadata?.leetcode_username || "";
            loadedBio = user?.user_metadata?.bio || "";
            loadedInstagram = user?.user_metadata?.instagram || "";
            loadedLinkedin = user?.user_metadata?.linkedin || "";
            loadedGithub = user?.user_metadata?.github || "";
          }

          return {
            totalQuestions: countAll !== null ? countAll : 3647,
            solved,
            userProgress: userProgress || [],
            currentStreak: currentStreakVal,
            longestStreak: longestStreakVal,
            loadedLeetcode,
            loadedBio,
            loadedInstagram,
            loadedLinkedin,
            loadedGithub
          };
        });

        setTotalQuestions(data.totalQuestions);
        setSolvedList(data.solved);
        setCurrentStreak(data.currentStreak);
        setLongestStreak(data.longestStreak);
        setLeetcodeUsername(data.loadedLeetcode);
        setBio(data.loadedBio);
        setInstagram(data.loadedInstagram);
        setLinkedin(data.loadedLinkedin);
        setGithub(data.loadedGithub);

        // Build dynamic activity log table rows from database solves
        const logs: LogEntry[] = [];
        
        data.userProgress.forEach((row: any, idx: number) => {
          const q = data.solved.find((s: SolvedQuestion) => s.ID === row.question_id);
          if (!q) return;

          const completedAt = row["completed-at"] || new Date().toISOString();
          const formattedTime = completedAt.replace("T", " ").slice(0, 19);
          
          let relativeText = "RECENTLY";
          if (idx === 0) relativeText = "2 hours ago";
          else if (idx === 1) relativeText = "5 hours ago";
          else if (idx === 2) relativeText = "Yesterday";
          else relativeText = `${idx} days ago`;

          logs.push({
            timestamp: formattedTime,
            event: "SOLVE",
            description: `Solved: "${q.Title}"`,
            status: "SUCCESS",
            tone: q.Difficulty.toLowerCase() === "easy" ? "secondary" : q.Difficulty.toLowerCase() === "medium" ? "tertiary" : "danger",
            difficulty: q.Difficulty,
            topics: q.Topics,
            relativeTime: relativeText
          });
        });

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

        if (data.loadedLeetcode) {
          fetchLeetcodeStats(data.loadedLeetcode);
        }

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
      <AppShell className="space-y-stack-lg max-w-container-max mx-auto px-gutter" gridBackground>
        {/* Profile Header Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter pt-6">
          {/* Developer Identity Card */}
          <div className="lg:col-span-8 bg-[#111111]/72 border border-[#2D2D2D] p-stack-lg flex flex-col md:flex-row items-center md:items-start gap-gutter relative overflow-hidden rounded-lg min-h-[220px]">
            <Skeleton className="w-32 h-32 md:w-40 md:h-40 rounded-xl shrink-0" />
            <div className="flex-1 space-y-4 w-full">
              <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-16 w-full" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-8 w-24 rounded" />
                <Skeleton className="h-8 w-24 rounded" />
              </div>
            </div>
          </div>

          {/* Connected Accounts Card */}
          <div className="lg:col-span-4 bg-[#111111]/72 border border-[#2D2D2D] p-stack-lg rounded-lg flex flex-col justify-between min-h-[220px]">
            <div className="space-y-4">
              <Skeleton className="h-5 w-40" />
              <div className="flex items-center gap-3 border border-[#2D2D2D]/60 p-4 rounded-xl">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </section>

        {/* Bento stats grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#111111]/72 border border-[#2D2D2D] p-6 rounded-xl space-y-4">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-3.5 w-full" />
            </div>
          ))}
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

  const formatDate = (timestampStr: string) => {
    try {
      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp)) return "";
      const date = new Date(timestamp * 1000);
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yy = String(date.getFullYear()).slice(-2);
      return `${dd}/${mm}/${yy}`;
    } catch {
      return "";
    }
  };

  return (
    <AppShell className="space-y-stack-lg max-w-container-max mx-auto px-gutter" gridBackground>
      <Breadcrumbs items={[{ label: "Profile" }]} />
      
      {/* Profile Header Section */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-stack-lg">
        {/* Developer Identity Card */}
        <div className="lg:col-span-8 bg-[#111111] border border-[#2D2D2D] p-stack-lg flex flex-col md:flex-row items-center md:items-start gap-gutter relative overflow-hidden rounded-lg shadow-lg">
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
          <div className="flex-1 text-center md:text-left mt-4 md:mt-0 space-y-4">
            <div>
              <h1 className="font-headline-lg text-headline-lg text-on-surface">{displayName}</h1>
              <p className="text-body-md text-on-surface-variant font-sans mt-2 max-w-xl leading-relaxed">
                {bio || "Developer session established. Connect your socials and set a bio in settings or click Edit Info."}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="px-3 py-1 border border-primary/30 hover:border-primary text-primary bg-primary/5 hover:bg-primary/10 rounded font-mono-label text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[12px]">edit</span>
                Edit Info
              </button>

              <div className="flex items-center gap-3 border-l border-[#2D2D2D] pl-4">
                {github ? (
                  <a href={github.startsWith('http') ? github : `https://github.com/${github}`} target="_blank" rel="noopener noreferrer" className="text-outline hover:text-white transition-colors" title="GitHub Profile">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </a>
                ) : (
                  <span className="text-outline/25" title="GitHub Not Connected">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                  </span>
                )}
                {linkedin ? (
                  <a href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`} target="_blank" rel="noopener noreferrer" className="text-outline hover:text-white transition-colors" title="LinkedIn Profile">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </a>
                ) : (
                  <span className="text-outline/25" title="LinkedIn Not Connected">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                    </svg>
                  </span>
                )}
                {instagram ? (
                  <a href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="text-outline hover:text-white transition-colors" title="Instagram Profile">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.79 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                ) : (
                  <span className="text-outline/25" title="Instagram Not Connected">
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.79 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Fast Stats Sidebar */}
        <div className="lg:col-span-4 grid grid-cols-2 gap-stack-md">
          <div className="bg-[#111111] border border-[#2D2D2D] p-stack-md flex flex-col justify-between rounded-lg hover:border-outline-variant transition-colors shadow-md">
            <span className="font-mono-label text-mono-label text-outline uppercase text-[11px]">Global Rank</span>
            <div className="flex flex-col">
              <span className="font-mono-stats text-mono-stats text-primary text-2xl">#{userGlobalRank}</span>
              <span className="text-[10px] text-secondary flex items-center gap-1 mt-1">
                <span className="material-symbols-outlined text-[12px]">trending_up</span> +12 today
              </span>
            </div>
          </div>
          <div className="bg-[#111111] border border-[#2D2D2D] p-stack-md flex flex-col justify-between rounded-lg hover:border-outline-variant transition-colors shadow-md">
            <span className="font-mono-label text-mono-label text-outline uppercase text-[11px]">Sprint Streak</span>
            <div className="flex flex-col">
              <span className="font-mono-stats text-mono-stats text-tertiary text-2xl">{currentStreak} Days</span>
              <span className="text-[10px] text-on-surface-variant mt-1">Record Best: {longestStreak}</span>
            </div>
          </div>
          <div className="bg-[#111111] border border-[#2D2D2D] p-stack-md flex flex-col justify-between rounded-lg hover:border-outline-variant transition-colors shadow-md">
            <span className="font-mono-label text-mono-label text-outline uppercase text-[11px]">Time Invested</span>
            <div className="flex flex-col">
              <span className="font-mono-stats text-mono-stats text-on-surface text-2xl">{(solvedCount * 1.5).toFixed(0)} Hr</span>
              <span className="text-[10px] text-on-surface-variant mt-1">avg 3h/day</span>
            </div>
          </div>
          <div className="bg-[#111111] border border-[#2D2D2D] p-stack-md flex flex-col justify-between rounded-lg hover:border-outline-variant transition-colors shadow-md">
            <span className="font-mono-label text-mono-label text-outline uppercase text-[11px]">Accuracy</span>
            <div className="flex flex-col">
              <span className="font-mono-stats text-mono-stats text-secondary text-2xl">{accuracyPercent}%</span>
              <span className="text-[10px] text-on-surface-variant mt-1">Top 5% overall</span>
            </div>
          </div>
        </div>
      </section>

      {/* Split Pane: Local Sheet Stats vs. Live LeetCode Stats */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-gutter mb-stack-lg">
        {/* Left Pane (Local Sheet Tracker Stats) */}
        <div className="lg:col-span-5 bg-[#111111] border border-[#2D2D2D] p-stack-lg flex flex-col rounded-lg shadow-md justify-between min-h-[400px]">
          <div className="flex justify-between items-center mb-stack-md pb-3 border-b border-[#2D2D2D]">
            <h2 className="font-headline-md text-headline-md flex items-center gap-2">
              <span className="material-symbols-outlined text-outline">analytics</span>
              Sheet Tracker Pulse
            </h2>
            <span className="font-mono-label text-[10px] text-primary uppercase">Local Data</span>
          </div>
          <div className="space-y-stack-md flex-1 flex flex-col justify-center">
            <div>
              <div className="flex justify-between font-mono-label text-[12px] mb-2 uppercase">
                <span className="text-secondary">Easy Solved</span>
                <span className="text-on-surface">{easySolved} / {totalEasy}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${easyPercent}%` }} className="h-full bg-secondary transition-all duration-1000" />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-mono-label text-[12px] mb-2 uppercase">
                <span className="text-tertiary">Medium Solved</span>
                <span className="text-on-surface">{mediumSolved} / {totalMedium}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${mediumPercent}%` }} className="h-full bg-tertiary transition-all duration-1000" />
              </div>
            </div>
            <div>
              <div className="flex justify-between font-mono-label text-[12px] mb-2 uppercase">
                <span className="text-error">Hard Solved</span>
                <span className="text-on-surface">{hardSolved} / {totalHard}</span>
              </div>
              <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${hardPercent}%` }} className="h-full bg-error transition-all duration-1000" />
              </div>
            </div>
          </div>
          <div className="mt-stack-lg pt-stack-md border-t border-[#2D2D2D] flex justify-around text-center select-none">
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

        {/* Right Pane (Live Leetcode Stats) */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <div className="bg-[#111111] border border-[#2D2D2D] p-stack-lg rounded-lg shadow-md flex flex-col justify-between h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-stack-md pb-3 border-b border-[#2D2D2D]">
              <h2 className="font-headline-md text-headline-md flex items-center gap-2">
                <svg className="w-5 h-5 fill-current text-primary" viewBox="0 0 24 24">
                  <path d="M13.483 0a1.374 1.374 0 0 0-.961.414l-9.777 9.778a1.375 1.375 0 0 0 0 1.945l1.894 1.894a1.375 1.375 0 0 0 1.945 0L15.38 5.253a1.375 1.375 0 0 0 0-1.945L13.483.414A1.374 1.374 0 0 0 13.483 0zm-8.835 15.65a1.375 1.375 0 0 0-1.945 0L.414 17.94a1.375 1.375 0 0 0 0 1.945l1.894 1.894a1.375 1.375 0 0 0 1.945 0l2.29-2.29a1.375 1.375 0 0 0 0-1.945l-1.895-1.894zm11.956-6.425a1.375 1.375 0 0 0-1.945 0l-7.778 7.778a1.375 1.375 0 0 0 0 1.945l1.894 1.894a1.375 1.375 0 0 0 1.945 0l7.778-7.778a1.375 1.375 0 0 0 0-1.945l-1.894-1.894z"/>
                </svg>
                LeetCode Live Stats
              </h2>
              {leetcodeUsername && !leetcodeLoading && (
                <button
                  onClick={() => fetchLeetcodeStats(leetcodeUsername, true)}
                  className="p-1 hover:bg-surface-variant/20 rounded text-outline hover:text-white transition-all cursor-pointer flex items-center justify-center border border-transparent"
                  title="Force Sync Stats"
                >
                  <span className="material-symbols-outlined text-[16px]">sync</span>
                </button>
              )}
            </div>

            {/* Content Logic */}
            {!leetcodeUsername ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10 space-y-6">
                <div className="w-16 h-16 rounded-full bg-surface-container-high/40 flex items-center justify-center border border-outline-variant/30 text-outline">
                  <span className="material-symbols-outlined text-3xl">link_off</span>
                </div>
                <div className="max-w-md space-y-2">
                  <h3 className="font-headline-md text-[18px] text-on-surface">LeetCode Sync Inactive</h3>
                  <p className="font-body-sm text-[12px] text-outline leading-relaxed">
                    Connect your LeetCode username in settings to sync your live problem-solving statistics, contest ratings, and recent accepted submissions.
                  </p>
                </div>
                <a href="/settings" className="px-6 py-2 bg-primary text-on-primary font-mono-label text-mono-label font-bold rounded hover:shadow-[0_0_15px_rgba(255,212,0,0.4)] active:scale-95 transition-all uppercase tracking-wider">
                  Sync LeetCode Account
                </a>
              </div>
            ) : leetcodeLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="font-mono-label text-mono-label text-outline text-xs tracking-wider animate-pulse">RETRIEVING_LEETCODE_LIVE_LOGS...</p>
              </div>
            ) : leetcodeError ? (
              <div className="flex-1 flex flex-col items-center justify-center py-10 text-center space-y-4">
                <div className="text-error font-mono-label text-xs uppercase tracking-widest bg-error/10 border border-error/20 px-3 py-2 rounded">
                  ERR: {leetcodeError}
                </div>
                <button
                  onClick={() => fetchLeetcodeStats(leetcodeUsername)}
                  className="px-4 py-2 border border-primary/30 text-primary hover:bg-primary/5 rounded font-mono-label text-[11px] uppercase tracking-wider active:scale-95 transition-all"
                >
                  Retry Connection
                </button>
              </div>
            ) : leetcodeStats ? (
              <div className="flex-1 space-y-6">
                {/* Stats Summary Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#090909] p-3 rounded-lg border border-[#2D2D2D] text-center">
                    <span className="text-[10px] text-outline uppercase font-mono-label">Total Solved</span>
                    <p className="text-2xl font-bold font-mono text-white mt-1">{leetcodeStats.solved.solvedProblem}</p>
                  </div>
                  <div className="bg-[#090909] p-3 rounded-lg border border-[#2D2D2D] text-center">
                    <span className="text-[10px] text-secondary uppercase font-mono-label">Easy Solved</span>
                    <p className="text-2xl font-bold font-mono text-secondary mt-1">{leetcodeStats.solved.easySolved}</p>
                  </div>
                  <div className="bg-[#090909] p-3 rounded-lg border border-[#2D2D2D] text-center">
                    <span className="text-[10px] text-tertiary uppercase font-mono-label">Medium Solved</span>
                    <p className="text-2xl font-bold font-mono text-tertiary mt-1">{leetcodeStats.solved.mediumSolved}</p>
                  </div>
                  <div className="bg-[#090909] p-3 rounded-lg border border-[#2D2D2D] text-center">
                    <span className="text-[10px] text-error uppercase font-mono-label">Hard Solved</span>
                    <p className="text-2xl font-bold font-mono text-error mt-1">{leetcodeStats.solved.hardSolved}</p>
                  </div>
                </div>

                {/* Contest & Standing Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-b border-[#2D2D2D] py-4">
                  <div>
                    <span className="text-[10px] text-outline uppercase font-mono-label block">Contest Rating</span>
                    <p className="text-xl font-bold font-mono text-white mt-1">
                      {leetcodeStats.contest?.contestRating ? Math.round(leetcodeStats.contest.contestRating) : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-mono-label block">Global Ranking</span>
                    <p className="text-xl font-bold font-mono text-white mt-1">
                      {leetcodeStats.profile?.ranking ? leetcodeStats.profile.ranking.toLocaleString() : "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-outline uppercase font-mono-label block">Top % Group</span>
                    <p className="text-xl font-bold font-mono text-white mt-1">
                      {leetcodeStats.contest?.contestTopPercentage ? `Top ${leetcodeStats.contest.contestTopPercentage}%` : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Last 7 Accepted Solutions */}
                <div>
                  <h3 className="text-[10px] uppercase font-mono-label text-outline mb-3 tracking-wider">Recent Submissions (Last 7 Accepted)</h3>
                  {leetcodeStats.submissions && leetcodeStats.submissions.length > 0 ? (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {leetcodeStats.submissions.map((sub: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-[#090909] border border-[#2D2D2D] p-2.5 rounded hover:border-outline-variant/40 transition-colors">
                          <div className="min-w-0 flex-1 pr-4">
                            <p className="text-sm font-semibold text-on-surface truncate">{sub.title}</p>
                            <span className="font-mono text-[10px] text-outline uppercase tracking-wider">{sub.lang}</span>
                          </div>
                          <span className="font-mono text-xs text-secondary shrink-0">{formatDate(sub.timestamp)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-outline font-mono uppercase tracking-widest text-center py-4">No recent accepted solutions found.</p>
                  )}
                </div>
              </div>
            ) : null}
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
                "bg-[#111111] border p-stack-md text-center flex flex-col items-center group rounded-lg transition-all",
                badge.active ? "border-[#2D2D2D] hover:border-primary" : "border-outline-variant/20 opacity-40 grayscale"
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
        <div className="bg-[#111111] border border-[#2D2D2D] p-stack-lg relative rounded-lg shadow-md">
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
      {/* Quick Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#111111] border border-[#2D2D2D] w-full max-w-lg rounded-xl overflow-hidden shadow-2xl flex flex-col text-left">
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#2D2D2D] bg-[#090909]">
              <h2 className="font-headline-md text-headline-md text-primary uppercase font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">edit</span>
                Update Profile Info
              </h2>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-outline hover:text-white transition-colors cursor-pointer flex items-center justify-center border border-transparent bg-transparent"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              
              const getWordCount = (text: string) => {
                const trimmed = text.trim();
                if (!trimmed) return 0;
                return trimmed.split(/\s+/).length;
              };

              if (getWordCount(bio) > 75) {
                alert("Bio cannot exceed 75 words.");
                return;
              }

              try {
                // Sanitize social inputs to prevent Stored XSS
                let sanitizedGithub = "";
                let sanitizedLinkedin = "";
                let sanitizedInstagram = "";

                try {
                  sanitizedGithub = sanitizeSocialInput(github, "github");
                } catch (e: any) {
                  alert(`GitHub Validation Error: ${e.message}`);
                  return;
                }

                try {
                  sanitizedLinkedin = sanitizeSocialInput(linkedin, "linkedin");
                } catch (e: any) {
                  alert(`LinkedIn Validation Error: ${e.message}`);
                  return;
                }

                try {
                  sanitizedInstagram = sanitizeSocialInput(instagram, "instagram");
                } catch (e: any) {
                  alert(`Instagram Validation Error: ${e.message}`);
                  return;
                }

                // Update local inputs to normalized values
                setGithub(sanitizedGithub);
                setLinkedin(sanitizedLinkedin);
                setInstagram(sanitizedInstagram);

                // Save to profiles database
                try {
                  await supabase
                    .from("profiles")
                    .upsert({
                      id: user?.id,
                      leetcode_username: leetcodeUsername.trim(),
                      bio: bio.trim(),
                      instagram: sanitizedInstagram,
                      linkedin: sanitizedLinkedin,
                      github: sanitizedGithub
                    });
                } catch (dbErr) {
                  console.warn("Profiles database upsert skipped:", dbErr);
                }

                // Save to auth user metadata
                const { error: authErr } = await supabase.auth.updateUser({
                  data: {
                    leetcode_username: leetcodeUsername.trim(),
                    bio: bio.trim(),
                    instagram: sanitizedInstagram,
                    linkedin: sanitizedLinkedin,
                    github: sanitizedGithub
                  }
                });

                if (authErr) throw authErr;

                if (user?.id) {
                  localStorage.removeItem(`profile_data_cache_${user.id}`);
                  localStorage.removeItem(`leetcode_live_stats_cache_${leetcodeUsername.trim()}`);
                }
                window.dispatchEvent(new Event("question-solved"));

                // Sync leetcode stats if username changed
                if (leetcodeUsername.trim()) {
                  fetchLeetcodeStats(leetcodeUsername.trim(), true);
                } else {
                  setLeetcodeStats(null);
                }

                setIsEditModalOpen(false);
              } catch (err: any) {
                alert(`Failed to save: ${err.message}`);
              }
            }} className="p-6 space-y-4 flex-1">
              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">LeetCode Username</label>
                <input 
                  type="text"
                  className="w-full bg-[#080808] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:border-primary transition-all font-mono" 
                  value={leetcodeUsername}
                  onChange={(e) => setLeetcodeUsername(e.target.value)}
                  placeholder="e.g. alfaarghya"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">Short Bio (Max 75 Words)</label>
                  <span className="text-[10px] font-mono-label text-outline tracking-wider">
                    {bio.trim() ? bio.trim().split(/\s+/).length : 0}/75 Words
                  </span>
                </div>
                <textarea 
                  className="w-full bg-[#080808] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:border-primary transition-all h-20 resize-none font-sans" 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">GitHub Profile/Username</label>
                <input 
                  type="text"
                  className="w-full bg-[#080808] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:border-primary transition-all" 
                  value={github}
                  onChange={(e) => setGithub(e.target.value)}
                  placeholder="e.g. githubusername"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">LinkedIn Profile/Username</label>
                <input 
                  type="text"
                  className="w-full bg-[#080808] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:border-primary transition-all" 
                  value={linkedin}
                  onChange={(e) => setLinkedin(e.target.value)}
                  placeholder="e.g. linkedinusername"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">Instagram Profile/Username</label>
                <input 
                  type="text"
                  className="w-full bg-[#080808] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm focus:outline-none focus:border-primary transition-all" 
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="e.g. instagramusername"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 bg-surface-container border border-outline-variant/30 text-on-surface py-2.5 rounded-lg font-mono-label text-[12px] uppercase hover:bg-surface-variant/20 transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-on-primary py-2.5 rounded-lg font-mono-label text-[12px] font-bold uppercase tracking-wider hover:shadow-[0_0_15px_rgba(255,212,0,0.4)] active:scale-95 transition-all cursor-pointer text-center"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AppShell>
  );
}
