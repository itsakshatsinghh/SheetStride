"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, CheckCircle2, Clock, Play, BookOpen } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

interface CalendarItem {
  id: number;
  title: string;
  difficulty: string;
  link: string;
  topics: string;
  type: "solve" | "revision";
  date: string; // YYYY-MM-DD
}

export function CalendarHUD() {
  const { user } = useAuth();
  
  // Date states
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA'));
  
  // Data lists
  const [solvesMap, setSolvesMap] = useState<{ [dateStr: string]: CalendarItem[] }>({});
  const [revisionsMap, setRevisionsMap] = useState<{ [dateStr: string]: CalendarItem[] }>({});
  const [isLoading, setIsLoading] = useState(true);

  // Month stats
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE",
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  // Helper to format date keys YYYY-MM-DD
  const formatDateKey = (y: number, m: number, d: number) => {
    return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  };

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      // 1. Fetch user progress rows (gotcha: manual join required)
      const { data: progressRows, error: progressErr } = await supabase
        .from("user_progress")
        .select('question_id, completed, "completed-at", next_revision_due')
        .eq("user_id", user.id) as any;

      if (progressErr) throw progressErr;
      if (!progressRows || progressRows.length === 0) {
        setSolvesMap({});
        setRevisionsMap({});
        setIsLoading(false);
        return;
      }

      // 2. Fetch master question details in a separate query to prevent Postgrest join issues
      const questionIds = Array.from(new Set((progressRows as any[]).map((r: any) => r.question_id)));
      const { data: questionsRows, error: questionsErr } = await supabase
        .from("questions")
        .select("ID, Title, Difficulty, Link, Topics")
        .in("ID", questionIds);

      if (questionsErr) throw questionsErr;

      // Map question details by ID for instant O(1) lookups
      const questionsLookup = new Map(questionsRows?.map(q => [q.ID, q]));

      // 3. Populate maps
      const newSolvesMap: { [dateStr: string]: CalendarItem[] } = {};
      const newRevisionsMap: { [dateStr: string]: CalendarItem[] } = {};

      progressRows.forEach((row: any) => {
        const qDetails = questionsLookup.get(row.question_id);
        if (!qDetails) return;

        // Map completed solves
        if (row.completed && row["completed-at"]) {
          const localDate = new Date(row["completed-at"]).toLocaleDateString('en-CA');
          if (!newSolvesMap[localDate]) {
            newSolvesMap[localDate] = [];
          }
          const alreadyExists = newSolvesMap[localDate].some((item: any) => item.id === qDetails.ID);
          if (!alreadyExists) {
            newSolvesMap[localDate].push({
              id: qDetails.ID,
              title: qDetails.Title,
              difficulty: qDetails.Difficulty,
              link: qDetails.Link,
              topics: qDetails.Topics,
              type: "solve",
              date: localDate
            });
          }
        }

        // Map upcoming/past scheduled revisions
        if (row.next_revision_due) {
          const localDate = new Date(row.next_revision_due).toLocaleDateString('en-CA');
          if (!newRevisionsMap[localDate]) {
            newRevisionsMap[localDate] = [];
          }
          const alreadyExists = newRevisionsMap[localDate].some((item: any) => item.id === qDetails.ID);
          if (!alreadyExists) {
            newRevisionsMap[localDate].push({
              id: qDetails.ID,
              title: qDetails.Title,
              difficulty: qDetails.Difficulty,
              link: qDetails.Link,
              topics: qDetails.Topics,
              type: "revision",
              date: localDate
            });
          }
        }
      });

      setSolvesMap(newSolvesMap);
      setRevisionsMap(newRevisionsMap);
    } catch (err) {
      console.error("Failed to load calendar data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Listen to live question solves to auto-update
    window.addEventListener("question-solved", loadData);
    return () => {
      window.removeEventListener("question-solved", loadData);
    };
  }, [user]);

  // Calendar logic
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const selectedDateSolves = solvesMap[selectedDate] || [];
  const selectedDateRevisions = revisionsMap[selectedDate] || [];

  // Helper formatting for detail card header
  const formatSelectedDateHuman = () => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0E0E0F]/80 border border-[#2D2D2D] p-6 rounded-xl relative overflow-hidden font-sans select-none animate-pulse">
        {/* Background terminal matrix lines */}
        <div className="absolute inset-0 code-grid opacity-15 pointer-events-none" />

        {/* Left column: Calendar Grid Skeleton */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-3">
            <div className="h-4 w-36 bg-[#2C2D2D] rounded" />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-[#141416]/80 rounded border border-[#2D2D2D]" />
              <div className="h-4 w-20 bg-[#2C2D2D] rounded" />
              <div className="w-7 h-7 bg-[#141416]/80 rounded border border-[#2D2D2D]" />
            </div>
          </div>
          
          {/* Calendar week header skeletons */}
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-5 bg-[#121214]/60 border border-[#1C1C1E] rounded-md" />
            ))}
          </div>

          {/* Calendar cell grids skeletons */}
          <div className="grid grid-cols-7 gap-1.5 min-h-[220px]">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="aspect-square border border-[#FFC700]/5 bg-[#FFC700]/[0.01] rounded-md" />
            ))}
          </div>
        </div>

        {/* Right column: Selected Day details panel skeletons */}
        <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-[#2D2D2D] pt-6 lg:pt-0 lg:pl-6 space-y-4">
          <div className="border-b border-[#2D2D2D] pb-3">
            <div className="h-3 w-32 bg-[#2D2D2D] rounded mb-1.5" />
            <div className="h-4 w-48 bg-[#2D2D2D] rounded" />
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-[#2D2D2D] rounded" />
              <div className="h-16 bg-[#121214]/80 border border-[#232325] rounded-lg" />
            </div>
            <div className="space-y-2 pt-2 border-t border-[#1C1C1E]">
              <div className="h-4 w-24 bg-[#2D2D2D] rounded" />
              <div className="h-16 bg-[#121214]/80 border border-[#232325] rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-[#0E0E0F]/80 border border-[#2D2D2D] p-6 rounded-xl relative overflow-hidden font-sans">
      {/* Background terminal matrix lines */}
      <div className="absolute inset-0 code-grid opacity-15 pointer-events-none" />

      {/* Calendar Grid Container (Left) */}
      <div className="lg:col-span-7 space-y-4 relative z-10 select-none">
        <div className="flex items-center justify-between border-b border-[#2D2D2D] pb-3">
          <h3 className="font-mono text-xs text-[#FFC700] font-bold tracking-widest uppercase flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#FFC700] animate-pulse" />
            SUBMISSION CALENDAR
          </h3>
          <div className="flex items-center gap-2 font-mono">
            <button
              onClick={handlePrevMonth}
              className="w-7 h-7 bg-[#141416] border border-[#2D2D2D] hover:border-[#FFC700] hover:text-[#FFC700] rounded flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold w-28 text-center text-text tracking-wider">
              {monthNames[month]} {year}
            </span>
            <button
              onClick={handleNextMonth}
              className="w-7 h-7 bg-[#141416] border border-[#2D2D2D] hover:border-[#FFC700] hover:text-[#FFC700] rounded flex items-center justify-center transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1.5 text-center font-mono text-[9px] text-outline font-bold">
          {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map(day => (
            <div key={day} className="py-1 bg-[#121214]/60 border border-[#1C1C1E] rounded-md uppercase">
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1.5 min-h-[220px]">
          {/* Blank padding prefix */}
          {Array.from({ length: firstDayIndex }).map((_, index) => (
            <div key={`empty-${index}`} className="border border-transparent rounded-md" />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const dayNum = index + 1;
            const dateKey = formatDateKey(year, month, dayNum);
            
            const hasSolves = (solvesMap[dateKey] || []).length > 0;
            const hasRevisions = (revisionsMap[dateKey] || []).length > 0;
            const isSelected = selectedDate === dateKey;

            return (
              <button
                key={`day-${dayNum}`}
                onClick={() => setSelectedDate(dateKey)}
                className={cn(
                  "aspect-square flex flex-col justify-between p-1.5 border rounded-md transition-all cursor-pointer relative",
                  isSelected
                    ? "border-[#FFC700] bg-[#FFC700]/10 text-[#FFC700] shadow-[0_0_8px_rgba(255,199,0,0.2)] font-bold"
                    : "border-[#FFC700]/15 bg-[#FFC700]/[0.02] text-[#F5F5F0] hover:border-[#FFC700]/40 hover:bg-[#FFC700]/[0.06]"
                )}
              >
                {/* Date number */}
                <span className="font-mono text-[13px] font-semibold">{dayNum}</span>

                {/* Contribution lights */}
                <div className="flex gap-1 justify-center w-full mt-1.5">
                  {hasSolves && (
                    <span 
                      className="w-1.5 h-1.5 rounded-full bg-[#10B981] shadow-[0_0_4px_#10B981]" 
                      title={`${solvesMap[dateKey].length} question(s) completed`}
                    />
                  )}
                  {hasRevisions && (
                    <span 
                      className="w-1.5 h-1.5 rounded-full bg-[#FFC700] shadow-[0_0_4px_#FFC700]" 
                      title={`${revisionsMap[dateKey].length} revision(s) due`}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 font-mono text-[9px] text-outline pt-2 border-t border-[#1C1C1E]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] shadow-[0_0_3px_#10B981]" />
            Completed Solves
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#FFC700] shadow-[0_0_3px_#FFC700]" />
            Scheduled Revisions
          </span>
        </div>
      </div>

      {/* Date Detail View (Right) */}
      <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-[#2D2D2D] pt-6 lg:pt-0 lg:pl-6 space-y-4 relative z-10 flex flex-col justify-between min-h-[300px]">
        <div className="space-y-4 flex-1">
          <div className="border-b border-[#2D2D2D] pb-3">
            <span className="block font-mono text-[9px] text-outline font-bold tracking-wider mb-0.5">SELECTED SCHEDULE LOG</span>
            <span className="font-mono text-[11px] text-[#FFC700] font-bold tracking-tight block">
              {formatSelectedDateHuman()}
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-1.5 custom-scrollbar">
            {/* Section A: Revisions scheduled for today */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                <Clock className="w-3.5 h-3.5 text-[#FFC700]" />
                Revisions Due ({selectedDateRevisions.length})
              </div>
              {selectedDateRevisions.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateRevisions.map(item => (
                    <div key={`rev-${item.id}`} className="flex items-center justify-between gap-3 p-2.5 bg-[#121214]/80 border border-[#232325] rounded-lg group">
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                            detail: {
                              questionId: item.id,
                              title: item.title,
                              difficulty: item.difficulty,
                              link: item.link,
                              mode: "description"
                            }
                          }))}
                          className="font-bold text-[11px] text-white text-left hover:text-primary transition-colors truncate block cursor-pointer"
                        >
                          {item.title}
                        </button>
                        <span className={cn(
                          "inline-block font-mono text-[8px] font-bold uppercase mt-1",
                          item.difficulty.toLowerCase() === "easy" ? "text-emerald-400" :
                          item.difficulty.toLowerCase() === "medium" ? "text-primary" : "text-red-400"
                        )}>
                          {item.difficulty}
                        </span>
                      </div>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                          detail: {
                            questionId: item.id,
                            title: item.title,
                            difficulty: item.difficulty,
                            link: item.link,
                            mode: "review"
                          }
                        }))}
                        className="bg-primary hover:bg-[#FFE14D] text-[#000000] font-bold font-mono text-[9px] px-2.5 py-1 rounded flex items-center gap-0.5 transition-all cursor-pointer shrink-0 uppercase tracking-wide"
                      >
                        REVISE
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-outline italic py-2 bg-[#121214]/20 border border-dashed border-[#232325]/50 rounded-lg text-center font-mono">
                  No revisions scheduled for this date.
                </div>
              )}
            </div>

            {/* Section B: Solves completed on this day */}
            <div className="space-y-2 pt-2 border-t border-[#1C1C1E]">
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-outline uppercase font-bold tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
                Completed Solves ({selectedDateSolves.length})
              </div>
              {selectedDateSolves.length > 0 ? (
                <div className="space-y-2">
                  {selectedDateSolves.map(item => (
                    <div key={`solve-${item.id}`} className="flex items-center justify-between gap-3 p-2.5 bg-[#121214]/80 border border-[#232325] rounded-lg">
                      <div className="min-w-0 flex-1">
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                            detail: {
                              questionId: item.id,
                              title: item.title,
                              difficulty: item.difficulty,
                              link: item.link,
                              mode: "description"
                            }
                          }))}
                          className="font-bold text-[11px] text-white text-left hover:text-[#10B981] transition-colors truncate block cursor-pointer"
                        >
                          {item.title}
                        </button>
                        <span className={cn(
                          "inline-block font-mono text-[8px] font-bold uppercase mt-1",
                          item.difficulty.toLowerCase() === "easy" ? "text-emerald-400" :
                          item.difficulty.toLowerCase() === "medium" ? "text-primary" : "text-red-400"
                        )}>
                          {item.difficulty}
                        </span>
                      </div>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                          detail: {
                            questionId: item.id,
                            title: item.title,
                            difficulty: item.difficulty,
                            link: item.link,
                            mode: "notebook"
                          }
                        }))}
                        className="border border-[#2C2D2D] hover:bg-white/5 text-text hover:text-primary font-bold font-mono text-[9px] px-2.5 py-1 rounded flex items-center gap-1 transition-all cursor-pointer shrink-0 uppercase tracking-wide"
                        title="View Study Notes"
                      >
                        <BookOpen className="w-3 h-3" />
                        NOTES
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] text-outline italic py-2 bg-[#121214]/20 border border-dashed border-[#232325]/50 rounded-lg text-center font-mono">
                  No questions completed on this date.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
