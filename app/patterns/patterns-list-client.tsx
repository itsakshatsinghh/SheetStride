"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Tag, Cpu, Layers } from "lucide-react";
import { slugifyPattern, slugifyTopic } from "@/lib/slugs";
import { cn } from "@/lib/utils";

interface Pattern {
  pattern_name: string;
  topic_name: string | null;
  core_idea: string | null;
  tc: string | null;
  sc: string | null;
  difficulty: string | null;
  recognition_keywords: any;
}

const DIFFICULTIES = ["All", "Easy", "Medium", "Hard"];

const getKeywordsArray = (keywords: any): string[] => {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords;
  try {
    const parsed = JSON.parse(keywords);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return [];
};

export function PatternsListClient({ initialPatterns }: { initialPatterns: Pattern[] }) {
  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");

  const filteredPatterns = initialPatterns.filter((p) => {
    const name = p.pattern_name.toLowerCase();
    const idea = (p.core_idea || "").toLowerCase();
    const topic = (p.topic_name || "").toLowerCase();
    const keywords = getKeywordsArray(p.recognition_keywords).map(k => k.toLowerCase());
    
    const matchesSearch =
      name.includes(search.toLowerCase()) ||
      idea.includes(search.toLowerCase()) ||
      topic.includes(search.toLowerCase()) ||
      keywords.some(k => k.includes(search.toLowerCase()));

    const matchesDifficulty =
      selectedDifficulty === "All" ||
      p.difficulty?.toLowerCase() === selectedDifficulty.toLowerCase();

    return matchesSearch && matchesDifficulty;
  });

  // Group by topic
  const groupedPatterns: { [topic: string]: Pattern[] } = {};
  filteredPatterns.forEach((p) => {
    const topic = p.topic_name || "Uncategorized";
    if (!groupedPatterns[topic]) {
      groupedPatterns[topic] = [];
    }
    groupedPatterns[topic].push(p);
  });

  // Sort topics alphabetically/numerically
  const sortedTopics = Object.keys(groupedPatterns).sort((a, b) => {
    // Check if they start with Roman Numerals (e.g. "I. ", "II. ")
    const extractNum = (str: string) => {
      const match = str.match(/^([IVXLCDM]+)\./);
      if (match) {
        const roman = match[1];
        const romanMap: { [key: string]: number } = { I:1, V:5, X:10, L:50, C:100, D:500, M:1000 };
        // Simple roman to int parsing
        let val = 0;
        for (let i = 0; i < roman.length; i++) {
          const current = romanMap[roman[i]] || 0;
          const next = romanMap[roman[i+1]] || 0;
          if (current < next) {
            val -= current;
          } else {
            val += current;
          }
        }
        return val;
      }
      return 999;
    };
    return extractNum(a) - extractNum(b);
  });

  return (
    <div className="space-y-8">
      {/* Filters HUD */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#131313]/90 border border-outline-variant/30 p-4 rounded-xl backdrop-blur-md">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
          <input
            type="text"
            placeholder="FILTER_PATTERNS_BY_KEYWORD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1b1b1b] border border-outline-variant/30 rounded-lg text-body font-mono text-[13px] text-text tracking-wide placeholder:text-outline/40 focus:outline-none focus:border-primary transition-all focus:ring-1 focus:ring-primary/20"
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
                  ? "bg-primary/10 border-primary text-primary shadow-[0_0_10px_rgba(178,210,255,0.2)]"
                  : "bg-surface-container border-outline-variant/30 text-on-surface-variant hover:text-text hover:border-outline-variant"
              )}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Pattern Cards */}
      <div className="space-y-12">
        {sortedTopics.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-outline-variant/30 rounded-xl bg-[#131313]/30">
            <p className="font-mono text-outline uppercase tracking-widest text-[13px]">NO_MATCHING_PATTERNS_FOUND</p>
          </div>
        ) : (
          sortedTopics.map((topic) => (
            <div key={topic} className="space-y-6">
              {/* Topic Header Link */}
              <div className="flex items-center gap-3 border-b border-outline-variant/20 pb-2">
                <Layers className="h-5 w-5 text-primary-strong" />
                <Link
                  href={`/topics/${slugifyTopic(topic)}`}
                  className="font-display-arcade text-body-lg text-primary tracking-widest hover:text-primary-strong transition-colors uppercase"
                >
                  {topic}
                </Link>
                <span className="text-mono-label font-mono-label text-xs text-outline/65">
                  ({groupedPatterns[topic].length} {groupedPatterns[topic].length === 1 ? 'pattern' : 'patterns'})
                </span>
              </div>

              {/* Grid of Patterns */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedPatterns[topic].map((pattern) => {
                  const patternSlug = slugifyPattern(pattern.pattern_name);
                  const keywords = getKeywordsArray(pattern.recognition_keywords).slice(0, 3);
                  
                  return (
                    <motion.div
                      key={pattern.pattern_name}
                      layout
                      className="group relative bg-[#131313] border border-outline-variant/30 hover:border-primary p-5 transition-all duration-300 rounded-xl hover:-translate-y-1 flex flex-col justify-between hover:shadow-[0_8px_25px_-10px_rgba(178,210,255,0.15)]"
                    >
                      <div>
                        {/* Title & Difficulty */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <h3 className="font-display text-text font-bold tracking-wider group-hover:text-primary transition-colors text-[15px]">
                            <Link href={`/patterns/${patternSlug}`}>
                              {pattern.pattern_name}
                            </Link>
                          </h3>
                          {pattern.difficulty && (
                            <span className={cn(
                              "text-[10px] font-mono uppercase px-2 py-0.5 rounded border tracking-wider",
                              pattern.difficulty === "Easy" && "bg-secondary/5 border-secondary/20 text-secondary",
                              pattern.difficulty === "Medium" && "bg-primary/5 border-primary/20 text-primary",
                              pattern.difficulty === "Hard" && "bg-danger/5 border-danger/20 text-danger"
                            )}>
                              {pattern.difficulty}
                            </span>
                          )}
                        </div>

                        {/* Core Idea snippet */}
                        <p className="font-body text-xs text-on-surface-variant leading-relaxed line-clamp-3 mb-6">
                          {pattern.core_idea || "No description provided."}
                        </p>
                      </div>

                      {/* Footer Info */}
                      <div>
                        {/* Time & Space */}
                        <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/15 pt-3 mb-4 text-[10px] font-mono uppercase tracking-wider text-outline/80">
                          <div className="flex items-center gap-1">
                            <Cpu className="h-3 w-3 text-secondary" />
                            <span>TC: {pattern.tc || "O(?)"}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Tag className="h-3 w-3 text-primary-strong" />
                            <span>SC: {pattern.sc || "O(?)"}</span>
                          </div>
                        </div>

                        {/* Keywords Tag cloud */}
                        {keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {keywords.map((word, index) => (
                              <span
                                key={index}
                                className="text-[10px] font-mono bg-[#1c1c1c] border border-outline-variant/20 px-2 py-0.5 rounded text-outline/90"
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
