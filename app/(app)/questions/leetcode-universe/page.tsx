"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Search, ExternalLink, Loader2, ChevronLeft, ChevronRight, Check, BookOpen } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { cn, fetchWithCache } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const TOPICS = [
  "All Topics",
  "Array",
  "String",
  "Hash Table",
  "Dynamic Programming",
  "Tree",
  "Graph",
  "Sorting",
  "Binary Search",
  "Linked List",
  "Backtracking",
  "Math",
  "Recursion",
  "Two Pointers",
  "Sliding Window"
];

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];
const STATUSES = ["All", "Solved", "Unsolved"];

interface Question {
  ID: number;
  Title: string;
  Difficulty: string;
  Link: string;
  Topics: string;
  "Acceptance Rate (%)"?: number;
  "Similar Questions"?: any;
}

function LeetcodeUniverseSkeleton() {
  return (
    <AppShell className="max-w-container-max mx-auto px-gutter" gridBackground>
      {/* Breadcrumbs */}
      <div className="py-2">
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6 pt-2">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
        <Skeleton className="h-16 w-32 rounded-xl" />
      </div>

      {/* Toolbar controls */}
      <div className="bg-[#111111]/40 border border-[#2D2D2D] rounded-xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <Skeleton className="h-10 w-full lg:w-96 rounded-lg" />
        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-24 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg ml-auto lg:ml-0" />
        </div>
      </div>

      {/* Table grid outline */}
      <div className="bg-[#111111]/20 border border-[#2D2D2D]/60 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[48px_1fr_140px_120px_120px_96px] gap-4 px-6 py-4 border-b border-[#2D2D2D] bg-[#090909]/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-16" />
          ))}
        </div>
        {/* Table rows */}
        <div className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="grid grid-cols-[48px_1fr_140px_120px_120px_96px] gap-4 py-3 border-b border-outline-variant/10 last:border-0 items-center">
              <Skeleton className="w-5 h-5 rounded" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-4 w-48 sm:w-64" />
              </div>
              <Skeleton className="h-7 w-20 rounded" />
              <Skeleton className="h-6 w-16 rounded" />
              <Skeleton className="h-3.5 w-16" />
              <div className="flex justify-center gap-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

export default function LeetcodeUniversePage() {
  return (
    <Suspense fallback={<LeetcodeUniverseSkeleton />}>
      <QuestionsList />
    </Suspense>
  );
}

