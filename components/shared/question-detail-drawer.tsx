"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, ExternalLink, Loader2, BookOpen, History, Sparkles, 
  Clock, AlertTriangle, CheckCircle2, ChevronRight, Save, Play, RefreshCw, ArrowLeft 
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { cn, fetchWithCache } from "@/lib/utils";

function CollapsibleHint({ index, content }: { index: number; content: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border border-[#232325] rounded-lg overflow-hidden bg-[#0A0A0B] select-none">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2.5 font-mono text-[10px] text-outline hover:text-[#FFC700] hover:bg-[#121214] transition-colors text-left cursor-pointer font-bold uppercase select-none"
      >
        <span>Hint {index}</span>
        <span className="text-[10px]">{isOpen ? "[-]" : "[+]"}</span>
      </button>
      {isOpen && (
        <div 
          className="p-3 text-xs text-[#E4E4E7] border-t border-[#1C1C1E] font-body-sm leading-relaxed whitespace-pre-wrap select-text bg-[#070708] leetcode-description-content"
          dangerouslySetInnerHTML={{ __html: content }}
        />
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
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("question_id", qId)
          .maybeSingle();

        setProgress(progressData);

        // 2. Fetch notebook entries
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
        }

        // 3. Fetch history
        const { data: historyData } = await supabase
          .from("user_reflection_log")
          .select("*")
          .eq("user_id", userId)
          .eq("question_id", qId)
          .order("attempt_number", { ascending: true });

        setHistory(historyData || []);

        // 4. Fetch LeetCode description from Alfa API
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

  // Submit Reflection (First solve)
  const handleSubmitReflection = async () => {
    if (!user || !qId) return;
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

      // 1. Upsert progress entry
      const { error: progressError } = await supabase
        .from("user_progress")
        .upsert({
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

      // 3. Upsert takeaways to notebook
      const { error: notebookError } = await supabase
        .from("user_notebooks")
        .upsert({
          user_id: userId,
          question_id: qId,
          biggest_takeaway: takeaway,
          note_to_self: noteToSelf,
          updated_at: completedAt
        });

      if (notebookError) throw notebookError;

      // Save local storage cache for immediate offline list sync
      const timestamps = JSON.parse(localStorage.getItem("solved_questions_timestamps") || "{}");
      timestamps[qId] = completedAt;
      localStorage.setItem("solved_questions_timestamps", JSON.stringify(timestamps));

      // Trigger micro-success state
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
    if (!user || !qId || !feedback) return;
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

      // Check if this revision is solved early (before the next_revision_due timestamp)
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

      // 1. Update progress fields via upsert for maximum compatibility and primary-key safety
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

      if (progressError) {
        console.error("Progress upsert failed in handleSubmitReview:", progressError);
        throw progressError;
      }

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

      // 3. Update mutable takeaways in notebook
      const { error: notebookError } = await supabase
        .from("user_notebooks")
        .upsert({
          user_id: userId,
          question_id: qId,
          biggest_takeaway: takeaway,
          note_to_self: noteToSelf,
          updated_at: nowStr
        });

      if (notebookError) throw notebookError;

      // Trigger completion animations
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

  // Save Notebook (Mutable structured study journal)
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
          biggest_takeaway: takeaway,
          note_to_self: noteToSelf,
          brute_force: bruteForce,
          optimization: optimization,
          pattern_strategy: patternStrategy,
          dry_run: dryRun,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      // Temporary success splash
      setSuccessMsg("STUDY WIKI UPDATED SUCCESS");
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
    setIsOpen(false);
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
                {(openMode === "reflection" || openMode === "review") && (
                  <button 
                    onClick={() => setOpenMode("description")}
                    className="w-8 h-8 rounded-lg border border-border flex items-center justify-center hover:bg-surface-container-highest hover:text-[#FFC700] transition-colors cursor-pointer select-none"
                    title="Back to Description"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                )}
                <div>
                  <div className="flex items-center gap-3 mb-1 select-none">
                    <span className="font-mono text-xs text-[#FFC700] uppercase font-bold tracking-wider">
                      {openMode === "reflection" && "Solve Reflection"}
                      {openMode === "review" && "Review Assessment"}
                      {openMode === "priming" && "Memory Priming"}
                      {openMode === "notebook" && "Question Workspace"}
                      {openMode === "description" && "Problem Description"}
                    </span>
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary/80 animate-pulse" />
                  </div>
                  <h3 className="font-headline-md text-lg text-text font-bold leading-tight">{title}</h3>
                  <div className="flex items-center gap-2 mt-1.5 select-none">
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

                      {/* Memory Notes Card */}
                      <div className="bg-[#111112] border border-border p-5 rounded-xl space-y-4">
                        <div className="flex items-center gap-2 font-mono text-[11px] text-[#FFC700] uppercase font-bold tracking-wider select-none border-b border-border pb-3">
                          <BookOpen className="w-4 h-4" />
                          Last Study Takeaways
                        </div>
                        <div className="space-y-4">
                          <div>
                            <span className="block text-[10px] text-outline font-semibold uppercase mb-1">Biggest Takeaway</span>
                            <p className="font-body-sm text-xs text-text bg-[#09090A] p-3 rounded border border-[#232325] whitespace-pre-wrap min-h-[50px] leading-relaxed">
                              {takeaway || "No takeaway notes recorded yet."}
                            </p>
                          </div>
                          <div>
                            <span className="block text-[10px] text-outline font-semibold uppercase mb-1">Note For Future Self</span>
                            <p className="font-body-sm text-xs text-text bg-[#09090A] p-3 rounded border border-[#232325] whitespace-pre-wrap min-h-[50px] leading-relaxed">
                              {noteToSelf || "No self warnings recorded yet."}
                            </p>
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
                                    <CollapsibleHint key={idx} index={idx + 1} content={hint} />
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        ) : (
                          <div className="space-y-6 animate-pulse select-none">
                            {/* Paragraph skeleton */}
                            <div className="space-y-3 bg-[#0D0D0E]/80 border border-border/40 p-5 rounded-xl">
                              <div className="h-4 w-3/4 bg-white/5 rounded" />
                              <div className="h-4 w-5/6 bg-white/5 rounded" />
                              <div className="h-4 w-2/3 bg-white/5 rounded" />
                              <div className="h-4 w-full bg-white/5 rounded" />
                            </div>
                            {/* Likes and dislikes skeleton */}
                            <div className="flex gap-4 px-1">
                              <div className="h-3 w-16 bg-white/5 rounded" />
                              <div className="h-3 w-16 bg-white/5 rounded" />
                            </div>
                            {/* System Hints accordion skeleton */}
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

                      {/* Takeaways & Future Warnings */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                            4. Biggest Takeaway
                          </label>
                          <textarea
                            value={takeaway}
                            onChange={(e) => setTakeaway(e.target.value)}
                            placeholder="What was the key algorithmic trick or blueprint of this problem?"
                            className="w-full bg-[#111112] border border-border focus:border-[#FFC700] rounded-xl p-3.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-[#FFC700]/30 min-h-[70px] leading-relaxed custom-scrollbar font-body-sm"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                            5. Note for Future Self (Warning)
                          </label>
                          <textarea
                            value={noteToSelf}
                            onChange={(e) => setNoteToSelf(e.target.value)}
                            placeholder="What off-by-one or special edge case should you verify next time?"
                            className="w-full bg-[#111112] border border-border focus:border-[#FFC700] rounded-xl p-3.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-[#FFC700]/30 min-h-[70px] leading-relaxed custom-scrollbar font-body-sm"
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
                            onChange={(e) => setTakeaway(e.target.value)}
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
                            onChange={(e) => setNoteToSelf(e.target.value)}
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
                          className="w-full bg-[#FFC700] hover:bg-[#FFE14D] disabled:bg-disabled disabled:cursor-not-allowed text-[#000000] font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
                        >
                          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                          SUBMIT REVIEW ASSESSMENT
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
                          Study Wiki
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

                      {/* Tab Content: Study Wiki */}
                      {activeTab === "wiki" && (
                        <div className="space-y-5">
                          {/* Core notes */}
                          <div className="space-y-2">
                            <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                              Biggest Takeaway
                            </label>
                            <textarea
                              value={takeaway}
                              onChange={(e) => setTakeaway(e.target.value)}
                              placeholder="Key concept/trick to remember..."
                              className="w-full bg-[#111112] border border-border focus:border-[#FFC700] rounded-xl p-3 text-xs text-text focus:outline-none min-h-[50px] leading-relaxed custom-scrollbar font-body-sm"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="block font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                              Note to Future Self
                            </label>
                            <textarea
                              value={noteToSelf}
                              onChange={(e) => setNoteToSelf(e.target.value)}
                              placeholder="Off-by-one or special cases to avoid..."
                              className="w-full bg-[#111112] border border-border focus:border-[#FFC700] rounded-xl p-3 text-xs text-text focus:outline-none min-h-[50px] leading-relaxed custom-scrollbar font-body-sm"
                            />
                          </div>

                          {/* Extended interview sections */}
                          <div className="bg-[#101011] border border-border p-4 rounded-xl space-y-4">
                            <div className="font-mono text-[10px] text-[#FFC700] uppercase font-bold tracking-wider select-none">
                              Structured Interview Notebook
                            </div>
                            
                            <div className="space-y-2">
                              <label className="block font-mono text-[9px] text-outline uppercase font-bold tracking-wider">
                                1. Brute Force Approach
                              </label>
                              <textarea
                                value={bruteForce}
                                onChange={(e) => setBruteForce(e.target.value)}
                                placeholder="How would you explain the naive O(N^2) approach verbally?"
                                className="w-full bg-[#080809] border border-border focus:border-[#FFC700] rounded-lg p-2.5 text-xs text-text focus:outline-none min-h-[50px] leading-relaxed custom-scrollbar font-body-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block font-mono text-[9px] text-outline uppercase font-bold tracking-wider">
                                2. Optimization Transition
                              </label>
                              <textarea
                                value={optimization}
                                onChange={(e) => setOptimization(e.target.value)}
                                placeholder="What is the optimization path? e.g. Sorting, Hash Map, DP?"
                                className="w-full bg-[#080809] border border-border focus:border-[#FFC700] rounded-lg p-2.5 text-xs text-text focus:outline-none min-h-[50px] leading-relaxed custom-scrollbar font-body-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block font-mono text-[9px] text-outline uppercase font-bold tracking-wider">
                                3. Pattern & Strategy
                              </label>
                              <textarea
                                value={patternStrategy}
                                onChange={(e) => setPatternStrategy(e.target.value)}
                                placeholder="Why does the pattern apply? What is the mathematical proof/insight?"
                                className="w-full bg-[#080809] border border-border focus:border-[#FFC700] rounded-lg p-2.5 text-xs text-text focus:outline-none min-h-[50px] leading-relaxed custom-scrollbar font-body-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              <label className="block font-mono text-[9px] text-outline uppercase font-bold tracking-wider">
                                4. Sample Dry Run
                              </label>
                              <textarea
                                value={dryRun}
                                onChange={(e) => setDryRun(e.target.value)}
                                placeholder="Walk through a single trace example (e.g. tracking index updates)"
                                className="w-full bg-[#080809] border border-border focus:border-[#FFC700] rounded-lg p-2.5 text-xs text-text focus:outline-none min-h-[50px] leading-relaxed custom-scrollbar font-body-sm"
                              />
                            </div>
                          </div>

                          {/* Save action */}
                          <div className="select-none pt-2">
                            <button
                              onClick={handleSaveNotebook}
                              disabled={isSaving}
                              className="w-full bg-[#FFC700] hover:bg-[#FFE14D] disabled:bg-disabled disabled:cursor-not-allowed text-[#000000] font-bold py-3.5 rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer text-sm"
                            >
                              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                              SAVE STUDY JOURNAL
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Tab Content: History Logs */}
                      {activeTab === "history" && (
                        <div className="space-y-4">
                          {history.length > 0 ? (
                            <div className="relative border-l border-border pl-4 space-y-6 py-2 select-none">
                              {history.map((log, index) => (
                                <div key={log.id} className="relative">
                                  {/* Timeline marker */}
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
