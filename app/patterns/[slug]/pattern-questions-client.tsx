"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ExternalLink, X, Lock, CheckCircle2, Circle } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Question {
  Sheet_order: number;
  question_id: number;
  title: string;
  difficulty: string;
  link: string;
  topics: string;
  acceptance_rate: number | null;
}

export function PatternQuestionsClient({
  initialQuestions,
  patternName
}: {
  initialQuestions: Question[];
  patternName: string;
}) {
  const { user } = useAuth();
  
  // Track solved states & timestamps locally
  const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
  const [solvedTimestamps, setSolvedTimestamps] = useState<{ [qId: number]: string }>({});
  
  // Toast state
  const [toastMessage, setToastMessage] = useState("");
  const [showToast, setShowToast] = useState(false);

  // Fetch solve status if logged in
  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function fetchSolveStatus() {
      try {
        const { data, error } = await supabase
          .from("user_progress")
          .select("question_id, completed-at")
          .eq("user_id", userId);
        
        if (error) throw error;

        const ids = new Set<number>();
        const timesMap: { [qId: number]: string } = {};
        
        data?.forEach((item: any) => {
          ids.add(item.question_id);
          timesMap[item.question_id] = item["completed-at"] || new Date().toISOString();
        });

        setSolvedIds(ids);
        setSolvedTimestamps(timesMap);
      } catch (err) {
        console.error("Failed to load user solve status:", err);
      }
    }

    fetchSolveStatus();
  }, [user]);

  // Checkbox toggle logic
  const handleToggleSolve = async (qId: number, title: string) => {
    if (!user) return;
    const userId = user.id;

    const isCurrentlySolved = solvedIds.has(qId);
    const newSolvedIds = new Set(solvedIds);
    const newTimestamps = { ...solvedTimestamps };

    // Optimistic Update
    if (isCurrentlySolved) {
      newSolvedIds.delete(qId);
      delete newTimestamps[qId];
    } else {
      newSolvedIds.add(qId);
      newTimestamps[qId] = new Date().toISOString();
    }
    setSolvedIds(newSolvedIds);
    setSolvedTimestamps(newTimestamps);

    const timestamps = JSON.parse(localStorage.getItem("solved_questions_timestamps") || "{}");

    try {
      if (isCurrentlySolved) {
        // Delete progress record
        const { error } = await supabase
          .from("user_progress")
          .delete()
          .match({ user_id: userId, question_id: qId });
        if (error) throw error;

        delete timestamps[qId];
        triggerToast(`"${title}" marked as incomplete.`);
      } else {
        // Insert progress record
        const { error } = await supabase
          .from("user_progress")
          .insert({
            user_id: userId,
            question_id: qId,
            completed: true,
            "completed-at": new Date().toISOString()
          });
        if (error) throw error;

        timestamps[qId] = new Date().toISOString();
        triggerToast(`"${title}" solved! Progress updated.`);
      }
      localStorage.setItem("solved_questions_timestamps", JSON.stringify(timestamps));
      
      // Dispatch solve event to update header stats
      window.dispatchEvent(new Event("question-solved"));
    } catch (err) {
      console.error("Failed to sync solve status with database:", err);
      // Revert optimistic state
      setSolvedIds(new Set(solvedIds));
      setSolvedTimestamps(solvedTimestamps);
    }
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 4000);
  };

  const formatID = (id: number) => {
    if (id < 10) return `00${id}`;
    if (id < 100) return `0${id}`;
    return `${id}`;
  };

  const formatSolvedDate = (qId: number) => {
    const isoStr = solvedTimestamps[qId];
    if (!isoStr) return "-";
    const dateObj = new Date(isoStr);
    return dateObj.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric"
    });
  };

  return (
    <div className="relative">
      
      {/* Dynamic stats overlay (when logged in) */}
      {user && (
        <div className="flex justify-between items-center bg-[#111111] border border-[#2D2D2D] px-4 py-3 rounded-lg mb-6 text-xs text-outline/80 font-mono">
          <span>PROGRESS: {solvedIds.size} / {initialQuestions.length} SOLVED</span>
          <span className="text-primary-strong">
            {Math.round((solvedIds.size / Math.max(initialQuestions.length, 1)) * 100)}% COMPLETE
          </span>
        </div>
      )}

      {/* Table container */}
      <div className="border border-outline-variant/15 rounded-lg overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#090909]/50 border-b border-outline-variant/20 select-none text-[10px] uppercase font-mono-label text-outline/65">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-5 py-3.5">Difficulty</th>
                {user && <th className="px-5 py-3.5">Status</th>}
                {user && <th className="px-5 py-3.5">Solved Date</th>}
                <th className="px-5 py-3.5">Link</th>
                <th className="px-5 py-3.5 text-right">Track</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {initialQuestions.map((row) => {
                const solved = solvedIds.has(row.question_id);
                return (
                  <tr
                    key={row.question_id}
                    className={cn(
                      "transition-all duration-200 hover:bg-primary/[0.01]",
                      solved && "bg-secondary/[0.01]"
                    )}
                  >
                    {/* Index */}
                    <td className="px-5 py-4 font-mono text-[11px] text-outline/50 select-none">
                      {formatID(row.Sheet_order)}
                    </td>

                    {/* Title */}
                    <td className="px-5 py-4">
                      <a
                        href={row.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          "font-headline-md text-xs font-semibold tracking-wide transition-colors hover:text-primary",
                          solved ? "text-outline line-through opacity-60" : "text-text"
                        )}
                      >
                        {row.title}
                      </a>
                    </td>

                    {/* Difficulty */}
                    <td className="px-5 py-4 select-none">
                      <Badge
                        tone={
                          row.difficulty.toLowerCase() === "easy" ? "secondary" :
                          row.difficulty.toLowerCase() === "medium" ? "tertiary" : "danger"
                        }
                      >
                        {row.difficulty.toUpperCase()}
                      </Badge>
                    </td>

                    {/* Solved Status (authenticated only) */}
                    {user && (
                      <td className="px-5 py-4 select-none">
                        <div className={cn("flex items-center gap-1.5 text-[11px] font-mono", solved ? "text-secondary" : "text-outline/50")}>
                          {solved ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-secondary" />
                              <span>Solved</span>
                            </>
                          ) : (
                            <>
                              <Circle className="h-3.5 w-3.5 text-outline/40" />
                              <span>Pending</span>
                            </>
                          )}
                        </div>
                      </td>
                    )}

                    {/* Solved Date (authenticated only) */}
                    {user && (
                      <td className="px-5 py-4 font-mono text-[11px] text-outline select-none">
                        {formatSolvedDate(row.question_id)}
                      </td>
                    )}

                    {/* Leetcode Link */}
                    <td className="px-5 py-4">
                      <a
                        href={row.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-outline/60 hover:text-primary transition-colors inline-flex items-center"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </td>

                    {/* Checkbox (or redirect trigger) */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end">
                        {user ? (
                          <button
                            onClick={() => handleToggleSolve(row.question_id, row.title)}
                            className={cn(
                              "w-4 h-4 rounded border flex items-center justify-center transition-all duration-300 cursor-pointer",
                              solved ? "border-secondary bg-secondary/15 text-secondary scale-110" : "border-outline-variant/60 hover:border-primary bg-transparent"
                            )}
                          >
                            {solved && <Check className="h-3 w-3" strokeWidth={3} />}
                          </button>
                        ) : (
                          <Link 
                            href="/login" 
                            className="text-outline/40 hover:text-primary transition-colors inline-flex items-center gap-1 text-[10px] font-mono tracking-wider"
                            title="Log in to track progress"
                          >
                            <Lock className="h-3 w-3" />
                            <span className="hidden sm:inline">LOGIN_TO_TRACK</span>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 right-8 bg-[#111111] border border-[#2D2D2D] border-l-4 border-l-secondary p-4 rounded-xl flex items-center gap-4 shadow-2xl z-50 min-w-[320px] max-w-[400px]"
          >
            <div className="w-8 h-8 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0 select-none">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-body text-xs font-semibold text-text">Progress Tracker</p>
              <p className="font-mono text-[11px] text-outline/80 truncate" title={toastMessage}>{toastMessage}</p>
            </div>
            <button
              onClick={() => setShowToast(false)}
              className="p-1 hover:bg-outline-variant/10 rounded text-outline hover:text-text cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
