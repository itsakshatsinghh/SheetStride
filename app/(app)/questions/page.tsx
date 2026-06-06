"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Plus, Search, ExternalLink, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Topbar } from "@/components/app/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";

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
  const { user } = useAuth();
  
  // Filter states
  const [search, setSearch] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("All Topics");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  
  // Questions and loading states
  const [questions, setQuestions] = useState<Question[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 50;

  // Fetch solved question IDs once for this user
  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    async function fetchUserProgress() {
      try {
        const { data, error } = await supabase
          .from("user_progress")
          .select("question_id")
          .eq("user_id", userId);
          
        if (error) throw error;
        setSolvedIds(new Set(data?.map((item) => item.question_id) || []));
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
        if (selectedDifficulty !== "All") {
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
        } else if (selectedStatus === "Unsolved") {
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
    
    // Optimistic Update
    if (isCurrentlySolved) {
      newSolvedIds.delete(qId);
    } else {
      newSolvedIds.add(qId);
    }
    setSolvedIds(newSolvedIds);

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
      const reverted = new Set(solvedIds);
      setSolvedIds(reverted);
    }
  };

  // Group current page questions by their primary topic (first word in Topics list)
  const groupQuestionsByTopic = () => {
    const groups: { [key: string]: Question[] } = {};
    
    questions.forEach((q) => {
      let primaryTopic = "MISCELLANEOUS";
      if (q.Topics) {
        const firstTopic = q.Topics.split(",")[0].trim().toUpperCase();
        if (firstTopic) primaryTopic = firstTopic;
      }
      if (!groups[primaryTopic]) {
        groups[primaryTopic] = [];
      }
      groups[primaryTopic].push(q);
    });
    
    return groups;
  };

  const questionGroups = groupQuestionsByTopic();
  const totalPages = Math.ceil(totalCount / limit) || 1;

  return (
    <AppShell
      className="px-0 pt-0 lg:px-0"
      topbar={
        <Topbar 
          searchValue={search} 
          onSearchChange={setSearch} 
          searchPlaceholder="Search questions by title..." 
          userAvatarUrl={user?.user_metadata?.avatar_url}
        />
      }
    >
      <div className="max-w-shell mx-auto pb-12 pt-24 lg:pt-24">
        
        {/* Filtering deck */}
        <section className="mb-8 flex flex-wrap items-center justify-between gap-6 px-6">
          <div className="flex flex-wrap gap-4 items-center">
            
            {/* Topic Filter */}
            <div className="flex items-center border border-outline bg-surface-dim px-3 py-1 text-label-caps uppercase text-primary">
              <span className="text-muted mr-2">TOPIC:</span>
              <select
                className="bg-transparent text-text outline-none cursor-pointer font-bold font-body"
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
              >
                {TOPICS.map(t => (
                  <option key={t} value={t} className="bg-surface">{t}</option>
                ))}
              </select>
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center border border-outline bg-surface-dim px-3 py-1 text-label-caps uppercase text-primary">
              <span className="text-muted mr-2">DIFFICULTY:</span>
              <select
                className="bg-transparent text-text outline-none cursor-pointer font-bold font-body"
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
              >
                {DIFFICULTIES.map(d => (
                  <option key={d} value={d} className="bg-surface">{d}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center border border-outline bg-surface-dim px-3 py-1 text-label-caps uppercase text-primary">
              <span className="text-muted mr-2">STATUS:</span>
              <select
                className="bg-transparent text-text outline-none cursor-pointer font-bold font-body"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s} className="bg-surface">{s}</option>
                ))}
              </select>
            </div>
            
          </div>
          
          <div className="font-data text-data-md text-primary bg-primary/10 border border-primary/20 px-4 py-2">
            CLUSTER_MATCHES: {totalCount}
          </div>
        </section>

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-primary">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="font-display text-label-caps tracking-[0.2em]">FETCHING_RECORDS...</p>
            </div>
          </div>
        ) : Object.keys(questionGroups).length === 0 ? (
          <div className="px-6">
            <Card className="flex flex-col items-center justify-center bg-[#1d2022] px-8 py-20 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center border border-outline bg-surface-dim">
                <FolderOpen className="h-8 w-8 text-outline" strokeWidth={1.6} />
              </div>
              <p className="font-display text-headline-sm text-text">NO_RECORDS_FOUND</p>
              <p className="mt-2 text-body-lg text-muted">Try adjusting your filters or search query.</p>
            </Card>
          </div>
        ) : (
          <div className="space-y-14 px-6">
            {Object.entries(questionGroups).map(([topic, rows]) => {
              const solvedInGroup = rows.filter(r => solvedIds.has(r.ID)).length;
              return (
                <section key={topic}>
                  <div className="mb-5 flex items-center gap-4">
                    <h2 className="font-display text-headline-sm text-secondary">
                      {topic}
                    </h2>
                    <div className="h-px flex-1 bg-outline/30" />
                    <span className="font-data text-data-md text-muted">
                      SOLVED: {solvedInGroup}/{rows.length}
                    </span>
                  </div>

                  <Card className="overflow-hidden bg-[#1d2022]">
                    <div className="grid grid-cols-[48px_1fr_120px_180px_48px] border-b border-outline bg-surface-dim px-4 py-4 text-label-caps text-muted">
                      <div />
                      <div>NAME</div>
                      <div>DIFFICULTY</div>
                      <div>TOPICS</div>
                      <div />
                    </div>
                    <div>
                      {rows.map((row) => (
                        <div
                          key={row.ID}
                          className="grid grid-cols-[48px_1fr_120px_180px_48px] items-center border-b border-outline/30 px-4 py-5 hover:bg-[#282A2C] transition-colors"
                        >
                          <div className="flex justify-center">
                            <Checkbox
                              checked={solvedIds.has(row.ID)}
                              onCheckedChange={() => handleToggleSolve(row.ID)}
                            />
                          </div>
                          <div className={`text-body-lg font-bold leading-normal ${solvedIds.has(row.ID) ? "text-muted line-through" : "text-text"}`}>
                            {row.Title}
                          </div>
                          <div>
                            <Badge
                              tone={
                                row.Difficulty.toLowerCase() === "easy"
                                  ? "secondary"
                                  : row.Difficulty.toLowerCase() === "medium"
                                    ? "tertiary"
                                    : "danger"
                              }
                            >
                              {row.Difficulty.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="truncate pr-4">
                            <span className="text-body-md text-muted truncate block">
                              {row.Topics}
                            </span>
                          </div>
                          <div className="flex justify-end text-muted">
                            <a
                              href={row.Link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-primary transition-colors"
                              title="Open in LeetCode"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </section>
              );
            })}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-outline bg-surface p-4 mt-8">
                <span className="text-label-caps text-muted">
                  PAGE {page} OF {totalPages}
                </span>
                <div className="flex gap-4">
                  <Button
                    variant="default"
                    className="gap-2 border-outline hover:bg-surface-dim disabled:opacity-30"
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(p - 1, 1))}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    PREV_CLUSTER
                  </Button>
                  <Button
                    variant="default"
                    className="gap-2 border-outline hover:bg-surface-dim disabled:opacity-30"
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  >
                    NEXT_CLUSTER
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <footer className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-outline bg-surface py-6 px-6 md:flex-row">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-secondary" />
              <span className="text-label-caps text-muted">SYSTEM ONLINE</span>
            </div>
            <span className="text-label-caps text-muted">LAST SYNC: JUST NOW</span>
          </div>
          <span className="text-label-caps text-muted">SHEETSTRIDE QUESTION ENGINE V3.0.0</span>
        </footer>

        <div className="pointer-events-none fixed bottom-10 right-10 hidden rotate-90 font-data text-data-lg text-primary opacity-10 xl:block">
          EXECUTE_SUCCESS
        </div>
      </div>
    </AppShell>
  );
}
