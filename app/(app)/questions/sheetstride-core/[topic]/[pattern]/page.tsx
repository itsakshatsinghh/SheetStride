"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ExternalLink, Check, Play, Info, Lightbulb, AlertCircle, X } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { cn } from "@/lib/utils";

const TOPIC_SLUGS: { [key: string]: string } = {
  "two-pointer-patterns": "I. Two Pointer Patterns",
  "sliding-window-patterns": "II. Sliding Window Patterns",
  "tree-traversal-patterns": "III. Tree Traversal Patterns (DFS & BFS)",
  "graph-traversal-patterns": "IV. Graph Traversal Patterns (DFS & BFS)",
  "dynamic-programming-patterns": "V. Dynamic Programming (DP) Patterns",
  "heap-patterns": "VI. Heap (Priority Queue) Patterns",
  "backtracking-patterns": "VII. Backtracking Patterns",
  "greedy-patterns": "VIII. Greedy Patterns",
  "binary-search-patterns": "IX. Binary Search Patterns",
  "stack-patterns": "X. Stack Patterns",
  "bit-manipulation-patterns": "XI. Bit Manipulation Patterns",
  "linked-list-patterns": "XII. Linked List Manipulation Patterns",
  "array-matrix-patterns": "XIII. Array/Matrix Manipulation Patterns",
  "string-manipulation-patterns": "XIV. String Manipulation Patterns",
  "design-patterns": "XV. Design Patterns"
};

const TOPIC_DISPLAY_NAMES: { [key: string]: string } = {
  "two-pointer-patterns": "Two Pointer Patterns",
  "sliding-window-patterns": "Sliding Window Patterns",
  "tree-traversal-patterns": "Tree Traversal Patterns",
  "graph-traversal-patterns": "Graph Traversal Patterns",
  "dynamic-programming-patterns": "Dynamic Programming Patterns",
  "heap-patterns": "Heap Patterns",
  "backtracking-patterns": "Backtracking Patterns",
  "greedy-patterns": "Greedy Patterns",
  "binary-search-patterns": "Binary Search Patterns",
  "stack-patterns": "Stack Patterns",
  "bit-manipulation-patterns": "Bit Manipulation Patterns",
  "linked-list-patterns": "Linked List Patterns",
  "array-matrix-patterns": "Array / Matrix Patterns",
  "string-manipulation-patterns": "String Manipulation Patterns",
  "design-patterns": "Design Patterns"
};

