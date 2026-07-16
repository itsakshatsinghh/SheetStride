"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ExternalLink, Loader2, BookOpen, History, Sparkles, 
  Clock, AlertTriangle, CheckCircle2, ChevronRight, Save, Play, RefreshCw, ArrowLeft, Lock,
  Plus, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronUp, PlayCircle, PauseCircle, SkipForward
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { cn, fetchWithCache } from "@/lib/utils";
import { slugifyPattern } from "@/lib/slugs";

interface ConstructionStep {
  title: string;
  reason: string;
}

interface SolutionBlueprint {
  understanding: {
    input: string;
    output: string;
    keyObservation: string;
    hiddenTrick: string;
  };
  selection: {
    patternUsed: string;
    whyPattern: string;
    alternatives: string[];
  };
  construction_steps: ConstructionStep[];
  complexities: {
    timeComplexity: string;
    timeWhy: string;
    spaceComplexity: string;
    spaceWhy: string;
  };
  reflection: {
    biggestMistake: string;
    futureReminder: string;
    interviewExplanation: string;
  };
}

const COMPLEXITY_OPTIONS = ["O(1)", "O(log N)", "O(N)", "O(N log N)", "O(N^2)", "O(2^N)"];

const PATTERN_TEMPLATES: Record<string, ConstructionStep[]> = {
  "sliding-window": [
    { title: "Initialize Window", reason: "Set left = 0, right = 0 pointer bounds." },
    { title: "Expand Window", reason: "Advance right pointer to include next element." },
    { title: "Check Invariant", reason: "Verify window state satisfies constraint." },
    { title: "Shrink Window", reason: "Contract left pointer while constraint is violated." },
    { title: "Update Result", reason: "Record optimal window size or count." }
  ],
  "tree-bfs": [
    { title: "Initialize Queue", reason: "Push root node to queue to start BFS." },
    { title: "Level Loop", reason: "Loop while queue is not empty." },
    { title: "Visit Node", reason: "Process current node values." },
    { title: "Push Children", reason: "Add child nodes to queue for next level." },
    { title: "Return", reason: "Return final answer." }
  ],
  "dynamic-programming": [
    { title: "Define DP State", reason: "dp[i] represents optimal result at index i." },
    { title: "Base Cases", reason: "Set default boundary conditions (e.g. dp[0] = 0)." },
    { title: "Transition Relation", reason: "Define state transition formula." },
    { title: "Iteration Order", reason: "Loop to compute states sequentially." },
    { title: "Return DP Value", reason: "Final answer is stored at last state." }
  ],
  "binary-search": [
    { title: "Initialize Bounds", reason: "Set low = 0, high = n-1." },
    { title: "Loop Condition", reason: "while low <= high." },
    { title: "Find Mid", reason: "mid = low + (high - low) / 2." },
    { title: "Decision Check", reason: "Check target constraint at mid." },
    { title: "Shrink Space", reason: "Update low = mid + 1 or high = mid - 1." }
  ],
  "graph-bfs-dfs": [
    { title: "Initialize Visited", reason: "Create visited Set or boolean array." },
    { title: "Setup Stack/Queue", reason: "Create Queue (BFS) or Stack (DFS), push start nodes." },
    { title: "Traverse Node", reason: "Pop node from stack/queue, mark as visited." },
    { title: "Push Neighbors", reason: "Loop through unvisited neighbors, push to stack/queue." }
  ],
  "heap-priority-queue": [
    { title: "Initialize Heap", reason: "Create min-heap or max-heap structure." },
    { title: "Add Elements", reason: "Push input elements or window items to heap." },
    { title: "Extract Optimal", reason: "Extract min/max elements to maintain constraint." },
    { title: "Process Item", reason: "Add new values or merge intervals." }
  ],
  "union-find": [
    { title: "Initialize Parents", reason: "parent[i] = i for all elements, setup ranks." },
    { title: "Find Operation", reason: "Traverse with path compression to find root." },
    { title: "Union Operation", reason: "Merge sets by rank/size, update parent pointers." },
    { title: "Check Component", reason: "Verify connectivity or decrement total components." }
  ]
};

const DEFAULT_STEPS: ConstructionStep[] = [
  { title: "Initialize", reason: "Set up initial data structures and base states." },
  { title: "Process", reason: "Traverse input space, process logic nodes." },
  { title: "Return", reason: "Return final answer." }
];

const getTemplateSteps = (pattern: string): ConstructionStep[] => {
  if (!pattern) return DEFAULT_STEPS;
  const norm = pattern.toLowerCase();
  if (norm.includes("sliding window")) return PATTERN_TEMPLATES["sliding-window"];
  if (norm.includes("bfs") && norm.includes("tree")) return PATTERN_TEMPLATES["tree-bfs"];
  if (norm.includes("dp") || norm.includes("dynamic programming")) return PATTERN_TEMPLATES["dynamic-programming"];
  if (norm.includes("binary search")) return PATTERN_TEMPLATES["binary-search"];
  if (norm.includes("union find") || norm.includes("union-find")) return PATTERN_TEMPLATES["union-find"];
  if (norm.includes("graph")) return PATTERN_TEMPLATES["graph-bfs-dfs"];
  if (norm.includes("heap") || norm.includes("priority queue")) return PATTERN_TEMPLATES["heap-priority-queue"];
  return DEFAULT_STEPS;
};

const createEmptyBlueprint = (patternUsed = "", noteToSelf = "", takeaway = ""): SolutionBlueprint => ({
  understanding: {
    input: "",
    output: "",
    keyObservation: "",
    hiddenTrick: ""
  },
  selection: {
    patternUsed: patternUsed,
    whyPattern: "",
    alternatives: []
  },
  construction_steps: getTemplateSteps(patternUsed),
  complexities: {
    timeComplexity: "O(N)",
    timeWhy: "",
    spaceComplexity: "O(1)",
    spaceWhy: ""
  },
  reflection: {
    biggestMistake: "",
    futureReminder: noteToSelf,
    interviewExplanation: takeaway
  }
});

