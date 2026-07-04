"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Layers, Award, Tag, CheckCircle, AlertCircle, ArrowRight, ShieldAlert, Cpu, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { PatternVisualizer } from "@/components/app/pattern-visualizer";
import { PatternQuestionsClient } from "./pattern-questions-client";
import { useAuth } from "@/components/providers/auth-provider";

interface PatternDetails {
  pattern_name: string;
  slug: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  family_name: string;
  overview: string;
  recognition_signals: string[];
  mental_model: {
    analogy: string;
    description: string;
  };
  brute_force_journey: {
    brute_force_description: string;
    inefficiency_observation: string;
    optimization_concept: string;
  };
  visualization_metadata: {
    type: "array-pointers" | "linkedlist-cycle" | "tree-traversal" | "heap-relations" | "custom";
    initial_state: Record<string, any>;
    animation_steps: any[];
  };
  polyglot_boilerplates: {
    cpp: string;
    python: string;
    java: string;
  };
  variants: { name: string; description: string }[];
  common_mistakes: { mistake_title: string; description: string }[];
  interview_perspective: string;
  related_patterns: string[];
  cheat_sheet: string[];
}

interface Question {
  Sheet_order: number;
  question_id: number;
  title: string;
  difficulty: string;
  link: string;
  topics: string;
  acceptance_rate: number | null;
  is_reference_only: boolean;
}

const TABS = ["LEARN", "PRACTICE", "MASTER"] as const;

// Learning Progression curriculum graph definition
const CURRICULUM_GRAPHS: Record<string, string[]> = {
  "sliding-window": ["Arrays", "Two Pointers", "Sliding Window", "Prefix Sum", "Monotonic Queue"],
  "two-pointers": ["Arrays", "Two Pointers", "Sliding Window", "Two Heaps"],
  "fast-slow-pointers": ["Linked Lists", "Two Pointers", "Fast & Slow Pointers", "Cyclic Sort"],
  "merge-intervals": ["Sorting", "Merge Intervals", "Interval Tree"],
  "cyclic-sort": ["Arrays", "Cyclic Sort", "Heap Sort"],
  "in-place-reversal-of-a-linked-list": ["Linked Lists", "In-place Reversal", "K-way Merge"],
  "tree-breadth-first-search-bfs": ["Trees", "Breadth-First Search", "Depth-First Search", "Topological Sort"],
  "tree-depth-first-search-dfs": ["Trees", "Depth-First Search", "Backtracking", "Recursion"],
  "two-heaps": ["Heaps", "Two Heaps", "K-way Merge"],
  "subsets": ["Recursion", "Subsets", "Backtracking", "0-1 Knapsack"],
  "modified-binary-search": ["Arrays", "Binary Search", "Modified Binary Search", "Segment Tree"],
  "bitwise-xor": ["Bitwise Operations", "Bitwise XOR", "Bit Masking"],
  "top-k-elements": ["Heaps", "Top 'K' Elements", "K-way Merge"],
  "k-way-merge": ["Heaps", "K-way Merge", "Top 'K' Elements"],
  "-1-knapsack-dynamic-programming": ["Recursion", "Subsets", "0-1 Knapsack", "Unbounded Knapsack"],
  "topological-sort-graph": ["Graphs", "Breadth-First Search", "Topological Sort", "Dijkstra"]
};

// C++ Syntax Highlighting Helper
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
    .replace(/(\/\/.*)/g, '<span class="text-outline/65">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="text-outline/65">$1</span>');
};

// Math and Markdown inline renderer helper function
function renderFormattedText(text: string | null | undefined) {
  if (!text) return null;
  const clean = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-text">$1</strong>')
    .replace(/`(.*?)`/g, '<code class="font-mono text-secondary bg-secondary/5 border border-secondary/15 px-1 py-0.5 rounded text-[11px] font-bold">$1</code>')
    .replace(/\$(.*?)\$/g, '<span class="font-mono text-primary bg-primary/5 border border-primary/10 px-1 py-0.5 rounded text-[11px] font-semibold">$1</span>');

  return <span dangerouslySetInnerHTML={{ __html: clean }} className="whitespace-pre-line leading-relaxed" />;
}

