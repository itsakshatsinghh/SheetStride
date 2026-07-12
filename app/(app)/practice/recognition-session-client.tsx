"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowRight, CheckCircle, AlertCircle, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface RecognitionSessionClientProps {
  onClose: () => void;
  preSelectedPattern?: string;
  onXPUpdate: () => void;
}

const PATTERNS_LIST = [
  { slug: "sliding-window", name: "Sliding Window" },
  { slug: "two-pointers", name: "Two Pointers" },
  { slug: "fast-slow-pointers", name: "Fast & Slow Pointers" },
  { slug: "merge-intervals", name: "Merge Intervals" },
  { slug: "cyclic-sort", name: "Cyclic Sort" },
  { slug: "in-place-reversal-of-a-linked-list", name: "In-place Reversal of a Linked List" },
  { slug: "tree-breadth-first-search-bfs", name: "Tree Breadth-First Search (BFS)" },
  { slug: "tree-depth-first-search-dfs", name: "Tree Depth-First Search (DFS)" },
  { slug: "two-heaps", name: "Two Heaps" },
  { slug: "subsets", name: "Subsets" },
  { slug: "modified-binary-search", name: "Modified Binary Search" },
  { slug: "bitwise-xor", name: "Bitwise XOR" },
  { slug: "top-k-elements", name: "Top 'K' Elements" },
  { slug: "k-way-merge", name: "K-way Merge" },
  { slug: "-1-knapsack-dynamic-programming", name: "0-1 Knapsack (Dynamic Programming)" },
  { slug: "topological-sort-graph", name: "Topological Sort (Graph)" }
];

const REFLECTION_CHIPS = [
  "Clue was obvious",
  "Tricky description",
  "Guessed by process of elimination",
  "Mistook for other pattern",
  "Overlooked crucial constraint"
];

function decodeEntities(str: string): string {
  if (!str) return "";
  return str
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&");
}

function parseLeetCodeDescription(htmlOrText: string): {
  statement: string;
  examples: string[];
  constraints: string;
} {
  const decoded = decodeEntities(htmlOrText);
  if (!decoded) return { statement: "", examples: [], constraints: "" };

  const exampleIndex = decoded.indexOf("Example 1:");
  const constraintsIndex = decoded.indexOf("Constraints:");

  let statement = decoded;
  let examplesText = "";
  let constraintsText = "";

  if (exampleIndex !== -1) {
    statement = decoded.substring(0, exampleIndex).trim();
    if (constraintsIndex !== -1 && constraintsIndex > exampleIndex) {
      examplesText = decoded.substring(exampleIndex, constraintsIndex).trim();
      constraintsText = decoded.substring(constraintsIndex).trim();
    } else {
      examplesText = decoded.substring(exampleIndex).trim();
    }
  } else if (constraintsIndex !== -1) {
    statement = decoded.substring(0, constraintsIndex).trim();
    constraintsText = decoded.substring(constraintsIndex).trim();
  }

  const examples: string[] = [];
  if (examplesText) {
    const rawParts = examplesText.split(/(Example \d+:)/g);
    for (let i = 1; i < rawParts.length; i += 2) {
      const header = rawParts[i];
      const body = rawParts[i + 1] || "";
      examples.push(`${header}${body}`.trim());
    }
  }

  return {
    statement,
    examples: examples.length > 0 ? examples : (examplesText ? [examplesText] : []),
    constraints: constraintsText
  };
}