function CollapsibleHint({ index, content }: { index: number; content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-[#232325] rounded-lg overflow-hidden bg-[#0A0A0B] select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 font-mono-label text-mono-label text-outline hover:text-[#FFC700] hover:bg-[#121214] transition-colors text-left cursor-pointer font-bold uppercase select-none"
      >
        <span>Hint {index}</span>
        <span className="text-badge-sm">{isOpen ? "[-]" : "[+]"}</span>
      </button>
      {isOpen && (
        <div 
          className="p-3 text-body-sm text-[#E4E4E7] border-t border-[#1C1C1E] font-body-lg leading-relaxed whitespace-pre-wrap select-text bg-[#070708] leetcode-description-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}
    </div>
  );
}

function AccordionSection({ 
  title, 
  isExpanded, 
  onToggle, 
  children 
}: { 
  title: string; 
  isExpanded: boolean; 
  onToggle: () => void; 
  children: React.ReactNode; 
}) {
  return (
    <div className="border border-border rounded-xl overflow-hidden bg-[#0A0A0B] select-none">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3.5 font-mono-label text-mono-label text-text hover:bg-[#121214] transition-colors text-left font-bold uppercase select-none cursor-pointer"
      >
        <span className="tracking-widest">{title}</span>
        <span>{isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-outline" /> : <ChevronDown className="w-3.5 h-3.5 text-outline" />}</span>
      </button>
      {isExpanded && (
        <div className="p-4 space-y-4 bg-[#09090A]/40 border-t border-border/50">
          {children}
        </div>
      )}
    </div>
  );
}

// Map initial solve confidence to scheduled intervals
const INITIAL_INTERVALS: { [key: string]: number } = {
  failed: 2,
  hints: 4,
  not_confident: 7,
  comfortable: 21
};

export function QuestionDetailDrawer() {
  const { user } = useAuth();
  
  // Drawer states
  const [isOpen, setIsOpen] = useState(false);
  const [qId, setQId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [diff, setDiff] = useState("");
  const [link, setLink] = useState("");
  const [openMode, setOpenMode] = useState<"notebook" | "reflection" | "priming" | "review" | "description">("notebook");
  
  // Tabs for notebook mode
  const [activeTab, setActiveTab] = useState<"wiki" | "history">("wiki");
  
  // Data loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [notebook, setNotebook] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [problemDescription, setProblemDescription] = useState("");
  const [problemHints, setProblemHints] = useState<string[]>([]);
  const [likesDislikes, setLikesDislikes] = useState<{ likes: number; dislikes: number }>({ likes: 0, dislikes: 0 });
  
  // Reflection/Review Form Fields
  const [confidence, setConfidence] = useState("comfortable");
  const [patternRec, setPatternRec] = useState("immediate");
  const [mistakes, setMistakes] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<"easier" | "same" | "difficult" | null>(null);
  
  // Editable Notebook Fields (Wiki & takeaways)
  const [takeaway, setTakeaway] = useState("");
  const [noteToSelf, setNoteToSelf] = useState("");
  const [bruteForce, setBruteForce] = useState("");
  const [optimization, setOptimization] = useState("");
  const [patternStrategy, setPatternStrategy] = useState("");
  const [dryRun, setDryRun] = useState("");
  
  // V1 Solution Blueprint State
  const [blueprint, setBlueprint] = useState<SolutionBlueprint>(createEmptyBlueprint());
  
  // Accordion Expand States
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    understanding: true,
    selection: false,
    construction: true,
    complexities: false,
    reflection: true
  });

  // Replay Deck States
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const [isReplayPaused, setIsReplayPaused] = useState(false);

  // Interactive UI messages
  const [successMsg, setSuccessMsg] = useState("");

  const mistakeOptions = [
    "Wrong Pattern",
    "Edge Case",
    "Time Complexity",
    "Overflow",
    "Wrong Data Structure",
    "Off-by-one",
    "Other"
  ];

  // Helper to extract LeetCode title slug from URL
  const getTitleSlug = (url: string): string => {
    if (!url) return "";
    const match = url.match(/\/problems\/([^/]+)/);
    return match ? match[1] : "";
  };

  // Toggle Accordion section
  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const proceedToSection = (current: string, next: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [current]: false,
      [next]: true
    }));
  };

  // Listen to open events from other screens
  useEffect(() => {
    const handleOpen = (e: any) => {
      const { questionId, title: qTitle, difficulty, link: qLink, mode } = e.detail;
      setQId(questionId);
      setTitle(qTitle);
      setDiff(difficulty);
      setLink(qLink);
      setOpenMode(mode);
      setIsOpen(true);
      setActiveTab("wiki");
      
      // Reset form variables
      setNotebook(null);
      setProgress(null);
      setHistory([]);
      setFeedback(null);
      setConfidence("comfortable");
      setPatternRec("immediate");
      setMistakes([]);
      setTakeaway("");
      setNoteToSelf("");
      setBruteForce("");
      setOptimization("");
      setPatternStrategy("");
      setDryRun("");
      setSuccessMsg("");
      setProblemDescription("");
      setProblemHints([]);
      setLikesDislikes({ likes: 0, dislikes: 0 });
      setBlueprint(createEmptyBlueprint());
      setExpandedSections({
        understanding: true,
        selection: false,
        construction: true,
        complexities: false,
        reflection: true
      });
      setIsReplaying(false);
      setReplayIndex(0);
      setIsReplayPaused(false);
      setIsLoading(true);
    };

    window.addEventListener("open-question-drawer" as any, handleOpen);
    return () => window.removeEventListener("open-question-drawer" as any, handleOpen);
  }, []);

  // Fetch data on drawer opening
  useEffect(() => {
    if (!isOpen || !qId || !user) return;
    const userId = user.id;

    async function loadData() {
      setIsLoading(true);
      try {
        // 1. Fetch user progress
        const { data: progressList, error: progressErr } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("question_id", qId);

        if (progressErr) throw progressErr;

        if (progressList && progressList.length > 0) {
          if (progressList.length > 1) {
            console.warn(`Detected ${progressList.length} duplicate progress rows for question ${qId}. Cleaning up...`);
            const keepRow = progressList[0];
            const extraIds = progressList.slice(1).map(r => r.id);
            await supabase
              .from("user_progress")
              .delete()
              .in("id", extraIds);
            setProgress(keepRow);
          } else {
            setProgress(progressList[0]);
          }
        } else {
          setProgress(null);
        }

        // 2. Query mapped pattern and topic from sheet questions
        let dbPattern = "";
        let dbTopic = "";
        try {
          const { data: sheetQ } = await supabase
            .from("sheet_questions")
            .select('"Pattern name", "topic name"')
            .eq("question ID", qId)
            .maybeSingle();
          if (sheetQ) {
            dbPattern = sheetQ["Pattern name"] || "";
            dbTopic = sheetQ["topic name"] || "";
          }
        } catch (err) {
          console.error("Error querying sheet_questions:", err);
        }

        // Query standard complexes from pattern_metadata
        let standardTC = "";
        let standardSC = "";
        if (dbPattern) {
          try {
            const { data: patternMeta } = await supabase
              .from("pattern_metadata")
              .select("tc, sc")
              .eq("pattern_name", dbPattern)
              .maybeSingle();
            if (patternMeta) {
              standardTC = patternMeta.tc || "";
              standardSC = patternMeta.sc || "";
            }
          } catch (metaErr) {
            console.error("Error fetching pattern complexities:", metaErr);
          }
        }

        // 3. Fetch notebook entries
        const { data: notebookData } = await supabase
          .from("user_notebooks")
          .select("*")
          .eq("user_id", userId)
          .eq("question_id", qId)
          .maybeSingle();

        if (notebookData) {
          setNotebook(notebookData);
          setTakeaway(notebookData.biggest_takeaway || "");
          setNoteToSelf(notebookData.note_to_self || "");
          setBruteForce(notebookData.brute_force || "");
          setOptimization(notebookData.optimization || "");
          setPatternStrategy(notebookData.pattern_strategy || "");
          setDryRun(notebookData.dry_run || "");

          if (notebookData.blueprint) {
            try {
              const parsed = typeof notebookData.blueprint === 'string'
                ? JSON.parse(notebookData.blueprint)
                : notebookData.blueprint;
              
              setBlueprint({
                understanding: {
                  input: parsed.understanding?.input || "",
                  output: parsed.understanding?.output || "",
                  keyObservation: parsed.understanding?.keyObservation || "",
                  hiddenTrick: parsed.understanding?.hiddenTrick || notebookData.brute_force || ""
                },
                selection: {
                  patternUsed: parsed.selection?.patternUsed || dbPattern || "",
                  whyPattern: parsed.selection?.whyPattern || "",
                  alternatives: parsed.selection?.alternatives || []
                },
                construction_steps: parsed.construction_steps || getTemplateSteps(parsed.selection?.patternUsed || dbPattern),
                complexities: {
                  timeComplexity: parsed.complexities?.timeComplexity || standardTC || "O(N)",
                  timeWhy: parsed.complexities?.timeWhy || "",
                  spaceComplexity: parsed.complexities?.spaceComplexity || standardSC || "O(1)",
                  spaceWhy: parsed.complexities?.spaceWhy || ""
                },
                reflection: {
                  biggestMistake: parsed.reflection?.biggestMistake || "",
                  futureReminder: parsed.reflection?.futureReminder || notebookData.note_to_self || "",
                  interviewExplanation: parsed.reflection?.interviewExplanation || notebookData.biggest_takeaway || ""
                }
              });
            } catch (err) {
              console.error("Error parsing blueprint JSON:", err);
              setBlueprint(createEmptyBlueprint(dbPattern || notebookData.pattern_strategy, notebookData.note_to_self, notebookData.biggest_takeaway));
            }
          } else {
            // Backfill legacy takeaways
            setBlueprint({
              understanding: {
                input: "",
                output: "",
                keyObservation: "",
                hiddenTrick: notebookData.brute_force || ""
              },
              selection: {
                patternUsed: dbPattern || notebookData.pattern_strategy || "",
                whyPattern: "",
                alternatives: []
              },
              construction_steps: getTemplateSteps(dbPattern || notebookData.pattern_strategy),
              complexities: {
                timeComplexity: standardTC || "O(N)",
                timeWhy: "",
                spaceComplexity: standardSC || "O(1)",
                spaceWhy: ""
              },
              reflection: {
                biggestMistake: "",
                futureReminder: notebookData.note_to_self || "",
                interviewExplanation: notebookData.biggest_takeaway || ""
              }
            });
          }
        } else {
          setBlueprint(createEmptyBlueprint(dbPattern, "", ""));
        }

        // 4. Fetch history
        const { data: historyData } = await supabase
          .from("user_reflection_log")
          .select("*")
          .eq("user_id", userId)
          .eq("question_id", qId)
          .order("attempt_number", { ascending: true });

        setHistory(historyData || []);

        // 5. Fetch LeetCode description from Alfa API
        let currentLink = link;
        if (!currentLink && qId) {
          const { data: qData } = await supabase
            .from("questions")
            .select("Link")
            .eq("ID", qId)
            .maybeSingle();
          if (qData) {
            currentLink = qData.Link;
          }
        }
        
        if (currentLink) {
          const titleSlug = getTitleSlug(currentLink);
          if (titleSlug) {
            try {
              const cacheKey = `leetcode_desc_cache_${titleSlug}`;
              const descData = await fetchWithCache(
                cacheKey,
                async () => {
                  const res = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${titleSlug}`);
                  if (!res.ok) throw new Error("API request failed");
                  const apiData = await res.json();
                  return {
                    question: apiData.question || "",
                    hints: apiData.hints || [],
                    likes: apiData.likes || 0,
                    dislikes: apiData.dislikes || 0
                  };
                },
                86400000 // 24 Hours Cache TTL
              );
              setProblemDescription(descData.question || "");
              setProblemHints(descData.hints || []);
              setLikesDislikes({ likes: descData.likes, dislikes: descData.dislikes });
            } catch (apiErr) {
              console.error("Failed to fetch description from Alfa LeetCode API:", apiErr);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load drawer data:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [isOpen, qId, user, link]);

  const handleToggleMistake = (option: string) => {
    if (mistakes.includes(option)) {
      setMistakes(mistakes.filter(m => m !== option));
    } else {
      setMistakes([...mistakes, option]);
    }
  };

  // Synchronize dynamic blueprint reflections with separate strings for reflection logs
  const syncTakeawayWithBlueprint = (takeawayText: string) => {
    setTakeaway(takeawayText);
    setBlueprint(prev => ({
      ...prev,
      reflection: {
        ...prev.reflection,
        interviewExplanation: takeawayText
      }
    }));
  };

  const syncReminderWithBlueprint = (reminderText: string) => {
    setNoteToSelf(reminderText);
    setBlueprint(prev => ({
      ...prev,
      reflection: {
        ...prev.reflection,
        futureReminder: reminderText
      }
    }));
  };

  // Submit Reflection (First solve)
  const handleSubmitReflection = async () => {
    if (!user || !qId || isSaving) return;
    const userId = user.id;
    setIsSaving(true);
    
    try {
      const intervalDays = INITIAL_INTERVALS[confidence] || 2;
      let finalInterval = intervalDays;
      let finalDueDate = new Date();
      finalDueDate.setDate(finalDueDate.getDate() + intervalDays);

      if (progress) {
        const now = new Date();
        const existingDueDate = progress.next_revision_due ? new Date(progress.next_revision_due) : null;
        const isEarlySolve = existingDueDate ? (now < existingDueDate) : false;
        
        if (isEarlySolve && existingDueDate) {
          finalInterval = progress.current_interval_days || intervalDays;
          finalDueDate = existingDueDate;
        }
      }
      
      const completedAt = new Date().toISOString();

      // Ensure blueprint reflection notes contain the latest form inputs
      const finalBlueprint = {
        ...blueprint,
        reflection: {
          ...blueprint.reflection,
          interviewExplanation: takeaway || blueprint.reflection.interviewExplanation,
          futureReminder: noteToSelf || blueprint.reflection.futureReminder
        }
      };

      // 1. Upsert progress entry
      const { error: progressError } = await supabase
        .from("user_progress")
        .upsert({
          id: progress?.id,
          user_id: userId,
          question_id: qId,
          completed: true,
          "completed-at": completedAt,
          current_interval_days: finalInterval,
          next_revision_due: finalDueDate.toISOString(),
          revision_count: 0,
          last_revised_at: null
        });

      if (progressError) throw progressError;

      // 2. Insert into reflection log
      const { error: logError } = await supabase
        .from("user_reflection_log")
        .insert({
          user_id: userId,
          question_id: qId,
          attempt_number: 1,
          reflection_source: "initial_solve",
          confidence,
          pattern_recognition: patternRec,
          mistake_types: mistakes,
          created_at: completedAt
        });

      if (logError) throw logError;

      // 3. Upsert takeaways & blueprint to notebook
      const { error: notebookError } = await supabase
        .from("user_notebooks")
        .upsert({
          user_id: userId,
          question_id: qId,
          biggest_takeaway: finalBlueprint.reflection.interviewExplanation,
          note_to_self: finalBlueprint.reflection.futureReminder,
          brute_force: finalBlueprint.understanding.hiddenTrick,
          optimization: "",
          pattern_strategy: "",
          dry_run: "",
          blueprint: finalBlueprint,
          updated_at: completedAt
        });

      if (notebookError) throw notebookError;

      const timestamps = JSON.parse(localStorage.getItem("solved_questions_timestamps") || "{}");
      timestamps[qId] = completedAt;
      localStorage.setItem("solved_questions_timestamps", JSON.stringify(timestamps));

      setSuccessMsg(`REVISION SCHEDULED: DUE IN ${finalInterval} DAYS`);
      window.dispatchEvent(new Event("question-solved"));

      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to save reflection:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Submit Review Assessment (Spaced revision)
  const handleSubmitReview = async () => {
    if (!user || !qId || !feedback || isSaving) return;
    const userId = user.id;
    setIsSaving(true);

    try {
      const currentInterval = progress?.current_interval_days || 2;
      let newInterval = currentInterval;

      if (feedback === "easier") {
        newInterval = Math.ceil(currentInterval * 2.0);
      } else if (feedback === "same") {
        newInterval = Math.ceil(currentInterval * 1.2);
      } else if (feedback === "difficult") {
        newInterval = Math.max(2, Math.floor(currentInterval * 0.5));
      }

      const now = new Date();
      const existingDueDate = progress?.next_revision_due ? new Date(progress.next_revision_due) : null;
      const isEarlySolve = existingDueDate ? (now < existingDueDate) : false;

      let dueDate = new Date();
      if (isEarlySolve && existingDueDate) {
        dueDate = existingDueDate;
        newInterval = currentInterval;
      } else {
        dueDate.setDate(dueDate.getDate() + newInterval);
      }
      
      const nowStr = new Date().toISOString();
      const nextAttemptNumber = (history?.length || 0) + 1;

      const finalBlueprint = {
        ...blueprint,
        reflection: {
          ...blueprint.reflection,
          interviewExplanation: takeaway || blueprint.reflection.interviewExplanation,
          futureReminder: noteToSelf || blueprint.reflection.futureReminder
        }
      };

      // 1. Update progress fields via upsert
      const upsertPayload = {
        id: progress?.id,
        user_id: userId,
        question_id: qId,
        completed: true,
        "completed-at": progress?.["completed-at"] || progress?.completed_at || nowStr,
        current_interval_days: newInterval,
        next_revision_due: dueDate.toISOString(),
        revision_count: (progress?.revision_count || 0) + 1,
        last_revised_at: nowStr
      };

      const { error: progressError } = await supabase
        .from("user_progress")
        .upsert(upsertPayload);

      if (progressError) throw progressError;

      // 2. Log entry to reflection history
      const { error: logError } = await supabase
        .from("user_reflection_log")
        .insert({
          user_id: userId,
          question_id: qId,
          attempt_number: nextAttemptNumber,
          reflection_source: "scheduled_revision",
          confidence,
          pattern_recognition: patternRec,
          mistake_types: mistakes,
          created_at: nowStr
        });

      if (logError) throw logError;

      // 3. Update mutable takeaways and blueprint
      const { error: notebookError } = await supabase
        .from("user_notebooks")
        .upsert({
          user_id: userId,
          question_id: qId,
          biggest_takeaway: finalBlueprint.reflection.interviewExplanation,
          note_to_self: finalBlueprint.reflection.futureReminder,
          brute_force: finalBlueprint.understanding.hiddenTrick,
          optimization: "",
          pattern_strategy: "",
          dry_run: "",
          blueprint: finalBlueprint,
          updated_at: nowStr
        });

      if (notebookError) throw notebookError;

      setSuccessMsg(`REVISION UPDATED: NEXT DUE IN ${newInterval} DAYS`);
      window.dispatchEvent(new Event("question-solved"));

      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to complete review save:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Mark as Premium (Completes without scheduling revisions)
  const handleMarkPremium = async () => {
    if (!user || !qId || isSaving) return;
    const userId = user.id;
    setIsSaving(true);

    try {
      const nowStr = new Date().toISOString();

      const finalBlueprint = {
        ...blueprint,
        reflection: {
          ...blueprint.reflection,
          biggestMistake: "Premium Skip",
          futureReminder: "Marked as Premium problem",
          interviewExplanation: "Marked as LeetCode Premium problem. Skipped revision scheduling."
        }
      };

      // 1. Mark as completed in user_progress
      const upsertPayload = {
        id: progress?.id,
        user_id: userId,
        question_id: qId,
        completed: true,
        "completed-at": "1970-01-01T00:00:00.000Z",
        current_interval_days: null,
        next_revision_due: null,
        revision_count: 0,
        last_revised_at: null
      };

      const { error: progressError } = await supabase
        .from("user_progress")
        .upsert(upsertPayload);

      if (progressError) throw progressError;

      // 2. Log entry to reflection history
      const { error: logError } = await supabase
        .from("user_reflection_log")
        .insert({
          user_id: userId,
          question_id: qId,
          attempt_number: 1,
          reflection_source: "initial_solve",
          confidence: "comfortable",
          pattern_recognition: "immediate",
          mistake_types: ["Premium Skip"],
          created_at: nowStr
        });

      if (logError) throw logError;

      // 3. Update notebook takeaway notes & blueprint
      const { error: notebookError } = await supabase
        .from("user_notebooks")
        .upsert({
          user_id: userId,
          question_id: qId,
          biggest_takeaway: finalBlueprint.reflection.interviewExplanation,
          note_to_self: finalBlueprint.reflection.futureReminder,
          brute_force: finalBlueprint.understanding.hiddenTrick,
          optimization: "",
          pattern_strategy: "",
          dry_run: "",
          blueprint: finalBlueprint,
          updated_at: nowStr
        });

      if (notebookError) throw notebookError;

      setSuccessMsg("MARKED AS PREMIUM: REVISION SKIPPED");
      window.dispatchEvent(new Event("question-solved"));

      setTimeout(() => {
        setIsOpen(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to complete premium skip:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Notebook (Mutable structured Solution Blueprint)
  const handleSaveNotebook = async () => {
    if (!user || !qId) return;
    const userId = user.id;
    setIsSaving(true);

    try {
      const { error } = await supabase
        .from("user_notebooks")
        .upsert({
          user_id: userId,
          question_id: qId,
          biggest_takeaway: blueprint.reflection.interviewExplanation,
          note_to_self: blueprint.reflection.futureReminder,
          brute_force: blueprint.understanding.hiddenTrick,
          optimization: "",
          pattern_strategy: "",
          dry_run: "",
          blueprint: blueprint, // Save full JSON blueprint
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Update notebook local state context
      setNotebook((prev: any) => ({
        ...prev,
        blueprint: blueprint,
        biggest_takeaway: blueprint.reflection.interviewExplanation,
        note_to_self: blueprint.reflection.futureReminder,
        brute_force: blueprint.understanding.hiddenTrick
      }));

      setSuccessMsg("SOLUTION BLUEPRINT SAVED");
      setTimeout(() => {
        setSuccessMsg("");
      }, 1500);
    } catch (err) {
      console.error("Failed to save notebook:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Close helper
  const handleClose = () => {
    setIsReplaying(false);
    setIsOpen(false);
  };

  // Blueprint local update utilities
  const updateBlueprintField = (section: keyof SolutionBlueprint, field: string, val: any) => {
    setBlueprint(prev => ({
      ...prev,
      [section]: {
        ...prev[section] as any,
        [field]: val
      }
    }));
  };

  const handleMoveStep = (idx: number, direction: "up" | "down") => {
    const steps = [...blueprint.construction_steps];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;
    // Swap
    const temp = steps[idx];
    steps[idx] = steps[targetIdx];
    steps[targetIdx] = temp;
    
    setBlueprint(prev => ({
      ...prev,
      construction_steps: steps
    }));
  };

  const handleAddStep = () => {
    setBlueprint(prev => ({
      ...prev,
      construction_steps: [
        ...prev.construction_steps,
        { title: "New Step", reason: "" }
      ]
    }));
  };

  const handleRemoveStep = (idx: number) => {
    setBlueprint(prev => ({
      ...prev,
      construction_steps: prev.construction_steps.filter((_, i) => i !== idx)
    }));
  };

  const handleUpdateStep = (idx: number, field: "title" | "reason", val: string) => {
    const steps = [...blueprint.construction_steps];
    steps[idx] = { ...steps[idx], [field]: val };
    
    setBlueprint(prev => ({
      ...prev,
      construction_steps: steps
    }));
  };

  // Build Replay timed slides dynamically
  const buildReplaySlides = () => {
    const slides: Array<{ title: string; subtitle: string; content: React.ReactNode }> = [];

    // Slide 1: Understanding
    slides.push({
      title: "1. Problem Observation",
      subtitle: "Inputs, outputs, and the core trick",
      content: (
        <div className="space-y-4 text-left select-text">
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-outline uppercase text-[8px] block font-bold">Input Signature</span>
              <span className="text-text font-bold bg-[#111112] px-2 py-1 rounded border border-border block overflow-x-auto whitespace-nowrap">
                {blueprint.understanding.input || "Unspecified"}
              </span>
            </div>
            <div>
              <span className="text-outline uppercase text-[8px] block font-bold">Output Signature</span>
              <span className="text-text font-bold bg-[#111112] px-2 py-1 rounded border border-border block overflow-x-auto whitespace-nowrap">
                {blueprint.understanding.output || "Unspecified"}
              </span>
            </div>
          </div>
          <div>
            <span className="text-outline uppercase text-[8px] font-mono block font-bold mb-1">Key Observation</span>
            <p className="text-xs text-text bg-[#0E0E0F] p-3 rounded border border-border leading-relaxed font-medium min-h-[50px] whitespace-pre-wrap select-text">
              {blueprint.understanding.keyObservation || "None logged"}
            </p>
          </div>
          {blueprint.understanding.hiddenTrick && (
            <div className="border border-[#FFC700]/20 bg-[#FFC700]/5 p-3 rounded-lg border-dashed">
              <span className="text-[#FFC700] uppercase font-mono text-[8px] block font-bold mb-0.5">★ Hidden Memory Trick</span>
              <p className="text-xs text-text font-medium leading-relaxed select-text">{blueprint.understanding.hiddenTrick}</p>
            </div>
          )}
        </div>
      )
    });

    // Slide 2: Selection
    slides.push({
      title: "2. Pattern Selection",
      subtitle: "Why we selected this algorithm strategy",
      content: (
        <div className="space-y-4 text-left">
          <div className="bg-[#111112] p-4 rounded-xl border border-border text-center">
            <span className="text-[9px] text-outline font-mono block uppercase mb-0.5">Selected Pattern</span>
            <span className="text-sm text-[#FFC700] font-extrabold uppercase tracking-widest font-mono">
              {blueprint.selection.patternUsed || "Not Specified"}
            </span>
          </div>
          <div>
            <span className="text-outline uppercase text-[8px] font-mono block font-bold mb-1">Pattern Rationale</span>
            <p className="text-xs text-text bg-[#0E0E0F] p-3.5 rounded border border-border leading-relaxed select-text">
              {blueprint.selection.whyPattern || "No rationale recorded."}
            </p>
          </div>
        </div>
      )
    });

    // Slides for construction steps
    blueprint.construction_steps.forEach((step, idx) => {
      slides.push({
        title: `3. Step ${idx + 1} / ${blueprint.construction_steps.length}`,
        subtitle: step.title,
        content: (
          <div className="space-y-4 h-full flex flex-col justify-center py-6 text-center select-text">
            <div className="inline-block mx-auto px-4 py-1.5 rounded-lg border border-[#FFC700]/20 bg-[#FFC700]/5 text-[#FFC700] font-mono text-xs font-bold uppercase tracking-widest mb-3">
              {step.title}
            </div>
            <div>
              <span className="text-outline uppercase text-[8px] font-mono block mb-1 font-bold">Execution Step Logic</span>
              <p className="text-sm text-text font-semibold leading-relaxed max-w-[400px] mx-auto whitespace-pre-wrap select-text">
                {step.reason || "Perform step operations."}
              </p>
            </div>
          </div>
        )
      });
    });

    // Final Slide: Complexity & Future Reminder
    slides.push({
      title: "4. Complexities & Reflections",
      subtitle: "Performance benchmarks and reminders",
      content: (
        <div className="space-y-4 text-left select-text">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#111112] p-3 rounded-lg border border-border">
              <span className="text-outline uppercase text-[8px] font-mono block font-bold">Time Complexity</span>
              <span className="text-xs font-bold text-text block mt-0.5 font-mono">{blueprint.complexities.timeComplexity}</span>
              {blueprint.complexities.timeWhy && (
                <span className="block text-[9px] text-outline mt-1 leading-normal italic">{blueprint.complexities.timeWhy}</span>
              )}
            </div>
            <div className="bg-[#111112] p-3 rounded-lg border border-border">
              <span className="text-outline uppercase text-[8px] font-mono block font-bold">Space Complexity</span>
              <span className="text-xs font-bold text-text block mt-0.5 font-mono">{blueprint.complexities.spaceComplexity}</span>
              {blueprint.complexities.spaceWhy && (
                <span className="block text-[9px] text-outline mt-1 leading-normal italic">{blueprint.complexities.spaceWhy}</span>
              )}
            </div>
          </div>
          <div className="border border-red-500/20 bg-red-500/5 p-3 rounded-lg border-dashed">
            <span className="text-red-400 uppercase font-mono text-[8px] block font-bold mb-0.5">⚠️ Future Revision Warning</span>
            <p className="text-xs text-text leading-relaxed font-bold select-text">
              {blueprint.reflection.futureReminder || "No specific warnings logged."}
            </p>
          </div>
        </div>
      )
    });

    return slides;
  };

  const replaySlides = buildReplaySlides();

  // Replay carousel timed timer hooks
  useEffect(() => {
    if (!isReplaying || isReplayPaused) return;

    const interval = setInterval(() => {
      setReplayIndex(prev => {
        if (prev >= replaySlides.length - 1) {
          clearInterval(interval);
          setIsReplaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [isReplaying, isReplayPaused, replaySlides.length]);

  const handleStartReplay = () => {
    setReplayIndex(0);
    setIsReplayPaused(false);
    setIsReplaying(true);
  };

  const handleStopReplay = () => {
    setIsReplaying(false);
    setReplayIndex(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Translucent overlay background */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-background z-40 cursor-pointer"
          />

          {/* Core Right side panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[500px] sm:max-w-[600px] bg-[#0B0B0C] border-l border-border z-50 flex flex-col shadow-2xl overflow-hidden font-sans"
          >
            {/* Header info */}
            <div className="p-6 border-b border-border bg-[#0E0E0F] flex items-center gap-4 justify-between">
              <div className="flex items-center gap-3">
                {(openMode === "reflection" || openMode === "review" || isReplaying) && (
                  <button 
                    onClick={() => {
                      if (isReplaying) {
                        handleStopReplay();
                      } else {
                        setOpenMode("description");
                      }
                    }}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-surface-container-highest hover:text-[#FFC700] transition-colors cursor-pointer select-none"
                    title="Back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-1 select-none">
                    <span className="font-mono text-xs text-[#FFC700] uppercase font-bold tracking-wider">
                      {isReplaying && "Cognitive Blueprint Replay"}
                      {!isReplaying && openMode === "reflection" && "Solve Reflection"}
                      {!isReplaying && openMode === "review" && "Review Assessment"}
                      {!isReplaying && openMode === "priming" && "Memory Priming"}
                      {!isReplaying && openMode === "notebook" && "Solution Blueprint"}
                      {!isReplaying && openMode === "description" && "Problem Description"}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary/80 animate-pulse" />
                  </div>
                  <h3 className="font-headline-md text-base text-text font-bold leading-tight line-clamp-1">{title}</h3>
                  <div className="flex items-center gap-2 mt-1 select-none">
                    <span className="font-mono text-[10px] text-outline">#{qId}</span>
                    <span className="h-1 w-1 bg-outline-variant/50 rounded-full" />
                    <span className={cn(
                      "text-[10px] font-bold px-1.5 py-0.5 rounded",
                      diff.toLowerCase() === "easy" && "bg-secondary/10 text-secondary border border-secondary/20",
                      diff.toLowerCase() === "medium" && "bg-tertiary/10 text-tertiary border border-tertiary/20",
                      diff.toLowerCase() === "hard" && "bg-danger/10 text-[#FF8A80] border border-danger/20"
                    )}>
                      {diff.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {link && (
                  <button 
                    onClick={() => window.open(link, "_blank", "noopener,noreferrer")}
                    className="h-8 px-3 rounded-lg border border-[#FFD400]/25 bg-[#FFD400]/5 hover:bg-[#FFD400]/10 flex items-center gap-1.5 text-[10px] font-mono font-bold text-[#FFD400] transition-all cursor-pointer select-none"
                    title="Open on LeetCode"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-[#FFD400]" />
                    <span>LEETCODE</span>
                  </button>
                )}
                <button 
                  onClick={handleClose}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-surface-container-highest hover:text-[#FFC700] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content box */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#09090A]/30">
              {isLoading ? (
                <div className="h-full flex items-center justify-center flex-col gap-3">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="font-mono text-xs text-outline tracking-wider">RETRIEVING RECORD METRICS...</span>
                </div>
              ) : successMsg ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center text-secondary border border-secondary/20 scale-110">
                    <CheckCircle2 className="w-8 h-8" strokeWidth={2.5} />
                  </div>
                  <div className="font-mono text-sm font-bold text-secondary tracking-widest uppercase">
                    {successMsg}
                  </div>
                  <span className="font-mono text-[10px] text-outline tracking-wider">SYNCING INTERFACE CONTROLS...</span>
                </div>
              ) : isReplaying ? (
                /* REPLAY BLUEPRINT Timed PowerPoint deck */
                <div className="h-full flex flex-col justify-between py-2 space-y-6">
                  {/* Top Slide Segment Indicator Progress bar */}
                  <div className="space-y-2 select-none">
                    <div className="flex gap-1.5 h-1.5 w-full bg-[#161618] rounded-full overflow-hidden">
                      {replaySlides.map((_, i) => (
                        <div 
                          key={i} 
                          className={cn(
                            "h-full flex-1 transition-all duration-300",
                            i === replayIndex ? "bg-[#FFC700] scale-y-110 shadow-lg shadow-[#FFC700]/20" : i < replayIndex ? "bg-[#FFC700]/60" : "bg-white/5"
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono font-bold text-outline">
                      <span>SLIDE {replayIndex + 1} OF {replaySlides.length}</span>
                      {isReplayPaused ? <span className="text-[#FFC700]">AUTO-ADVANCE PAUSED</span> : <span className="animate-pulse">AUTO-ADVANCING (3S)</span>}
                    </div>
                  </div>

                  {/* Active Slide panel */}
                  <div className="flex-1 bg-[#111112] border border-border p-6 rounded-xl flex flex-col justify-between shadow-inner">
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-mono text-[#FFC700] font-bold block uppercase tracking-widest mb-1">
                          {replaySlides[replayIndex].title}
                        </span>
                        <h4 className="text-base text-text font-bold leading-snug">
                          {replaySlides[replayIndex].subtitle}
                        </h4>
                      </div>
                      <div className="border-t border-border/40 my-3" />
                      <div className="py-2">
                        {replaySlides[replayIndex].content}
                      </div>
                    </div>
                    
                    <div className="text-center font-mono text-[9px] text-outline select-none mt-4">
                      SHEETSTRIDE SOLUTION BLUEPRINT PRIMING
                    </div>
                  </div>

                  {/* Carousel Controls */}
                  <div className="flex items-center justify-between gap-3 bg-[#0E0E0F] p-4 rounded-xl border border-border select-none">
                    <button
                      onClick={() => {
                        setIsReplayPaused(true);
                        setReplayIndex(prev => Math.max(0, prev - 1));
                      }}
                      disabled={replayIndex === 0}
                      className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-text hover:border-primary disabled:opacity-30 disabled:hover:border-border cursor-pointer transition-colors"
                    >
                      PREVIOUS
                    </button>

                    <button
                      onClick={() => setIsReplayPaused(!isReplayPaused)}
                      className="flex items-center gap-1.5 text-xs text-[#FFC700] font-bold border border-[#FFC700]/30 bg-[#FFD400]/5 hover:bg-[#FFD400]/10 px-4 py-2.5 rounded-lg cursor-pointer transition-colors"
                    >
                      {isReplayPaused ? (
                        <>
                          <PlayCircle className="w-4 h-4 text-[#FFC700]" />
                          <span>AUTO-PLAY</span>
                        </>
                      ) : (
                        <>
                          <PauseCircle className="w-4 h-4 text-[#FFC700]" />
                          <span>PAUSE</span>
                        </>
                      )}
                    </button>

                    {replayIndex < replaySlides.length - 1 ? (
                      <button
                        onClick={() => {
                          setIsReplayPaused(true);
                          setReplayIndex(prev => prev + 1);
                        }}
                        className="px-4 py-2 border border-border rounded-lg text-xs font-semibold text-text hover:border-primary cursor-pointer transition-colors"
                      >
                        NEXT
                      </button>
                    ) : (
                      <button
                        onClick={handleStopReplay}
                        className="px-4 py-2 bg-[#FFC700] hover:bg-[#FFE14D] text-[#000000] rounded-lg text-xs font-bold cursor-pointer transition-colors"
                      >
                        FINISH
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* MODE: MEMORY PRIMING */}
                  {openMode === "priming" && (
                    <div className="space-y-6">
                      {/* Last Attempt Card */}
                      <div className="bg-[#111112] border border-border p-5 rounded-xl space-y-4">
                        <div className="flex items-center gap-2 font-mono text-[11px] text-[#FFC700] uppercase font-bold tracking-wider select-none border-b border-border pb-3">
                          <Clock className="w-4 h-4" />
                          Last Attempt Analytics
                        </div>
                        {history.length > 0 ? (
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="block text-[10px] text-outline font-semibold uppercase mb-1">Confidence</span>
                              <span className="font-headline-md text-xs font-bold text-text">
                                {history[history.length - 1].confidence.replace("_", " ").toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <span className="block text-[10px] text-outline font-semibold uppercase mb-1">Pattern Recognition</span>
                              <span className="font-headline-md text-xs font-bold text-text">
                                {history[history.length - 1].pattern_recognition.toUpperCase()}
                              </span>
                            </div>
                            <div className="col-span-2">
                              <span className="block text-[10px] text-outline font-semibold uppercase mb-1">Mistakes Logged</span>
                              <div className="flex flex-wrap gap-1.5 mt-1">
                                {history[history.length - 1].mistake_types.length > 0 ? (
                                  history[history.length - 1].mistake_types.map((m: string) => (
                                    <span key={m} className="text-[10px] px-2 py-0.5 rounded border border-[#2D2D2D] bg-[#18181A] text-outline">
                                      {m}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[10px] text-outline italic">No mistakes logged in last attempt</span>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-outline text-xs italic">
                            No practice logs found. Initial solve was direct.
                          </div>
                        )}
                      </div>

                      {/* Solution Snapshot Replay Deck launcher */}
                      <div className="bg-[#111112] border border-border p-5 rounded-xl space-y-4">
                        <div className="flex items-center justify-between font-mono text-[11px] text-[#FFC700] uppercase font-bold tracking-wider select-none border-b border-border pb-3">
                          <span className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Solution Snapshot
                          </span>
                          <button
                            onClick={handleStartReplay}
                            className="flex items-center gap-1 text-[9px] border border-[#FFD400]/30 hover:border-[#FFD400] bg-[#FFD400]/5 hover:bg-[#FFD400]/10 px-2 py-1 rounded transition-colors cursor-pointer"
                          >
                            <PlayCircle className="w-3 h-3 text-[#FFC700]" />
                            <span>REPLAY TIMELINE</span>
                          </button>
                        </div>
                        <div className="space-y-3 font-mono text-xs select-none">
                          <div className="grid grid-cols-2 gap-3 text-[11px]">
                            <div>
                              <span className="text-outline uppercase text-[8px] block font-bold">Pattern</span>
                              <span className="font-bold text-text">{blueprint.selection.patternUsed || "Not Specified"}</span>
                            </div>
                            <div>
                              <span className="text-outline uppercase text-[8px] block font-bold">Complexity</span>
                              <span className="font-bold text-text">
                                {blueprint.complexities.timeComplexity} / {blueprint.complexities.spaceComplexity}
                              </span>
                            </div>
                            <div className="col-span-2 border-t border-[#1C1C1E] pt-2">
                              <span className="text-outline uppercase text-[8px] block font-bold mb-0.5">Key Observation</span>
                              <span className="text-text leading-relaxed font-medium select-text block max-h-[80px] overflow-y-auto">
                                {blueprint.understanding.keyObservation || "None logged"}
                              </span>
                            </div>
                            {blueprint.understanding.hiddenTrick && (
                              <div className="col-span-2 border-t border-[#1C1C1E] pt-2">
                                <span className="text-outline uppercase text-[8px] block font-bold mb-0.5">Hidden Trick</span>
                                <span className="text-text font-medium select-text block max-h-[60px] overflow-y-auto">
                                  {blueprint.understanding.hiddenTrick}
                                </span>
                              </div>
                            )}
                            <div className="col-span-2 border-t border-[#1C1C1E] pt-2">
                              <span className="text-outline uppercase text-[8px] block font-bold mb-0.5">Construction Steps</span>
                              <span className="font-bold text-text">{blueprint.construction_steps.length} Steps Mapped</span>
                            </div>
                            <div className="col-span-2 border-t border-[#1C1C1E] pt-2">
                              <span className="text-outline uppercase text-[8px] block font-bold mb-0.5">Future Reminder</span>
                              <span className="text-[#FFC700] font-bold block select-text">
                                {blueprint.reflection.futureReminder || "None logged"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-3 pt-4 select-none">
                        <button
                          onClick={() => window.open(link, "_blank", "noopener,noreferrer")}
                          className="w-full bg-gradient-to-r from-primary to-tertiary text-[#000000] font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-primary/5 cursor-pointer text-sm"
                        >
                          <Play className="w-4 h-4 fill-[#000000]" />
                          ATTEMPT ON LEETCODE
                        </button>
                        <button
                          onClick={() => setOpenMode("review")}
                          className="w-full bg-[#111112] border border-border text-text font-semibold py-3 rounded-lg flex items-center justify-center gap-2 hover:border-[#FFC700] transition-colors cursor-pointer text-sm"
                        >
                          PROCEED TO REVIEW ASSESSMENT
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MODE: PROBLEM DESCRIPTION */}
                  {openMode === "description" && (
                    <div className="space-y-6 flex flex-col">
                      <div className="space-y-4">
                        {problemDescription ? (
                          <>
                            <div 
                              className="leetcode-description-content text-xs text-[#E4E4E7] bg-[#0D0D0E]/80 border border-border/50 p-5 rounded-xl leading-relaxed font-body-sm overflow-x-auto whitespace-pre-wrap selection:bg-[#FFC700] selection:text-[#000000]"
                              dangerouslySetInnerHTML={{ __html: problemDescription }}
                            />

                            {likesDislikes.likes > 0 && (
                              <div className="flex items-center gap-4 px-1 select-none font-mono text-[9px] text-outline">
                                <span>LIKES: <span className="text-[#10B981] font-bold">{likesDislikes.likes}</span></span>
                                <span>DISLIKES: <span className="text-red-400 font-bold">{likesDislikes.dislikes}</span></span>
                              </div>
                            )}

                            {problemHints.length > 0 && (
                              <div className="bg-[#101011] border border-border/60 p-4 rounded-xl space-y-3">
                                <span className="block font-mono text-[10px] text-[#FFC700] uppercase font-bold tracking-wider select-none">
                                  System Hints
                                </span>
                                <div className="space-y-2">
                                  {problemHints.map((hint, idx) => (
                                    <CollapsibleHint key={hint} index={idx + 1} content={hint} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-6 animate-pulse select-none">
                            <div className="space-y-3 bg-[#0D0D0E]/80 border border-border/40 p-5 rounded-xl">
                              <div className="h-4 w-3/4 bg-white/5 rounded" />
                              <div className="h-4 w-5/6 bg-white/5 rounded" />
                              <div className="h-4 w-2/3 bg-white/5 rounded" />
                              <div className="h-4 w-full bg-white/5 rounded" />
                            </div>
                            <div className="flex gap-4 px-1">
                              <div className="h-3 w-16 bg-white/5 rounded" />
                              <div className="h-3 w-16 bg-white/5 rounded" />
                            </div>
                            <div className="bg-[#101011] border border-border/40 p-4 rounded-xl space-y-2">
                              <div className="h-3.5 w-24 bg-white/5 rounded mb-3" />
                              <div className="h-10 bg-[#0A0A0B] border border-[#232325] rounded-lg" />
                              <div className="h-10 bg-[#0A0A0B] border border-[#232325] rounded-lg" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-3 pt-2 select-none">
                        <button
                          onClick={() => window.open(link, "_blank", "noopener,noreferrer")}
                          className="w-full bg-gradient-to-r from-primary to-tertiary hover:from-[#FFE14D] hover:to-[#FF8A80] text-[#000000] font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-primary/5 cursor-pointer text-sm font-headline"
                        >
                          <Play className="w-4 h-4 fill-[#000000]" />
                          ATTEMPT ON LEETCODE
                        </button>
                        <button
                          onClick={() => {
                            if (progress && progress.completed) {
                              setOpenMode("review");
                            } else {
                              setOpenMode("reflection");
                            }
                          }}
                          className="w-full bg-[#111112] border border-[#FFC700]/30 hover:border-[#FFC700] text-primary hover:text-[#FFE14D] font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-sm font-headline"
                        >
                          LOG YOUR SUBMISSION
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        {!progress?.completed && (
                          <button
                            onClick={handleMarkPremium}
                            disabled={isSaving}
                            className="w-full bg-red-500/10 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-red-300 font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer text-sm font-headline"
                          >
                            <Lock className="w-4 h-4" />
                            MARK AS PREMIUM PROBLEM (SKIP REVISIONS)
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MODE: INITIAL REFLECTION */}
                  {openMode === "reflection" && (
                    <div className="space-y-6">
                      {/* Confidence */}
                      <div className="space-y-2 select-none">
                        <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                          1. How comfortable were you?
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {[
                            { key: "failed", label: "Couldn't solve without editorial", sub: "Needs revision in 2 days" },
                            { key: "hints", label: "Needed hints", sub: "Needs revision in 4 days" },
                            { key: "not_confident", label: "Solved but not confidently", sub: "Needs revision in 7 days" },
                            { key: "comfortable", label: "Solved comfortably", sub: "Needs revision in 21 days" }
                          ].map(opt => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setConfidence(opt.key)}
                              className={cn(
                                "flex flex-col items-start p-3.5 rounded-lg border text-left transition-all cursor-pointer",
                                confidence === opt.key 
                                  ? "border-primary bg-primary/5 text-primary" 
                                  : "border-border hover:border-outline-variant text-on-surface"
                              )}
                            >
                              <span className="text-xs font-bold font-headline-md">{opt.label}</span>
                              <span className="text-[9px] opacity-60 font-mono mt-1 font-semibold">{opt.sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Pattern Recognition */}
                      <div className="space-y-2 select-none">
                        <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                          2. Did you recognize the correct pattern?
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: "immediate", label: "Immediately" },
                            { key: "thinking", label: "After thinking" },
                            { key: "hints", label: "Only after hints" },
                            { key: "none", label: "Didn't recognize it" }
                          ].map(opt => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setPatternRec(opt.key)}
                              className={cn(
                                "p-3 rounded-lg border text-center transition-all cursor-pointer font-bold text-xs",
                                patternRec === opt.key 
                                  ? "border-primary bg-primary/5 text-primary" 
                                  : "border-border hover:border-outline-variant text-on-surface"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mistakes Multi-select */}
                      <div className="space-y-2 select-none">
                        <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                          3. Common Mistakes Made (Optional)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {mistakeOptions.map(opt => {
                            const selected = mistakes.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleToggleMistake(opt)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all",
                                  selected 
                                    ? "border-primary bg-[#FFC700]/10 text-primary" 
                                    : "border-border hover:border-outline-variant text-outline"
                                )}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Quick Takeaway / Revision Warning */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider select-none">
                            4. Core Revision Reminder / Note to Self
                          </label>
                          <input
                            type="text"
                            value={noteToSelf}
                            onChange={(e) => syncReminderWithBlueprint(e.target.value)}
                            placeholder="e.g. Always verify strict loop bounds (left < right)..."
                            className="w-full bg-[#111112] border border-border focus:border-[#FFC700] rounded-xl p-3 text-xs text-text focus:outline-none focus:ring-1 focus:ring-[#FFC700]/30 leading-relaxed font-body-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider select-none">
                            5. Approach Strategy / Key Insight
                          </label>
                          <textarea
                            value={takeaway}
                            onChange={(e) => syncTakeawayWithBlueprint(e.target.value)}
                            placeholder="What was the optimal solution approach, pattern strategy, or code flow..."
                            className="w-full bg-[#111112] border border-border focus:border-[#FFC700] rounded-xl p-3.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-[#FFC700]/30 min-h-[90px] leading-relaxed custom-scrollbar font-body-sm"
                          />
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="pt-4 select-none">
                        <button
                          onClick={handleSubmitReflection}
                          disabled={isSaving}
                          className="w-full bg-[#FFC700] hover:bg-[#FFE14D] disabled:bg-disabled disabled:cursor-not-allowed text-[#000000] font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
                        >
                          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                          SUBMIT REFLECTION & SCHEDULE
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MODE: REVISIONS FEEDBACK */}
                  {openMode === "review" && (
                    <div className="space-y-6">
                      {/* Repetition feedback */}
                      <div className="space-y-2 select-none">
                        <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                          1. How did this revision feel compared to last time?
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { key: "easier", label: "Easier", sub: "Interval x2.0" },
                            { key: "same", label: "Same", sub: "Interval x1.2" },
                            { key: "difficult", label: "Difficult", sub: "Interval x0.5" }
                          ].map(opt => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setFeedback(opt.key as any)}
                              className={cn(
                                "flex flex-col items-center p-3 rounded-lg border text-center transition-all cursor-pointer",
                                feedback === opt.key 
                                  ? "border-primary bg-primary/5 text-primary font-bold" 
                                  : "border-border hover:border-outline-variant text-on-surface"
                              )}
                            >
                              <span className="text-xs font-headline-md font-bold">{opt.label}</span>
                              <span className="text-[8px] opacity-60 font-mono mt-1">{opt.sub}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Current Confidence */}
                      <div className="space-y-2 select-none">
                        <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                          2. Confidence Level Now
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { key: "failed", label: "Couldn't solve without editorial" },
                            { key: "hints", label: "Needed hints" },
                            { key: "not_confident", label: "Solved but not confidently" },
                            { key: "comfortable", label: "Solved comfortably" }
                          ].map(opt => (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() => setConfidence(opt.key)}
                              className={cn(
                                "p-3 rounded-lg border text-center transition-all cursor-pointer font-bold text-[11px] leading-tight flex items-center justify-center",
                                confidence === opt.key 
                                  ? "border-primary bg-primary/5 text-primary" 
                                  : "border-border hover:border-outline-variant text-on-surface"
                              )}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Mistakes Logged */}
                      <div className="space-y-2 select-none">
                        <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                          3. Any Mistakes Made in This Attempt?
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {mistakeOptions.map(opt => {
                            const selected = mistakes.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => handleToggleMistake(opt)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full border text-xs font-semibold cursor-pointer transition-all",
                                  selected 
                                    ? "border-primary bg-[#FFC700]/10 text-primary" 
                                    : "border-border hover:border-outline-variant text-outline"
                                )}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Notes updates */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                            4. Refine Takeaway notes
                          </label>
                          <textarea
                            value={takeaway}
                            onChange={(e) => syncTakeawayWithBlueprint(e.target.value)}
                            placeholder="Add or refine the biggest lesson learned..."
                            className="w-full bg-[#111112] border border-border focus:border-[#FFC700] rounded-xl p-3.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-[#FFC700]/30 min-h-[70px] leading-relaxed custom-scrollbar font-body-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                            5. Refine Note for Self (Warning)
                          </label>
                          <textarea
                            value={noteToSelf}
                            onChange={(e) => syncReminderWithBlueprint(e.target.value)}
                            placeholder="What warning should you give yourself for the next cycle?"
                            className="w-full bg-[#111112] border border-border focus:border-[#FFC700] rounded-xl p-3.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-[#FFC700]/30 min-h-[70px] leading-relaxed custom-scrollbar font-body-sm"
                          />
                        </div>
                      </div>

                      {/* Submit */}
                      <div className="pt-4 select-none">
                        <button
                          onClick={handleSubmitReview}
                          disabled={isSaving || !feedback}
                          className={cn(
                            "w-full font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors text-sm",
                            (!feedback || isSaving)
                              ? "bg-disabled/40 text-text/40 cursor-not-allowed border border-border"
                              : "bg-[#FFC700] hover:bg-[#FFE14D] text-[#000000] cursor-pointer"
                          )}
                        >
                          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                          {!feedback ? "SELECT REVISION FEELING TO SUBMIT" : "SUBMIT REVIEW ASSESSMENT"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MODE: NOTEBOOK & LOGS */}
                  {openMode === "notebook" && (
                    <div className="space-y-6 flex flex-col h-full">
                      {/* Tabs Header */}
                      <div className="flex border-b border-border select-none">
                        <button
                          onClick={() => setActiveTab("wiki")}
                          className={cn(
                            "flex-1 pb-3 text-center text-xs font-semibold border-b-2 flex items-center justify-center gap-2 transition-colors cursor-pointer",
                            activeTab === "wiki" 
                              ? "border-[#FFC700] text-[#FFC700]" 
                              : "border-transparent text-outline hover:text-text"
                          )}
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          Solution Blueprint
                        </button>
                        <button
                          onClick={() => setActiveTab("history")}
                          className={cn(
                            "flex-1 pb-3 text-center text-xs font-semibold border-b-2 flex items-center justify-center gap-2 transition-colors cursor-pointer",
                            activeTab === "history" 
                              ? "border-[#FFC700] text-[#FFC700]" 
                              : "border-transparent text-outline hover:text-text"
                          )}
                        >
                          <History className="w-3.5 h-3.5" />
                          Practice Logs ({history.length})
                        </button>
                      </div>

                      {/* Tab Content: Solution Blueprint editing */}
                      {activeTab === "wiki" && (() => {
                        const isIdeaDone = !!blueprint.understanding.keyObservation;
                        const isStrategyDone = !!blueprint.selection.patternUsed;
                        const isBuildDone = blueprint.construction_steps.length > 0 && blueprint.construction_steps.some(s => s.title);
                        const isPerfDone = !!blueprint.complexities.timeComplexity && !!blueprint.complexities.spaceComplexity;
                        const isRememberDone = !!blueprint.reflection.futureReminder;
                        
                        return (
                          <div className="space-y-5 select-text pb-8">
                            {/* Progress HUD */}
                            <div className="bg-[#111112] border border-border rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-badge-sm font-mono-label text-outline/80 select-none">
                              <span className="text-[10px] text-outline uppercase font-bold tracking-wider">Workflow Progress</span>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 items-center justify-center">
                                <span className={cn("flex items-center gap-1 transition-colors", isIdeaDone ? "text-secondary font-bold" : "text-outline/40")}>
                                  {isIdeaDone ? "✓" : "○"} Idea
                                </span>
                                <span className="text-outline/20">/</span>
                                <span className={cn("flex items-center gap-1 transition-colors", isStrategyDone ? "text-secondary font-bold" : "text-outline/40")}>
                                  {isStrategyDone ? "✓" : "○"} Strategy
                                </span>
                                <span className="text-outline/20">/</span>
                                <span className={cn("flex items-center gap-1 transition-colors", isBuildDone ? "text-secondary font-bold" : "text-outline/40")}>
                                  {isBuildDone ? "✓" : "○"} Build
                                </span>
                                <span className="text-outline/20">/</span>
                                <span className={cn("flex items-center gap-1 transition-colors", isPerfDone ? "text-secondary font-bold" : "text-outline/40")}>
                                  {isPerfDone ? "✓" : "○"} Performance
                                </span>
                                <span className="text-outline/20">/</span>
                                <span className={cn("flex items-center gap-1 transition-colors", isRememberDone ? "text-secondary font-bold" : "text-outline/40")}>
                                  {isRememberDone ? "✓" : "○"} Remember
                                </span>
                              </div>
                            </div>

                            {/* 5 Collapsible Cards */}
                            <div className="space-y-4">
                              {/* Card 1: THE IDEA */}
                              <AccordionSection
                                title="THE IDEA"
                                isExpanded={expandedSections.understanding}
                                onToggle={() => toggleSection("understanding")}
                              >
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <label className="text-outline uppercase text-badge-sm font-bold block">Key Observation</label>
                                    <textarea
                                      value={blueprint.understanding.keyObservation}
                                      onChange={(e) => updateBlueprintField("understanding", "keyObservation", e.target.value)}
                                      placeholder="What changed the problem from brute force to optimal?"
                                      className="w-full bg-[#111112] border border-border rounded-lg p-3 text-body-sm text-text focus:outline-none focus:border-[#FFC700] min-h-[70px] font-body-sm leading-relaxed"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-outline uppercase text-badge-sm font-bold block">Memory Trick (Hidden Trick)</label>
                                    <input
                                      type="text"
                                      value={blueprint.understanding.hiddenTrick}
                                      onChange={(e) => updateBlueprintField("understanding", "hiddenTrick", e.target.value)}
                                      placeholder="What is the non-obvious twist or edge case constraint to remember?"
                                      className="w-full bg-[#111112] border border-border rounded-lg px-2.5 py-2 text-body-sm text-text focus:outline-none focus:border-[#FFC700]"
                                    />
                                  </div>
                                  <div className="flex justify-end pt-2 border-t border-border/20">
                                    <button
                                      type="button"
                                      onClick={() => proceedToSection("understanding", "selection")}
                                      className="text-primary hover:text-[#FFE14D] text-badge-sm font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      PROCEED TO STRATEGY <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </AccordionSection>

                              {/* Card 2: THE STRATEGY */}
                              <AccordionSection
                                title="THE STRATEGY"
                                isExpanded={expandedSections.selection}
                                onToggle={() => toggleSection("selection")}
                              >
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <label className="text-outline uppercase text-badge-sm font-bold block">Algorithmic Pattern</label>
                                    <input
                                      type="text"
                                      value={blueprint.selection.patternUsed}
                                      onChange={(e) => updateBlueprintField("selection", "patternUsed", e.target.value)}
                                      placeholder="Enter algorithmic pattern (e.g. Tree BFS, Sliding Window...)"
                                      className="w-full bg-[#111112] border border-border rounded-lg px-2.5 py-2 text-body-sm text-text focus:outline-none focus:border-[#FFC700]"
                                    />
                                    {blueprint.selection.patternUsed && (
                                      <a
                                        href={`/patterns/${slugifyPattern(blueprint.selection.patternUsed)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-primary hover:text-[#FFE14D] text-badge-sm font-mono-label font-bold inline-flex items-center gap-1 hover:underline transition-colors mt-2"
                                      >
                                        <BookOpen className="w-3.5 h-3.5" />
                                        OPEN PATTERN ATLAS
                                      </a>
                                    )}
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-outline uppercase text-badge-sm font-bold block">Why this pattern?</label>
                                    <input
                                      type="text"
                                      value={blueprint.selection.whyPattern}
                                      onChange={(e) => updateBlueprintField("selection", "whyPattern", e.target.value)}
                                      placeholder="What features of the input/constraints made this pattern the optimal choice?"
                                      className="w-full bg-[#111112] border border-border rounded-lg px-2.5 py-2 text-body-sm text-text focus:outline-none focus:border-[#FFC700]"
                                    />
                                  </div>
                                  <div className="flex justify-end pt-2 border-t border-border/20">
                                    <button
                                      type="button"
                                      onClick={() => proceedToSection("selection", "construction")}
                                      className="text-primary hover:text-[#FFE14D] text-badge-sm font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      PROCEED TO BUILD THE SOLUTION <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </AccordionSection>

                              {/* Card 3: BUILD THE SOLUTION */}
                              <AccordionSection
                                title="BUILD THE SOLUTION"
                                isExpanded={expandedSections.construction}
                                onToggle={() => toggleSection("construction")}
                              >
                                <div className="space-y-6">
                                  {/* Connected vertical timeline */}
                                  <div className="relative border-l-2 border-[#2D2D2D]/60 ml-3 pl-6 space-y-6 py-2 select-none">
                                    {blueprint.construction_steps.map((step, idx) => (
                                      <div key={idx} className="relative group">
                                        {/* Node bullet */}
                                        <div className="absolute -left-[32px] top-2 w-4 h-4 rounded-full bg-[#111112] border-2 border-primary flex items-center justify-center text-[8px] font-bold text-primary shadow-[0_0_8px_rgba(255,212,0,0.3)]">
                                          {idx + 1}
                                        </div>

                                        <div className="space-y-2">
                                          <div className="flex items-center justify-between">
                                            <span className="font-mono-label text-badge-sm text-[#FFC700]/90 font-bold uppercase tracking-wider">
                                              Step Node {idx + 1}
                                            </span>
                                            <div className="flex items-center gap-1 bg-black/35 border border-border/50 rounded p-0.5 opacity-80 group-hover:opacity-100 transition-opacity">
                                              <button
                                                type="button"
                                                onClick={() => handleMoveStep(idx, "up")}
                                                disabled={idx === 0}
                                                className="p-1 text-outline hover:text-primary disabled:opacity-20 cursor-pointer transition-colors"
                                                title="Move Up"
                                              >
                                                <ArrowUp className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleMoveStep(idx, "down")}
                                                disabled={idx === blueprint.construction_steps.length - 1}
                                                className="p-1 text-outline hover:text-primary disabled:opacity-20 cursor-pointer transition-colors"
                                                title="Move Down"
                                              >
                                                <ArrowDown className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                type="button"
                                                onClick={() => handleRemoveStep(idx)}
                                                className="p-1 text-outline hover:text-red-400 cursor-pointer transition-colors"
                                                title="Delete Step"
                                              >
                                                <Trash2 className="w-3.5 h-3.5" />
                                              </button>
                                            </div>
                                          </div>
                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <input
                                              type="text"
                                              value={step.title}
                                              onChange={(e) => handleUpdateStep(idx, "title", e.target.value)}
                                              placeholder="e.g. Initialize Queue"
                                              className="w-full bg-[#111112] border border-border rounded-lg px-2.5 py-1.5 text-body-sm text-text font-bold select-text focus:outline-none focus:border-[#FFC700]"
                                            />
                                            <input
                                              type="text"
                                              value={step.reason}
                                              onChange={(e) => handleUpdateStep(idx, "reason", e.target.value)}
                                              placeholder="e.g. Push root node to start traversal..."
                                              className="w-full bg-[#111112] border border-border rounded-lg px-2.5 py-1.5 text-body-sm text-text sm:col-span-2 select-text focus:outline-none focus:border-[#FFC700]"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleAddStep}
                                    className="w-full border border-dashed border-border/80 hover:border-primary/50 py-2.5 rounded-lg text-body-sm font-semibold text-outline hover:text-[#FFC700] transition-colors flex items-center justify-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4" />
                                    ADD TIMELINE STEP
                                  </button>

                                  <div className="flex justify-end pt-2 border-t border-border/20">
                                    <button
                                      type="button"
                                      onClick={() => proceedToSection("construction", "complexities")}
                                      className="text-primary hover:text-[#FFE14D] text-badge-sm font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      PROCEED TO PERFORMANCE <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </AccordionSection>

                              {/* Card 4: PERFORMANCE */}
                              <AccordionSection
                                title="PERFORMANCE"
                                isExpanded={expandedSections.complexities}
                                onToggle={() => toggleSection("complexities")}
                              >
                                <div className="space-y-4">
                                  {/* Time Complexity */}
                                  <div className="space-y-1.5">
                                    <label className="text-outline uppercase text-badge-sm font-bold font-mono-label">Time Complexity</label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {COMPLEXITY_OPTIONS.map(opt => (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => updateBlueprintField("complexities", "timeComplexity", opt)}
                                          className={cn(
                                            "px-2.5 py-1 rounded text-badge-sm font-mono-label font-bold border transition-all cursor-pointer",
                                            blueprint.complexities.timeComplexity === opt
                                              ? "border-[#FFC700] bg-[#FFC700]/10 text-[#FFC700]"
                                              : "border-border hover:border-outline text-outline"
                                          )}
                                        >
                                          {opt}
                                        </button>
                                      ))}
                                    </div>
                                    <input
                                      type="text"
                                      value={blueprint.complexities.timeWhy}
                                      onChange={(e) => updateBlueprintField("complexities", "timeWhy", e.target.value)}
                                      placeholder="Why this complexity? (e.g. single pass linear scan)"
                                      className="w-full bg-[#111112] border border-border rounded-lg px-2.5 py-1.5 text-body-sm text-text focus:outline-none focus:border-[#FFC700] mt-1"
                                    />
                                  </div>

                                  {/* Space Complexity */}
                                  <div className="space-y-1.5 border-t border-[#1C1C1E] pt-3">
                                    <label className="text-outline uppercase text-badge-sm font-bold font-mono-label">Space Complexity</label>
                                    <div className="flex flex-wrap gap-1.5">
                                      {COMPLEXITY_OPTIONS.slice(0, 4).map(opt => (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => updateBlueprintField("complexities", "spaceComplexity", opt)}
                                          className={cn(
                                            "px-2.5 py-1 rounded text-badge-sm font-mono-label font-bold border transition-all cursor-pointer",
                                            blueprint.complexities.spaceComplexity === opt
                                              ? "border-[#FFC700] bg-[#FFC700]/10 text-[#FFC700]"
                                              : "border-border hover:border-outline text-outline"
                                          )}
                                        >
                                          {opt}
                                        </button>
                                      ))}
                                    </div>
                                    <input
                                      type="text"
                                      value={blueprint.complexities.spaceWhy}
                                      onChange={(e) => updateBlueprintField("complexities", "spaceWhy", e.target.value)}
                                      placeholder="Why this complexity? (e.g. visited set sizes)"
                                      className="w-full bg-[#111112] border border-border rounded-lg px-2.5 py-1.5 text-body-sm text-text focus:outline-none focus:border-[#FFC700] mt-1"
                                    />
                                  </div>

                                  <div className="flex justify-end pt-2 border-t border-border/20">
                                    <button
                                      type="button"
                                      onClick={() => proceedToSection("complexities", "reflection")}
                                      className="text-primary hover:text-[#FFE14D] text-badge-sm font-bold flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                      PROCEED TO REMEMBER <ChevronRight className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </AccordionSection>

                              {/* Card 5: REMEMBER */}
                              <AccordionSection
                                title="REMEMBER"
                                isExpanded={expandedSections.reflection}
                                onToggle={() => toggleSection("reflection")}
                              >
                                <div className="space-y-4">
                                  <div className="space-y-1">
                                    <label className="text-outline uppercase text-badge-sm font-bold block">Biggest Mistake</label>
                                    <input
                                      type="text"
                                      value={blueprint.reflection.biggestMistake}
                                      onChange={(e) => updateBlueprintField("reflection", "biggestMistake", e.target.value)}
                                      placeholder="What was the main cognitive bottleneck or bug during your first attempt?"
                                      className="w-full bg-[#111112] border border-border rounded-lg px-2.5 py-1.5 text-body-sm text-text focus:outline-none focus:border-[#FFC700]"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-outline uppercase text-badge-sm font-bold block text-red-400">⚠️ Future Reminder (Warnings)</label>
                                    <input
                                      type="text"
                                      value={blueprint.reflection.futureReminder}
                                      onChange={(e) => {
                                        updateBlueprintField("reflection", "futureReminder", e.target.value);
                                        setNoteToSelf(e.target.value);
                                      }}
                                      placeholder="What mistake should future you avoid?"
                                      className="w-full bg-[#111112] border border-border focus:border-red-500 rounded-lg px-2.5 py-1.5 text-body-sm text-text focus:outline-none"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-outline uppercase text-badge-sm font-bold block">Interview explanation (takeaway)</label>
                                    <textarea
                                      value={blueprint.reflection.interviewExplanation}
                                      onChange={(e) => {
                                        updateBlueprintField("reflection", "interviewExplanation", e.target.value);
                                        setTakeaway(e.target.value);
                                      }}
                                      placeholder="How would you explain the core strategy to an interviewer in under 30 seconds?"
                                      className="w-full bg-[#111112] border border-border rounded-lg p-3 text-body-sm text-text focus:outline-none focus:border-[#FFC700] min-h-[70px] font-body-sm leading-relaxed"
                                    />
                                  </div>
                                </div>
                              </AccordionSection>
                            </div>

                            {/* Save Action Button */}
                            <div className="select-none pt-2">
                              <button
                                onClick={handleSaveNotebook}
                                disabled={isSaving}
                                className="w-full bg-[#FFC700] hover:bg-[#FFE14D] disabled:bg-disabled disabled:cursor-not-allowed text-[#000000] font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
                              >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                SAVE SOLUTION BLUEPRINT
                              </button>
                            </div>

                            {/* Live Solution Snapshot Card */}
                            <div className="border border-[#FFC700]/30 bg-[#FFC700]/5 rounded-xl p-4 space-y-3 font-mono-label text-body-sm select-none">
                              <div className="flex items-center justify-between border-b border-[#FFC700]/25 pb-2 text-badge-sm uppercase font-bold text-[#FFC700] tracking-widest">
                                <span>SYSTEM LOG: SOLUTION SNAPSHOT</span>
                                <span className={cn("animate-pulse", notebook ? "text-secondary" : "text-primary")}>
                                  {notebook ? "● SAVED" : "○ EDITING LIVE"}
                                </span>
                              </div>
                              <div className="grid grid-cols-2 gap-3 text-badge-sm select-text">
                                <div>
                                  <span className="text-outline uppercase text-badge-sm block font-bold">Pattern</span>
                                  <span className="font-bold text-text">{blueprint.selection.patternUsed || "Not Specified"}</span>
                                </div>
                                <div>
                                  <span className="text-outline uppercase text-badge-sm block font-bold">Complexity</span>
                                  <span className="font-bold text-text">
                                    {blueprint.complexities.timeComplexity} TC / {blueprint.complexities.spaceComplexity} SC
                                  </span>
                                </div>
                                <div className="col-span-2 border-t border-[#FFC700]/10 pt-2">
                                  <span className="text-outline uppercase text-badge-sm block font-bold mb-0.5">Key Observation</span>
                                  <span className="text-text font-medium block max-h-[80px] overflow-y-auto">{blueprint.understanding.keyObservation || "None"}</span>
                                </div>
                                <div>
                                  <span className="text-outline uppercase text-badge-sm block font-bold">Construction</span>
                                  <span className="font-bold text-text">{blueprint.construction_steps.length} Steps Mapped</span>
                                </div>
                                <div className="col-span-2 border-t border-[#FFC700]/10 pt-2">
                                  <span className="text-outline uppercase text-badge-sm block font-bold mb-0.5">Future Reminder</span>
                                  <span className="text-[#FFC700] font-bold block">{blueprint.reflection.futureReminder || "None"}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Tab Content: History Logs */}
                      {activeTab === "history" && (
                        <div className="space-y-4 select-none">
                          {history.length > 0 ? (
                            <div className="relative border-l border-border pl-4 space-y-6 py-2 select-none">
                              {history.map((log, index) => (
                                <div key={log.id} className="relative">
                                  <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-[#FFC700] border border-[#0B0B0C]" />
                                  
                                  <div className="bg-[#111112] border border-border rounded-xl p-4 space-y-2.5">
                                    <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                                      <span className="text-[#FFC700]">ATTEMPT #{log.attempt_number}</span>
                                      <span className="text-outline">
                                        {new Date(log.created_at).toLocaleDateString(undefined, { 
                                          year: 'numeric', month: 'short', day: 'numeric' 
                                        })}
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                                      <div>
                                        <span className="text-outline block text-[9px] uppercase font-semibold">Confidence</span>
                                        <span className="font-bold text-text">
                                          {log.confidence.replace("_", " ").toUpperCase()}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-outline block text-[9px] uppercase font-semibold">Recognition</span>
                                        <span className="font-bold text-text">
                                          {log.pattern_recognition.toUpperCase()}
                                        </span>
                                      </div>
                                    </div>
                                    {log.mistake_types.length > 0 && (
                                      <div className="border-t border-[#232325] pt-2">
                                        <span className="text-outline block text-[9px] uppercase font-semibold mb-1">Mistakes</span>
                                        <div className="flex flex-wrap gap-1">
                                          {log.mistake_types.map((m: string) => (
                                            <span key={m} className="text-[9px] px-1.5 py-0.5 rounded border border-[#2D2D2D] bg-[#18181A] text-outline">
                                              {m}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12 border border-dashed border-border rounded-xl">
                              <AlertTriangle className="w-6 h-6 text-outline/40 mx-auto mb-2" />
                              <span className="block font-mono text-[11px] text-outline uppercase tracking-wider">No attempts logged yet</span>
                              <span className="block text-[10px] text-outline/60 mt-1">Reflections and scheduled reviews are logged here.</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