export function PatternDetailClient({
  pattern,
  mappedQuestions,
}: {
  pattern: PatternDetails;
  mappedQuestions: Question[];
}) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<typeof TABS[number]>("LEARN");

  const pathList = CURRICULUM_GRAPHS[pattern.slug] || [pattern.family_name, pattern.pattern_name];

  return (
    <div className="space-y-8">
      {/* Logical Sections Tabs Selector HUD */}
      <div className="flex border-b border-outline-variant/20 gap-2 select-none">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-5 py-3 font-display text-sm uppercase tracking-widest border-b-2 transition-all cursor-pointer",
              activeTab === tab
                ? "border-primary text-primary font-bold shadow-[inset_0_-2px_0_0_rgba(255,212,0,1)]"
                : "border-transparent text-on-surface-variant hover:text-text"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* TAB 1: LEARN */}
          {activeTab === "LEARN" && (
            <>
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Overview */}
                <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl relative overflow-hidden space-y-4">
                  <div className="flex justify-between items-center">
                    <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">01 // OVERVIEW</h2>
                    <Link
                      href={`/training-ground?drill_pattern=${pattern.slug}`}
                      className="px-3 py-1 bg-primary/10 hover:bg-primary/20 border border-primary/25 hover:border-primary/50 rounded text-primary text-[10px] uppercase font-mono tracking-wider flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="h-3 w-3" />
                      Train this Pattern
                    </Link>
                  </div>
                  <div className="font-body text-text leading-relaxed text-sm">
                    {renderFormattedText(pattern.overview)}
                  </div>
                </section>

                {/* Mental Model */}
                <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
                  <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">02 // MENTAL MODEL</h2>
                  <div className="bg-[#090909] border border-primary/20 p-5 rounded-lg flex gap-4 items-start">
                    <Award className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-mono text-xs text-primary font-bold uppercase tracking-wider mb-2">ANALOGY: {renderFormattedText(pattern.mental_model.analogy)}</h3>
                      <div className="font-body text-xs text-on-surface-variant leading-relaxed">
                        {renderFormattedText(pattern.mental_model.description)}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Optimization Journey */}
                <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
                  <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">03 // OPTIMIZATION JOURNEY</h2>
                  <div className="space-y-4">
                    <div className="border border-outline-variant/15 p-4 rounded-lg bg-[#090909]/40">
                      <span className="block font-mono text-[9px] text-danger uppercase tracking-widest mb-1">BRUTE FORCE</span>
                      <div className="font-body text-xs text-on-surface-variant leading-relaxed">
                        {renderFormattedText(pattern.brute_force_journey.brute_force_description)}
                      </div>
                    </div>
                    <div className="border border-outline-variant/15 p-4 rounded-lg bg-[#090909]/40">
                      <span className="block font-mono text-[9px] text-warning uppercase tracking-widest mb-1">INEFFICIENCY OBSERVATION</span>
                      <div className="font-body text-xs text-on-surface-variant leading-relaxed">
                        {renderFormattedText(pattern.brute_force_journey.inefficiency_observation)}
                      </div>
                    </div>
                    <div className="border border-primary-strong/20 p-4 rounded-lg bg-[#090909]/60">
                      <span className="block font-mono text-[9px] text-primary uppercase tracking-widest mb-1">OPTIMIZED CONCEPT</span>
                      <div className="font-body text-xs text-text leading-relaxed">
                        {renderFormattedText(pattern.brute_force_journey.optimization_concept)}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Algorithm Blueprint */}
                <section className="bg-[#111111] border border-outline-variant/30 rounded-xl overflow-hidden">
                  <div className="bg-[#090909] border-b border-outline-variant/20 px-6 py-3 flex justify-between items-center select-none">
                    <span className="font-mono text-outline uppercase tracking-widest text-[11px]">04 // ALGORITHM BLUEPRINT (C++)</span>
                    <span className="font-mono text-[10px] text-primary-strong uppercase tracking-wider font-bold">C++ TEMPLATE</span>
                  </div>
                  <div className="p-6 overflow-x-auto bg-[#090909] custom-scrollbar">
                    <pre className="font-mono text-sm leading-relaxed whitespace-pre font-medium">
                      <code dangerouslySetInnerHTML={{ __html: highlightCpp(pattern.polyglot_boilerplates.cpp) }} />
                    </pre>
                  </div>
                </section>
              </div>

              {/* Sidebar Column */}
              <div className="space-y-8">
                {/* Visualizer Player component */}
                <PatternVisualizer metadata={pattern.visualization_metadata} />

                {/* Recognition Signals */}
                <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
                  <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">RECOGNITION SIGNALS</h2>
                  <div className="flex flex-col gap-2.5">
                    {pattern.recognition_signals.map((sig, i) => (
                      <div key={i} className="text-xs font-mono bg-[#090909] border border-outline-variant/20 px-3 py-2 rounded text-outline flex items-start gap-2 leading-relaxed">
                        <Tag className="h-3.5 w-3.5 text-primary-strong flex-shrink-0 mt-0.5" />
                        <div>{renderFormattedText(sig)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* TAB 2: PRACTICE */}
          {activeTab === "PRACTICE" && (
            <>
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Question Journey Table */}
                <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl">
                  <h2 className="font-mono text-outline uppercase tracking-widest text-[11px] mb-6">01 // REPRESENTATIVE PROBLEMS CHECKLIST</h2>
                  <PatternQuestionsClient initialQuestions={mappedQuestions} patternName={pattern.pattern_name} />
                </section>
              </div>

              {/* Sidebar Column */}
              <div className="space-y-8">
                {/* Variants Card */}
                {pattern.variants.length > 0 && (
                  <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
                    <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">PATTERN VARIANTS</h2>
                    <div className="space-y-4">
                      {pattern.variants.map((v, i) => (
                        <div key={i} className="border border-outline-variant/20 p-4 rounded-lg bg-[#090909]/40">
                          <h3 className="font-display font-semibold text-xs text-text uppercase tracking-wider mb-2">{renderFormattedText(v.name)}</h3>
                          <div className="font-body text-xs text-on-surface-variant leading-relaxed">
                            {renderFormattedText(v.description)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Related Patterns - Learning Progression Node Chain */}
                <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-5">
                  <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">SheetStride curriculum graph</h2>
                  <div className="relative pl-4 border-l border-outline-variant/30 space-y-5">
                    {pathList.map((node, idx) => {
                      const isActive = node.toLowerCase().includes(pattern.pattern_name.toLowerCase()) || node === pattern.pattern_name;
                      return (
                        <div key={idx} className="relative flex items-center gap-3">
                          {/* Circle indicator */}
                          <div
                            className={cn(
                              "absolute -left-[21px] w-2.5 h-2.5 rounded-full border transition-all duration-300",
                              isActive
                                ? "bg-primary border-primary shadow-[0_0_8px_rgba(255,212,0,1)] scale-125"
                                : "bg-[#111111] border-outline-variant"
                            )}
                          />
                          <div
                            className={cn(
                              "font-mono text-xs px-3 py-1.5 rounded-lg border transition-all duration-300",
                              isActive
                                ? "bg-primary/10 border-primary text-primary"
                                : "bg-[#090909] border-outline-variant/30 text-on-surface-variant"
                            )}
                          >
                            {node.toUpperCase()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </>
          )}

          {/* TAB 3: MASTER */}
          {activeTab === "MASTER" && (
            <>
              {/* Main Column */}
              <div className="lg:col-span-2 space-y-8">
                {/* Study Notebook advice */}
                <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
                  <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">01 // COGNITIVE STUDY NOTEBOOK</h2>
                  <p className="font-body text-text leading-relaxed text-sm">
                    Connect each exercise to your structured study journal. Evaluate your approach by documenting:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div className="border border-outline-variant/20 p-4 rounded-lg bg-[#090909]/40 font-mono text-xs text-outline/80">
                      <span className="text-secondary font-bold block mb-1">1. BRUTE FORCE JOURNAL</span>
                      Draft the naive approach and establish index range boundaries.
                    </div>
                    <div className="border border-outline-variant/20 p-4 rounded-lg bg-[#090909]/40 font-mono text-xs text-outline/80">
                      <span className="text-primary font-bold block mb-1">2. OPTIMIZATION PATH</span>
                      Record which signals triggered the transition to sliding/heaps/DP.
                    </div>
                  </div>
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg flex items-center gap-3 text-xs text-on-surface-variant leading-relaxed">
                    <BookOpen className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>To write notebook entries, click the book icon on mapped questions in the **PRACTICE** table.</span>
                  </div>
                </section>

                {/* Pitfalls */}
                {pattern.common_mistakes.length > 0 && (
                  <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
                    <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">02 // COMMON PITFALLS</h2>
                    <div className="space-y-3">
                      {pattern.common_mistakes.map((m, i) => (
                        <div key={i} className="border border-l-4 border-danger/40 border-outline-variant/20 p-4 rounded-lg bg-danger/[0.01] flex gap-3 items-start">
                          <ShieldAlert className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-mono text-xs text-danger font-bold uppercase tracking-wider mb-1">{renderFormattedText(m.mistake_title)}</h3>
                            <div className="font-body text-xs text-on-surface-variant leading-relaxed">
                              {renderFormattedText(m.description)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Sidebar Column */}
              <div className="space-y-8">
                {/* Live progress and revision statistics */}
                <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
                  <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">PATTERN PROGRESS</h2>
                  
                  {user ? (
                    <div className="space-y-4">
                      {/* Simple static stats placeholder that links to active user solves */}
                      <div className="border border-[#222222] bg-[#090909] p-4 rounded-lg font-mono text-[11px] space-y-3 text-outline/80">
                        <div className="flex justify-between border-b border-[#222222] pb-1.5">
                          <span>SOLVED EXERCISES:</span>
                          <span className="text-text font-bold">See practice tab</span>
                        </div>
                        <div className="flex justify-between border-b border-[#222222] pb-1.5">
                          <span>MEMORIZATION LEVEL:</span>
                          <span className="text-secondary">Tracked live</span>
                        </div>
                        <div className="flex justify-between pb-0.5">
                          <span>SPACED REVISION:</span>
                          <span className="text-primary">Linked to active queue</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-outline/50 font-mono text-xs">
                      LOGIN TO VIEW LIVE METRICS
                    </div>
                  )}
                </section>

                {/* Cheat Sheet */}
                <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
                  <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">CHEAT SHEET</h2>
                  <ul className="space-y-2.5">
                    {pattern.cheat_sheet.map((tip, i) => (
                      <li key={i} className="flex gap-2.5 items-start text-xs text-on-surface-variant leading-relaxed">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <div>{renderFormattedText(tip)}</div>
                      </li>
                    ))}
                  </ul>
                </section>

                {/* Interview perspective */}
                <section className="bg-primary/5 border border-primary/20 p-6 rounded-xl flex items-start gap-4">
                  <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="block font-mono text-[9px] text-primary uppercase tracking-widest mb-1">INTERVIEW ADVICE</span>
                    <div className="font-body text-xs text-on-surface-variant leading-relaxed">
                      {renderFormattedText(pattern.interview_perspective)}
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
