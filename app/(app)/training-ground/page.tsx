"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Sparkles, Brain, History, ArrowRight, ShieldAlert, Award, Lock, Dumbbell } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { DrillsClient } from "./drills-client";
import { WorkoutClient } from "./workout-client";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { cn } from "@/lib/utils";

interface DrillLog {
  id: string;
  selected_pattern: string;
  correct_pattern: string;
  selected_signal: string;
  reflection_chip: string;
  reflection_text: string;
  is_correct: boolean;
  created_at: string;
  questions: {
    Title: string;
  } | null;
}

export default function TrainingGroundPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeMode = searchParams.get("mode") || ""; // "drill" or "workout"
  const preSelectedPattern = searchParams.get("drill_pattern") || "";

  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<DrillLog[]>([]);
  const [userXP, setUserXP] = useState(0);
  const [insights, setInsights] = useState<string[]>([]);

  // Load history & profile stats
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const userId = user.id;

    async function loadData() {
      try {
        setLoading(true);
        // 1. Load User XP
        const { data: profile } = await supabase
          .from("profiles")
          .select("xp")
          .eq("id", userId)
          .maybeSingle();

        if (profile) {
          setUserXP(profile.xp || 0);
        }

        // 2. Load Drill History
        let logsList = [];
        const { data: logs, error: logsError } = await supabase
          .from("drill_history")
          .select(`
            id,
            selected_pattern,
            correct_pattern,
            selected_signal,
            reflection_chip,
            reflection_text,
            is_correct,
            created_at,
            questions:question_id ( Title )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(20);

        let localBackups = [];
        try {
          localBackups = JSON.parse(localStorage.getItem("sheetstride-drill-logs") || "[]");
        } catch (e) {
          console.warn("Failed to parse local drill backups:", e);
        }

        if (!logsError && logs && logs.length > 0) {
          const remoteIds = new Set(logs.map(log => log.id));
          const uniqueLocal = localBackups.filter((log: any) => !remoteIds.has(log.id));
          logsList = [...logs, ...uniqueLocal].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } else {
          logsList = localBackups;
        }

        setHistory(logsList as any);
        generateInsights(logsList as any);
      } catch (err) {
        console.warn("Failed to load training data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, activeMode]);

  // Compute supportive Recognition Insights
  const generateInsights = (logs: DrillLog[]) => {
    const incorrect = logs.filter((log) => !log.is_correct);
    if (incorrect.length === 0) {
      setInsights(["Great pattern-matching focus! Keep up the deliberate training."]);
      return;
    }

    const pairs: Record<string, number> = {};
    incorrect.forEach((log) => {
      const key = `${log.selected_pattern} vs. ${log.correct_pattern}`;
      pairs[key] = (pairs[key] || 0) + 1;
    });

    const sortedPairs = Object.entries(pairs).sort((a, b) => b[1] - a[1]);
    const parsedInsights: string[] = [];

    sortedPairs.slice(0, 2).forEach(([pair, count]) => {
      parsedInsights.push(
        `Keep an eye on ${pair}: You mismatched them ${count} time${count > 1 ? "s" : ""} recently.`
      );
    });

    if (parsedInsights.length === 0) {
      parsedInsights.push("You are building solid pattern muscle memory. Carry on.");
    }

    setInsights(parsedInsights);
  };

  const startDrillMode = (patternSlug = "") => {
    const params = new URLSearchParams();
    params.set("mode", "drill");
    if (patternSlug) {
      params.set("drill_pattern", patternSlug);
    }
    router.push(`/training-ground?${params.toString()}`);
  };

  const returnToHub = () => {
    router.push("/training-ground");
  };

  const handleXPUpdate = () => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("xp")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setUserXP(data.xp || 0);
      });
  };

  if (!user) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
          <ShieldAlert className="h-12 w-12 text-primary animate-pulse" />
          <h1 className="font-display text-xl text-text uppercase tracking-widest">Training Sector Locked</h1>
          <p className="font-body text-xs text-outline max-w-sm leading-relaxed">
            Please log in with your developer operator session credentials to access the Pattern Recognition Drills and Workout Packs.
          </p>
          <a
            href="/login"
            className="px-5 py-2 border border-primary text-primary hover:bg-primary/10 rounded font-mono text-xs uppercase tracking-widest transition-all"
          >
            Authenticate Operator
          </a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className={cn(
        "mx-auto space-y-8 pb-12 transition-all duration-300",
        activeMode === "drill" ? "max-w-[1400px] px-6" : "max-w-5xl"
      )}>
        {/* Header HUD */}
        <div className="flex flex-col gap-4 border-b border-[#222] pb-6">
          <Breadcrumbs items={[{ label: "Patterns", href: "/patterns" }, { label: "Challenges Hub" }]} />
          
          <div className="flex justify-between items-end">
            <div>
              <h1 className="font-display text-2xl text-text uppercase tracking-wider">
                OPERATIONAL TRAINING CENTER
              </h1>
            </div>

            <div className="flex items-center gap-3 border border-primary/20 bg-primary/[0.03] px-4 py-2 rounded-lg select-none font-mono">
              <Award className="h-4 w-4 text-primary" />
              <span className="text-[10px] text-outline uppercase tracking-wider">Accumulated Score:</span>
              <span className="text-xs text-primary font-bold">{userXP} XP</span>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-24"
            >
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </motion.div>
          ) : activeMode === "drill" ? (
            <motion.div
              key="drill"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <DrillsClient
                onClose={returnToHub}
                preSelectedPattern={preSelectedPattern}
                onXPUpdate={handleXPUpdate}
              />
            </motion.div>
          ) : (
            <motion.div
              key="hub"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {/* Daily Workout Panel with Integrated Calendar Grid */}
              <div className="border border-[#222]/80 bg-[#111]/90 rounded-2xl p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-[#222] pb-4">
                  <div className="h-8 w-8 rounded-lg bg-primary/5 border border-primary/25 flex items-center justify-center">
                    <Dumbbell className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-sm text-text uppercase tracking-wider">
                      DAILY TRAINING WORKOUT & SCHEDULE
                    </h3>
                    <p className="font-body text-xs text-outline mt-0.5">
                      Select date keys to track solve sessions, generate daily packs (resets 5 AM IST), and verify targets.
                    </p>
                  </div>
                </div>

                <WorkoutClient onXPUpdate={handleXPUpdate} />
              </div>

              {/* Lower Grid Details */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left 2 Columns: Drills launcher & History */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Drill launcher card */}
                  <div
                    onClick={() => startDrillMode()}
                    className="group border border-[#222] hover:border-primary/45 bg-[#111]/60 hover:bg-[#111] p-6 rounded-2xl cursor-pointer flex flex-col justify-between h-40 transition-all hover:shadow-[0_4px_25px_-5px_rgba(255,212,0,0.1)]"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <Brain className="h-5 w-5 text-primary" />
                        <span className="font-mono text-[10px] border border-primary/25 text-primary px-1.5 py-0.5 rounded tracking-widest uppercase">SIMULATOR ACTIVE</span>
                      </div>
                      <h3 className="font-display font-semibold text-xs text-text uppercase tracking-wider group-hover:text-primary transition-colors mt-3">
                        PATTERN RECOGNITION SIMULATOR
                      </h3>
                      <p className="font-body text-xs text-outline leading-relaxed mt-1.5">
                        Analyze descriptive prompts under zero compile rules, select primary clues, and match approach patterns.
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-primary uppercase tracking-widest font-semibold mt-3">
                      Initiate simulator <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>

                  {/* Drill History List */}
                  <div className="border border-[#222] bg-[#111]/40 rounded-xl p-6 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-[#222]">
                      <History className="h-4 w-4 text-outline/50" />
                      <h3 className="font-mono text-xs uppercase tracking-wider text-outline">
                        DRILL PRACTICE LOG
                      </h3>
                    </div>

                    {history.length === 0 ? (
                      <div className="text-center py-12 text-outline/40 font-mono text-xs uppercase tracking-wider">
                        No recent drill history logged
                      </div>
                    ) : (
                      <div className="divide-y divide-[#1C1C1C] overflow-hidden rounded-lg border border-[#1A1A1A]">
                        {history.slice(0, 5).map((log) => (
                          <div
                            key={log.id}
                            className="px-4 py-3 bg-[#0C0C0C]/40 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 hover:bg-[#151515]/30 transition-all font-mono"
                          >
                            <div className="min-w-0">
                              <p className="text-xs text-text font-semibold truncate">
                                {log.questions?.Title || "LeetCode Challenge"}
                              </p>
                              <div className="flex flex-wrap gap-2 mt-1 items-center">
                                <span className="text-xs text-outline/50">
                                  {new Date(log.created_at).toLocaleDateString()}
                                </span>
                                {log.reflection_chip && (
                                  <span className="text-[10px] border border-[#222] text-outline/70 px-1.5 py-0.5 rounded">
                                    {log.reflection_chip}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0 text-xs">
                              <span className="text-outline/40">GUESSED:</span>
                              <span
                                className={
                                  log.is_correct ? "text-secondary font-bold" : "text-danger"
                                }
                              >
                                {log.selected_pattern}
                              </span>
                              {!log.is_correct && (
                                <>
                                  <span className="text-outline/25">→</span>
                                  <span className="text-outline/60">{log.correct_pattern}</span>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Insights & Lockups */}
                <div className="space-y-6">
                  {/* Recognition Insights */}
                  <div className="border border-[#222] bg-[#111]/40 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h3 className="font-mono text-xs uppercase tracking-widest text-primary font-bold">
                        Recognition Insights
                      </h3>
                    </div>

                    <div className="space-y-3 font-body text-sm text-outline/90 leading-relaxed">
                      {insights.map((insight, idx) => (
                        <div
                          key={idx}
                          className="p-3 border border-outline-variant/15 rounded bg-[#090909]/60 flex items-start gap-2.5"
                        >
                          <span className="text-primary font-bold mt-0.5">●</span>
                          <span>{insight}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Locked Challenges Sector */}
                  <div className="border border-[#222] bg-[#0E0E0E]/40 p-6 rounded-2xl space-y-4">
                    <h3 className="font-mono text-xs uppercase tracking-widest text-outline/40 select-none">
                      ADDITIONAL DRILLS
                    </h3>

                    <div className="space-y-3 select-none">
                      {/* Speed Run Mode */}
                      <div className="border border-[#1A1A1A]/40 bg-[#0C0C0C]/30 p-4 rounded-xl opacity-50 flex items-center justify-between">
                        <div>
                          <span className="block font-display text-xs text-outline uppercase tracking-wider font-semibold">Speed Run Mode</span>
                          <span className="block font-mono text-[10px] text-outline/45 mt-0.5">TIME ATTACK PATTERN IDENTIFICATION</span>
                        </div>
                        <Lock className="h-4 w-4 text-outline/35" />
                      </div>

                      {/* Mistake Spotter */}
                      <div className="border border-[#1A1A1A]/40 bg-[#0C0C0C]/30 p-4 rounded-xl opacity-50 flex items-center justify-between">
                        <div>
                          <span className="block font-display text-xs text-outline uppercase tracking-wider font-semibold">Mistake Spotter</span>
                          <span className="block font-mono text-[10px] text-outline/45 mt-0.5">DEBUG DEBUGGING EXERCISE PATHS</span>
                        </div>
                        <Lock className="h-4 w-4 text-outline/35" />
                      </div>

                      {/* Sub-Pattern Matcher */}
                      <div className="border border-[#1A1A1A]/40 bg-[#0C0C0C]/30 p-4 rounded-xl opacity-50 flex items-center justify-between">
                        <div>
                          <span className="block font-display text-xs text-outline uppercase tracking-wider font-semibold">Sub-Pattern Matcher</span>
                          <span className="block font-mono text-[10px] text-outline/45 mt-0.5">DEEP DRILL ALGORITHMIC VARIANTS</span>
                        </div>
                        <Lock className="h-4 w-4 text-outline/35" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