function QuestionsList() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const topicParam = searchParams.get("topic");
  
  // Filter states
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState(topicParam || "All Topics");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Sync URL query params to state
  useEffect(() => {
    if (topicParam) {
      setSelectedTopic(topicParam);
    }
  }, [topicParam]);
  
  // Questions and loading states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [solvedTimestamps, setSolvedTimestamps] = useState<{ [qId: number]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  // Fetch solved question IDs and timestamps once for this user
  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    async function fetchUserProgress() {
      try {
        const cacheKey = `user_solves_cache_${userId}`;
        const data = await fetchWithCache(cacheKey, async () => {
          const { data: rawData, error } = await supabase
            .from("user_progress")
            .select("question_id, completed-at")
            .eq("user_id", userId);
            
          if (error) throw error;
          return rawData || [];
        });

        const ids = new Set<number>();
        const timesMap: { [qId: number]: string } = {};
        
        data.forEach((item: any) => {
          ids.add(item.question_id);
          timesMap[item.question_id] = item["completed-at"] || new Date().toISOString();
        });

        setSolvedIds(ids);
        setSolvedTimestamps(timesMap);
      } catch (err) {
        console.error("Failed to load user progress:", err);
      }
    }
    fetchUserProgress();

    const handleSolveEvent = () => {
      localStorage.removeItem(`user_solves_cache_${userId}`);
      fetchUserProgress();
    };

    window.addEventListener("question-solved", handleSolveEvent);
    return () => {
      window.removeEventListener("question-solved", handleSolveEvent);
    };
  }, [user]);

  // Fetch questions matching filters and page offset
  useEffect(() => {
    async function fetchQuestions() {
      if (!user) return;
      const userId = user.id;

      try {
        setIsLoading(true);
        
        const safeSearch = encodeURIComponent(search.trim());
        const cacheKey = `leetcode_universe_questions_cache_${userId}_${page}_${selectedDifficulty}_${selectedTopic}_${selectedStatus}_${safeSearch}`;

        const dataResult = await fetchWithCache(cacheKey, async () => {
          let query = supabase
            .from("questions")
            .select("*", { count: "exact" });

          if (selectedStatus === "Solved") {
            const solvedArr = Array.from(solvedIds);
            if (solvedArr.length > 0) {
              query = query.in("ID", solvedArr);
            } else {
              query = query.eq("ID", -1); // Force empty result if none solved
            }
          } else if (selectedStatus === "Unsolved" || selectedStatus === "Todo") {
            const solvedArr = Array.from(solvedIds);
            if (solvedArr.length > 0) {
              query = query.not("ID", "in", `(${solvedArr.join(",")})`);
            }
          }

          // Apply difficulty filter
          if (selectedDifficulty !== "All" && selectedDifficulty !== "Difficulty") {
            query = query.eq("Difficulty", selectedDifficulty);
          }

          // Apply topic filter
          if (selectedTopic !== "All Topics") {
            query = query.ilike("Topics", `%${selectedTopic}%`);
          }

          // Apply search filter
          if (search.trim()) {
            query = query.ilike("Title", `%${search.trim()}%`);
          }

          // Handle page offset
          const fromOffset = (page - 1) * limit;
          const toOffset = fromOffset + limit - 1;
          
          const { data, count, error } = await query
            .order("ID", { ascending: true })
            .range(fromOffset, toOffset);

          if (error) throw error;

          return {
            questions: (data as Question[]) || [],
            totalCount: count || 0
          };
        });

        setQuestions(dataResult.questions);
        setTotalCount(dataResult.totalCount);
      } catch (err) {
        console.error("Failed to load questions list:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();
  }, [search, selectedTopic, selectedDifficulty, selectedStatus, page, user, solvedIds]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedTopic, selectedDifficulty, selectedStatus]);

  // Checkbox toggle logic
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

      // Sync localStorage timestamps
      const timestamps = JSON.parse(localStorage.getItem("solved_questions_timestamps") || "{}");

      try {
        // Delete progress
        const { error } = await supabase
          .from("user_progress")
          .delete()
          .match({ user_id: userId, question_id: qId });
        if (error) throw error;

        // Delete from local timestamp
        delete timestamps[qId];
        localStorage.setItem("solved_questions_timestamps", JSON.stringify(timestamps));
        
        // Dispatch solve event to trigger heatmap update
        window.dispatchEvent(new Event("question-solved"));
      } catch (err) {
        console.error("Failed to update question status in Supabase:", err);
        // Revert state if query fails
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

  const handlePickRandom = () => {
    const unsolved = questions.filter(q => !solvedIds.has(q.ID));
    if (unsolved.length > 0) {
      const randomQ = unsolved[Math.floor(Math.random() * unsolved.length)];
      window.open(randomQ.Link, "_blank", "noopener,noreferrer");
    } else if (questions.length > 0) {
      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      window.open(randomQ.Link, "_blank", "noopener,noreferrer");
    }
  };

  // Helper to format relative dates
  const getRelativeTime = (qId: number) => {
    const isoStr = solvedTimestamps[qId];
    if (!isoStr) return "Never";
    if (isoStr.startsWith("1970-01-01")) return "PREMIUM";
    
    const diff = new Date().getTime() - new Date(isoStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 6000);
    const days = Math.floor(hours / 24);

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const totalPages = Math.ceil(totalCount / limit) || 1;
  const globalSolvedCount = solvedIds.size;

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter" gridBackground>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "LeetCode Universe" }]} />

      {/* Header section with Stats widgets */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6 pt-2">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">LeetCode Universe</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Access the full algorithmic database with search and company tags.</p>
        </div>
        
        <div className="flex gap-4 select-none">
          <div className="bg-surface-container p-4 border border-[#2D2D2D] rounded-xl flex flex-col min-w-[120px]">
            <span className="font-mono-label text-mono-label text-outline uppercase mb-1">Solved</span>
            <span className="font-mono-stats text-mono-stats text-secondary">{globalSolvedCount}/{totalCount || 3647}</span>
          </div>
        </div>
      </div>

      {/* Toolbar controls and inputs */}
      <div className="bg-surface-container-low border border-[#2D2D2D] rounded-xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4 group-focus-within:text-primary transition-colors" />
          <input 
            type="text"
            className="w-full bg-[#080808] border border-outline-variant/50 rounded-lg py-2 pl-10 pr-4 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all font-body-sm text-body-sm"
            placeholder="Search problems by name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full lg:w-auto">
          {/* Topic Select */}
          <select 
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="bg-[#080808] border border-outline-variant/50 rounded-lg py-2 px-4 text-on-surface-variant font-body-sm text-body-sm focus:border-primary cursor-pointer hover:border-outline-variant transition-colors"
          >
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>

          {/* Difficulty Select */}
          <select 
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-[#080808] border border-outline-variant/50 rounded-lg py-2 px-4 text-on-surface-variant font-body-sm text-body-sm focus:border-primary cursor-pointer"
          >
            <option value="All">Difficulty</option>
            {DIFFICULTIES.slice(1).map((diff) => (
              <option key={diff} value={diff}>{diff}</option>
            ))}
          </select>

          {/* Status Select */}
          <select 
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-[#080808] border border-outline-variant/50 rounded-lg py-2 px-4 text-on-surface-variant font-body-sm text-body-sm focus:border-primary cursor-pointer"
          >
            <option value="All">Status</option>
            {STATUSES.slice(1).map((stat) => (
              <option key={stat} value={stat}>{stat}</option>
            ))}
          </select>

          <button 
            onClick={handlePickRandom}
            className="ml-auto lg:ml-0 flex items-center gap-2 bg-primary text-background px-4 py-2 rounded-lg font-body-sm text-body-sm font-bold active:scale-95 transition-all shadow-lg shadow-primary/10"
          >
            <span className="material-symbols-outlined text-[18px]">shuffle</span>
            Pick Random
          </button>
        </div>
      </div>

      {/* Tabular Question List Grid */}
      <div className="bg-surface-container-lowest border border-[#2D2D2D]/60 rounded-xl overflow-hidden shadow-2xl">
        
        {/* Table header row */}
        <div className="grid grid-cols-[48px_1fr_140px_120px_120px_96px] gap-4 px-6 py-4 border-b border-[#2D2D2D] bg-[#090909]/50 select-none">
          <div className="font-mono-label text-mono-label text-outline uppercase">Stat</div>
          <div className="font-mono-label text-mono-label text-outline uppercase">Title</div>
          <div className="font-mono-label text-mono-label text-outline uppercase">Topic</div>
          <div className="font-mono-label text-mono-label text-outline uppercase">Difficulty</div>
          <div className="font-mono-label text-mono-label text-outline uppercase">Solved_At</div>
          <div className="font-mono-label text-mono-label text-outline uppercase text-center font-bold">Action</div>
        </div>

        {/* Table rows list */}
        <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {Array.from({ length: 8 }).map((_, idx) => (
                <div key={idx} className="grid grid-cols-[48px_1fr_140px_120px_120px_96px] gap-4 py-3 border-b border-outline-variant/10 last:border-0 items-center">
                  <Skeleton className="w-5 h-5 rounded" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-4 w-48 sm:w-64" />
                  </div>
                  <Skeleton className="h-7 w-20 rounded" />
                  <Skeleton className="h-6 w-16 rounded" />
                  <Skeleton className="h-3.5 w-16" />
                  <div className="flex justify-center gap-3">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <FolderOpen className="w-12 h-12 text-outline-variant" />
              <p className="font-mono-label text-mono-label text-outline">NO_DSA_RECORDS_MATCH_CRITERIA</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {questions.map((row) => {
                const solved = solvedIds.has(row.ID);
                return (
                  <motion.div 
                    key={row.ID}
                    whileHover={{ x: 3, background: "linear-gradient(90deg, rgba(255, 212, 0, 0.04) 0%, transparent 100%)" }}
                    className={cn(
                       "grid grid-cols-[48px_1fr_140px_120px_120px_96px] gap-4 px-6 py-4 border-b border-outline-variant/10 items-center transition-all",
                      solved && "bg-secondary/[0.02]"
                    )}
                  >
                    {/* Interactive solve check */}
                    <div className="flex justify-start">
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

                    {/* Question Meta & Title */}
                    <div className="flex items-center gap-3">
                      <span className="font-mono-label text-mono-label text-outline-variant select-none">#{row.ID}</span>
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
                    </div>

                    {/* Primary Topic Tag */}
                    <div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-high/40 px-2.5 py-1 rounded border border-[#2D2D2D] block w-fit truncate max-w-[120px]">
                        {row.Topics?.split(",")[0] || "Unknown"}
                      </span>
                    </div>

                    {/* Difficulty badge */}
                    <div>
                      <Badge 
                        tone={
                          row.Difficulty.toLowerCase() === "easy" ? "secondary" : 
                          row.Difficulty.toLowerCase() === "medium" ? "tertiary" : "danger"
                        }
                      >
                        {row.Difficulty.toUpperCase()}
                      </Badge>
                    </div>

                    {/* Solved timestamp */}
                    <div className="font-mono-label text-mono-label text-outline select-none">
                      {getRelativeTime(row.ID)}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center gap-3 text-outline">
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
                        className="hover:text-primary transition-colors cursor-pointer"
                        title="Open Notebook"
                      >
                        <BookOpen className="w-4 h-4" />
                      </button>
                      <a 
                        href={row.Link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors"
                        title="Open LeetCode"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>

        {/* Tabular pagination row */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-[#090909]/50 border-t border-[#2D2D2D] flex justify-between items-center select-none">
            <span className="font-mono-label text-mono-label text-outline">
              Page {page} of {totalPages} (Matching: {totalCount})
            </span>
            <div className="flex gap-2">
              <button 
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                className="w-8 h-8 flex items-center justify-center border border-outline-variant/30 rounded hover:bg-surface-variant/30 text-outline transition-colors active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button className="h-8 px-3 flex items-center justify-center bg-primary text-background rounded font-mono-label text-mono-label font-bold">
                {page}
              </button>
              <button 
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                className="w-8 h-8 flex items-center justify-center border border-outline-variant/30 rounded hover:bg-surface-variant/30 text-outline transition-colors active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer info footnote */}
      <footer className="border-t border-outline-variant/20 py-stack-md mt-12 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 text-xs">
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
