"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Search, Tag, Layers, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatternIndexItem {
  pattern_name: string;
  slug: string;
  difficulty: string;
  family_name: string;
  recognition_signals: string[];
  variants: string[];
  companies: string[];
  questions_count: number;
}

const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

export function PatternsListClient({ initialPatterns }: { initialPatterns: PatternIndexItem[] }) {
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  const filteredPatterns = initialPatterns.filter((p) => {
    const name = p.pattern_name.toLowerCase();
    const family = p.family_name.toLowerCase();
    const signals = p.recognition_signals.map(s => s.toLowerCase());
    const variants = p.variants.map(v => v.toLowerCase());
    const companies = p.companies.map(c => c.toLowerCase());
    
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      family.includes(search.toLowerCase()) ||
      signals.some(s => s.includes(search.toLowerCase())) ||
      variants.some(v => v.includes(search.toLowerCase())) ||
      companies.some(c => c.includes(search.toLowerCase()));

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
            placeholder="FILTER_PATTERNS_BY_NAME_SIGNAL_OR_VARIANT..."
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
            <p className="font-mono text-outline uppercase tracking-widest text-[13px]">NO_MATCHING_PATTERNS_FOUND</p>
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

                      {/* Footer Info */}
                      <div>
                        {/* Solves tracker counts */}
                        <div className="flex justify-between items-center border-t border-outline-variant/15 pt-3 mb-4 text-[10px] font-mono uppercase tracking-wider text-outline/80">
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
