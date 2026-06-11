"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FolderOpen, Search, ExternalLink, Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

export default function QuestionsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-96 items-center justify-center bg-[#131313] text-primary">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="font-mono-label text-mono-label tracking-[0.2em]">BOOTING_QUESTIONS_MODULE...</p>
        </div>
      </div>
    }>
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
        const { data, error } = await supabase
          .from("user_progress")
          .select("question_id, created_at")
          .eq("user_id", userId);
          
        if (error) throw error;
        
        const ids = new Set<number>();
        const timesMap: { [qId: number]: string } = {};
        
        data?.forEach((item: any) => {
          ids.add(item.question_id);
          timesMap[item.question_id] = item.created_at || new Date().toISOString();
        });

        setSolvedIds(ids);
        setSolvedTimestamps(timesMap);
      } catch (err) {
        console.error("Failed to load user progress:", err);
      }
    }
    fetchUserProgress();
  }, [user]);

  // Fetch questions matching filters and page offset
  useEffect(() => {
    async function fetchQuestions() {
      try {
        setIsLoading(true);
        let query = supabase.from("questions").select("*", { count: "exact" });

        // Apply difficulty filter
        if (selectedDifficulty !== "All" && selectedDifficulty !== "Difficulty") {
          query = query.eq("Difficulty", selectedDifficulty);
        }

        // Apply topic filter
        if (selectedTopic !== "All Topics") {
          query = query.ilike("Topics", `%${selectedTopic}%`);
        }

        // Apply search search
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

        let filteredData = (data as Question[]) || [];
        
        // Handle client-side status filter (since status is computed dynamically via user_progress set)
        if (selectedStatus === "Solved") {
          filteredData = filteredData.filter(q => solvedIds.has(q.ID));
        } else if (selectedStatus === "Unsolved" || selectedStatus === "Todo") {
          filteredData = filteredData.filter(q => !solvedIds.has(q.ID));
        }

        setQuestions(filteredData);
        setTotalCount(count || 0);
      } catch (err) {
        console.error("Failed to load questions list:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchQuestions();
  }, [search, selectedTopic, selectedDifficulty, selectedStatus, page, solvedIds]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, selectedTopic, selectedDifficulty, selectedStatus]);

  // Checkbox toggle logic
  const handleToggleSolve = async (qId: number) => {
    if (!user) return;
    const userId = user.id;

    const isCurrentlySolved = solvedIds.has(qId);
    const newSolvedIds = new Set(solvedIds);
    const newTimestamps = { ...solvedTimestamps };
    
    // Optimistic Update
    if (isCurrentlySolved) {
      newSolvedIds.delete(qId);
      delete newTimestamps[qId];
    } else {
      newSolvedIds.add(qId);
      newTimestamps[qId] = new Date().toISOString();
    }
    setSolvedIds(newSolvedIds);
    setSolvedTimestamps(newTimestamps);

    // Sync localStorage timestamps
    const timestamps = JSON.parse(localStorage.getItem("solved_questions_timestamps") || "{}");

    try {
      if (isCurrentlySolved) {
        // Delete progress
        const { error } = await supabase
          .from("user_progress")
          .delete()
          .match({ user_id: userId, question_id: qId });
        if (error) throw error;

        // Delete from local timestamp
        delete timestamps[qId];
      } else {
        // Insert progress
        const { error } = await supabase
          .from("user_progress")
          .insert({ user_id: userId, question_id: qId });
        if (error) throw error;

        // Save local timestamp
        timestamps[qId] = new Date().toISOString();
      }
      localStorage.setItem("solved_questions_timestamps", JSON.stringify(timestamps));
    } catch (err) {
      console.error("Failed to update question status in Supabase:", err);
      // Revert state if query fails
      setSolvedIds(new Set(solvedIds));
      setSolvedTimestamps(solvedTimestamps);
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
  // const userGlobalRank = Math.max(1, 1500 - globalSolvedCount * 3);

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter" gridBackground>
      {/* Header section with Stats widgets */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6 pt-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Problem Set</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Level up your technical prowess with curated DSA challenges.</p>
        </div>
        
        <div className="flex gap-4 select-none">
          <div className="bg-surface-container p-4 border border-[#2B2B2B] rounded-xl flex flex-col min-w-[120px]">
            <span className="font-mono-label text-mono-label text-outline uppercase mb-1">Solved</span>
            <span className="font-mono-stats text-mono-stats text-secondary">{globalSolvedCount}/{totalCount || 450}</span>
          </div>
        </div>
      </div>

      {/* Toolbar controls and inputs */}
      <div className="bg-surface-container-low border border-[#2B2B2B] rounded-xl p-4 mb-6 flex flex-col lg:flex-row gap-4 items-center">
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
      <div className="bg-surface-container-lowest border border-[#2B2B2B]/40 rounded-xl overflow-hidden shadow-2xl">
        
        {/* Table header row */}
        <div className="grid grid-cols-[48px_1fr_140px_120px_120px_64px] gap-4 px-6 py-4 border-b border-[#2B2B2B] bg-[#1C1C1C]/50 select-none">
          <div className="font-mono-label text-mono-label text-outline uppercase">Stat</div>
          <div className="font-mono-label text-mono-label text-outline uppercase">Title</div>
          <div className="font-mono-label text-mono-label text-outline uppercase">Topic</div>
          <div className="font-mono-label text-mono-label text-outline uppercase">Difficulty</div>
          <div className="font-mono-label text-mono-label text-outline uppercase">Solved_At</div>
          <div className="font-mono-label text-mono-label text-outline uppercase text-center font-bold">Ext</div>
        </div>

        {/* Table rows list */}
        <div className="overflow-y-auto max-h-[600px] custom-scrollbar">
          {isLoading ? (
            <div className="flex h-64 items-center justify-center text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
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
                    whileHover={{ x: 3, background: "linear-gradient(90deg, rgba(178, 210, 255, 0.04) 0%, transparent 100%)" }}
                    className={cn(
                      "grid grid-cols-[48px_1fr_140px_120px_120px_64px] gap-4 px-6 py-4 border-b border-outline-variant/10 items-center transition-all",
                      solved && "bg-secondary/[0.02]"
                    )}
                  >
                    {/* Interactive solve check */}
                    <div className="flex justify-start">
                      <button 
                        onClick={() => handleToggleSolve(row.ID)}
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
                      <a 
                        href={row.Link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={cn(
                          "font-headline-md text-headline-md transition-colors leading-snug",
                          solved ? "text-on-surface-variant line-through opacity-60" : "text-on-surface hover:text-primary"
                        )}
                      >
                        {row.Title}
                      </a>
                    </div>

                    {/* Primary Topic Tag */}
                    <div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant bg-surface-container-high/40 px-2.5 py-1 rounded border border-[#2B2B2B] block w-fit truncate max-w-[120px]">
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

                    {/* External Link */}
                    <div className="flex justify-center text-outline">
                      <a 
                        href={row.Link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-primary transition-colors flex items-center"
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
          <div className="px-6 py-4 bg-[#1C1C1C]/50 border-t border-[#2B2B2B] flex justify-between items-center select-none">
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

      {/* Atmospheric Bento Feature Section */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 select-none">
        <div className="col-span-1 md:col-span-2 bg-[#1C1C1C] p-8 rounded-xl border border-[#2B2B2B] relative overflow-hidden group">
          <div className="relative z-10 space-y-4">
            <h3 className="font-headline-md text-headline-md text-on-surface">Streaks are Back.</h3>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">Solve a problem every day to maintain your multipliers and establish consistency logs.</p>
            <Link href="/profile">
              <button className="mt-4 px-6 py-2.5 border border-primary text-primary rounded-lg font-bold hover:bg-primary hover:text-background transition-all active:scale-95 font-body-sm text-body-sm uppercase tracking-wider">
                View Achievements Road
              </button>
            </Link>
          </div>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-primary/5 blur-[80px] rounded-full group-hover:bg-primary/10 transition-all duration-700 pointer-events-none"></div>
        </div>
        
        <div className="bg-[#1C1C1C] p-8 rounded-xl border border-[#2B2B2B] flex flex-col justify-center items-center text-center">
          <span className="material-symbols-outlined text-[48px] text-tertiary mb-4">tips_and_updates</span>
          <h3 className="font-headline-md text-headline-md text-on-surface">Daily Motivation</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-2 leading-relaxed">
            "Consistency beats intensity. Mastering complex algorithmic patterns is a marathon, not a sprint. Stride forward!"
          </p>
        </div>
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