const FALLBACK_QUESTIONS = [
  { question_id: 209, title: "Minimum Size Subarray Sum", difficulty: "Medium", link: "https://leetcode.com/problems/minimum-size-subarray-sum/", pattern_name: "Sliding Window" },
  { question_id: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", pattern_name: "Sliding Window" },
  { question_id: 1004, title: "Max Consecutive Ones III", difficulty: "Medium", link: "https://leetcode.com/problems/max-consecutive-ones-iii/", pattern_name: "Sliding Window" },
  { question_id: 643, title: "Maximum Average Subarray I", difficulty: "Easy", link: "https://leetcode.com/problems/maximum-average-subarray-i/", pattern_name: "Sliding Window" },
  { question_id: 167, title: "Two Sum II - Input Array Is Sorted", difficulty: "Easy", link: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", pattern_name: "Two Pointers" },
  { question_id: 15, title: "3Sum", difficulty: "Medium", link: "https://leetcode.com/problems/3sum/", pattern_name: "Two Pointers" },
  { question_id: 11, title: "Container With Most Water", difficulty: "Medium", link: "https://leetcode.com/problems/container-with-most-water/", pattern_name: "Two Pointers" },
  { question_id: 977, title: "Squares of a Sorted Array", difficulty: "Easy", link: "https://leetcode.com/problems/squares-of-a-sorted-array/", pattern_name: "Two Pointers" },
  { question_id: 141, title: "Linked List Cycle", difficulty: "Easy", link: "https://leetcode.com/problems/linked-list-cycle/", pattern_name: "Fast & Slow Pointers" },
  { question_id: 142, title: "Linked List Cycle II", difficulty: "Medium", link: "https://leetcode.com/problems/linked-list-cycle-ii/", pattern_name: "Fast & Slow Pointers" },
  { question_id: 287, title: "Find the Duplicate Number", difficulty: "Medium", link: "https://leetcode.com/problems/find-the-duplicate-number/", pattern_name: "Fast & Slow Pointers" },
  { question_id: 56, title: "Merge Intervals", difficulty: "Medium", link: "https://leetcode.com/problems/merge-intervals/", pattern_name: "Merge Intervals" },
  { question_id: 57, title: "Insert Interval", difficulty: "Medium", link: "https://leetcode.com/problems/insert-interval/", pattern_name: "Merge Intervals" },
  { question_id: 986, title: "Interval List Intersections", difficulty: "Medium", link: "https://leetcode.com/problems/interval-list-intersections/", pattern_name: "Merge Intervals" },
  { question_id: 268, title: "Missing Number", difficulty: "Easy", link: "https://leetcode.com/problems/missing-number/", pattern_name: "Cyclic Sort" },
  { question_id: 448, title: "Find All Numbers Disappeared in an Array", difficulty: "Easy", link: "https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/", pattern_name: "Cyclic Sort" },
  { question_id: 102, title: "Binary Tree Level Order Traversal", difficulty: "Medium", link: "https://leetcode.com/problems/binary-tree-level-order-traversal/", pattern_name: "Tree Breadth-First Search (BFS)" },
  { question_id: 107, title: "Binary Tree Level Order Traversal II", difficulty: "Medium", link: "https://leetcode.com/problems/binary-tree-level-order-traversal-ii/", pattern_name: "Tree Breadth-First Search (BFS)" },
  { question_id: 104, title: "Maximum Depth of Binary Tree", difficulty: "Easy", link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", pattern_name: "Tree Depth-First Search (DFS)" },
  { question_id: 112, title: "Path Sum", difficulty: "Easy", link: "https://leetcode.com/problems/path-sum/", pattern_name: "Tree Depth-First Search (DFS)" },
  { question_id: 113, title: "Path Sum II", difficulty: "Medium", link: "https://leetcode.com/problems/path-sum-ii/", pattern_name: "Tree Depth-First Search (DFS)" },
  { question_id: 295, title: "Find Median from Data Stream", difficulty: "Hard", link: "https://leetcode.com/problems/find-median-from-data-stream/", pattern_name: "Two Heaps" },
  { question_id: 78, title: "Subsets", difficulty: "Medium", link: "https://leetcode.com/problems/subsets/", pattern_name: "Subsets" },
  { question_id: 90, title: "Subsets II", difficulty: "Medium", link: "https://leetcode.com/problems/subsets-ii/", pattern_name: "Subsets" },
  { question_id: 704, title: "Binary Search", difficulty: "Easy", link: "https://leetcode.com/problems/binary-search/", pattern_name: "Modified Binary Search" },
  { question_id: 33, title: "Search in Rotated Sorted Array", difficulty: "Medium", link: "https://leetcode.com/problems/search-in-rotated-sorted-array/", pattern_name: "Modified Binary Search" },
  { question_id: 207, title: "Course Schedule", difficulty: "Medium", link: "https://leetcode.com/problems/course-schedule/", pattern_name: "Topological Sort (Graph)" },
  { question_id: 210, title: "Course Schedule II", difficulty: "Medium", link: "https://leetcode.com/problems/course-schedule-ii/", pattern_name: "Topological Sort (Graph)" }
];

export function RecognitionSessionClient({ onClose, preSelectedPattern, onXPUpdate }: RecognitionSessionClientProps) {
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"read" | "clue" | "pattern" | "reflect" | "result">("read");

  // Question & Pattern details state
  const [questionsPool, setQuestionsPool] = useState<any[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<any | null>(null);
  const [description, setDescription] = useState("");
  const [patternDetails, setPatternDetails] = useState<any | null>(null);

  // Scratchpad browser memory
  const [scratchpadNotes, setScratchpadNotes] = useState("");

  // User selections
  const [clueChoices, setClueChoices] = useState<string[]>([]);
  const [selectedClue, setSelectedClue] = useState("");
  const [selectedPatternSlug, setSelectedPatternSlug] = useState("");
  const [selectedVariant, setSelectedVariant] = useState("");
  const [selectedChip, setSelectedChip] = useState("");
  const [reflectionText, setReflectionText] = useState("");

  const [savingLog, setSavingLog] = useState(false);

  // 1. Initial pool load
  useEffect(() => {
    async function loadPool() {
      try {
        setLoading(true);
        let pool = [];
        const { data, error } = await supabase.from("view_sheet_questions").select("*");
        if (!error && data && data.length > 0) {
          pool = data;
        } else {
          pool = FALLBACK_QUESTIONS;
        }

        const filteredPool = preSelectedPattern
          ? pool.filter((q) => q.pattern_name.toLowerCase().replace(/[^a-z0-9]/g, "") === preSelectedPattern.replace(/-/g, ""))
          : pool;

        setQuestionsPool(filteredPool);
        await selectRandomQuestion(filteredPool);
      } catch (err) {
        console.error("Failed to load questions pool:", err);
        setQuestionsPool(FALLBACK_QUESTIONS);
        await selectRandomQuestion(FALLBACK_QUESTIONS);
      }
    }
    loadPool();
  }, [preSelectedPattern]);

  // 2. Question selection
  const selectRandomQuestion = async (pool: any[]) => {
    if (pool.length === 0) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setStep("read");
    setSelectedClue("");
    setSelectedPatternSlug("");
    setSelectedVariant("");
    setSelectedChip("");
    setReflectionText("");
    setScratchpadNotes(""); // auto-delete scratchpad notes on next question

    const randomQ = pool[Math.floor(Math.random() * pool.length)];
    setActiveQuestion(randomQ);

    const titleSlug = randomQ.link.split("/problems/")[1]?.split("/")[0] || "";
    const cacheKey = `leetcode-desc-${titleSlug}`;
    const cachedDesc = localStorage.getItem(cacheKey);

    const normalizedPatternSlug = PATTERNS_LIST.find(
      (p) => p.name.toLowerCase().replace(/[^a-z0-9]/g, "") === randomQ.pattern_name.toLowerCase().replace(/[^a-z0-9]/g, "")
    )?.slug || "sliding-window";

    try {
      const detailsRes = await fetch(`/api/patterns/preview?slug=${normalizedPatternSlug}`);
      const detailsJson = await detailsRes.json();
      if (detailsJson?.data) {
        setPatternDetails(detailsJson.data);
        const signals = (detailsJson.data.recognition_signals || []).filter((s: string) => s !== "--").slice(0, 3);
        setClueChoices(signals.length > 0 ? signals : ["Iterative search", "Subarray size checks", "Pointers traversal bounds"]);
      }
    } catch (e) {
      console.warn("Failed to load preview details for clues:", e);
      setClueChoices(["Iterative search", "Subarray size checks", "Pointers traversal bounds"]);
    }

    if (cachedDesc) {
      setDescription(cachedDesc);
      setLoading(false);
    } else {
      try {
        const res = await fetch(`https://alfa-leetcode-api.onrender.com/select?titleSlug=${titleSlug}`);
        const leetData = await res.json();
        if (leetData && leetData.question) {
          const cleanText = leetData.question.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
          localStorage.setItem(cacheKey, cleanText);
          setDescription(cleanText);
        } else {
          setDescription(`Analyze algorithmic structure of question: ${randomQ.title}`);
        }
      } catch (err) {
        console.warn("Alfa API failed, fallback to title reference:", err);
        setDescription(`Analyze algorithmic structure of question: ${randomQ.title}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Submit drill logs to database
  const saveDrillResult = async () => {
    if (!activeQuestion) return;
    setSavingLog(true);

    const correctPatternObj = PATTERNS_LIST.find(
      (p) => p.name.toLowerCase().replace(/[^a-z0-9]/g, "") === activeQuestion.pattern_name.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    const correctPatternName = correctPatternObj?.name || activeQuestion.pattern_name;

    const userSelectedObj = PATTERNS_LIST.find((p) => p.slug === selectedPatternSlug);
    const selectedPatternName = userSelectedObj?.name || selectedPatternSlug;

    try {
      // 1. Backup log locally in localStorage
      try {
        const localLogs = JSON.parse(localStorage.getItem("sheetstride-drill-logs") || "[]");
        localLogs.unshift({
          id: Math.random().toString(36).substring(2, 9),
          selected_pattern: selectedPatternName,
          correct_pattern: correctPatternName,
          selected_signal: selectedClue,
          reflection_chip: selectedChip,
          reflection_text: reflectionText,
          is_correct: selectedPatternName === correctPatternName,
          created_at: new Date().toISOString(),
          questions: { Title: activeQuestion.title }
        });
        localStorage.setItem("sheetstride-drill-logs", JSON.stringify(localLogs.slice(0, 50)));
      } catch (e) {
        console.warn("Failed to write local backup log:", e);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // 2. Log History Row in remote DB
        await supabase.from("drill_history").insert({
          user_id: user.id,
          question_id: activeQuestion.question_id,
          selected_pattern: selectedPatternName,
          correct_pattern: correctPatternName,
          selected_signal: selectedClue,
          reflection_chip: selectedChip,
          reflection_text: reflectionText
        });

        // 2. If correct, award 5 XP
        if (selectedPatternName === correctPatternName) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("xp")
            .eq("id", user.id)
            .maybeSingle();
          const currentXP = profile?.xp || 0;
          await supabase
            .from("profiles")
            .update({ xp: currentXP + 5 })
            .eq("id", user.id);
          onXPUpdate();
        } else {
          // Spacing deduction
          const { data: progress } = await supabase
            .from("user_progress")
            .select("id, interval_multiplier")
            .eq("user_id", user.id)
            .eq("question_id", activeQuestion.question_id)
            .maybeSingle();

          if (progress) {
            const newMultiplier = Math.max(1.0, (progress.interval_multiplier || 1.5) * 0.7);
            await supabase
              .from("user_progress")
              .update({ interval_multiplier: newMultiplier })
              .eq("id", progress.id);
          }
        }
      }
    } catch (err) {
      console.warn("Failed to write history log:", err);
    } finally {
      setSavingLog(false);
      setStep("result");
    }
  };

  const getCorrectPatternName = () => {
    if (!activeQuestion) return "";
    return PATTERNS_LIST.find(
      (p) => p.name.toLowerCase().replace(/[^a-z0-9]/g, "") === activeQuestion.pattern_name.toLowerCase().replace(/[^a-z0-9]/g, "")
    )?.name || activeQuestion.pattern_name;
  };

  const variantsList = patternDetails?.variants?.map((v: any) => v.name) || [
    "Fixed Size",
    "Variable Maximize",
    "Variable Minimize",
    "General Strategy"
  ];

  const parsedDesc = parseLeetCodeDescription(description);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="font-mono text-xs text-outline uppercase tracking-wider">Loading recognition session...</span>
      </div>
    );
  }

  return (
    <div className="border border-[#222] bg-[#111] rounded-xl overflow-hidden shadow-2xl flex flex-col min-h-[500px]">
      {/* Header */}
      <div className="bg-[#090909] border-b border-[#222] px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-primary animate-spin" style={{ animationDuration: "10s" }} />
          <h2 className="font-mono text-xs uppercase tracking-widest text-text">RECOGNITION SESSION</h2>
        </div>
        <button
          onClick={onClose}
          className="text-xs font-mono text-outline hover:text-text cursor-pointer transition-colors"
        >
          CLOSE [ESC]
        </button>
      </div>

      {/* Body Panel */}
      <div className="p-8 flex-1 flex flex-col justify-between space-y-6">
        {step === "read" && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 flex-1">
            {/* Left 60% Problem Column */}
            <div className="md:col-span-3 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="font-mono text-xs text-outline uppercase tracking-widest">STEP 01 // ANALYSIS DESCRIPTIVE</h3>
                
                <div className="border border-[#1A1A1A] bg-[#070707] p-5 rounded-lg h-[500px] overflow-y-auto custom-scrollbar shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)] space-y-5">
                  {/* Problem Statement */}
                  <div className="space-y-1">
                    <h4 className="font-mono text-xs text-primary uppercase tracking-wider font-bold">Problem Statement</h4>
                    <p className="font-body text-sm md:text-base text-text leading-relaxed select-text font-medium">
                      {parsedDesc.statement}
                    </p>
                  </div>

                  {/* Examples */}
                  {parsedDesc.examples.map((example, idx) => (
                    <div key={idx} className="border-t border-[#1C1C1C] pt-3 space-y-1">
                      <h4 className="font-mono text-xs text-secondary uppercase tracking-wider font-bold">Example {idx + 1}</h4>
                      <pre className="font-mono text-xs bg-[#0C0C0C] border border-[#1A1A1A] p-3 rounded text-outline/90 leading-relaxed whitespace-pre-wrap select-text">
                        {example}
                      </pre>
                    </div>
                  ))}

                  {/* Constraints */}
                  {parsedDesc.constraints && (
                    <div className="border-t border-[#1C1C1C] pt-3 space-y-1">
                      <h4 className="font-mono text-xs text-danger uppercase tracking-wider font-bold">Constraints</h4>
                      <p className="font-mono text-xs text-outline/70 select-text leading-relaxed">
                        {parsedDesc.constraints}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setStep("clue")}
                  className="px-4 py-2 bg-primary hover:bg-primary-strong text-black font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  Identify Clues <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Right 40% Scratchpad */}
            <div className="md:col-span-2 border border-[#222] bg-[#0C0C0C]/80 rounded-xl p-5 flex flex-col justify-between h-[565px] shadow-inner">
              <div className="space-y-2 flex-1 flex flex-col">
                <h4 className="font-mono text-xs text-primary uppercase tracking-widest font-bold">OPERATOR SCRATCHPAD</h4>
                <p className="font-body text-xs text-outline/65 leading-relaxed">
                  Jot down variable states, test parameters, or index swaps here. (State is saved in browser memory and auto-erases upon exit).
                </p>
                <textarea
                  placeholder="Dry-run indices: left = 0, right = 0\nState sums tracking: sum += nums[right]...\n"
                  value={scratchpadNotes}
                  onChange={(e) => setScratchpadNotes(e.target.value)}
                  className="w-full flex-1 mt-2 bg-[#050505] border border-[#1A1A1A] text-text rounded p-3 font-mono text-xs focus:outline-none focus:border-primary resize-none placeholder-outline/20 leading-relaxed shadow-inner"
                />
              </div>
              <button
                onClick={() => setScratchpadNotes("")}
                className="mt-3 font-mono text-xs text-outline/45 hover:text-text transition-colors text-left uppercase"
              >
                Clear scratchpad
              </button>
            </div>
          </div>
        )}

        {step === "clue" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-mono text-xs text-outline uppercase tracking-widest">STEP 02 // CHOOSE PRIMARY CLUE</h3>
              <p className="font-body text-sm text-outline leading-relaxed">
                What is the single most critical signal in the prompt indicating the algorithmic pattern?
              </p>

              <div className="flex flex-col gap-3 pt-2">
                {clueChoices.map((clue, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedClue(clue)}
                    className={cn(
                      "text-left p-4 rounded-lg border font-mono text-sm transition-all cursor-pointer leading-relaxed",
                      selectedClue === clue
                        ? "bg-primary/5 border-primary text-primary font-bold shadow-[0_0_12px_rgba(255,212,0,0.05)]"
                        : "bg-[#0C0C0C] border-[#222] text-outline hover:border-outline hover:text-text"
                    )}
                  >
                    {clue}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[#1C1C1C]">
              <button
                onClick={() => setStep("read")}
                className="px-4 py-2 border border-[#222] hover:border-outline rounded font-mono text-xs text-outline hover:text-text cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                disabled={!selectedClue}
                onClick={() => setStep("pattern")}
                className="px-4 py-2 bg-primary hover:bg-primary-strong text-black font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Next <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === "pattern" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-5">
              <h3 className="font-mono text-xs text-outline uppercase tracking-widest">STEP 03 // SELECT APPROACH</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block font-mono text-xs text-outline uppercase tracking-wider mb-2">
                    ALGORITHMIC PATTERN
                  </label>
                  <select
                    value={selectedPatternSlug}
                    onChange={(e) => {
                      setSelectedPatternSlug(e.target.value);
                      setSelectedVariant("");
                    }}
                    className="w-full bg-[#0C0C0C] border border-[#222] text-text rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">-- SELECT --</option>
                    {PATTERNS_LIST.map((p) => (
                      <option key={p.slug} value={p.slug}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-mono text-xs text-outline uppercase tracking-wider mb-2">
                    VARIANT / SUB-PATTERN (IF APPLICABLE)
                  </label>
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="w-full bg-[#0C0C0C] border border-[#222] text-text rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="">-- SELECT --</option>
                    {variantsList.map((variant: string, idx: number) => (
                      <option key={idx} value={variant}>
                        {variant}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[#1C1C1C]">
              <button
                onClick={() => setStep("clue")}
                className="px-4 py-2 border border-[#222] hover:border-outline rounded font-mono text-xs text-outline hover:text-text cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                disabled={!selectedPatternSlug || !selectedVariant}
                onClick={() => setStep("reflect")}
                className="px-4 py-2 bg-primary hover:bg-primary-strong text-black font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                Reflect <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === "reflect" && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-mono text-xs text-outline uppercase tracking-widest">STEP 04 // REFLECTION DIALOG</h3>
              <p className="font-body text-sm text-outline leading-relaxed">
                Reflect on your selection criteria. How did you arrive at this choice?
              </p>

              {/* Reflection Chips Grid */}
              <div className="flex flex-wrap gap-2.5 pt-2 select-none">
                {REFLECTION_CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedChip(chip === selectedChip ? "" : chip)}
                    className={cn(
                      "font-mono text-xs uppercase border px-3 py-1.5 rounded transition-all cursor-pointer",
                      selectedChip === chip
                        ? "bg-primary/10 border-primary text-primary font-bold shadow-[0_0_8px_rgba(255,212,0,0.1)]"
                        : "bg-[#0C0C0C] border-[#222] text-outline hover:border-outline"
                    )}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Optional Textarea */}
              <div className="pt-2">
                <label className="block font-mono text-xs text-outline uppercase tracking-wider mb-2">
                  ADDITIONAL STRATEGY REFLECTION NOTES (OPTIONAL)
                </label>
                <textarea
                  placeholder="Elaborate on index bounds, optimization clues, or data structure choices here..."
                  value={reflectionText}
                  onChange={(e) => setReflectionText(e.target.value)}
                  className="w-full h-20 bg-[#0C0C0C] border border-[#222] text-text rounded px-3 py-2 font-mono text-sm focus:outline-none focus:border-primary resize-none placeholder-outline/30"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[#1C1C1C]">
              <button
                onClick={() => setStep("pattern")}
                className="px-4 py-2 border border-[#222] hover:border-outline rounded font-mono text-xs text-outline hover:text-text cursor-pointer transition-colors"
              >
                Back
              </button>
              <button
                disabled={savingLog}
                onClick={saveDrillResult}
                className="px-4 py-2 bg-primary hover:bg-primary-strong text-black font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {savingLog ? "Logging Session..." : "Reveal Answer"} <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {step === "result" && activeQuestion && (
          <div className="space-y-6 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <h3 className="font-mono text-xs text-outline uppercase tracking-widest">STEP 05 // RECOGNITION INSIGHTS RESPONSE</h3>

              {selectedPatternSlug === PATTERNS_LIST.find((p) => p.name === getCorrectPatternName())?.slug ? (
                <div className="border border-secondary/20 bg-secondary/[0.03] p-4 rounded-lg flex gap-3 items-start">
                  <CheckCircle className="h-5 w-5 text-secondary flex-shrink-0" />
                  <div>
                    <h4 className="font-mono text-xs text-secondary uppercase font-bold tracking-wider">Correct Recognition!</h4>
                    <p className="font-body text-sm text-outline mt-1 leading-relaxed">
                      You identified **{getCorrectPatternName()}** correctly as the optimal template. (+5 XP added to score)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-danger/20 bg-danger/[0.03] p-4 rounded-lg flex gap-3 items-start">
                  <XCircle className="h-5 w-5 text-danger flex-shrink-0" />
                  <div>
                    <h4 className="font-mono text-xs text-danger uppercase font-bold tracking-wider">Mismatched Selection</h4>
                    <p className="font-body text-sm text-outline mt-1 leading-relaxed">
                      You selected **{PATTERNS_LIST.find((p) => p.slug === selectedPatternSlug)?.name || selectedPatternSlug}**. The correct approach is **{getCorrectPatternName()}**. (Revision queue suggestions updated)
                    </p>
                  </div>
                </div>
              )}

              {/* Explanation Content */}
              <div className="border border-[#222] bg-[#070707] p-5 rounded-lg space-y-3 font-body text-sm">
                <div>
                  <span className="block font-mono text-xs text-primary uppercase tracking-widest mb-1">PROMPT OVERVIEW</span>
                  <p className="text-text leading-relaxed font-semibold">
                    {activeQuestion.title}
                  </p>
                </div>

                {patternDetails && (
                  <div>
                    <span className="block font-mono text-xs text-primary uppercase tracking-widest mb-1">PATTERN EXPLANATION</span>
                    <p className="text-outline leading-relaxed">
                      {patternDetails.mental_model?.description || patternDetails.overview}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t border-[#1C1C1C]">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-[#222] hover:border-outline rounded font-mono text-xs text-outline hover:text-text cursor-pointer transition-colors"
              >
                Return to Hub
              </button>
              <button
                onClick={() => selectRandomQuestion(questionsPool)}
                className="px-4 py-2 bg-primary hover:bg-primary-strong text-black font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                Next Question <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
