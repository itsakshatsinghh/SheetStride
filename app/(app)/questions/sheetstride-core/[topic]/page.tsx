"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { fetchWithCache } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

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

interface PatternStats {
  name: string;
  slug: string;
  total: number;
  solved: number;
  percent: number;
  difficultyMix: string;
  isCompleted: boolean;
}

export default function PatternExplorerPage({ params }: { params: Promise<{ topic: string }> }) {
  const resolvedParams = use(params);
  const topicSlug = resolvedParams.topic;
  
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  const [dbTopicName, setDbTopicName] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [patterns, setPatterns] = useState<PatternStats[]>([]);
  const [topicTotal, setTopicTotal] = useState(0);
  const [topicSolved, setTopicSolved] = useState(0);

  async function loadPatternData() {
    const dbName = TOPIC_SLUGS[topicSlug];
    if (!dbName || !user) return;
    const userId = user.id;

    try {
      setLoading(true);

      const cacheKey = `topic_patterns_cache_${user ? user.id : "anon"}_${topicSlug}`;
      const dataResult = await fetchWithCache(cacheKey, async () => {
        // 1. Fetch user's solved question IDs
        const { data: userSolves, error: solvesError } = await supabase
          .from("user_progress")
          .select("question_id")
          .eq("user_id", userId);

        if (solvesError) throw solvesError;
        const solvedIdsArr = userSolves?.map((row: any) => row.question_id) || [];

        // 2. Fetch sheet questions for this topic, joined with difficulty
        const { data: qData, error: qError } = await supabase
          .from("sheet_questions")
          .select(`
            question_id: "question ID",
            Pattern_name: "Pattern name",
            questions (
              Difficulty
            )
          `)
          .eq("topic name", dbName);

        if (qError) throw qError;

        return {
          solvedIdsArr,
          qData: qData || []
        };
      }, 300000); // 5 minutes TTL

      if (dataResult) {
        const solvedIds = new Set(dataResult.solvedIdsArr);
        const qData = dataResult.qData;

        // Group questions by pattern
        const patternMap: { [key: string]: { total: number; solved: number; questionsList: any[] } } = {};
        
        let tTotal = 0;
        let tSolved = 0;

        qData.forEach((row: any) => {
          const rawPatName = row.Pattern_name || "General";
          const patName = rawPatName.trim();
          const qId = row.question_id;

          tTotal++;
          if (solvedIds.has(qId)) {
            tSolved++;
          }

          if (!patternMap[patName]) {
            patternMap[patName] = { total: 0, solved: 0, questionsList: [] };
          }

          patternMap[patName].total++;
          if (solvedIds.has(qId)) {
            patternMap[patName].solved++;
          }
          patternMap[patName].questionsList.push(row);
        });

        setTopicTotal(tTotal);
        setTopicSolved(tSolved);

        // Map grouped results to PatternStats array
        const statsList = Object.entries(patternMap).map(([name, data]) => {
          const percent = data.total > 0 ? Math.round((data.solved / data.total) * 100) : 0;
          
          // Compute difficulty mix
          const diffCounts: { [key: string]: number } = { easy: 0, medium: 0, hard: 0 };
          data.questionsList.forEach(q => {
            const diff = q.questions?.Difficulty?.toLowerCase() || "";
            if (diffCounts[diff] !== undefined) {
              diffCounts[diff]++;
            }
          });

          const totalQuestions = data.total;
          const mixParts: string[] = [];
          if (diffCounts.easy > 0) {
            mixParts.push(`${Math.round((diffCounts.easy / totalQuestions) * 100)}% Easy`);
          }
          if (diffCounts.medium > 0) {
            mixParts.push(`${Math.round((diffCounts.medium / totalQuestions) * 100)}% Medium`);
          }
          if (diffCounts.hard > 0) {
            mixParts.push(`${Math.round((diffCounts.hard / totalQuestions) * 100)}% Hard`);
          }
          const difficultyMix = `Mix: ${mixParts.join(", ")}`;

          return {
            name,
            slug: slugifyPattern(name),
            total: data.total,
            solved: data.solved,
            percent,
            difficultyMix,
            isCompleted: percent === 100
          };
        });

        setPatterns(statsList);
      }
    } catch (err) {
      console.error("Failed to load pattern stats:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const dbName = TOPIC_SLUGS[topicSlug];
    if (!dbName) {
      setLoading(false);
      return;
    }
    setDbTopicName(dbName);
    setDisplayName(TOPIC_DISPLAY_NAMES[topicSlug] || dbName);

    if (user) {
      loadPatternData();
    }
  }, [topicSlug, user]);

  useEffect(() => {
    if (!user) return;
    const handleSync = () => {
      localStorage.removeItem(`topic_patterns_cache_${user.id}_${topicSlug}`);
      loadPatternData();
    };
    window.addEventListener("question-solved", handleSync);
    return () => window.removeEventListener("question-solved", handleSync);
  }, [user, topicSlug]);

  if (loading) {
    return (
      <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
        {/* Breadcrumbs */}
        <div className="py-2">
          <Skeleton className="h-4 w-48" />
        </div>

        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pt-2">
          <div className="space-y-2">
            <Skeleton className="h-8 w-80" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-16 w-48 rounded-xl" />
        </div>

        {/* Pattern Card Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-[#111111]/72 border border-[#2D2D2D]/60 p-6 rounded-xl flex flex-col justify-between min-h-[280px]"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <Skeleton className="h-5.5 w-24 rounded" />
                  <Skeleton className="h-6 w-6 rounded" />
                </div>
                <Skeleton className="h-6.5 w-40 mb-4" />
                
                <div className="flex justify-between items-end mb-6">
                  <div>
                    <Skeleton className="h-3 w-14 mb-1" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-3 w-12 mb-1" />
                    <Skeleton className="h-5 w-8" />
                  </div>
                </div>

                <div className="space-y-2 mb-6">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-8" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                  <Skeleton className="h-3 w-28 mx-auto pt-1" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </AppShell>
    );
  }

  if (!dbTopicName) {
    return (
      <AppShell>
        <div className="flex h-[60vh] flex-col items-center justify-center text-center space-y-4">
          <h2 className="font-display-arcade text-error">TOPIC_NOT_FOUND</h2>
          <p className="text-on-surface-variant max-w-sm">The requested roadmap topic slug does not match any known records.</p>
          <Link href="/questions/sheetstride-core">
            <button className="px-6 py-2 bg-primary text-background font-bold rounded-lg font-mono-label text-sm uppercase">
              Go Back
            </button>
          </Link>
        </div>
      </AppShell>
    );
  }

  const topicPercent = topicTotal > 0 ? Math.round((topicSolved / topicTotal) * 100) : 0;

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

  const cardReveal = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  };

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      {/* Breadcrumbs */}
      <Breadcrumbs 
        items={[
          { label: "SheetStride Core", href: "/questions/sheetstride-core" },
          { label: displayName }
        ]} 
      />

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pt-2">
        <div className="space-y-2">
          <h1 className="font-display-arcade text-2xl md:text-3xl text-primary uppercase leading-tight tracking-wider">
            {displayName.toUpperCase()}
          </h1>
          <p className="font-mono-label text-mono-label text-secondary uppercase flex items-center gap-2">
            <span className="material-symbols-outlined text-base">terminal</span>
            Pattern Explorer: Roadmap Segments
          </p>
        </div>
        
        {/* Topic Stats */}
        <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl flex items-center gap-6 select-none">
          <div>
            <p className="font-mono-label text-mono-label text-outline uppercase mb-1">Topic Mastery</p>
            <div className="flex items-baseline gap-2">
              <span className="font-mono-stats text-mono-stats text-secondary">{topicPercent}%</span>
              <span className="text-xs text-outline">{topicSolved}/{topicTotal} SOLVED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Pattern Card Grid */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {patterns.map(pat => (
          <motion.div
            key={pat.slug}
            variants={cardReveal}
            className="glass-card bg-[#111111] border border-[#2D2D2D] p-6 rounded-xl flex flex-col justify-between hover:translate-y-[-4px] hover:border-primary hover:shadow-[0_10px_30px_-10px_rgba(255,212,0,0.12)] transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className={`px-2 py-1 border font-mono-label text-xs uppercase rounded ${
                  pat.isCompleted 
                    ? "bg-secondary/20 text-secondary border-secondary/40" 
                    : "bg-primary/10 text-primary border-primary/20"
                }`}>
                  {pat.isCompleted ? "COMPLETED" : "ACTIVE"}
                </span>
                <span className="material-symbols-outlined text-outline">
                  {pat.isCompleted ? "check_circle" : "sync_alt"}
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-2 truncate" title={pat.name}>
                {pat.name}
              </h3>
              
              <div className="flex justify-between items-end mb-6 select-none">
                <div>
                  <p className="font-mono-label text-mono-label text-outline uppercase">Questions</p>
                  <p className="font-mono-stats text-mono-stats">{pat.total}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono-label text-mono-label text-secondary uppercase">Solved</p>
                  <p className="font-mono-stats text-mono-stats text-secondary">{pat.solved}</p>
                </div>
              </div>

              {/* Progress and Difficulty Mix */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-mono-label uppercase select-none">
                  <span className="text-outline">Progress</span>
                  <span className="text-secondary">{pat.percent}%</span>
                </div>
                <div className="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-secondary transition-all duration-1000 ease-out" 
                    style={{ width: `${pat.percent}%` }}
                  />
                </div>
                <p className="text-[11px] font-mono-label text-outline uppercase text-center pt-1">
                  {pat.difficultyMix}
                </p>
              </div>
            </div>

            <Link href={`/questions/sheetstride-core/${topicSlug}/${pat.slug}`}>
              <button className={`w-full py-3 rounded-lg font-mono-label text-mono-label uppercase font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                pat.isCompleted 
                  ? "bg-secondary/10 text-secondary border border-secondary/30 hover:bg-secondary/20" 
                  : "bg-primary text-on-primary hover:shadow-[0_0_15px_rgba(255,212,0,0.4)]"
              }`}>
                {pat.isCompleted ? "Review Patterns" : "View Questions"} 
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </motion.div>
        ))}
      </motion.div>

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
