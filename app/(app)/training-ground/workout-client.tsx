"use client";

import { useEffect, useState } from "react";
import { Loader2, ArrowRight, CheckCircle2, Award, Dumbbell, ExternalLink, Calendar, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface WorkoutClientProps {
  onXPUpdate: () => void;
}

interface WorkoutQuestion {
  question_id: number;
  title: string;
  difficulty: string;
  link: string;
  pattern_name: string;
  completed: boolean;
}

interface WorkoutState {
  questions: WorkoutQuestion[];
  difficulty: string;
  patterns: string[];
  created_at: string;
}

const PATTERNS_LIST = [
  { slug: "sliding-window", name: "Sliding Window" },
  { slug: "two-pointers", name: "Two Pointers" },
  { slug: "fast-slow-pointers", name: "Fast & Slow Pointers" },
  { slug: "merge-intervals", name: "Merge Intervals" },
  { slug: "cyclic-sort", name: "Cyclic Sort" },
  { slug: "in-place-reversal-of-a-linked-list", name: "In-place Reversal of a Linked List" },
  { slug: "tree-breadth-first-search-bfs", name: "Tree Breadth-First Search (BFS)" },
  { slug: "tree-depth-first-search-dfs", name: "Tree Depth-First Search (DFS)" },
  { slug: "two-heaps", name: "Two Heaps" },
  { slug: "subsets", name: "Subsets" },
  { slug: "modified-binary-search", name: "Modified Binary Search" },
  { slug: "bitwise-xor", name: "Bitwise XOR" },
  { slug: "top-k-elements", name: "Top 'K' Elements" },
  { slug: "k-way-merge", name: "K-way Merge" },
  { slug: "-1-knapsack-dynamic-programming", name: "0-1 Knapsack (Dynamic Programming)" },
  { slug: "topological-sort-graph", name: "Topological Sort (Graph)" }
];

const FALLBACK_QUESTIONS = [
  { question_id: 209, title: "Minimum Size Subarray Sum", difficulty: "Medium", link: "https://leetcode.com/problems/minimum-size-subarray-sum/", pattern_name: "Sliding Window" },
  { question_id: 3, title: "Longest Substring Without Repeating Characters", difficulty: "Medium", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", pattern_name: "Sliding Window" },
  { question_id: 1004, title: "Max Consecutive Ones III", difficulty: "Medium", link: "https://leetcode.com/problems/max-consecutive-ones-iii/", pattern_name: "Sliding Window" },
  { question_id: 643, title: "Maximum Average Subarray I", difficulty: "Easy", link: "https://leetcode.com/problems/maximum-average-subarray-i/", pattern_name: "Sliding Window" },
  { question_id: 167, title: "Two Sum II - Input Array Is Sorted", difficulty: "Easy", link: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", pattern_name: "Two Pointers" },
  { question_id: 15, title: "3Sum", difficulty: "Medium", link: "https://leetcode.com/problems/3sum/", pattern_name: "Two Pointers" },
  { question_id: 11, title: "Container With Most Water", difficulty: "Medium", link: "https://leetcode.com/problems/container-with-most-water/", pattern_name: "Two Pointers" },
  { question_id: 977, title: "Squares of a Sorted Array", difficulty: "Easy", link: "https://leetcode.com/problems/squares-of-a-sorted-array/", pattern_name: "Two Pointers" },
  { question_id: 141, title: "Linked List Cycle", difficulty: "Easy", link: "https://leetcode.com/problems/linked-list-cycle/", pattern_name: "Fast & Slow Pointers" },
  { question_id: 142, title: "Linked List Cycle II", difficulty: "Medium", link: "https://leetcode.com/problems/linked-list-cycle-ii/", pattern_name: "Fast & Slow Pointers" },
  { question_id: 287, title: "Find the Duplicate Number", difficulty: "Medium", link: "https://leetcode.com/problems/find-the-duplicate-number/", pattern_name: "Fast & Slow Pointers" },
  { question_id: 56, title: "Merge Intervals", difficulty: "Medium", link: "https://leetcode.com/problems/merge-intervals/", pattern_name: "Merge Intervals" },
  { question_id: 57, title: "Insert Interval", difficulty: "Medium", link: "https://leetcode.com/problems/insert-interval/", pattern_name: "Merge Intervals" },
  { question_id: 986, title: "Interval List Intersections", difficulty: "Medium", link: "https://leetcode.com/problems/interval-list-intersections/", pattern_name: "Merge Intervals" },
  { question_id: 268, title: "Missing Number", difficulty: "Easy", link: "https://leetcode.com/problems/missing-number/", pattern_name: "Cyclic Sort" },
  { question_id: 448, title: "Find All Numbers Disappeared in an Array", difficulty: "Easy", link: "https://leetcode.com/problems/find-all-numbers-disappeared-in-an-array/", pattern_name: "Cyclic Sort" },
  { question_id: 102, title: "Binary Tree Level Order Traversal", difficulty: "Medium", link: "https://leetcode.com/problems/binary-tree-level-order-traversal/", pattern_name: "Tree Breadth-First Search (BFS)" },
  { question_id: 107, title: "Binary Tree Level Order Traversal II", difficulty: "Medium", link: "https://leetcode.com/problems/binary-tree-level-order-traversal-ii/", pattern_name: "Tree Breadth-First Search (BFS)" },
  { question_id: 104, title: "Maximum Depth of Binary Tree", difficulty: "Easy", link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", pattern_name: "Tree Depth-First Search (DFS)" },
  { question_id: 112, title: "Path Sum", difficulty: "Easy", link: "https://leetcode.com/problems/path-sum/", pattern_name: "Tree Depth-First Search (DFS)" },
  { question_id: 113, title: "Path Sum II", difficulty: "Medium", link: "https://leetcode.com/problems/path-sum-ii/", pattern_name: "Tree Depth-First Search (DFS)" },
  { question_id: 295, title: "Find Median from Data Stream", difficulty: "Hard", link: "https://leetcode.com/problems/find-median-from-data-stream/", pattern_name: "Two Heaps" },
  { question_id: 78, title: "Subsets", difficulty: "Medium", link: "https://leetcode.com/problems/subsets/", pattern_name: "Subsets" },
  { question_id: 90, title: "Subsets II", difficulty: "Medium", link: "https://leetcode.com/problems/subsets-ii/", pattern_name: "Subsets" },
  { question_id: 704, title: "Binary Search", difficulty: "Easy", link: "https://leetcode.com/problems/binary-search/", pattern_name: "Modified Binary Search" },
  { question_id: 33, title: "Search in Rotated Sorted Array", difficulty: "Medium", link: "https://leetcode.com/problems/search-in-rotated-sorted-array/", pattern_name: "Modified Binary Search" },
  { question_id: 207, title: "Course Schedule", difficulty: "Medium", link: "https://leetcode.com/problems/course-schedule/", pattern_name: "Topological Sort (Graph)" },
  { question_id: 210, title: "Course Schedule II", difficulty: "Medium", link: "https://leetcode.com/problems/course-schedule-ii/", pattern_name: "Topological Sort (Graph)" }
];

// Helper to get workout day key with 5AM IST reset boundary
const getWorkoutDayKey = (dateObject = new Date()) => {
  // IST is UTC + 5:30. Subtracting 5:00 hours boundary resets day at 5:00 AM IST
  // Equivalent: UTC timestamp shifted by +30 minutes (+0.5 hours)
  const adjusted = new Date(dateObject.getTime() + (30 * 60 * 1000));
  const yyyy = adjusted.getUTCFullYear();
  const mm = String(adjusted.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(adjusted.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

export function WorkoutClient({ onXPUpdate }: WorkoutClientProps) {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedDateKey, setSelectedDateKey] = useState("");
  const [todayDateKey, setTodayDateKey] = useState("");

  const [activeWorkout, setActiveWorkout] = useState<WorkoutState | null>(null);

  // Setup options
  const [selectedDifficulty, setSelectedDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("mixed");
  const [selectedPatterns, setSelectedPatterns] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [solvingId, setSolvingId] = useState<number | null>(null);

  // Calendar states
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth()); // 0-indexed
  const [datesWithWorkouts, setDatesWithWorkouts] = useState<Set<string>>(new Set());

  // Compute today's active workout key on mount
  useEffect(() => {
    const todayKey = getWorkoutDayKey(new Date());
    setTodayDateKey(todayKey);
    setSelectedDateKey(todayKey);
    loadWorkoutForDate(todayKey);
    updateWorkoutDots();
    setLoading(false);
  }, []);

  // Update dots for calendar rendering
  const updateWorkoutDots = () => {
    const dates = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("sheetstride-workout-")) {
        const dateKey = key.replace("sheetstride-workout-", "");
        dates.add(dateKey);
      }
    }
    setDatesWithWorkouts(dates);
  };

  const loadWorkoutForDate = (dateKey: string) => {
    const cached = localStorage.getItem(`sheetstride-workout-${dateKey}`);
    if (cached) {
      try {
        setActiveWorkout(JSON.parse(cached));
      } catch (err) {
        console.warn("Failed to parse cached workout:", err);
        setActiveWorkout(null);
      }
    } else {
      setActiveWorkout(null);
    }
  };

  // Sync solve states with Supabase
  useEffect(() => {
    if (!activeWorkout) return;
    const currentWorkout = activeWorkout;

    async function syncSolves() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const qIds = currentWorkout.questions.map((q) => q.question_id);
        const { data: userSolves } = await supabase
          .from("user_progress")
          .select("question_id, completed")
          .eq("user_id", user.id)
          .in("question_id", qIds);

        if (userSolves) {
          const solvedSet = new Set(
            userSolves.filter((s) => s.completed).map((s) => s.question_id)
          );

          let stateChanged = false;
          const updatedQuestions = currentWorkout.questions.map((q) => {
            const isSolved = solvedSet.has(q.question_id);
            if (q.completed !== isSolved) {
              stateChanged = true;
              return { ...q, completed: isSolved };
            }
            return q;
          });

          if (stateChanged) {
            const newState = { ...currentWorkout, questions: updatedQuestions };
            setActiveWorkout(newState);
            localStorage.setItem(`sheetstride-workout-${selectedDateKey}`, JSON.stringify(newState));
          }
        }
      } catch (e) {
        console.warn("Failed to sync solves with user_progress:", e);
      }
    }

    syncSolves();
  }, [activeWorkout, selectedDateKey]);

  useEffect(() => {
    const handleSolveEvent = () => {
      loadWorkoutForDate(selectedDateKey);
    };
    window.addEventListener("question-solved", handleSolveEvent);
    return () => {
      window.removeEventListener("question-solved", handleSolveEvent);
    };
  }, [selectedDateKey]);

  // Generate Workout Pack
  const generateWorkoutPack = async () => {
    if (selectedPatterns.length === 0 || selectedDateKey !== todayDateKey) return;
    setGenerating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setGenerating(false);
        return;
      }

      let corePool: any[] = [];
      try {
        const { data, error } = await supabase
          .from("view_sheet_questions")
          .select("*");
        
        if (!error && data && data.length > 0) {
          corePool = data;
        } else {
          corePool = FALLBACK_QUESTIONS;
        }
      } catch (e) {
        console.warn("Supabase query failed, falling back to static questions list:", e);
        corePool = FALLBACK_QUESTIONS;
      }

      const chosenPatternNames = PATTERNS_LIST.filter((p) => selectedPatterns.includes(p.slug)).map((p) => p.name);
      let filteredPool = corePool.filter((q) => 
        chosenPatternNames.some(name => q.pattern_name.toLowerCase().includes(name.toLowerCase()))
      );

      if (filteredPool.length === 0) {
        filteredPool = FALLBACK_QUESTIONS.filter((q) => 
          chosenPatternNames.some(name => q.pattern_name.toLowerCase().includes(name.toLowerCase()))
        );
      }

      if (selectedDifficulty !== "mixed") {
        filteredPool = filteredPool.filter(
          (q) => q.difficulty.toLowerCase() === selectedDifficulty
        );
      }

      let solvedIds = new Set<number>();
      let dueIds = new Set<number>();
      let userSolves: any[] = [];

      try {
        const { data } = await supabase
          .from("user_progress")
          .select("question_id, completed, next_revision_date, interval_multiplier")
          .eq("user_id", user.id);

        if (data) {
          userSolves = data;
          solvedIds = new Set(data.filter((s) => s.completed).map((s) => s.question_id));
          dueIds = new Set(
            data
              .filter((s) => s.next_revision_date && new Date(s.next_revision_date) <= new Date())
              .map((s) => s.question_id)
          );
        }
      } catch (e) {
        console.warn("Failed to fetch user progress:", e);
      }

      const unsolved = filteredPool.filter((q) => !solvedIds.has(q.question_id));
      const weak = filteredPool.filter(
        (q) => userSolves.find((s) => s.question_id === q.question_id && (s.interval_multiplier || 1.5) < 1.3)
      );
      const due = filteredPool.filter((q) => dueIds.has(q.question_id));
      const fallback = filteredPool;

      const selection: WorkoutQuestion[] = [];
      const selectedIds = new Set<number>();

      const tryAdd = (list: any[]) => {
        const shuffled = [...list].sort(() => 0.5 - Math.random());
        for (const item of shuffled) {
          if (selection.length >= 3) break;
          if (!selectedIds.has(item.question_id)) {
            selectedIds.add(item.question_id);
            selection.push({
              question_id: item.question_id,
              title: item.title || item.question_name || "Classic Challenge",
              difficulty: item.difficulty,
              link: item.link,
              pattern_name: item.pattern_name,
              completed: false
            });
          }
        }
      };

      tryAdd(unsolved);
      tryAdd(weak);
      tryAdd(due);
      tryAdd(fallback);

      // Relax difficulty constraint if still less than 3
      if (selection.length < 3 && selectedDifficulty !== "mixed") {
        const relaxedDifficultyPool = corePool.filter((q) => 
          chosenPatternNames.some(name => q.pattern_name.toLowerCase().includes(name.toLowerCase()))
        );
        tryAdd(relaxedDifficultyPool);
      }

      // Relax patterns constraint if still less than 3
      if (selection.length < 3) {
        let generalPool = corePool;
        if (selectedDifficulty !== "mixed") {
          generalPool = generalPool.filter((q) => q.difficulty.toLowerCase() === selectedDifficulty);
        }
        tryAdd(generalPool);
      }

      // Final fallback: any questions
      if (selection.length < 3) {
        tryAdd(corePool);
      }

      if (selection.length > 0) {
        const newWorkout: WorkoutState = {
          questions: selection,
          difficulty: selectedDifficulty,
          patterns: selectedPatterns,
          created_at: new Date().toISOString()
        };
        setActiveWorkout(newWorkout);
        localStorage.setItem(`sheetstride-workout-${selectedDateKey}`, JSON.stringify(newWorkout));
        updateWorkoutDots();
      }
    } catch (err) {
      console.error("Failed to generate workout:", err);
    } finally {
      setGenerating(false);
    }
  };

  const openReflectionDrawer = (q: WorkoutQuestion) => {
    window.dispatchEvent(new CustomEvent("open-question-drawer", {
      detail: {
        questionId: q.question_id,
        title: q.title,
        difficulty: q.difficulty,
        link: q.link,
        mode: "reflection"
      }
    }));
  };

  // Perform question completion writes to Supabase
  const completeQuestion = async (qId: number, difficulty: string) => {
    setSolvingId(qId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from("user_progress").upsert({
        user_id: user.id,
        question_id: qId,
        completed: true,
        completed_at: new Date().toISOString()
      });

      if (!error) {
        window.dispatchEvent(new Event("question-solved"));

        const xpAmount = difficulty.toLowerCase() === "easy" ? 10 : difficulty.toLowerCase() === "medium" ? 15 : 20;

        const { data: profile } = await supabase
          .from("profiles")
          .select("xp")
          .eq("id", user.id)
          .maybeSingle();

        const currentXP = profile?.xp || 0;
        await supabase
          .from("profiles")
          .update({ xp: currentXP + xpAmount })
          .eq("id", user.id);

        onXPUpdate();

        if (activeWorkout) {
          const updated = activeWorkout.questions.map((q) =>
            q.question_id === qId ? { ...q, completed: true } : q
          );
          const newState = { ...activeWorkout, questions: updated };
          setActiveWorkout(newState);
          localStorage.setItem(`sheetstride-workout-${selectedDateKey}`, JSON.stringify(newState));
        }
      }
    } catch (e) {
      console.warn("Failed to checkoff question:", e);
    } finally {
      setSolvingId(null);
    }
  };

  const handleDateClick = (dayNum: number) => {
    const targetDate = new Date(calendarYear, calendarMonth, dayNum);
    const targetKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
    const todayKey = todayDateKey;

    // Prevent future selections (only allow past & today)
    if (targetDate.getTime() > new Date().getTime() && targetKey !== todayKey) {
      return;
    }

    setSelectedDate(targetDate);
    setSelectedDateKey(targetKey);
    loadWorkoutForDate(targetKey);
  };

  // Render Calendar Grid Helper
  const renderCalendarGrid = () => {
    const firstDayIndex = new Date(calendarYear, calendarMonth, 1).getDay();
    const totalDays = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const daysArray = [];

    // Empty spaces for preceding days
    for (let i = 0; i < firstDayIndex; i++) {
      daysArray.push(<div key={`empty-${i}`} className="h-9 w-9" />);
    }

    // Days numbers
    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(calendarYear, calendarMonth, day);
      const cellKey = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const isSelected = cellKey === selectedDateKey;
      const isToday = cellKey === todayDateKey;
      const hasWorkout = datesWithWorkouts.has(cellKey);
      
      const isFuture = cellDate.getTime() > new Date().getTime() && cellKey !== todayDateKey;

      daysArray.push(
        <button
          key={day}
          disabled={isFuture}
          onClick={() => handleDateClick(day)}
          className={cn(
            "h-9 w-9 rounded-lg flex flex-col items-center justify-center font-mono text-xs relative transition-all border cursor-pointer select-none",
            isFuture && "opacity-25 cursor-not-allowed border-transparent text-outline/30",
            !isFuture && !isSelected && "bg-[#0C0C0C] border-[#222]/60 text-outline hover:border-primary/45 hover:text-text",
            isSelected && "bg-primary border-primary text-black font-bold shadow-[0_0_12px_rgba(255,212,0,0.15)]",
            isToday && !isSelected && "border-primary/60 text-primary font-semibold"
          )}
        >
          <span>{day}</span>
          {hasWorkout && (
            <span
              className={cn(
                "absolute bottom-1 h-1 w-1 rounded-full",
                isSelected ? "bg-black" : "bg-primary animate-pulse"
              )}
            />
          )}
        </button>
      );
    }

    return daysArray;
  };

  const prevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11);
      setCalendarYear((prev) => prev - 1);
    } else {
      setCalendarMonth((prev) => prev - 1);
    }
  };

  const nextMonth = () => {
    const todayDate = new Date();
    // Prevent navigating to future months
    if (calendarYear >= todayDate.getFullYear() && calendarMonth >= todayDate.getMonth()) {
      return;
    }
    if (calendarMonth === 11) {
      setCalendarMonth(0);
      setCalendarYear((prev) => prev + 1);
    } else {
      setCalendarMonth((prev) => prev + 1);
    }
  };

  const monthName = new Date(calendarYear, calendarMonth).toLocaleString("en-US", { month: "long" }).toUpperCase();

  const togglePattern = (slug: string) => {
    setSelectedPatterns((prev) =>
      prev.includes(slug) ? prev.filter((p) => p !== slug) : [...prev, slug]
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="font-mono text-xs text-outline uppercase tracking-wider">Loading workout planner...</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
      {/* Left 40% Span Calendar Column */}
      <div className="md:col-span-2 space-y-4">
        <div className="border border-[#222]/80 bg-[#0C0C0C]/80 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[#222] pb-3">
            <span className="font-mono text-xs text-outline uppercase tracking-widest flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> WORKOUT CALENDAR
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={prevMonth}
                className="p-1 border border-[#222] hover:border-outline bg-[#070707] hover:text-text rounded text-outline transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <span className="font-mono text-xs text-text font-bold px-1 select-none">
                {monthName} {calendarYear}
              </span>
              <button
                onClick={nextMonth}
                disabled={calendarYear >= new Date().getFullYear() && calendarMonth >= new Date().getMonth()}
                className="p-1 border border-[#222] hover:border-outline bg-[#070707] hover:text-text rounded text-outline disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs text-outline/50 uppercase select-none">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i} className="h-6 flex items-center justify-center font-bold">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5">
            {renderCalendarGrid()}
          </div>
        </div>

        <div className="border border-[#222]/40 bg-[#090909]/40 p-4 rounded-xl font-mono text-xs text-outline/65 leading-relaxed space-y-1.5 select-none">
          <span className="block font-bold text-outline/80">OPERATOR RULES:</span>
          <span>● Click past/today dates on the chronometer calendar to load that day's target sheets.</span>
          <span>● Workout packages are limit-locked to once-a-day, resetting automatically at 5:00 AM IST.</span>
        </div>
      </div>

      {/* Right 60% Span Workout Content Column */}
      <div className="md:col-span-3 space-y-6">
        {!activeWorkout ? (
          // Generator Configuration Setup (Only allowed for today)
          selectedDateKey === todayDateKey ? (
            <div className="space-y-6">
              <div>
                <label className="block font-mono text-xs text-outline uppercase tracking-wider mb-2">
                  WORKOUT DIFFICULTY PRESET
                </label>
                <div className="grid grid-cols-4 gap-2.5">
                  {(["easy", "medium", "hard", "mixed"] as const).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setSelectedDifficulty(diff)}
                      className={cn(
                        "py-2 px-3 border rounded text-xs uppercase font-mono transition-all cursor-pointer",
                        selectedDifficulty === diff
                          ? "bg-primary/10 border-primary text-primary font-bold shadow-[0_0_8px_rgba(255,212,0,0.05)]"
                          : "bg-[#0C0C0C] border-[#222] text-outline/80 hover:border-outline hover:text-text"
                      )}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-mono text-xs text-outline uppercase tracking-wider mb-2">
                  SELECT FOCUS PATTERNS (CHOOSE AT LEAST 1)
                </label>
                <div className="grid grid-cols-2 gap-2.5 max-h-[160px] overflow-y-auto custom-scrollbar p-1">
                  {PATTERNS_LIST.map((p) => {
                    const isSelected = selectedPatterns.includes(p.slug);
                    return (
                      <button
                        key={p.slug}
                        type="button"
                        onClick={() => togglePattern(p.slug)}
                        className={cn(
                          "px-3 py-2 border rounded font-mono text-xs text-left uppercase transition-all cursor-pointer select-none",
                          isSelected
                            ? "bg-primary/5 border-primary text-primary font-bold shadow-[0_0_8px_rgba(255,212,0,0.05)]"
                            : "bg-[#0C0C0C] border-[#222] text-outline/65 hover:border-outline hover:text-text"
                        )}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#1C1C1C]">
                <button
                  disabled={generating || selectedPatterns.length === 0}
                  onClick={generateWorkoutPack}
                  className="px-5 py-2.5 bg-primary hover:bg-primary-strong text-black font-mono text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {generating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Assembling Workout...
                    </>
                  ) : (
                    <>
                      Build daily workout pack <ArrowRight className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="border border-outline-variant/10 bg-[#090909]/40 p-8 rounded-xl text-center font-mono text-xs text-outline/40 select-none py-20">
              No daily workout was generated on this date ({selectedDateKey})
            </div>
          )
        ) : (
          // Active Workout Pack Display
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-[#1C1C1C] pb-3">
              <span className="font-mono text-xs text-outline uppercase tracking-wider font-bold">
                DAILY PACK TARGETS (
                {activeWorkout.questions.filter((q) => q.completed).length} / 3 SOLVED)
              </span>
              <span className="font-mono text-xs text-outline/45">
                SESSION: {selectedDateKey}
              </span>
            </div>

            {/* Workout List */}
            <div className="space-y-3">
              {activeWorkout.questions.map((q) => (
                <div
                  key={q.question_id}
                  className={cn(
                    "p-4 border rounded-xl flex items-center justify-between gap-4 transition-all bg-[#0C0C0C]/50 border-[#222]/85",
                    q.completed && "border-secondary/20 bg-[#061009]/20"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 select-none">
                      <span className="font-mono text-xs text-outline/50">
                        #{q.question_id}
                      </span>
                      <Badge
                        tone={
                          q.difficulty.toLowerCase() === "easy"
                            ? "secondary"
                            : q.difficulty.toLowerCase() === "medium"
                            ? "tertiary"
                            : "danger"
                        }
                      >
                        {q.difficulty.toUpperCase()}
                      </Badge>
                      <span className="font-mono text-xs text-outline/45 uppercase">
                        {q.pattern_name}
                      </span>
                    </div>
                    <p
                      className={cn(
                        "font-display text-sm font-semibold leading-relaxed text-text",
                        q.completed && "line-through text-outline/40 font-normal"
                      )}
                    >
                      {q.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <a
                      href={q.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 border border-[#222] hover:border-primary/50 rounded-lg text-outline/65 hover:text-primary transition-all flex items-center justify-center"
                      title="Solve on LeetCode"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    {q.completed ? (
                      <div className="h-8 px-3 border border-secondary/20 bg-secondary/10 rounded-lg flex items-center gap-1.5 select-none font-mono text-xs text-secondary font-bold uppercase">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Solved
                      </div>
                    ) : (
                      <button
                        onClick={() => openReflectionDrawer(q)}
                        className="h-8 px-3 border border-[#222] hover:border-primary bg-[#151515] text-outline hover:text-black rounded-lg transition-all font-mono text-xs uppercase font-semibold cursor-pointer flex items-center justify-center gap-1"
                      >
                        <>
                          Mark Solved <Award className="h-3 w-3" />
                        </>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Complete State Card */}
            {activeWorkout.questions.every((q) => q.completed) && (
              <div className="border border-secondary/30 bg-secondary/[0.04] p-5 rounded-xl text-center space-y-2 select-none shadow-[0_0_15px_rgba(77,224,130,0.03)]">
                <Award className="h-8 w-8 text-secondary mx-auto animate-bounce" />
                <h4 className="font-display font-semibold text-sm text-secondary uppercase tracking-wider">
                  Workout Completed!
                </h4>
                <p className="font-body text-xs text-outline max-w-sm mx-auto leading-relaxed">
                  You have finished all 3 training tasks and unlocked full workout XP rewards. Your pattern recognition database is refreshed.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
