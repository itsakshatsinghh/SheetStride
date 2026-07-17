import { SupabaseClient } from "@supabase/supabase-js";

export interface SolvedQuestion {
  ID: number;
  Title: string;
  Difficulty: string;
  Topics: string;
}

export interface RoadmapTask {
  id: string;
  type: "learn" | "drill" | "solve" | "revise";
  label: string;
  question?: {
    ID: number;
    Title: string;
    Difficulty: string;
    Link: string;
    Topics: string;
  };
  completed: boolean;
  topic?: string;
}

export interface FocusHealthTopic {
  completed: number;
  target: number;
  blocks: string;
}

export interface Roadmap {
  date: string;
  welcomeMessage: string;
  estimatedEffortText: string;
  estimatedQuestions: number;
  estimatedMinutes: number;
  items: RoadmapTask[];
  activeFocusTopic: string;
  focusTopics: string[];
  focusHealth: {
    [topic: string]: FocusHealthTopic;
  };
  studyBalance: {
    learning: number;
    practice: number;
    review: number;
  };
  weeklyActivities: number;
  weeklyTopTopic: string;
  currentStreak: number;
  longestStreak: number;
  userXP: number;
  weakestTopic: string;
  revisionQueueLength: number;
  revisionQueue: any[];
  upcomingQueue: any[];
  dailyQuest: any;
}

