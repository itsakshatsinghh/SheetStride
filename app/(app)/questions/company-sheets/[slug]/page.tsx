"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ExternalLink, Check, Info, AlertCircle, X, Search, Clock, Target, CheckCircle2, Circle, Lock, BookOpen } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { cn, fetchWithCache } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface CompanyQuestion {
  question_id: number;
  title: string;
  difficulty: string;
  link: string;
  topics: string;
  acceptance_rate: number | null;
  frequency: number;
}

export default function CompanySheetDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("");
  const [questions, setQuestions] = useState<CompanyQuestion[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [solvedTimestamps, setSolvedTimestamps] = useState<{ [qId: number]: string }>({});

  // Filters
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  // Toast notification state
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const cacheKey = `company_questions_cache_${user ? user.id : "anon"}_${slug}`;
        const sheetData = await fetchWithCache(cacheKey, async () => {
          // 1. Fetch company profile details from view_company_summary
          const { data: summaryData, error: summaryError } = await supabase
            .from("view_company_summary")
            .select("*")
            .eq("company_slug", slug)
            .limit(1);

          if (summaryError) throw summaryError;
          const companyName = summaryData?.[0]?.company_name || "";

          // 2. Fetch user's solved question IDs if logged in
          let solvedArr: any[] = [];
          if (user) {
            const { data: userSolves, error: solvesError } = await supabase
              .from("user_progress")
              .select("question_id, completed-at")
              .eq("user_id", user.id);

            if (!solvesError && userSolves) {
              solvedArr = userSolves;
            }
          }

          // 3. Fetch questions mapped under this company from the view
          const { data: questionsData, error: qError } = await supabase
            .from("view_company_questions")
            .select("question_id, title, difficulty, link, topics, acceptance_rate, frequency")
            .eq("company_slug", slug)
            .order("frequency", { ascending: false });

          if (qError) throw qError;

          return {
            companyName,
            solvedArr,
            questions: questionsData || []
          };
        }, 300000); // 5 minutes TTL

        if (sheetData) {
          setCompanyName(sheetData.companyName);
          setQuestions(sheetData.questions);

          const solvedSet = new Set<number>();
          const timesMap: { [qId: number]: string } = {};
          sheetData.solvedArr.forEach((item: any) => {
            solvedSet.add(item.question_id);
            timesMap[item.question_id] = item["completed-at"] || new Date().toISOString();
          });
          setSolvedIds(solvedSet);
          setSolvedTimestamps(timesMap);
        }
      } catch (err) {
        console.error("Failed to load company sheet detail data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slug, user]);

  useEffect(() => {
    if (typeof window !== "undefined" && companyName && slug) {
      localStorage.setItem("sheetstride-last-company", slug);
      localStorage.setItem("sheetstride-last-company-name", companyName);
    }
  }, [companyName, slug]);

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
        // Delete progress record
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
        console.error("Failed to sync solve status with database:", err);
        // Revert optimistic state
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

  const formatIndex = (idx: number) => {
    const order = idx + 1;
    if (order < 10) return `00${order}`;
    if (order < 100) return `0${order}`;
    return `${order}`;
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

  // Client-side filtering
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.title.toLowerCase().includes(search.toLowerCase()) ||
      (q.topics && q.topics.toLowerCase().includes(search.toLowerCase()));

    const matchesDifficulty =
      selectedDifficulty === "All" ||
      q.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

    return matchesSearch && matchesDifficulty;
  });

  // Calculate metrics
  const totalCount = questions.length;
  const solvedCount = questions.filter((q) => solvedIds.has(q.question_id)).length;
  const percent = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  // Stagger animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04
      }
    }
  };

  const rowReveal = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  if (loading) {
    return (
      <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
        {/* Breadcrumbs */}
        <div className="py-2">
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pt-2">
          <div className="space-y-2">
            <Skeleton className="h-8 w-80 mb-4" />
            <Skeleton className="h-5 w-full max-w-2xl" />
          </div>
          <Skeleton className="h-16 w-36 rounded-xl bg-[#f97316]/10" />
        </div>

        {/* Toolbar Controls */}
        <div className="bg-surface-container-low border border-[#2D2D2D]/60 rounded-xl p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
          <Skeleton className="h-11 w-full lg:w-96 rounded-lg" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>

        {/* Questions Table Grid container */}
        <div className="bg-[#111111] border border-[#2D2D2D] rounded-xl overflow-hidden relative">
          <div className="grid grid-cols-[60px_1fr_120px_100px_100px_120px_60px_60px_80px] gap-4 px-6 py-4 border-b border-[#2D2D2D] bg-[#090909]/50">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-12" />
            ))}
          </div>
          <div className="p-6 space-y-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="grid grid-cols-[60px_1fr_120px_100px_100px_120px_60px_60px_80px] gap-4 py-3 border-b border-outline-variant/10 last:border-0 items-center">
                <Skeleton className="h-3.5 w-6" />
                <Skeleton className="h-4.5 w-48 sm:w-64" />
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-6 w-16 rounded" />
                <Skeleton className="h-5 w-14 rounded bg-[#f97316]/10" />
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

  if (!companyName) {
    return (
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-[#f97316]" />
          <h2 className="font-display-arcade text-[#f97316] uppercase">COMPANY_NOT_FOUND</h2>
          <p className="text-on-surface-variant max-w-sm">The requested company sheet could not be located in our active database.</p>
          <Link href="/questions/company-sheets">
            <button className="px-6 py-2 border border-[#f97316]/55 hover:border-[#f97316] text-[#f97316] hover:bg-[#f97316]/10 font-bold rounded-lg font-mono-label text-sm uppercase">
              Return to Hub
            </button>
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      {/* Breadcrumbs HUD */}
      <Breadcrumbs
        items={[
          { label: "Company Sheets", href: "/questions/company-sheets" },
          { label: companyName }
        ]}
      />

      {/* Page Header */}
      <header className="mb-10 relative pt-2">
        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-[#f97316] rounded" />
        <h1 className="font-display-arcade text-2xl md:text-3xl text-on-surface uppercase tracking-tight mb-4">
          {companyName.toUpperCase()} <span className="text-[#f97316]">SHEET</span>
        </h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant max-w-3xl leading-relaxed">
          Solve the interview coding questions most frequently asked in **{companyName}** technical rounds. Complete this roadmap to boost your chances.
        </p>
      </header>

      {/* Statistics HUD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10 select-none">
        <div className="bg-[#111111] border border-[#2D2D2D] p-6 rounded-xl flex flex-col gap-1 shadow-md">
          <span className="font-mono-label text-mono-label text-outline/60 uppercase">Total Questions</span>
          <span className="font-mono-stats text-mono-stats text-on-surface">{totalCount}</span>
        </div>
        <div className="bg-[#111111] border border-[#2D2D2D] p-6 rounded-xl flex flex-col gap-1 border-l-4 border-l-secondary shadow-md">
          <span className="font-mono-label text-mono-label text-outline/60 uppercase">Solved</span>
          <span className="font-mono-stats text-mono-stats text-secondary">{solvedCount}</span>
        </div>
        <div className="bg-[#111111] border border-[#2D2D2D] p-6 rounded-xl flex flex-col gap-1 border-l-4 border-l-[#f97316]/50 shadow-md">
          <span className="font-mono-label text-mono-label text-outline/60 uppercase">Completion Rate</span>
          <span className="font-mono-stats text-mono-stats text-[#f97316]">{percent}%</span>
        </div>
        <div className="bg-[#111111] border border-[#2D2D2D] p-6 rounded-xl flex flex-col gap-1 shadow-md">
          <span className="font-mono-label text-mono-label text-outline/60 uppercase">Active Mode</span>
          <span className="font-mono-stats text-mono-stats text-primary flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" /> TARGETED
          </span>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="bg-[#111111]/90 border border-[#2D2D2D] rounded-xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4 group-focus-within:text-[#f97316] transition-colors" />
          <input
            type="text"
            className="w-full bg-[#080808] border border-outline-variant/40 rounded-lg py-2.5 pl-10 pr-4 text-on-surface focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30 transition-all font-body-sm text-body-sm"
            placeholder="Search problems or topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="flex gap-4 w-full lg:w-auto justify-end">
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-[#080808] border border-outline-variant/40 rounded-lg py-2 px-4 text-on-surface-variant font-body-sm text-body-sm focus:border-[#f97316] cursor-pointer hover:border-outline-variant transition-colors"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
      </div>

      {/* Questions Table */}
      <div className="bg-[#111111] border border-[#2D2D2D] rounded-xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#090909]/40 border-b border-[#2D2D2D] select-none text-[10px] uppercase font-mono-label text-outline/65">
                <th className="px-6 py-4">#</th>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Primary Topic</th>
                <th className="px-6 py-4">Difficulty</th>
                <th className="px-6 py-4">Frequency</th>
                {user && <th className="px-6 py-4">Solved Date</th>}
                <th className="px-6 py-4">Link</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4 text-right">Track</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2D2D2D]/40">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={user ? 8 : 7} className="text-center py-16 text-outline/60 font-mono-label text-sm uppercase">
                    No questions found matching your filter criteria
                  </td>
                </tr>
              ) : (
                <AnimatePresence mode="popLayout">
                  {filteredQuestions.map((row, idx) => {
                    const solved = solvedIds.has(row.question_id);
                    return (
                      <motion.tr
                        key={row.question_id}
                        variants={rowReveal}
                        initial="hidden"
                        animate="show"
                        exit="hidden"
                        whileHover={{ background: "rgba(249, 115, 22, 0.01)" }}
                        className={cn(
                          "transition-all duration-200",
                          solved && "bg-secondary/[0.015]"
                        )}
                      >
                        {/* Index */}
                        <td className="px-6 py-4.5 font-mono text-[11px] text-outline/50 select-none">
                          {formatIndex(idx)}
                        </td>

                        {/* Title */}
                        <td className="px-6 py-4.5">
                          <button
                            onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                              detail: {
                                questionId: row.question_id,
                                title: row.title,
                                difficulty: row.difficulty,
                                link: row.link,
                                mode: "description"
                              }
                            }))}
                            className={cn(
                              "font-body-lg text-body-md font-semibold tracking-wide transition-colors cursor-pointer text-left",
                              solved ? "text-outline line-through opacity-60" : "text-text hover:text-[#f97316]"
                            )}
                          >
                            {row.title}
                          </button>
                        </td>

                        {/* Topic tag */}
                        <td className="px-6 py-4.5">
                          <span className="font-body-sm text-[11px] text-on-surface-variant bg-surface-container-high/40 px-2 py-0.5 rounded border border-[#2D2D2D] block w-fit truncate max-w-[120px]" title={row.topics}>
                            {row.topics?.split(",")[0] || "Unknown"}
                          </span>
                        </td>

                        {/* Difficulty */}
                        <td className="px-6 py-4.5 select-none">
                          <Badge
                            tone={
                              row.difficulty.toLowerCase() === "easy" ? "secondary" :
                              row.difficulty.toLowerCase() === "medium" ? "tertiary" : "danger"
                            }
                          >
                            {row.difficulty.toUpperCase()}
                          </Badge>
                        </td>

                        {/* Frequency Rating */}
                        <td className="px-6 py-4.5 select-none">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-[#2D2D2D] rounded-full overflow-hidden shrink-0">
                              <div
                                className="h-full bg-[#f97316]"
                                style={{ width: `${Math.min(row.frequency, 100)}%` }}
                              />
                            </div>
                            <span className="font-mono text-[10px] text-[#f97316] font-bold">
                              {row.frequency}%
                            </span>
                          </div>
                        </td>

                        {/* Solved Date (authenticated only) */}
                        {user && (
                          <td className="px-6 py-4.5 font-mono text-[11px] text-outline select-none">
                            {formatSolvedDate(row.question_id)}
                          </td>
                        )}

                        {/* Leetcode Link */}
                        <td className="px-6 py-4.5">
                          <a
                            href={row.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-outline/60 hover:text-[#f97316] transition-colors inline-flex items-center"
                            title="Open LeetCode"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        </td>

                        {/* Notebook Link */}
                        <td className="px-6 py-4.5">
                          {user && (
                            <button
                              onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                                detail: {
                                  questionId: row.question_id,
                                  title: row.title,
                                  difficulty: row.difficulty,
                                  link: row.link,
                                  mode: "notebook"
                                }
                              }))}
                              className="text-outline/60 hover:text-[#f97316] transition-colors inline-flex items-center cursor-pointer"
                              title="Open Notebook"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>

                        {/* Solve Checkbox */}
                        <td className="px-6 py-4.5 text-right">
                          <div className="flex justify-end">
                            {user ? (
                              <button
                                onClick={() => handleToggleSolve(row.question_id, row.title, row.difficulty, row.link)}
                                className={cn(
                                  "w-4 h-4 rounded border flex items-center justify-center transition-all duration-300 cursor-pointer",
                                  solved ? "border-secondary bg-secondary/15 text-secondary scale-110" : "border-outline-variant/60 hover:border-[#f97316] bg-transparent"
                                )}
                              >
                                {solved && <Check className="h-3 w-3" strokeWidth={3} />}
                              </button>
                            ) : (
                              <Link
                                href="/login"
                                className="text-outline/40 hover:text-[#f97316] transition-colors inline-flex items-center gap-1 text-[10px] font-mono tracking-wider"
                                title="Log in to track progress"
                              >
                                <Lock className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 bg-[#111111] border border-[#2D2D2D] border-l-4 border-l-secondary p-4 rounded-xl flex items-center gap-4 shadow-2xl z-50 min-w-[320px] max-w-[400px]"
          >
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0 select-none">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body-xs text-xs font-semibold text-text">Progress Tracker</p>
              <p className="font-mono text-[11px] text-outline/80 truncate" title={toastMessage}>{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="p-1 hover:bg-[#2D2D2D]/30 rounded text-outline hover:text-text cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 py-stack-md mt-16 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-display-arcade text-display-arcade text-[#f97316]">SHEETSTRIDE</span>
          <span className="font-mono-label text-mono-label text-outline uppercase">v2.2.0-STABLE</span>
        </div>
        <div className="flex gap-6 font-mono-label text-outline">
          <a href="#" className="hover:text-primary transition-colors">System Status</a>
          <a href="#" className="hover:text-primary transition-colors">API Docs</a>
          <a href="#" className="hover:text-[#f97316] transition-colors">Changelog</a>
        </div>
      </footer>
    </AppShell>
  );
}
