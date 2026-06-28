"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { fetchWithCache } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function MissionLibraryPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  // Stats states
  const [totalLeetcode, setTotalLeetcode] = useState(3647);
  const [solvedLeetcode, setSolvedLeetcode] = useState(0);
  
  const [totalCore, setTotalCore] = useState(437);
  const [solvedCore, setSolvedCore] = useState(0);

  const [totalCompanies, setTotalCompanies] = useState(463);
  const [totalCompanyQuestions, setTotalCompanyQuestions] = useState(7715);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function loadStats() {
      try {
        setLoading(true);

        const cacheKey = `questions_hub_stats_${userId}`;
        const data = await fetchWithCache(cacheKey, async () => {
          // 1. Fetch total LeetCode questions count
          const { count: leetcodeCount } = await supabase
            .from("questions")
            .select("*", { count: "exact", head: true });

          // 2. Fetch user's solved questions
          const { data: userSolves, error: solvesError } = await supabase
            .from("user_progress")
            .select("question_id")
            .eq("user_id", userId);
          
          if (solvesError) throw solvesError;
          const solvedIds = new Set(userSolves?.map((row: any) => row.question_id) || []);

          // 3. Fetch SheetStride Core questions mapping
          const { data: coreQuestions, error: coreError } = await supabase
            .from("sheet_questions")
            .select("*");

          if (coreError) throw coreError;

          // 4. Fetch Company Sheets summary stats
          const { data: companySummary, error: summaryError } = await supabase
            .from("view_company_summary")
            .select("question_count");

          if (summaryError) throw summaryError;

          return {
            leetcodeCount: leetcodeCount !== null ? leetcodeCount : 3647,
            solvedLeetcodeCount: solvedIds.size,
            totalCore: coreQuestions ? coreQuestions.length : 437,
            solvedCoreCount: coreQuestions ? coreQuestions.filter((q: any) => solvedIds.has(q["question ID"])).length : 0,
            totalCompanies: companySummary ? companySummary.length : 463,
            totalCompanyQuestions: companySummary ? companySummary.reduce((sum: number, row: any) => sum + (row.question_count || 0), 0) : 7715
          };
        });

        setTotalLeetcode(data.leetcodeCount);
        setSolvedLeetcode(data.solvedLeetcodeCount);
        setTotalCore(data.totalCore);
        setSolvedCore(data.solvedCoreCount);
        setTotalCompanies(data.totalCompanies);
        setTotalCompanyQuestions(data.totalCompanyQuestions);

      } catch (err) {
        console.error("Failed to load Mission Library stats:", err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [user]);

  // Calculations
  const corePercent = totalCore > 0 ? Math.round((solvedCore / totalCore) * 100) : 0;
  const leetcodePercent = totalLeetcode > 0 ? Math.round((solvedLeetcode / totalLeetcode) * 100) : 0;

  // Animation variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardReveal = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } }
  };

  if (loading) {
    return (
      <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
        {/* Header / Breadcrumb */}
        <header className="mb-12 relative overflow-hidden">
          <nav className="flex items-center gap-2 mb-4 text-on-surface-variant font-mono-label text-mono-label uppercase">
            <Skeleton className="h-4 w-24" />
          </nav>
          <Skeleton className="h-10 w-80 mb-4" />
          <Skeleton className="h-5 w-full max-w-2xl" />
        </header>

        {/* Mission Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* SHEETSTRIDE CORE - Flagship Skeleton */}
          <div className="bg-[#111111]/72 border border-[#2D2D2D]/60 p-6 flex flex-col justify-between overflow-hidden lg:col-span-2 rounded-xl min-h-[340px]">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-6 w-32 rounded" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-12 w-full max-w-lg" />
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 border-t border-outline-variant/30 pt-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                ))}
              </div>

              {/* Progress Bar */}
              <Skeleton className="w-full h-1.5 rounded-full" />
            </div>
            
            <div className="flex items-center justify-between mt-6">
              <Skeleton className="w-16 h-8 rounded-full" />
              <Skeleton className="w-40 h-10 rounded-lg" />
            </div>
          </div>

          {/* LEETCODE UNIVERSE Skeleton */}
          <div className="bg-[#111111]/72 border border-[#2D2D2D]/60 p-6 flex flex-col justify-between rounded-xl min-h-[340px]">
            <div className="space-y-6">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-12 w-full" />
              <div className="space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4.5 w-20" />
                  <Skeleton className="h-4.5 w-16" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4.5 w-20" />
                  <Skeleton className="h-4.5 w-24" />
                </div>
              </div>
            </div>
            <Skeleton className="w-full h-11 rounded-lg mt-6" />
          </div>

          {/* COMPANY SHEETS Skeleton */}
          <div className="bg-[#111111]/72 border border-[#f97316]/20 p-6 flex flex-col justify-between rounded-xl min-h-[340px]">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-12 w-full" />
              <div className="space-y-4 border-t border-outline-variant/15 pt-4">
                <div className="flex justify-between">
                  <Skeleton className="h-4.5 w-28" />
                  <Skeleton className="h-4.5 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4.5 w-28" />
                  <Skeleton className="h-4.5 w-16" />
                </div>
              </div>
            </div>
            <Skeleton className="w-full h-11 rounded-lg mt-6 bg-[#f97316]/5 border border-[#f97316]/20" />
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      {/* Header / Breadcrumb */}
      <header className="mb-12 relative overflow-hidden">
        <nav className="flex items-center gap-2 mb-4 text-on-surface-variant font-mono-label text-mono-label uppercase">
          <span className="text-on-surface">Questions</span>
        </nav>
        <h1 className="font-display-arcade text-3xl md:text-4xl text-on-surface tracking-widest leading-tight uppercase">
          MISSION <span className="text-primary">LIBRARY</span>
        </h1>
        <p className="mt-4 font-body-lg text-on-surface-variant max-w-2xl">
          Access hyper-optimized curricula and comprehensive problem sets. Select your active mission to begin the deep-dive into algorithmic mastery.
        </p>
      </header>

      {/* Mission Grid */}
      <motion.div 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {/* SHEETSTRIDE CORE - Flagship */}
        <motion.div 
          variants={cardReveal}
          className="group relative bg-surface-container border border-primary p-6 transition-all duration-300 flex flex-col justify-between overflow-hidden lg:col-span-2 rounded-xl hover:translate-y-[-4px] hover:shadow-[0_10px_30px_-10px_rgba(255,212,0,0.2)]"
        >
          <div className="absolute top-0 right-0 p-4">
            <span className="px-3 py-1 bg-primary text-on-primary font-mono-label text-xs font-bold uppercase tracking-widest rounded-sm">FLAGSHIP ROADMAP</span>
          </div>
          <div>
            <h2 className="font-display-arcade text-lg text-primary mb-4 mt-2">SHEETSTRIDE CORE</h2>
            <p className="font-body-lg text-on-surface-variant mb-8 max-w-lg">
              Our meticulously curated flagship roadmap. Designed to transition you from foundational patterns to high-level system design thinking.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 mb-8 border-t border-outline-variant/30 pt-6">
              <div>
                <span className="block font-mono-label text-mono-label text-outline uppercase mb-1">Total Tasks</span>
                <span className="font-mono-stats text-mono-stats text-on-surface">{totalCore}</span>
              </div>
              <div>
                <span className="block font-mono-label text-mono-label text-outline uppercase mb-1">Solved</span>
                <span className="font-mono-stats text-mono-stats text-secondary">{solvedCore}</span>
              </div>
              <div>
                <span className="block font-mono-label text-mono-label text-outline uppercase mb-1">Completion</span>
                <span className="font-mono-stats text-mono-stats text-primary">{corePercent}%</span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-surface-container-highest rounded-full mb-8 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-primary-container to-secondary transition-all duration-1000"
                style={{ width: `${corePercent}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-surface-container-highest border-2 border-surface-container flex items-center justify-center font-mono-label text-[10px] text-outline">+2k</div>
            </div>
            <Link href="/questions/sheetstride-core">
              <button className="px-6 py-2 bg-primary text-on-primary font-mono-label text-sm font-bold uppercase transition-all hover:scale-105 active:scale-95 flex items-center gap-2 rounded-lg">
                Continue Journey
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
        </motion.div>

        {/* LEETCODE UNIVERSE */}
        <motion.div 
          variants={cardReveal}
          className="group bg-surface-container border border-outline-variant p-6 transition-all duration-300 flex flex-col justify-between rounded-xl hover:translate-y-[-4px] hover:border-primary hover:shadow-[0_10px_30px_-10px_rgba(255,212,0,0.12)]"
        >
          <div>
            <h2 className="font-display-arcade text-lg text-on-surface mb-4 mt-2">LEETCODE UNIVERSE</h2>
            <p className="font-body-lg text-on-surface-variant mb-6">
              Complete LeetCode Question Database access. Filter by company, difficulty, and frequency tags.
            </p>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-end">
                <span className="font-mono-label text-mono-label text-outline uppercase">Questions</span>
                <span className="font-mono-stats text-mono-stats text-on-surface">{totalLeetcode}+</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="font-mono-label text-mono-label text-outline uppercase">Progress</span>
                <span className="font-mono-stats text-mono-stats text-on-surface-variant">{solvedLeetcode} solved</span>
              </div>
            </div>
          </div>
          <Link href="/questions/leetcode-universe">
            <button className="w-full py-3 border border-outline-variant text-on-surface font-mono-label text-sm font-bold uppercase hover:bg-surface-variant/20 hover:border-primary transition-all active:scale-95 rounded-lg">
              Enter Database
            </button>
          </Link>
        </motion.div>

        {/* COMPANY SHEETS - Premium Discovery */}
        <motion.div 
          variants={cardReveal}
          className="group relative bg-[#111111] border border-[#f97316]/35 p-6 transition-all duration-300 flex flex-col justify-between rounded-xl hover:translate-y-[-4px] hover:scale-[1.01] hover:border-[#f97316] hover:shadow-[0_10px_30px_-5px_rgba(249,115,22,0.3)]"
        >
          <div className="absolute top-0 right-0 p-4">
            <span className="px-2 py-0.5 bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316] font-mono-label text-[9px] font-bold uppercase tracking-widest tracking-widest rounded-sm">
              PREMIUM PREP
            </span>
          </div>
          
          <div>
            <h2 className="font-display-arcade text-lg text-[#f97316] mb-4 mt-2">COMPANY SHEETS</h2>
            <p className="font-body-md text-on-surface-variant mb-6 leading-relaxed">
              FAANG • HFT • SaaS • Startup Interview Prep. Master coding patterns asked in top product organizations.
            </p>
            
            <div className="space-y-4 mb-8 border-t border-outline-variant/15 pt-4">
              <div className="flex justify-between items-end">
                <span className="font-mono-label text-mono-label text-outline/65 uppercase">Total Companies</span>
                <span className="font-mono-stats text-mono-stats text-on-surface">{totalCompanies}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="font-mono-label text-mono-label text-outline/65 uppercase">Total Questions</span>
                <span className="font-mono-stats text-mono-stats text-on-surface">{totalCompanyQuestions}</span>
              </div>
            </div>
          </div>
          
          <Link href="/questions/company-sheets">
            <button className="w-full py-3 bg-[#f97316]/10 border border-[#f97316]/35 hover:border-[#f97316] text-[#f97316] hover:bg-[#f97316]/20 font-mono-label text-sm font-bold uppercase transition-all active:scale-95 rounded-lg flex items-center justify-center gap-2">
              Explore Sheets
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </Link>
        </motion.div>

        {/* LOCKED: NEETCODE 150 */}
        <motion.div 
          variants={cardReveal}
          className="relative group bg-surface-container-low border border-outline-variant/30 p-6 opacity-60 grayscale cursor-not-allowed rounded-xl"
        >
          <div className="absolute top-4 right-4">
            <Lock className="w-4 h-4 text-outline" />
          </div>
          <div className="mb-4">
            <span className="font-mono-label text-[10px] px-2 py-0.5 border border-outline-variant text-outline rounded uppercase">Coming Soon</span>
          </div>
          <h2 className="font-display-arcade text-lg text-on-surface-variant mb-4">NEETCODE 150</h2>
          <p className="font-body-sm text-outline mb-6">
            The essential blind list for fast-track interview preparation. Advanced integration pending.
          </p>
          <div className="w-full h-[1px] bg-outline-variant/30 mb-6" />
          <div className="flex justify-between text-outline font-mono-label text-xs">
            <span>150 MISSIONS</span>
            <span>LOCKED</span>
          </div>
        </motion.div>

        {/* LOCKED: BLIND 75 */}
        <motion.div 
          variants={cardReveal}
          className="relative group bg-surface-container-low border border-outline-variant/30 p-6 opacity-60 grayscale cursor-not-allowed rounded-xl"
        >
          <div className="absolute top-4 right-4">
            <Lock className="w-4 h-4 text-outline" />
          </div>
          <div className="mb-4">
            <span className="font-mono-label text-[10px] px-2 py-0.5 border border-outline-variant text-outline rounded uppercase">Coming Soon</span>
          </div>
          <h2 className="font-display-arcade text-lg text-on-surface-variant mb-4">BLIND 75</h2>
          <p className="font-body-sm text-outline mb-6">
            The original legendary list that started it all. Enhanced stats tracking coming soon.
          </p>
          <div className="w-full h-[1px] bg-outline-variant/30 mb-6" />
          <div className="flex justify-between text-outline font-mono-label text-xs">
            <span>75 MISSIONS</span>
            <span>LOCKED</span>
          </div>
        </motion.div>

        {/* LOCKED: STRIVER A2Z */}
        <motion.div 
          variants={cardReveal}
          className="relative group bg-surface-container-low border border-outline-variant/30 p-6 opacity-60 grayscale cursor-not-allowed rounded-xl"
        >
          <div className="absolute top-4 right-4">
            <Lock className="w-4 h-4 text-outline" />
          </div>
          <div className="mb-4">
            <span className="font-mono-label text-[10px] px-2 py-0.5 border border-outline-variant text-outline rounded uppercase">Coming Soon</span>
          </div>
          <h2 className="font-display-arcade text-lg text-on-surface-variant mb-4">STRIVER A2Z</h2>
          <p className="font-body-sm text-outline mb-6">
            Comprehensive A-Z DSA course integration for structured learning paths.
          </p>
          <div className="w-full h-[1px] bg-outline-variant/30 mb-6" />
          <div className="flex justify-between text-outline font-mono-label text-xs">
            <span>455 MISSIONS</span>
            <span>LOCKED</span>
          </div>
        </motion.div>

        {/* LOCKED: GRIND 169 */}
        <motion.div 
          variants={cardReveal}
          className="relative group bg-surface-container-low border border-outline-variant/30 p-6 opacity-60 grayscale cursor-not-allowed rounded-xl"
        >
          <div className="absolute top-4 right-4">
            <Lock className="w-4 h-4 text-outline" />
          </div>
          <div className="mb-4">
            <span className="font-mono-label text-[10px] px-2 py-0.5 border border-outline-variant text-outline rounded uppercase">Coming Soon</span>
          </div>
          <h2 className="font-display-arcade text-lg text-on-surface-variant mb-4">GRIND 169</h2>
          <p className="font-body-sm text-outline mb-6">
            Successor to Blind 75. Optimized for more comprehensive coverage of topics.
          </p>
          <div className="w-full h-[1px] bg-outline-variant/30 mb-6" />
          <div className="flex justify-between text-outline font-mono-label text-xs">
            <span>169 MISSIONS</span>
            <span>LOCKED</span>
          </div>
        </motion.div>
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
