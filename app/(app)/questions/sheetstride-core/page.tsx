"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

const TOPIC_CONFIGS: { 
  [key: string]: { 
    displayName: string; 
    slug: string; 
    badge: string; 
    badgeTone: "secondary" | "tertiary" | "danger" 
  } 
} = {
  "I. Two Pointer Patterns": { displayName: "Two Pointer Patterns", slug: "two-pointer-patterns", badge: "Easy-Medium", badgeTone: "secondary" },
  "II. Sliding Window Patterns": { displayName: "Sliding Window Patterns", slug: "sliding-window-patterns", badge: "Medium", badgeTone: "secondary" },
  "III. Tree Traversal Patterns (DFS & BFS)": { displayName: "Tree Traversal Patterns", slug: "tree-traversal-patterns", badge: "Hard", badgeTone: "danger" },
  "IV. Graph Traversal Patterns (DFS & BFS)": { displayName: "Graph Traversal Patterns", slug: "graph-traversal-patterns", badge: "Medium-Hard", badgeTone: "tertiary" },
  "V. Dynamic Programming (DP) Patterns": { displayName: "Dynamic Programming Patterns", slug: "dynamic-programming-patterns", badge: "Elite", badgeTone: "danger" },
  "VI. Heap (Priority Queue) Patterns": { displayName: "Heap Patterns", slug: "heap-patterns", badge: "Medium", badgeTone: "secondary" },
  "VII. Backtracking Patterns": { displayName: "Backtracking Patterns", slug: "backtracking-patterns", badge: "Medium-Hard", badgeTone: "tertiary" },
  "VIII. Greedy Patterns": { displayName: "Greedy Patterns", slug: "greedy-patterns", badge: "Medium", badgeTone: "secondary" },
  "IX. Binary Search Patterns": { displayName: "Binary Search Patterns", slug: "binary-search-patterns", badge: "Easy-Medium", badgeTone: "secondary" },
  "X. Stack Patterns": { displayName: "Stack Patterns", slug: "stack-patterns", badge: "Easy", badgeTone: "secondary" },
  "XI. Bit Manipulation Patterns": { displayName: "Bit Manipulation Patterns", slug: "bit-manipulation-patterns", badge: "Medium", badgeTone: "tertiary" },
  "XII. Linked List Manipulation Patterns": { displayName: "Linked List Patterns", slug: "linked-list-patterns", badge: "Easy-Medium", badgeTone: "secondary" },
  "XIII. Array/Matrix Manipulation Patterns": { displayName: "Array / Matrix Patterns", slug: "array-matrix-patterns", badge: "Standard", badgeTone: "secondary" },
  "XIV. String Manipulation Patterns": { displayName: "String Manipulation Patterns", slug: "string-manipulation-patterns", badge: "Easy", badgeTone: "secondary" },
  "XV. Design Patterns": { displayName: "Design Patterns", slug: "design-patterns", badge: "System", badgeTone: "tertiary" }
};

// Order topics numerically based on prefix (I, II, III...)
const TOPIC_ORDER = [
  "I. Two Pointer Patterns",
  "II. Sliding Window Patterns",
  "III. Tree Traversal Patterns (DFS & BFS)",
  "IV. Graph Traversal Patterns (DFS & BFS)",
  "V. Dynamic Programming (DP) Patterns",
  "VI. Heap (Priority Queue) Patterns",
  "VII. Backtracking Patterns",
  "VIII. Greedy Patterns",
  "IX. Binary Search Patterns",
  "X. Stack Patterns",
  "XI. Bit Manipulation Patterns",
  "XII. Linked List Manipulation Patterns",
  "XIII. Array/Matrix Manipulation Patterns",
  "XIV. String Manipulation Patterns",
  "XV. Design Patterns"
];

interface TopicStats {
  dbName: string;
  displayName: string;
  slug: string;
  badge: string;
  badgeTone: "secondary" | "tertiary" | "danger";
  total: number;
  solved: number;
  percent: number;
}

