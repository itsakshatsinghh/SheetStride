"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Layers, ArrowRight, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";

interface PatternIndexItem {
  pattern_name: string;
  slug: string;
  difficulty: string;
  family_name: string;
  recognition_signals: string[];
  variants: string[];
  companies: string[];
  questions_count: number;
  aliases: string[];
  data_structures: string[];
  keywords: string[];
  question_ids: number[];
}

const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

export function PatternsListClient({ initialPatterns }: { initialPatterns: PatternIndexItem[] }) {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  // Track solved states & revision due dates locally
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [revisionMap, setRevisionMap] = useState<{ [qId: number]: string | null }>({});

  useEffect(() => {
    if (!user) return;
    async function fetchUserProgress() {
      try {
        const { data, error } = await supabase
          .from("user_progress")
          .select("question_id, next_revision_due, completed");
        if (!error && data) {
          const solvedSet = new Set<number>();
          const revs: { [qId: number]: string | null } = {};
          data.forEach((row: any) => {
            if (row.completed) {
              solvedSet.add(row.question_id);
            }
            revs[row.question_id] = row.next_revision_due;
          });
          setSolvedIds(solvedSet);
          setRevisionMap(revs);
        }
      } catch (err) {
        console.error("Failed to load list progress:", err);
      }
    }
    fetchUserProgress();
    window.addEventListener("question-solved", fetchUserProgress);
    return () => {
      window.removeEventListener("question-solved", fetchUserProgress);
    };
  }, [user]);

  // Compute revision label for a pattern
  const getRevisionDueLabel = (qIds: number[]) => {
    let earliestDate: Date | null = null;
    for (const qId of qIds) {
      const due = revisionMap[qId];
      if (due) {
        const d = new Date(due);
        if (!earliestDate || d < earliestDate) {
          earliestDate = d;
        }
      }
    }
    if (!earliestDate) return "N/A";
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dueDay = new Date(earliestDate.getFullYear(), earliestDate.getMonth(), earliestDate.getDate());
    const diffTime = dueDay.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return "Overdue";
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return earliestDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const filteredPatterns = initialPatterns.filter((p) => {
    const name = p.pattern_name.toLowerCase();
    const family = p.family_name.toLowerCase();
    const signals = p.recognition_signals.map(s => s.toLowerCase());
    const variants = p.variants.map(v => v.toLowerCase());
    const companies = p.companies.map(c => c.toLowerCase());
    const aliases = (p.aliases || []).map(a => a.toLowerCase());
    const dataStructures = (p.data_structures || []).map(d => d.toLowerCase());
    const keywords = (p.keywords || []).map(k => k.toLowerCase());
    
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      family.includes(search.toLowerCase()) ||
      signals.some(s => s.includes(search.toLowerCase())) ||
      variants.some(v => v.includes(search.toLowerCase())) ||
      companies.some(c => c.includes(search.toLowerCase())) ||
      aliases.some(a => a.includes(search.toLowerCase())) ||
      dataStructures.some(d => d.includes(search.toLowerCase())) ||
      keywords.some(k => k.includes(search.toLowerCase()));

    const matchesDifficulty =
      selectedDifficulty === "All" ||
      p.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

    return matchesSearch && matchesDifficulty;
  });

  // Group by family_name
  const groupedPatterns: { [family: string]: PatternIndexItem[] } = {};
  filteredPatterns.forEach((p) => {
    const family = p.family_name || "General";
    if (!groupedPatterns[family]) {
      groupedPatterns[family] = [];
    }
    groupedPatterns[family].push(p);
  });

  const sortedFamilies = Object.keys(groupedPatterns).sort();

  return (
    <div className="space-y-8">
      {/* Filters HUD */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#111111]/90 border border-outline-variant/30 p-4 rounded-xl backdrop-blur-md">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="FILTER BY NAME, SIGNAL, VARIANT OR DATA STRUCTURE..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0A0A0A] border border-outline-variant/30 rounded-lg text-body font-mono text-[13px] text-text tracking-wide placeholder:text-outline/40 focus:outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/20"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {DIFFICULTIES.map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={cn(
                "px-3 py-1 text-mono-label font-mono-label text-xs uppercase tracking-wider border transition-all rounded-md cursor-pointer",
                selectedDifficulty === diff
                  ? "bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(255,212,0,0.2)]"
                  : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-text hover:border-outline-variant"
              )}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Family Cards */}
      <div className="space-y-12">
        {sortedFamilies.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-outline-variant/30 rounded-xl bg-[#111111]/30">
            <p className="font-mono text-outline uppercase tracking-widest text-[13px]">NO MATCHING PATTERNS FOUND</p>
          </div>
        ) : (
          sortedFamilies.map((family) => (
            <div key={family} className="space-y-6">
              {/* Family Header */}
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-2">
                <Layers className="h-5 w-5 text-primary-strong" />
                <h2 className="font-display text-lg text-primary tracking-widest uppercase">
                  {family}
                </h2>
                <span className="text-mono-label font-mono-label text-xs text-outline/65">
                  ({groupedPatterns[family].length} {groupedPatterns[family].length === 1 ? 'pattern' : 'patterns'})
                </span>
              </div>

              {/* Grid of Patterns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedPatterns[family].map((pattern) => {
                  const keywords = pattern.recognition_signals.slice(0, 3);
                  const qIds = pattern.question_ids || [];
                  const solvedCount = qIds.filter(id => solvedIds.has(id)).length;
                  const totalCount = pattern.questions_count;
                  const completionPercentage = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;
                  
                  let confidence = "None";
                  if (solvedCount > 0) {
                    const ratio = solvedCount / totalCount;
                    if (ratio < 0.4) confidence = "Low";
                    else if (ratio < 0.8) confidence = "Medium";
                    else confidence = "High";
                  }

                  const revisionLabel = getRevisionDueLabel(qIds);

                  return (
                    <motion.div
                      key={pattern.pattern_name}
                      layout
                      className="group relative bg-[#111111] border border-outline-variant/30 hover:border-primary p-5 transition-all duration-300 rounded-xl hover:-translate-y-1 flex flex-col justify-between hover:shadow-[0_8px_25px_-10px_rgba(255,212,0,0.15)]"
                    >
                      <div>
                        {/* Title & Difficulty */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <h3 className="font-display text-text font-bold tracking-wider group-hover:text-primary transition-colors text-[15px]">
                            <Link href={`/patterns/${pattern.slug}`}>
                              {pattern.pattern_name}
                            </Link>
                          </h3>
                          <span className={cn(
                            "text-[10px] font-mono uppercase px-2 py-0.5 rounded border tracking-wider",
                            pattern.difficulty === "Beginner" && "bg-secondary/5 border-secondary/20 text-secondary",
                            pattern.difficulty === "Intermediate" && "bg-primary/5 border-primary/20 text-primary",
                            pattern.difficulty === "Advanced" && "bg-danger/5 border-danger/20 text-danger"
                          )}>
                            {pattern.difficulty}
                          </span>
                        </div>

                        {/* Variants Snippet count */}
                        <div className="text-[11px] text-on-surface-variant font-body leading-relaxed mb-4">
                          <span className="text-outline/70">Variants:</span> {pattern.variants.join(", ")}
                        </div>
                      </div>

                      {/* Progress Panel (authenticated only) */}
                      {user && (
                        <div className="border-t border-dashed border-outline-variant/10 pt-3.5 pb-4 space-y-2.5">
                          {/* Progress bar */}
                          <div className="flex items-center justify-between text-[10px] font-mono uppercase text-outline/65">
                            <span>Progress: {solvedCount} / {totalCount} Solved</span>
                            <span className="text-secondary font-bold">{completionPercentage}%</span>
                          </div>
                          <div className="h-1 w-full bg-[#1A1A1A] rounded-full overflow-hidden">
                            <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${completionPercentage}%` }} />
                          </div>

                          {/* Confidence & Revision Due */}
                          <div className="flex justify-between text-[9px] font-mono uppercase text-outline/80">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3 text-secondary" />
                              <span>Confidence: {confidence}</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-primary-strong" />
                              <span>Revision Due: {revisionLabel}</span>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Footer Info */}
                      <div className="border-t border-outline-variant/15 pt-3">
                        <div className="flex justify-between items-center mb-3 text-[10px] font-mono uppercase tracking-wider text-outline/80">
                          <div className="flex items-center gap-1">
                            <span>LADDER PATH:</span>
                            <span className="text-primary font-bold">{pattern.questions_count} Exercises</span>
                          </div>
                          <Link href={`/patterns/${pattern.slug}`} className="flex items-center gap-1 text-primary hover:text-primary-strong transition-colors cursor-pointer">
                            <span>EXPLORE</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </div>

                        {/* Keywords Tag cloud */}
                        {keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {keywords.map((word, index) => (
                              <span
                                key={index}
                                className="text-[10px] font-mono bg-[#181818] border border-outline-variant/20 px-2 py-0.5 rounded text-outline/90"
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
