"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ExternalLink, Check, Play, Info, Lightbulb, AlertCircle, X, Brain, Tag, Clock, Database, BarChart3, Code2, BookOpen } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { cn, fetchWithCache } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

import { TOPIC_SLUGS, TOPIC_DISPLAY_NAMES, slugifyPattern } from "@/lib/slugs";

const highlightCpp = (code: string) => {
  if (!code) return "";
  
  return code
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/(#include\s+&lt;.*&gt;)/g, '<span class="text-primary">$1</span>')
    .replace(/\b(using namespace std)\b/g, '<span class="text-primary">using namespace</span> <span class="text-secondary">std</span>')
    .replace(/\b(void|int|double|float|char|bool|struct|public|private|protected|static|const)\b/g, '<span class="text-secondary">$1</span>')
    .replace(/\bclass\b(?!\s*=)/g, '<span class="text-secondary">class</span>')
    .replace(/\b(while|for|if|else|return|break|continue|switch|case|new|delete)\b/g, '<span class="text-primary">$1</span>')
    .replace(/\b(\d+)\b/g, '<span class="text-tertiary">$1</span>')
    .replace(/(\/\/.*)/g, '<span class="text-outline/60">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-outline/60">$1</span>');
};

const getKeywordsArray = (keywords: any): string[] => {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords;
  try {
    const parsed = JSON.parse(keywords);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return [];
};


interface Question {
  ID: number;
  Title: string;
  Difficulty: string;
  Link: string;
  Topics: string;
  "Acceptance Rate (%)"?: number;
}

interface PatternMetadata {
  id: string;
  pattern_name: string;
  topic_name: string | null;
  core_idea: string | null;
  recognition_keywords: string[] | null;
  tc: string | null;
  sc: string | null;
  difficulty: string | null;
  cpp_template: string | null;
}

export default function QuestionExplorerPage({ params }: { params: Promise<{ topic: string; pattern: string }> }) {
  const resolvedParams = use(params);
  const topicSlug = resolvedParams.topic;
  const patternSlug = resolvedParams.pattern;

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [dbTopicName, setDbTopicName] = useState<string | null>(null);
  const [dbPatternName, setDbPatternName] = useState("");
  const [topicDisplayName, setTopicDisplayName] = useState("");
  
  const [patternMetadata, setPatternMetadata] = useState<PatternMetadata | null>(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("core_idea");
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [solvedTimestamps, setSolvedTimestamps] = useState<{ [qId: number]: string }>({});
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);



  useEffect(() => {
    const dbName = TOPIC_SLUGS[topicSlug];
    if (!dbName) {
      setLoading(false);
      return;
    }
    setDbTopicName(dbName);
    setTopicDisplayName(TOPIC_DISPLAY_NAMES[topicSlug] || dbName);

    if (!user) return;
    const userId = user.id;

    async function loadQuestionsData() {
      try {
        setLoading(true);

        const cacheKey = `pattern_questions_cache_${user ? user.id : "anon"}_${topicSlug}_${patternSlug}`;
        const dataResult = await fetchWithCache(cacheKey, async () => {
          // 1. Fetch user's solved question IDs
          let solvedArr: any[] = [];
          if (user) {
            const { data: userSolves, error: solvesError } = await supabase
              .from("user_progress")
              .select("question_id, completed-at")
              .eq("user_id", userId);

            if (solvesError) throw solvesError;
            solvedArr = userSolves || [];
          }

          // 2. Fetch sheet questions mapped under this topic from the optimized view
          const { data: qData, error: qError } = await supabase
            .from("view_sheet_questions")
            .select("*")
            .eq("topic_name", dbName);

          if (qError) throw qError;

          // Group sheet questions by their pattern slug
          const matched = qData?.filter((row: any) => {
            return slugifyPattern(row.pattern_name || "") === patternSlug;
          });

          let resolvedPatternName = "";
          let mappedQList: Question[] = [];
          let metaData = null;

          if (matched && matched.length > 0) {
            resolvedPatternName = matched[0].pattern_name;
            
            // Fetch additional metadata (Title and Topics) from the master questions table
            const qIds = matched.map((row: any) => row.question_id);
            const { data: questionsMeta, error: metaQError } = await supabase
              .from("questions")
              .select("ID, Title, Topics")
              .in("ID", qIds);
              
            const metaMap = new Map();
            if (!metaQError && questionsMeta) {
              questionsMeta.forEach((q: any) => {
                metaMap.set(q.ID, q);
              });
            }

            mappedQList = matched
              .map((row: any) => {
                const meta = metaMap.get(row.question_id);
                return {
                  ID: row.question_id,
                  Title: meta?.Title || row.question_name || row.title || "",
                  Difficulty: row.difficulty,
                  Link: row.link,
                  Topics: meta?.Topics || row.topics || "",
                  "Acceptance Rate (%)": row.acceptance_rate,
                };
              })
              .filter(Boolean) as Question[];
            
            mappedQList.sort((a, b) => a.ID - b.ID);
          }

          // Fetch pattern metadata
          if (resolvedPatternName) {
            const { data: metaDataList, error: metaError } = await supabase
              .from("pattern_metadata")
              .select("*")
              .eq("pattern_name", resolvedPatternName)
              .limit(1);

            if (!metaError && metaDataList && metaDataList.length > 0) {
              metaData = metaDataList[0];
            }
          }

          return {
            resolvedPatternName,
            solvedArr,
            mappedQList,
            metaData
          };
        }, 300000); // 5 minutes TTL

        if (dataResult) {
          setDbPatternName(dataResult.resolvedPatternName);
          setQuestions(dataResult.mappedQList);
          setPatternMetadata(dataResult.metaData);

          const ids = new Set<number>();
          const timesMap: { [qId: number]: string } = {};
          dataResult.solvedArr.forEach((item: any) => {
            ids.add(item.question_id);
            timesMap[item.question_id] = item["completed-at"] || new Date().toISOString();
          });
          setSolvedIds(ids);
          setSolvedTimestamps(timesMap);
        }
      } catch (err) {
        console.error("Failed to load question explorer data:", err);
        setPatternMetadata(null);
      } finally {
        setLoading(false);
        setMetaLoading(false);
      }
    }

    loadQuestionsData();
  }, [topicSlug, patternSlug, user]);

  // Listen to solved events to refetch progress directly from Supabase (bypassing cache)
  useEffect(() => {
    if (!user) return;
    const handleSync = async () => {
      try {
        const { data: userSolves, error } = await supabase
          .from("user_progress")
          .select("question_id, completed-at")
          .eq("user_id", user.id);
        
        if (!error && userSolves) {
          const solvedSet = new Set<number>();
          const timesMap: { [qId: number]: string } = {};
          userSolves.forEach((item: any) => {
            solvedSet.add(item.question_id);
            timesMap[item.question_id] = item["completed-at"] || new Date().toISOString();
          });
          setSolvedIds(solvedSet);
          setSolvedTimestamps(timesMap);
        }
      } catch (err) {
        console.error("Failed to sync solves:", err);
      }
    };
    window.addEventListener("question-solved", handleSync);
    return () => window.removeEventListener("question-solved", handleSync);
  }, [user]);

  const handleToggleSolve = async (qId: number, title: string, difficulty: string, link: string) => {
    if (!user) return;
    const userId = user.id;

    const isCurrentlySolved = solvedIds.has(qId);
    
    if (isCurrentlySolved) {
      const newSolvedIds = new Set(solvedIds);
      const newTimestamps = { ...solvedTimestamps };
      newSolvedIds.delete(qId);
      delete newTimestamps[qId];
      setSolvedIds(newSolvedIds);
      setSolvedTimestamps(newTimestamps);

      const timestamps = JSON.parse(localStorage.getItem("solved_questions_timestamps") || "{}");

      try {
        // Delete progress
        const { error } = await supabase
          .from("user_progress")
          .delete()
          .match({ user_id: userId, question_id: qId });
        if (error) throw error;

        delete timestamps[qId];
        localStorage.setItem("solved_questions_timestamps", JSON.stringify(timestamps));
        triggerToast(`"${title}" marked as incomplete.`);
        window.dispatchEvent(new Event("question-solved"));
      } catch (err) {
        console.error("Failed to update solve state:", err);
        // Revert optimistic update
        setSolvedIds(new Set(solvedIds));
        setSolvedTimestamps(solvedTimestamps);
      }
    } else {
      // Open reflection drawer!
      window.dispatchEvent(new CustomEvent("open-question-drawer", {
        detail: {
          questionId: qId,
          title,
          difficulty,
          link,
          mode: "reflection"
        }
      }));
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };



  if (loading) {
    return (
      <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
        {/* Breadcrumbs */}
        <div className="py-2">
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Page Header */}
        <div className="mb-12 relative pt-2">
          <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary/20 rounded" />
          <Skeleton className="h-8 w-80 mb-4" />
          <Skeleton className="h-5 w-full max-w-3xl" />
        </div>

        {/* Pattern Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#111111]/72 border border-[#2D2D2D] p-6 rounded-xl flex flex-col gap-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          ))}
        </div>

        {/* Question Table Grid container */}
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-xl overflow-hidden relative">
          <div className="grid grid-cols-[60px_1fr_120px_100px_100px_120px_60px_60px_80px] gap-4 px-6 py-4 border-b border-[#2D2D2D] bg-[#090909]/50">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-12" />
            ))}
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="grid grid-cols-[60px_1fr_120px_100px_100px_120px_60px_60px_80px] gap-4 py-3 border-b border-outline-variant/10 last:border-0 items-center">
                <Skeleton className="h-3.5 w-6" />
                <Skeleton className="h-4.5 w-48 sm:w-64" />
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-6 w-16 rounded" />
                <Skeleton className="h-5 w-14 rounded" />
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-8 w-14 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!dbTopicName || questions.length === 0) {
    return (
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-error" />
          <h2 className="font-display-arcade text-error">PATTERN_NOT_FOUND</h2>
          <p className="text-on-surface-variant max-w-sm">The requested pattern slug does not contain any questions in the core roadmap.</p>
          <Link href={`/questions/sheetstride-core/${topicSlug}`}>
            <button className="px-6 py-2 bg-primary text-background font-bold rounded-lg font-mono-label text-sm uppercase">
              Go Back
            </button>
          </Link>
        </div>
      </AppShell>
    );
  }

  // Calculate metrics
  const totalCount = questions.length;
  const solvedCount = questions.filter(q => solvedIds.has(q.ID)).length;
  const percent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
  
  // Find first unsolved question
  const nextMilestoneQ = questions.find(q => !solvedIds.has(q.ID));
  const nextMilestone = nextMilestoneQ ? nextMilestoneQ.Title : "All Solved!";

  // Format ID pad helpers
  const formatID = (id: number) => {
    if (id < 10) return `00${id}`;
    if (id < 100) return `0${id}`;
    return `${id}`;
  };

  const formatSolvedDate = (qId: number) => {
    const isoStr = solvedTimestamps[qId];
    if (!isoStr) return "-";
    if (isoStr.startsWith("1970-01-01")) return "PREMIUM";
    const dateObj = new Date(isoStr);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  };

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const rowReveal = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: "SheetStride Core", href: "/questions/sheetstride-core" },
          { label: topicDisplayName, href: `/questions/sheetstride-core/${topicSlug}` },
          { label: dbPatternName }
        ]} 
      />

      {/* Page Header */}
      <div className="mb-12 relative pt-2">
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-primary rounded" />
        <h1 className="font-display-arcade text-2xl md:text-3xl text-primary uppercase tracking-tight mb-4">
          {dbPatternName.toUpperCase()}
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
          Master the algorithmic nuances of the {dbPatternName} pattern. Resolve the problem set below to achieve full pattern completion.
        </p>
      </div>

      {/* Pattern Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 select-none">
        <div className="bg-[#111111] border border-[#2D2D2D] p-6 rounded-xl flex flex-col gap-1 shadow-md">
          <span className="font-mono-label text-mono-label text-outline uppercase">Total Exercises</span>
          <span className="font-mono-stats text-mono-stats text-on-surface">{totalCount < 10 ? `0${totalCount}` : totalCount}</span>
        </div>
        <div className="bg-[#111111] border border-[#2D2D2D] p-6 rounded-xl flex flex-col gap-1 border-l-4 border-l-secondary shadow-md">
          <span className="font-mono-label text-mono-label text-outline uppercase">Completed</span>
          <span className="font-mono-stats text-mono-stats text-secondary">{solvedCount < 10 ? `0${solvedCount}` : solvedCount}</span>
        </div>
        <div className="bg-[#111111] border border-[#2D2D2D] p-6 rounded-xl flex flex-col gap-1 shadow-md">
          <span className="font-mono-label text-mono-label text-outline uppercase">Completion Rate</span>
          <span className="font-mono-stats text-mono-stats text-on-surface">{percent}%</span>
        </div>
        <div className="bg-[#111111] border border-[#2D2D2D] p-6 rounded-xl flex flex-col gap-1 border-l-4 border-l-tertiary shadow-md">
          <span className="font-mono-label text-mono-label text-outline uppercase">Next Milestone</span>
          <span className="font-mono-stats text-mono-stats text-tertiary truncate block max-w-full" title={nextMilestone}>
            {nextMilestone}
          </span>
        </div>
      </div>

      {/* Question Table Grid container */}
      <div className="bg-[#111111] border border-[#2D2D2D] rounded-xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#090909]/50 border-b border-[#2D2D2D] select-none">
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">#</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Title</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Topic</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Difficulty</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Status</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Solved Date</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Link</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Notes</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2D2D]/40">
              <AnimatePresence mode="popLayout">
                {questions.map((row) => {
                  const solved = solvedIds.has(row.ID);
                  return (
                    <motion.tr 
                      key={row.ID}
                      whileHover={{ background: "rgba(255, 212, 0, 0.02)" }}
                      className={cn(
                        "transition-all duration-200",
                        solved && "bg-secondary/[0.01]"
                      )}
                    >
                      {/* ID */}
                      <td className="px-6 py-5 font-mono-label text-mono-label text-on-surface-variant select-none">
                        {formatID(row.ID)}
                      </td>
                      
                      {/* Title */}
                      <td className="px-6 py-5">
                        <button 
                          onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                            detail: {
                              questionId: row.ID,
                              title: row.Title,
                              difficulty: row.Difficulty,
                              link: row.Link,
                              mode: "description"
                            }
                          }))}
                          className={cn(
                            "font-headline-md text-headline-md transition-colors leading-snug cursor-pointer text-left",
                            solved ? "text-on-surface-variant line-through opacity-60" : "text-on-surface hover:text-primary"
                          )}
                        >
                          {row.Title}
                        </button>
                      </td>

                      {/* Topic tag */}
                      <td className="px-6 py-5">
                        <span className="font-body-sm text-[11px] text-on-surface-variant bg-surface-container-high/40 px-2 py-0.5 rounded border border-[#2D2D2D] block w-fit truncate max-w-[120px]" title={row.Topics}>
                          {row.Topics?.split(",")[0] || "Unknown"}
                        </span>
                      </td>

                      {/* Difficulty */}
                      <td className="px-6 py-5 select-none">
                        <Badge 
                          tone={
                            row.Difficulty.toLowerCase() === "easy" ? "secondary" : 
                            row.Difficulty.toLowerCase() === "medium" ? "tertiary" : "danger"
                          }
                        >
                          {row.Difficulty.toUpperCase()}
                        </Badge>
                      </td>

                      {/* Solved Status */}
                      <td className="px-6 py-5 select-none">
                        <div className={cn("flex items-center gap-2", solved ? "text-secondary" : "text-outline")}>
                          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: solved ? "'FILL' 1" : "" }}>
                            {solved ? "check_circle" : "pending"}
                          </span>
                          <span className="font-body-sm text-body-sm">{solved ? "Solved" : "Pending"}</span>
                        </div>
                      </td>

                      {/* Solved Date */}
                      <td className="px-6 py-5 font-mono-label text-mono-label text-outline select-none">
                        {formatSolvedDate(row.ID)}
                      </td>

                      {/* LeetCode link */}
                      <td className="px-6 py-5">
                        <a 
                          href={row.Link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="hover:text-primary text-outline transition-colors inline-flex items-center"
                          title="Open LeetCode"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>

                      {/* Notebook link */}
                      <td className="px-6 py-5">
                        {user && (
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                              detail: {
                                questionId: row.ID,
                                title: row.Title,
                                difficulty: row.Difficulty,
                                link: row.Link,
                                mode: "notebook"
                              }
                            }))}
                            className="hover:text-primary text-outline transition-colors inline-flex items-center cursor-pointer"
                            title="Open Notebook"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                        )}
                      </td>

                      {/* Checkbox action */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleToggleSolve(row.ID, row.Title, row.Difficulty, row.Link)}
                            className={cn(
                              "w-5 h-5 rounded border flex items-center justify-center transition-all duration-300",
                              solved ? "border-secondary bg-secondary/10 text-secondary scale-110" : "border-outline-variant hover:border-primary"
                            )}
                          >
                            {solved && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pattern Details / Pro-tip Bento Section (Pattern Handbook) */}
      {metaLoading ? (
        <section className="mt-12 grid grid-cols-1 lg:grid-cols-10 gap-6 animate-pulse select-none">
          {/* Left Panel Skeleton */}
          <div className="lg:col-span-3 flex flex-col gap-4">
            <div className="mb-4">
              <div className="h-6 w-48 bg-[#2B2B2B] rounded mb-2" />
              <div className="h-4 w-24 bg-[#2B2B2B] rounded" />
            </div>
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-14 bg-[#111111] border border-[#2D2D2D] rounded-xl" />
              ))}
            </div>
          </div>
          {/* Right Panel Skeleton */}
          <div className="lg:col-span-7 bg-[#111111]/80 border border-[#2D2D2D] rounded-xl p-8 h-[400px] flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-8">
                <div className="h-6 w-32 bg-[#2B2B2B] rounded" />
                <div className="h-4 w-20 bg-[#2B2B2B] rounded" />
              </div>
              <div className="space-y-4">
                <div className="h-4 w-full bg-[#2B2B2B] rounded" />
                <div className="h-4 w-5/6 bg-[#2B2B2B] rounded" />
                <div className="h-4 w-4/6 bg-[#2B2B2B] rounded" />
              </div>
            </div>
            <div className="h-32 w-full bg-[#0E0E0E] border border-[#2B2B2B] rounded-lg" />
          </div>
        </section>
      ) : !patternMetadata ? (
        <section className="mt-12 bg-[#111111] border border-dashed border-error/30 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-error animate-pulse" />
          <h3 className="font-headline-md text-error">Pattern handbook data unavailable.</h3>
          <p className="text-outline text-body-sm max-w-md">
            The metadata for this algorithmic pattern could not be retrieved from the database.
          </p>
        </section>
      ) : (() => {
        const availableTabs = [];
        if (patternMetadata.core_idea) {
          availableTabs.push({ id: "core_idea", label: "Core Idea", icon: Brain });
        }
        const keywords = getKeywordsArray(patternMetadata.recognition_keywords);
        if (keywords.length > 0) {
          availableTabs.push({ id: "recognition_keywords", label: "Recognition Keywords", icon: Tag });
        }
        if (patternMetadata.tc) {
          availableTabs.push({ id: "tc", label: "Time Complexity", icon: Clock });
        }
        if (patternMetadata.sc) {
          availableTabs.push({ id: "sc", label: "Space Complexity", icon: Database });
        }
        if (patternMetadata.difficulty) {
          availableTabs.push({ id: "difficulty", label: "Difficulty Level", icon: BarChart3 });
        }
        if (patternMetadata.cpp_template) {
          availableTabs.push({ id: "cpp_template", label: "CPP Template", icon: Code2 });
        }

        if (availableTabs.length === 0) {
          return (
            <section className="mt-12 bg-[#111111] border border-dashed border-error/30 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-4">
              <AlertCircle className="w-10 h-10 text-error" />
              <h3 className="font-headline-md text-error">Pattern handbook data unavailable.</h3>
              <p className="text-outline text-body-sm max-w-md">
                No handbook fields are populated for this pattern.
              </p>
            </section>
          );
        }

        const activeTabObj = availableTabs.find(t => t.id === activeTab) || availableTabs[0];
        const currentTabId = activeTabObj.id;
        const currentTabIndex = availableTabs.findIndex(t => t.id === currentTabId);

        return (
          <section className="mt-12 grid grid-cols-1 lg:grid-cols-10 gap-6">
            {/* Left Panel: Navigation Rail (30%) */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="mb-4 select-none">
                <h2 className="font-display-arcade text-headline-md text-primary uppercase tracking-tight">PATTERN HANDBOOK</h2>
                <p className="font-mono-label text-mono-label text-outline uppercase">Knowledge Base</p>
              </div>
              <div className="flex flex-col gap-3">
                {availableTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = tab.id === currentTabId;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "p-4 rounded-xl text-left flex items-center gap-4 transition-all duration-300",
                        isActive
                          ? "bg-[#ffd400]/5 border border-[#2D2D2D] border-l-4 border-l-primary shadow-[0_0_15px_rgba(255,212,0,0.12)]"
                          : "bg-[#111111] border border-[#2D2D2D] hover:bg-surface-container-high/40 group"
                      )}
                    >
                      <Icon
                        className={cn(
                          "w-5 h-5 transition-colors",
                          isActive ? "text-primary" : "text-outline group-hover:text-primary"
                        )}
                      />
                      <span
                        className={cn(
                          "font-body-lg text-body-lg transition-colors",
                          isActive ? "text-primary font-bold" : "text-on-surface"
                        )}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Panel: Content Viewer (70%) */}
            <div className="lg:col-span-7 bg-[#111111] border border-[#2D2D2D] rounded-xl p-8 relative overflow-hidden select-none min-h-[380px] flex flex-col justify-between">
              {currentTabId === "core_idea" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-headline-md text-headline-md text-on-surface">Core Idea</h3>
                    <span className="font-mono-label text-mono-label text-outline uppercase">
                      Module {currentTabIndex + 1 < 10 ? `0${currentTabIndex + 1}` : currentTabIndex + 1} / {availableTabs.length < 10 ? `0${availableTabs.length}` : availableTabs.length}
                    </span>
                  </div>
                  <div className="prose prose-invert max-w-none flex-1">
                    <p className="text-on-surface-variant font-body-lg leading-relaxed mb-6 whitespace-pre-line">
                      {patternMetadata.core_idea}
                    </p>
                  </div>
                </div>
              )}

              {currentTabId === "recognition_keywords" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-headline-md text-headline-md text-on-surface">Recognition Keywords</h3>
                    <span className="font-mono-label text-mono-label text-outline uppercase">
                      Module {currentTabIndex + 1 < 10 ? `0${currentTabIndex + 1}` : currentTabIndex + 1} / {availableTabs.length < 10 ? `0${availableTabs.length}` : availableTabs.length}
                    </span>
                  </div>
                  <div className="space-y-4 flex-1">
                    <p className="text-on-surface-variant font-body-lg leading-relaxed">
                      Identify when to apply this pattern in coding exercises by looking for these key terms:
                    </p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      {keywords.map((keyword, i) => (
                        <span
                          key={i}
                          className="px-4 py-2 bg-[#090909] border border-[#2D2D2D] hover:border-primary hover:text-primary text-on-surface font-body-sm rounded-xl transition-all duration-200 cursor-default select-none shadow-md"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentTabId === "tc" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-headline-md text-headline-md text-on-surface">Typical Time Complexity</h3>
                    <span className="font-mono-label text-mono-label text-outline uppercase">
                      Module {currentTabIndex + 1 < 10 ? `0${currentTabIndex + 1}` : currentTabIndex + 1} / {availableTabs.length < 10 ? `0${availableTabs.length}` : availableTabs.length}
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row gap-8 items-center flex-1 justify-center">
                    <div className="flex-1 space-y-4">
                      <p className="text-on-surface-variant font-body-lg leading-relaxed">
                        In algorithm analysis, <span className="text-primary font-mono-stats">{patternMetadata.tc}</span> describes the growth rate of runtime as a function of the input size.
                      </p>
                      <div className="flex gap-4 pt-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-secondary"></span>
                          <span className="text-on-surface-variant font-mono-label text-mono-label">Efficiency: Optimized</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                          <span className="text-on-surface-variant font-mono-label text-mono-label">Complexity Scale</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-64 h-40 bg-[#090909] rounded-xl border border-[#2D2D2D] flex flex-col items-center justify-center relative overflow-hidden shrink-0">
                      <div className="relative z-10 text-center">
                        <span className="font-mono-stats text-4xl text-secondary tracking-tighter">{patternMetadata.tc}</span>
                        <div className="mt-1 font-mono-label text-[11px] text-secondary uppercase tracking-widest opacity-80">Time Complexity</div>
                      </div>
                      <div className="absolute bottom-0 left-0 w-full h-1 bg-[#2D2D2D]">
                        <div className="h-full bg-secondary w-[75%]"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentTabId === "sc" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-headline-md text-headline-md text-on-surface">Typical Space Complexity</h3>
                    <span className="font-mono-label text-mono-label text-outline uppercase">
                      Module {currentTabIndex + 1 < 10 ? `0${currentTabIndex + 1}` : currentTabIndex + 1} / {availableTabs.length < 10 ? `0${availableTabs.length}` : availableTabs.length}
                    </span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-8 bg-[#090909]/50 border border-[#2D2D2D] rounded-xl flex-1">
                    <span className="font-mono-label text-mono-label text-on-surface-variant mb-4 tracking-widest uppercase opacity-60">Typical Space Complexity</span>
                    <div className="font-mono-stats text-[72px] leading-none text-primary mb-4" style={{ textShadow: "0 0 20px rgba(255, 212, 0, 0.4)" }}>{patternMetadata.sc}</div>
                    <div className="h-1.5 w-32 bg-primary/20 rounded-full overflow-hidden mb-6">
                      <div className="h-full w-1/3 bg-primary"></div>
                    </div>
                    <span className="font-mono-label text-mono-label text-primary">Space Optimized</span>
                  </div>
                </div>
              )}

              {currentTabId === "difficulty" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-headline-md text-headline-md text-on-surface">Difficulty Level</h3>
                    <span className="font-mono-label text-mono-label text-outline uppercase">
                      Module {currentTabIndex + 1 < 10 ? `0${currentTabIndex + 1}` : currentTabIndex + 1} / {availableTabs.length < 10 ? `0${availableTabs.length}` : availableTabs.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-6 flex-1 justify-center">
                    <p className="text-on-surface-variant max-w-2xl font-body-lg leading-relaxed">
                      This pattern is primarily categorized as <strong className="text-on-surface">{patternMetadata.difficulty}</strong>, which signifies the conceptual complexity and state-tracking accuracy required.
                    </p>
                    <div className="flex items-center gap-3">
                      {["Beginner", "Intermediate", "Advanced"].map((level) => {
                        const isActive = patternMetadata.difficulty?.toLowerCase() === level.toLowerCase();
                        return (
                          <span
                            key={level}
                            className={cn(
                              "font-mono-label text-mono-label px-3 py-1 rounded-full border transition-all duration-200 cursor-default select-none",
                              isActive
                                ? "bg-secondary/10 text-secondary border-secondary/20 shadow-lg shadow-secondary/10"
                                : "bg-surface-variant/20 text-outline border-outline-variant/30 opacity-45"
                            )}
                          >
                            {level}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {currentTabId === "cpp_template" && (
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="font-headline-md text-headline-md text-on-surface">CPP Template</h3>
                    <span className="font-mono-label text-mono-label text-outline uppercase">
                      Module {currentTabIndex + 1 < 10 ? `0${currentTabIndex + 1}` : currentTabIndex + 1} / {availableTabs.length < 10 ? `0${availableTabs.length}` : availableTabs.length}
                    </span>
                  </div>
                  <div className="mt-2 flex-1">
                    <div className="bg-[#0A101E] rounded-xl border border-outline-variant/30 overflow-hidden shadow-2xl">
                      <div className="bg-[#111A2E] border-b border-outline-variant/30 px-4 h-10 flex items-center justify-between">
                        <div className="flex h-full">
                          <div className="flex items-center gap-2 bg-[#0A101E] border-x border-outline-variant/30 px-4 h-full text-secondary font-mono-label text-[13px]">
                            <span className="material-symbols-outlined text-[16px]">description</span> main.cpp
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-danger/40"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-tertiary/40"></div>
                          <div className="w-2.5 h-2.5 rounded-full bg-secondary/40"></div>
                        </div>
                      </div>
                      <div className="p-6 font-mono-stats text-[14px] leading-relaxed flex gap-6 overflow-x-auto custom-scrollbar max-h-[400px]">
                        <div className="text-outline/30 text-right select-none border-r border-outline-variant/20 pr-4 shrink-0 font-mono">
                          {patternMetadata.cpp_template?.split("\n").map((_, idx) => (
                            <div key={idx}>{idx + 1}</div>
                          ))}
                        </div>
                        <pre 
                          className="text-[#A9B7C6] whitespace-pre font-mono text-sm leading-relaxed overflow-x-auto select-text flex-1"
                          dangerouslySetInnerHTML={{ __html: highlightCpp(patternMetadata.cpp_template || "") }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        );
      })()}

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 bg-[#111111] border border-[#2D2D2D] border-l-4 border-l-secondary p-4 rounded-xl flex items-center gap-4 shadow-2xl z-50 min-w-[320px] max-w-[400px]"
          >
            <div className="w-9 h-9 rounded-full bg-secondary/15 flex items-center justify-center text-secondary shrink-0 select-none">
              <span className="material-symbols-outlined text-sm">military_tech</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body-sm text-body-sm font-semibold text-on-surface">Roadmap Tracker</p>
              <p className="font-body-sm text-[12px] text-outline truncate" title={toastMessage}>{toastMessage}</p>
            </div>
            <button 
              onClick={() => setShowToast(false)} 
              className="p-1 hover:bg-surface-variant/30 rounded text-outline hover:text-on-surface"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 py-stack-md mt-12 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-display-arcade text-display-arcade text-primary">SHEETSTRIDE</span>
          <span className="font-mono-label text-mono-label text-outline uppercase">v2.2.0-STABLE</span>
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