function slugifyPattern(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s&-]/g, "")
    .replace(/&/g, "and")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface Question {
  ID: number;
  Title: string;
  Difficulty: string;
  Link: string;
  Topics: string;
  "Acceptance Rate (%)"?: number;
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
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [solvedTimestamps, setSolvedTimestamps] = useState<{ [qId: number]: string }>({});
  
  // Toast notification state
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationStep, setSimulationStep] = useState(0);

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

        // 1. Fetch user's solved question IDs
        const { data: userSolves, error: solvesError } = await supabase
          .from("user_progress")
          .select("question_id, completed-at")
          .eq("user_id", userId);

        if (solvesError) throw solvesError;
        
        const ids = new Set<number>();
        const timesMap: { [qId: number]: string } = {};
        
        userSolves?.forEach((item: any) => {
          ids.add(item.question_id);
          timesMap[item.question_id] = item["completed-at"] || new Date().toISOString();
        });

        setSolvedIds(ids);
        setSolvedTimestamps(timesMap);

        // 2. Fetch sheet questions mapped under this topic
        const { data: qData, error: qError } = await supabase
          .from("sheet_questions")
          .select(`
            Sheet_order,
            question_id: "question ID",
            question_name: "question name",
            Pattern_name: "Pattern name",
            questions (
              ID,
              Title,
              Difficulty,
              Link,
              Topics,
              "Acceptance Rate (%)"
            )
          `)
          .eq("topic name", dbName);

        if (qError) throw qError;

        // Group sheet questions by their pattern slug
        const matched = qData?.filter((row: any) => {
          return slugifyPattern(row.Pattern_name || "") === patternSlug;
        });

        if (matched && matched.length > 0) {
          setDbPatternName(matched[0].Pattern_name);
          const mappedQList = matched
            .map((row: any) => row.questions)
            .filter(Boolean) as Question[];
          
          // Sort by ID ascending
          mappedQList.sort((a, b) => a.ID - b.ID);
          setQuestions(mappedQList);
        } else {
          setQuestions([]);
        }

      } catch (err) {
        console.error("Failed to load question explorer data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadQuestionsData();
  }, [topicSlug, patternSlug, user]);

  const handleToggleSolve = async (qId: number, title: string) => {
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

    const timestamps = JSON.parse(localStorage.getItem("solved_questions_timestamps") || "{}");

    try {
      if (isCurrentlySolved) {
        // Delete progress
        const { error } = await supabase
          .from("user_progress")
          .delete()
          .match({ user_id: userId, question_id: qId });
        if (error) throw error;

        delete timestamps[qId];
        triggerToast(`"${title}" marked as incomplete.`);
      } else {
        // Insert progress
        const { error } = await supabase
          .from("user_progress")
          .insert({
            user_id: userId,
            question_id: qId,
            completed: true,
            "completed-at": new Date().toISOString()
          });
        if (error) throw error;

        timestamps[qId] = new Date().toISOString();
        triggerToast(`"${title}" solved! Progress updated.`);
      }
      localStorage.setItem("solved_questions_timestamps", JSON.stringify(timestamps));
      
      // Dispatch solve event to trigger heatmap updates
      window.dispatchEvent(new Event("question-solved"));
    } catch (err) {
      console.error("Failed to update solve state:", err);
      // Revert optimistic update
      setSolvedIds(new Set(solvedIds));
      setSolvedTimestamps(solvedTimestamps);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(0);
    
    const interval = setInterval(() => {
      setSimulationStep(prev => {
        if (prev >= 4) {
          clearInterval(interval);
          setIsSimulating(false);
          return 4;
        }
        return prev + 1;
      });
    }, 1200);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[70vh] items-center justify-center bg-[#131313] text-primary">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="font-mono-label text-mono-label tracking-[0.2em]">BOOTING_SOLUTIONS_MATRIX...</p>
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
        <div className="bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl flex flex-col gap-1 shadow-md">
          <span className="font-mono-label text-mono-label text-outline uppercase">Total Exercises</span>
          <span className="font-mono-stats text-mono-stats text-on-surface">{totalCount < 10 ? `0${totalCount}` : totalCount}</span>
        </div>
        <div className="bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl flex flex-col gap-1 border-l-4 border-l-secondary shadow-md">
          <span className="font-mono-label text-mono-label text-outline uppercase">Completed</span>
          <span className="font-mono-stats text-mono-stats text-secondary">{solvedCount < 10 ? `0${solvedCount}` : solvedCount}</span>
        </div>
        <div className="bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl flex flex-col gap-1 shadow-md">
          <span className="font-mono-label text-mono-label text-outline uppercase">Completion Rate</span>
          <span className="font-mono-stats text-mono-stats text-on-surface">{percent}%</span>
        </div>
        <div className="bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl flex flex-col gap-1 border-l-4 border-l-tertiary shadow-md">
          <span className="font-mono-label text-mono-label text-outline uppercase">Next Milestone</span>
          <span className="font-mono-stats text-mono-stats text-tertiary truncate block max-w-full" title={nextMilestone}>
            {nextMilestone}
          </span>
        </div>
      </div>

      {/* Question Table Grid container */}
      <div className="bg-[#1C1C1C] border border-[#2B2B2B] rounded-xl overflow-hidden shadow-2xl relative">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1C1C1C]/50 border-b border-[#2B2B2B] select-none">
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">#</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Title</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Difficulty</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Status</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Solved Date</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase">Link</th>
                <th className="px-6 py-4 font-mono-label text-mono-label text-outline uppercase text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2B2B2B]/40">
              <AnimatePresence mode="popLayout">
                {questions.map((row) => {
                  const solved = solvedIds.has(row.ID);
                  return (
                    <motion.tr 
                      key={row.ID}
                      whileHover={{ background: "rgba(178, 210, 255, 0.02)" }}
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
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </td>

                      {/* Checkbox action */}
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleToggleSolve(row.ID, row.Title)}
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

      {/* Pattern details / complexity analysis bento grid */}
      <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6 select-none">
        {/* Efficiency Analysis */}
        <div className="lg:col-span-2 bg-[#1C1C1C] border border-[#2B2B2B] rounded-xl p-8 border-l-4 border-l-primary flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-6">
            <Lightbulb className="w-5 h-5 text-primary" />
            <h3 className="font-headline-md text-headline-md text-on-surface">Efficiency Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="font-mono-label text-mono-label text-outline uppercase mb-2">Time Complexity</p>
              <p className="font-body-lg text-body-lg text-on-surface mb-4">
                O(N) for linear pass pointers, O(N log N) if elements require sorting.
              </p>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-secondary h-full" style={{ width: "85%" }} />
              </div>
            </div>
            <div>
              <p className="font-mono-label text-mono-label text-outline uppercase mb-2">Space Complexity</p>
              <p className="font-body-lg text-body-lg text-on-surface mb-4">
                O(1) auxiliary space, keeping variable declarations static.
              </p>
              <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden">
                <div className="bg-primary h-full" style={{ width: "95%" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Algorithm Visualizer mockup */}
        <div className="bg-[#1C1C1C] border border-[#2B2B2B] rounded-xl p-8 relative overflow-hidden group">
          <h3 className="font-headline-md text-headline-md text-on-surface mb-4">Algorithm Visualizer</h3>
          
          <div className="aspect-video bg-[#0E0E0E] rounded-lg border border-[#2B2B2B] flex flex-col items-center justify-center mb-4 relative overflow-hidden">
            
            {/* Visualizer animation nodes */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between items-center px-8">
              {/* Left pointer node */}
              <motion.div 
                animate={isSimulating ? { x: [0, 40, 70, 70, 0] } : {}}
                transition={{ duration: 4 }}
                className={cn(
                  "w-8 h-8 rounded-full border border-primary flex items-center justify-center font-mono-label text-[10px] text-primary font-bold shadow-lg",
                  isSimulating && "bg-primary/10 shadow-primary/40"
                )}
              >
                P1
              </motion.div>

              {/* Dotted bridge */}
              <div className="flex-1 border-t border-dashed border-outline-variant/40 mx-4 h-0" />

              {/* Right pointer node */}
              <motion.div 
                animate={isSimulating ? { x: [0, -40, -70, -70, 0] } : {}}
                transition={{ duration: 4 }}
                className={cn(
                  "w-8 h-8 rounded-full border border-secondary flex items-center justify-center font-mono-label text-[10px] text-secondary font-bold shadow-lg",
                  isSimulating && "bg-secondary/10 shadow-secondary/40"
                )}
              >
                P2
              </motion.div>
            </div>

            <span className="font-mono-label text-outline uppercase text-[10px] absolute bottom-3 select-none">
              {isSimulating ? `RUNNING SIMULATION (STEP ${simulationStep}/4)...` : "CLICK RUN TO INITIALIZE"}
            </span>
          </div>

          <button 
            disabled={isSimulating}
            onClick={runSimulation}
            className={cn(
              "w-full py-3 bg-primary text-background font-bold rounded-lg transition-all flex items-center justify-center gap-2",
              isSimulating ? "opacity-40 cursor-not-allowed" : "hover:bg-primary-container active:scale-[0.98]"
            )}
          >
            <Play className="w-4 h-4 fill-current" />
            RUN SIMULATION
          </button>
        </div>
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 bg-[#1C1C1C] border border-[#2B2B2B] border-l-4 border-l-secondary p-4 rounded-xl flex items-center gap-4 shadow-2xl z-50 min-w-[320px] max-w-[400px]"
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