function getDeterministicPick<T>(arr: T[], seedStr: string): T | null {
  if (arr.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = seedStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % arr.length;
  return arr[index];
}

export async function buildRoadmap(
  userId: string,
  supabase: SupabaseClient,
  preferences: {
    studyMode: "learn" | "balanced" | "review";
    dailyLoad: "light" | "balanced" | "intensive";
    focusDifficulty?: string;
    focusSource?: string;
    focusReviewDensity?: string;
    focusTopics?: string[];
  }
): Promise<Roadmap> {
  const now = new Date();
  const todayDateStr = now.toDateString();
  const todayDateKey = now.toISOString().split("T")[0];
  const daySeed = `${userId}-${todayDateKey}`;

  // 1. Fetch user's completed/revised progress from user_progress
  const { data: progressList, error: progressErr } = await supabase
    .from("user_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("completed", true);

  let revData: any[] = [];
  if (!progressErr && progressList && progressList.length > 0) {
    const questionIds = progressList.map((row: any) => row.question_id);
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("ID, Title, Difficulty, Link, Topics")
      .in("ID", questionIds);
    
    if (!questionsError && questionsData) {
      const questionsMap = new Map(questionsData.map((q: any) => [q.ID, q]));
      revData = progressList
        .map((row: any) => {
          const q = questionsMap.get(row.question_id);
          if (!q) return null;
          return {
            ...row,
            questions: q
          };
        })
        .filter(Boolean);
    }
  }

  const dueRevisions = revData.filter((item: any) => item.next_revision_due && new Date(item.next_revision_due) <= now);
  const upcoming = revData.filter((item: any) => !item.next_revision_due || new Date(item.next_revision_due) > now);
  const revisionQueueLength = dueRevisions.length;

  // 2. Fetch user's solved questions from user_progress
  const { data: userProgress, error: progressError } = await supabase
    .from("user_progress")
    .select(`
      question_id,
      completed,
      "completed-at",
      last_revised_at,
      revision_count
    `)
    .eq("user_id", userId)
    .order("completed-at", { ascending: true });

  if (progressError) throw progressError;

  let solved: SolvedQuestion[] = [];
  if (userProgress && userProgress.length > 0) {
    const questionIds = userProgress.map((row: any) => row.question_id);
    const { data: questionsData, error: questionsError } = await supabase
      .from("questions")
      .select("ID, Title, Difficulty, Topics")
      .in("ID", questionIds);

    if (!questionsError && questionsData) {
      const questionsMap = new Map(questionsData.map((q: any) => [q.ID, q]));
      solved = userProgress
        .map((row: any) => {
          const q = questionsMap.get(row.question_id);
          if (!q) return null;
          return {
            ID: q.ID,
            Title: q.Title,
            Difficulty: q.Difficulty,
            Topics: q.Topics
          };
        })
        .filter(Boolean) as SolvedQuestion[];
    }
  }

  // 3. Compute streaks
  let currentStreak = 0;
  let longestStreak = 0;
  const { data: streakData, error: streakError } = await supabase
    .rpc("calculate_user_streaks", { target_user_id: userId });

  if (!streakError && streakData && streakData.length > 0) {
    currentStreak = streakData[0].res_current_streak || 0;
    longestStreak = streakData[0].res_max_streak || 0;
  }

  // 4. Calculate weakest topic
  const topicStatsMap: { [key: string]: number } = {};
  solved.forEach((q) => {
    if (q.Topics) {
      q.Topics.split(",").forEach((t) => {
        const cleanTopic = t.trim();
        topicStatsMap[cleanTopic] = (topicStatsMap[cleanTopic] || 0) + 1;
      });
    }
  });

  const TOPIC_DENOMINATORS: { [key: string]: number } = {
    "Array": 500,
    "String": 300,
    "Hash Table": 250,
    "Dynamic Programming": 350,
    "Tree": 200,
    "Graph": 150,
    "Binary Search": 130,
    "Linked List": 90
  };

  let computedWeakest = "Array";
  let lowestRatio = 1.0;
  Object.entries(TOPIC_DENOMINATORS).forEach(([topic, total]) => {
    const solvedCount = topicStatsMap[topic] || 0;
    const ratio = solvedCount / total;
    if (ratio < lowestRatio) {
      lowestRatio = ratio;
      computedWeakest = topic;
    }
  });

  // 5. Fetch Daily LeetCode Objective
  let quest = null;
  try {
    const res = await fetch("https://alfa-leetcode-api.onrender.com/daily").then(r => r.ok ? r.json() : null);
    if (res && res.questionTitle) {
      const { data: qMatch } = await supabase
        .from("questions")
        .select("ID, Title, Difficulty, Link, Topics")
        .eq("Title", res.questionTitle)
        .maybeSingle();

      if (qMatch) {
        quest = qMatch;
      } else {
        quest = {
          ID: 9999,
          Title: res.questionTitle,
          Difficulty: res.difficulty || "Medium",
          Link: res.questionLink,
          Topics: "LeetCode Daily"
        };
      }
    }
  } catch (dailyErr) {
    console.warn("Failed to fetch official daily:", dailyErr);
  }

  if (!quest) {
    const solvedIdsSet = new Set(solved.map(q => q.ID));
    const { data: topicQuestions } = await supabase
      .from("questions")
      .select("ID, Title, Difficulty, Link, Topics")
      .ilike("Topics", `%${computedWeakest}%`)
      .limit(50);

    if (topicQuestions) {
      quest = topicQuestions.find(q => !solvedIdsSet.has(q.ID));
    }

    if (!quest) {
      const { data: altQuestions } = await supabase
        .from("questions")
        .select("ID, Title, Difficulty, Link, Topics")
        .limit(100);
      quest = altQuestions?.find(q => !solvedIdsSet.has(q.ID));
    }
  }

  // 6. Fetch profiles data (XP, focus_topics)
  let activeFocus: string[] = preferences.focusTopics && preferences.focusTopics.length > 0
    ? preferences.focusTopics
    : [];
  let userXP = 0;

  if (activeFocus.length === 0) {
    try {
      const { data: dbProfile } = await supabase
        .from("profiles")
        .select("focus_topics, xp")
        .eq("id", userId)
        .maybeSingle();
      if (dbProfile) {
        activeFocus = dbProfile.focus_topics || [];
        userXP = dbProfile.xp || 0;
      }
    } catch (dbErr) {
      console.warn("Profiles check failed in engine:", dbErr);
    }
  }

  // 7. Fetch sheet questions list
  let sheetQuestionsList: any[] = [];
  const { data: sheetQuestionsData } = await supabase
    .from("view_sheet_questions")
    .select("*");
  if (sheetQuestionsData) {
    sheetQuestionsList = sheetQuestionsData;
  }

  // 8. Heuristic counts allocation
  let targetNewCount = 2;
  let targetReviewCount = 2;
  let targetDrillCount = 1;

  const { studyMode, dailyLoad, focusDifficulty, focusSource, focusReviewDensity } = preferences;

  if (studyMode === "learn") {
    if (dailyLoad === "light") {
      targetNewCount = 2;
      targetReviewCount = 1;
      targetDrillCount = 0;
    } else if (dailyLoad === "balanced") {
      targetNewCount = 4;
      targetReviewCount = 1;
      targetDrillCount = 0;
    } else { // intensive
      targetNewCount = 6;
      targetReviewCount = 2;
      targetDrillCount = 0;
    }
  } else if (studyMode === "balanced") {
    if (dailyLoad === "light") {
      targetNewCount = 1;
      targetReviewCount = 1;
      targetDrillCount = 1;
    } else if (dailyLoad === "balanced") {
      targetNewCount = 2;
      targetReviewCount = 2;
      targetDrillCount = 1;
    } else { // intensive
      targetNewCount = 3;
      targetReviewCount = 3;
      targetDrillCount = 2;
    }
  } else if (studyMode === "review") {
    if (dailyLoad === "light") {
      targetNewCount = 0;
      targetReviewCount = 2;
      targetDrillCount = 1;
    } else if (dailyLoad === "balanced") {
      targetNewCount = 0;
      targetReviewCount = 4;
      targetDrillCount = 1;
    } else { // intensive
      targetNewCount = 0;
      targetReviewCount = 6;
      targetDrillCount = 2;
    }
  }

  // Apply revision density adjustments
  if (focusReviewDensity === "strict") {
    targetReviewCount = Math.max(targetReviewCount, 2);
  } else if (focusReviewDensity === "light") {
    targetReviewCount = Math.max(0, targetReviewCount - 1);
  }

  // A. Revisions selection (Sync Overdue)
  const activeRevisions = revData.filter((item: any) => {
    const isDue = new Date(item.next_revision_due) <= now;
    const isRevisedToday = item.last_revised_at && new Date(item.last_revised_at).toDateString() === todayDateStr;
    return isDue || isRevisedToday;
  });
  activeRevisions.sort((a, b) => a.question_id - b.question_id);

  const selectedRevisions: any[] = [];
  let availableRevisions = [...activeRevisions];
  for (let i = 0; i < targetReviewCount; i++) {
    if (availableRevisions.length === 0) break;
    const seed = i === 0 ? daySeed : `${daySeed}-rev${i + 1}`;
    const pick = getDeterministicPick(availableRevisions, seed);
    if (pick) {
      selectedRevisions.push(pick);
      availableRevisions = availableRevisions.filter((r) => r.question_id !== pick.question_id);
    }
  }

  const revisionTasks: RoadmapTask[] = selectedRevisions.map((rev: any) => {
    const completed = rev.last_revised_at && new Date(rev.last_revised_at).toDateString() === todayDateStr;
    return {
      id: `revision-${rev.question_id}`,
      type: "revise",
      label: `Review: ${rev.questions?.Title || "Roadmap Question"}`,
      question: rev.questions,
      completed: !!completed
    };
  });

  // B. Focus Solves selection
  const topicsFilter = activeFocus.length > 0 ? activeFocus : [computedWeakest];
  const selectedSource = focusSource || "core";
  const selectedDifficulty = focusDifficulty || "mix";
  let matchingQuestions: any[] = [];

  const loadMatchingQuestions = async (applyDifficulty: boolean) => {
    let result: any[] = [];
    if (selectedSource === "company") {
      try {
        const topicPromises = topicsFilter.map(async (topic) => {
          const { data } = await supabase
            .from("view_company_questions")
            .select("*")
            .ilike("topics", `%${topic}%`)
            .order("frequency", { ascending: false })
            .limit(100);
          return data || [];
        });
        const results = await Promise.all(topicPromises);
        const seen = new Set();
        result = results.flat().filter((q: any) => {
          if (seen.has(q.question_id)) return false;
          seen.add(q.question_id);
          return true;
        });
      } catch (e) {
        console.warn("Company questions query failed:", e);
      }
    } else if (selectedSource === "leetcode") {
      try {
        const topicPromises = topicsFilter.map(async (topic) => {
          const { data } = await supabase
            .from("questions")
            .select("ID, Title, Difficulty, Link, Topics")
            .ilike("Topics", `%${topic}%`)
            .limit(100);
          return data || [];
        });
        const results = await Promise.all(topicPromises);
        const seen = new Set();
        result = results.flat()
          .filter((q: any) => {
            if (seen.has(q.ID)) return false;
            seen.add(q.ID);
            return true;
          })
          .map((q: any) => ({
            question_id: q.ID,
            title: q.Title,
            difficulty: q.Difficulty,
            link: q.Link,
            topics: q.Topics,
            topic_name: topicsFilter.find(t => q.Topics?.toLowerCase().includes(t.toLowerCase())) || ""
          }));
      } catch (e) {
        console.warn("Leetcode questions query failed:", e);
      }
    } else {
      result = sheetQuestionsList.filter((q) => 
        topicsFilter.some((t) => 
          (q.topic_name && q.topic_name.toLowerCase().includes(t.toLowerCase())) || 
          (q.topics && q.topics.toLowerCase().includes(t.toLowerCase()))
        )
      );
    }

    if (applyDifficulty && selectedDifficulty !== "mix") {
      result = result.filter((q) => 
        (q.difficulty || q.Difficulty)?.toLowerCase() === selectedDifficulty.toLowerCase()
      );
    }
    return result;
  };

  // Run matching questions search with difficulty filter
  matchingQuestions = await loadMatchingQuestions(true);

  // Fallback: If no questions match the target difficulty, remove difficulty filter to avoid empty list
  if (matchingQuestions.length === 0 && selectedDifficulty !== "mix") {
    matchingQuestions = await loadMatchingQuestions(false);
  }

  const solvedIdsSet = new Set(solved.map((s) => s.ID));
  const unsolvedFocusQuestions = matchingQuestions.filter((q) => !solvedIdsSet.has(q.question_id));
  
  const solvedTodayIds = new Set(
    userProgress
      ?.filter((row: any) => row["completed-at"] && new Date(row["completed-at"]).toDateString() === todayDateStr)
      .map((row: any) => row.question_id) || []
  );
  const solvedTodayFocusQuestions = matchingQuestions.filter((q) => solvedTodayIds.has(q.question_id));

  const eligibleFocusQuestions = [...unsolvedFocusQuestions, ...solvedTodayFocusQuestions];
  eligibleFocusQuestions.sort((a, b) => a.question_id - b.question_id);

  const selectedFocusQuestions: any[] = [];
  let availableFocus = [...eligibleFocusQuestions];
  for (let i = 0; i < targetNewCount; i++) {
    if (availableFocus.length === 0) break;
    const seed = i === 0 ? `${daySeed}-focus1` : `${daySeed}-focus${i + 1}`;
    const pick = getDeterministicPick(availableFocus, seed);
    if (pick) {
      selectedFocusQuestions.push(pick);
      availableFocus = availableFocus.filter((q) => q.question_id !== pick.question_id);
    }
  }

  const focusTasks: RoadmapTask[] = selectedFocusQuestions.map((q: any) => {
    const completed = solvedTodayIds.has(q.question_id) || solvedIdsSet.has(q.question_id);
    return {
      id: `solve-${q.question_id}`,
      type: "solve",
      label: `Solve: ${q.title || q.Title || "Practice Question"}`,
      question: {
        ID: q.question_id,
        Title: q.title || q.Title,
        Difficulty: q.difficulty || q.Difficulty,
        Link: q.link || q.Link,
        Topics: q.topics || q.Topics
      },
      completed: !!completed
    };
  });

  // C. Drill completions check (Query dynamic database table `drill_history`)
  let completedDrillsToday = 0;
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const { data: dbDrills } = await supabase
      .from("drill_history")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", startOfToday.toISOString());
    if (dbDrills) {
      completedDrillsToday = dbDrills.length;
    }
  } catch (e) {
    console.warn("Failed to check database drill history:", e);
  }

  const drillTasks: RoadmapTask[] = [];
  for (let i = 0; i < targetDrillCount; i++) {
    const topicIndex = i % topicsFilter.length;
    const topicName = topicsFilter[topicIndex] || "Array";
    const isCompleted = completedDrillsToday > i;
    drillTasks.push({
      id: `drill-practice-${i}`,
      type: "drill",
      label: `Practice: Complete a Pattern Recognition Session in ${topicName} (Set ${i + 1})`,
      topic: topicName,
      completed: isCompleted
    });
  }

  // D. Daily LeetCode Objective
  const dailyTask: RoadmapTask[] = quest ? [{
    id: `daily-objective-${quest.ID}`,
    type: "solve",
    label: `Solve: Daily Objective - ${quest.Title}`,
    question: quest,
    completed: solved.some((s) => s.Title.toLowerCase() === quest.Title.toLowerCase()) || solvedTodayIds.has(quest.ID)
  }] : [];

  const items = [
    ...revisionTasks,
    ...focusTasks,
    ...dailyTask,
    ...drillTasks
  ];

  // 9. Focus Health dynamic scaling targets
  const focusHealth: { [topic: string]: FocusHealthTopic } = {};
  topicsFilter.forEach((topic) => {
    const topicQuestions = sheetQuestionsList.filter((q) => 
      (q.topic_name && q.topic_name.toLowerCase().includes(topic.toLowerCase())) || 
      (q.topics && q.topics.toLowerCase().includes(topic.toLowerCase()))
    );
    const targetCount = topicQuestions.length || 20;
    
    const roadmapQuestionIds = new Set(topicQuestions.map((q) => q.question_id));
    const completedCount = solved.filter((q) => roadmapQuestionIds.has(q.ID)).length;
    
    const filledCount = Math.min(targetCount, completedCount);
    const scale = 20;
    const filledBlocks = Math.round((filledCount / targetCount) * scale);
    const emptyBlocks = scale - filledBlocks;
    
    const blocksStr = "■".repeat(filledBlocks) + "□".repeat(emptyBlocks);
    focusHealth[topic] = {
      completed: completedCount,
      target: targetCount,
      blocks: blocksStr
    };
  });

  // 10. Study Balance Heuristics calculation
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentProgress = userProgress?.filter((row: any) => 
    row["completed-at"] && new Date(row["completed-at"]) >= thirtyDaysAgo
  ) || [];

  let focusDistList: { topic: string; percentage: number }[] = [];
  if (recentProgress.length > 0) {
    const recentIds = recentProgress.map((r: any) => r.question_id);
    const { data: recentQuestions } = await supabase
      .from("questions")
      .select("Topics")
      .in("ID", recentIds);

    if (recentQuestions) {
      const topicTally: { [key: string]: number } = {};
      let totalTopicOccurrences = 0;
      recentQuestions.forEach((q) => {
        if (q.Topics) {
          q.Topics.split(",").forEach((t: string) => {
            const topic = t.trim();
            topicTally[topic] = (topicTally[topic] || 0) + 1;
            totalTopicOccurrences++;
          });
        }
      });

      if (totalTopicOccurrences > 0) {
        focusDistList = Object.entries(topicTally)
          .map(([topic, count]) => ({
            topic,
            percentage: Math.round((count / totalTopicOccurrences) * 100)
          }))
          .sort((a, b) => b.percentage - a.percentage)
          .slice(0, 5);
      }
    }
  }

  const learningCount = recentProgress.length;

  let practiceCount = 0;
  try {
    const startOf30Days = new Date();
    startOf30Days.setDate(startOf30Days.getDate() - 30);
    const { data: dbDrills30 } = await supabase
      .from("drill_history")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", startOf30Days.toISOString());
    if (dbDrills30) {
      practiceCount = dbDrills30.length;
    }
  } catch (e) {
    console.warn("Failed to check database drills for 30 days:", e);
  }

  const reviewCount = userProgress?.filter((row: any) => 
    row.last_revised_at && new Date(row.last_revised_at) >= thirtyDaysAgo
  ).length || 0;

  const studyBalance = {
    learning: learningCount,
    practice: practiceCount,
    review: reviewCount
  };

  // 11. Weekly Activities reflection
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const weeklySolves = userProgress?.filter((row: any) => 
    row["completed-at"] && new Date(row["completed-at"]) >= sevenDaysAgo
  ).length || 0;
  const weeklyRevisions = userProgress?.filter((row: any) => 
    row.last_revised_at && new Date(row.last_revised_at) >= sevenDaysAgo
  ).length || 0;
  
  let weeklyDrills = 0;
  try {
    const startOf7Days = new Date();
    startOf7Days.setDate(startOf7Days.getDate() - 7);
    const { data: dbDrills7 } = await supabase
      .from("drill_history")
      .select("created_at")
      .eq("user_id", userId)
      .gte("created_at", startOf7Days.toISOString());
    if (dbDrills7) {
      weeklyDrills = dbDrills7.length;
    }
  } catch (e) {}

  const weeklyActivities = weeklySolves + weeklyRevisions + weeklyDrills;

  let weeklyTopTopic = topicsFilter[0] || computedWeakest;
  if (focusDistList.length > 0) {
    weeklyTopTopic = focusDistList[0].topic;
  }

  // 12. Estimated Effort metrics
  const totalItems = items.length;
  const estimatedEffortText = `≈ ${totalItems} question${totalItems === 1 ? "" : "s"}`;
  
  const activeFocusName = activeFocus[0] || computedWeakest;
  const welcomeMessage = `Welcome back, Akshat. Your current focus is ${activeFocusName}. ${revisionTasks.length} review${revisionTasks.length === 1 ? " is" : "s are"} ready today, along with ${focusTasks.length} new practice opportunit${focusTasks.length === 1 ? "y" : "ies"}.`;

  return {
    date: todayDateKey,
    welcomeMessage,
    estimatedEffortText,
    estimatedQuestions: totalItems,
    estimatedMinutes: totalItems * 10,
    items,
    activeFocusTopic: activeFocusName,
    focusTopics: activeFocus,
    focusHealth,
    studyBalance,
    weeklyActivities,
    weeklyTopTopic,
    currentStreak,
    longestStreak,
    userXP,
    weakestTopic: computedWeakest,
    revisionQueueLength,
    revisionQueue: dueRevisions,
    upcomingQueue: upcoming,
    dailyQuest: quest
  };
}