export default function SheetstrideCorePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [topicsList, setTopicsList] = useState<TopicStats[]>([]);
  const [globalSolved, setGlobalSolved] = useState(0);
  const [globalTotal, setGlobalTotal] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function loadTopicData() {
      try {
        setLoading(true);

        // 1. Fetch user's solved question IDs
        const { data: userSolves, error: solvesError } = await supabase
          .from("user_progress")
          .select("question_id")
          .eq("user_id", userId);

        if (solvesError) throw solvesError;
        const solvedIds = new Set(userSolves?.map((row: any) => row.question_id) || []);

        // 2. Fetch all Core roadmap questions
        const { data: coreQuestions, error: coreError } = await supabase
          .from("sheet_questions")
          .select("*");

        if (coreError) throw coreError;

        // Group counts by topic
        const topicCounts: { [key: string]: { total: number; solved: number } } = {};
        
        // Initialize keys
        TOPIC_ORDER.forEach(topic => {
          topicCounts[topic] = { total: 0, solved: 0 };
        });

        coreQuestions?.forEach((q: any) => {
          const tName = q["topic name"];
          const qId = q["question ID"];
          if (topicCounts[tName]) {
            topicCounts[tName].total++;
            if (solvedIds.has(qId)) {
              topicCounts[tName].solved++;
            }
          }
        });

        // Map to topic stats
        let gSolved = 0;
        let gTotal = 0;

        const statsList = TOPIC_ORDER.map(dbName => {
          const config = TOPIC_CONFIGS[dbName];
          const counts = topicCounts[dbName] || { total: 0, solved: 0 };
          const percent = counts.total > 0 ? Math.round((counts.solved / counts.total) * 100) : 0;

          gSolved += counts.solved;
          gTotal += counts.total;

          return {
            dbName,
            displayName: config.displayName,
            slug: config.slug,
            badge: config.badge,
            badgeTone: config.badgeTone,
            total: counts.total,
            solved: counts.solved,
            percent
          };
        });

        setTopicsList(statsList);
        setGlobalSolved(gSolved);
        setGlobalTotal(gTotal);

        // Fetch streak from timestamps in local storage
        const storedTimestamps = localStorage.getItem("solved_questions_timestamps");
        if (storedTimestamps) {
          try {
            const timestamps = JSON.parse(storedTimestamps) as { [qId: string]: string };
            const dates = Object.values(timestamps)
              .map(isoStr => isoStr.slice(0, 10))
              .filter((value, index, self) => self.indexOf(value) === index)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

            if (dates.length > 0) {
              let current = 0;
              const todayStr = new Date().toISOString().slice(0, 10);
              const yesterday = new Date();
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().slice(0, 10);

              const hasSolvedRecently = dates[0] === todayStr || dates[0] === yesterdayStr;
              
              if (hasSolvedRecently) {
                current = 1;
                let lastDate = new Date(dates[0]);
                for (let i = 1; i < dates.length; i++) {
                  const checkDate = new Date(dates[i]);
                  const diffTime = Math.abs(lastDate.getTime() - checkDate.getTime());
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays === 1) {
                    current++;
                    lastDate = checkDate;
                  } else {
                    break;
                  }
                }
              }
              setStreak(current);
            }
          } catch (e) {
            console.error(e);
          }
        }

      } catch (err) {
        console.error("Failed to load topic stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTopicData();
  }, [user]);

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

  if (loading) {
    return (
      <AppShell>
        <div className="flex h-[70vh] items-center justify-center bg-[#090909] text-primary">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="font-mono-label text-mono-label tracking-[0.2em]">INITIALIZING_ROADMAP...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[{ label: "SheetStride Core" }]} />

      {/* Page Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
        <div>
          <h1 className="font-display-arcade text-2xl md:text-3xl text-primary uppercase mb-2">
            SHEETSTRIDE CORE ROADMAP
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl">
            Master the essential patterns required for high-performance algorithm engineering. Track your progress across 15 mission-critical domains.
          </p>
        </div>
        
        {/* Global Core Stats */}
        <div className="bg-surface-container-low border border-outline-variant/30 p-4 rounded-xl flex gap-8 items-center select-none">
          <div className="text-center">
            <span className="block font-mono-label text-mono-label text-outline uppercase mb-1">Overall Progress</span>
            <span className="block font-mono-stats text-mono-stats text-secondary">{globalSolved}/{globalTotal}</span>
          </div>
          <div className="w-[1px] h-10 bg-outline-variant/30" />
          <div className="text-center">
            <span className="block font-mono-label text-mono-label text-outline uppercase mb-1">Current Streak</span>
            <span className="block font-mono-stats text-mono-stats text-tertiary">{streak} DAYS</span>
          </div>
        </div>
      </header>

      {/* Topic Grid */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {topicsList.map(topic => (
          <motion.div
            key={topic.slug}
            variants={cardReveal}
            className="topic-card bg-surface-container border border-outline-variant/30 rounded-xl p-6 flex flex-col justify-between group hover:translate-y-[-4px] hover:border-primary hover:shadow-[0_10px_30px_-10px_rgba(255,212,0,0.2)] transition-all duration-300"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-headline-md text-headline-md text-on-surface group-hover:text-primary transition-colors pr-2 leading-tight">
                  {topic.displayName}
                </h3>
                <Badge tone={topic.badgeTone} className="uppercase shrink-0 text-[10px]">
                  {topic.badge}
                </Badge>
              </div>
              <div className="flex items-center justify-between mb-2 select-none">
                <span className="font-mono-label text-mono-label text-outline">Solved</span>
                <span className="font-mono-stats text-mono-stats text-on-surface">{topic.solved} / {topic.total}</span>
              </div>
              {/* Progress bar */}
              <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden mb-6">
                <div 
                  className="h-full bg-gradient-to-r from-primary-container to-secondary rounded-full transition-all duration-1000"
                  style={{ width: `${topic.percent}%` }}
                />
              </div>
            </div>
            
            <Link href={`/questions/sheetstride-core/${topic.slug}`}>
              <button className="w-full py-3 bg-surface-container-high border border-outline-variant/50 rounded-lg font-mono-label text-mono-label uppercase tracking-widest hover:bg-primary hover:text-on-primary-fixed transition-all active:scale-[0.98] font-bold">
                Explore Patterns
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
