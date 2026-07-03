import fs from "fs";
import path from "path";
import { PatternDetails, QuestionLadderItem } from "../types/pattern";
import { validatePattern } from "../validators/pattern.validator";
import { supabase } from "../../supabase";

// Helper to convert Title to kebab-case slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[-\s]+/g, "-");
}

// Map slugs to families
function getFamilyName(slug: string): string {
  const families: Record<string, string> = {
    "sliding-window": "Pointers",
    "two-pointers": "Pointers",
    "fast-slow-pointers": "Pointers",
    "merge-intervals": "Intervals",
    "cyclic-sort": "Sorting",
    "in-place-reversal-of-a-linkedlist": "LinkedLists",
    "tree-breadth-first-search": "Trees",
    "tree-depth-first-search": "Trees",
    "two-heaps": "Heaps",
    "subsets": "Backtracking",
    "modified-binary-search": "Binary Search",
    "bitwise-xor": "Bitwise",
    "top-k-elements": "Heaps",
    "k-way-merge": "Heaps",
    "0-1-knapsack-dynamic-programming": "Dynamic Programming",
    "topological-sort-graph": "Graphs",
  };
  return families[slug] || "Algorithms";
}

// Attempt to fetch LeetCode question ID by matching title from Supabase
async function lookupQuestionId(title: string): Promise<number | null> {
  const hasCredentials =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  if (!hasCredentials) {
    return null;
  }

  try {
    const cleanTitle = title.trim().replace(/^🔎\s*/, "").replace(/^🙃\s*/, "");
    const { data, error } = await supabase
      .from("questions")
      .select("ID")
      .ilike("Title", cleanTitle)
      .limit(1);

    if (error || !data || data.length === 0) {
      // Fallback: return null for manual review mapping
      return null;
    }
    return data[0].ID;
  } catch {
    return null;
  }
}

export interface IngestionOptions {
  checkSupabase?: boolean;
  enhanceWithAI?: boolean;
}

export async function parsePatternMarkdown(
  filePath: string,
  options: IngestionOptions = {}
): Promise<{ pattern: PatternDetails; errors: string[]; warnings: string[] }> {
  const content = fs.readFileSync(filePath, "utf-8");
  const fileName = path.basename(filePath);

  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Extract Pattern Name
  const nameMatch = content.match(/^# Pattern \d+:\s*(.+)$/m) || content.match(/^# (.+)$/m);
  if (!nameMatch) {
    throw new Error(`Could not parse Pattern name from header in ${fileName}`);
  }
  const rawPatternName = nameMatch[1].trim();
  const patternName = rawPatternName.replace(/^Pattern \d+:\s*/i, "").replace(/[:|]/g, "").trim();
  const slug = slugify(patternName);
  const familyName = getFamilyName(slug);

  // 2. Parse Overview
  // Overview is text between title and first ## heading
  const firstHeadingIndex = content.indexOf("\n## ");
  let overview = "";
  if (firstHeadingIndex !== -1) {
    overview = content.substring(nameMatch[0].length + nameMatch.index!, firstHeadingIndex).trim();
  } else {
    overview = content.substring(nameMatch[0].length + nameMatch.index!).trim();
  }
  // Strip initial paragraph tag cleanups
  overview = overview.replace(/^[>\s\n\r]+/, "");

  // 3. Extract LeetCode questions
  const questionLadder: QuestionLadderItem[] = [];
  const questionHeadingRegex = /^##\s*(.+?)\s*\((easy|medium|hard)\)/gim;
  let match;
  const questionsToProcess: { title: string; difficulty: string; startIndex: number }[] = [];

  while ((match = questionHeadingRegex.exec(content)) !== null) {
    questionsToProcess.push({
      title: match[1].replace(/^[🔎✅🙃\s]+/, "").trim(),
      difficulty: match[2].trim(),
      startIndex: match.index,
    });
  }

  for (let i = 0; i < questionsToProcess.length; i++) {
    const q = questionsToProcess[i];
    const nextIndex = i + 1 < questionsToProcess.length ? questionsToProcess[i + 1].startIndex : content.length;
    const qContent = content.substring(q.startIndex, nextIndex);

    // Extract link (first url following heading)
    const linkMatch = qContent.match(/https:\/\/leetcode\.com\/problems\/[a-z0-9-]+\/?/i);
    const link = linkMatch ? linkMatch[0] : "";

    if (!link) {
      warnings.push(`[Parser] Question "${q.title}" in ${fileName} has no LeetCode link`);
    }

    // Lookup Question ID from Supabase
    let questionId: number | undefined = undefined;
    if (options.checkSupabase) {
      const dbId = await lookupQuestionId(q.title);
      if (dbId !== null) {
        questionId = dbId;
      }
    }

    const type: QuestionLadderItem["type"] =
      i === 0 ? "Introductory" : i === questionsToProcess.length - 1 ? "Classic" : q.difficulty === "hard" ? "Advanced" : "Medium";

    questionLadder.push({
      question_id: questionId,
      title: q.title,
      difficulty: (q.difficulty.charAt(0).toUpperCase() + q.difficulty.slice(1)) as any,
      link,
      type,
    });
  }

  // 4. Set up educational stubs (AI Pipeline will populate these dynamically)
  const defaultDifficulty =
    slug === "sliding-window" || slug === "two-pointers" ? "Beginner" : "Intermediate";

  // Build temporary object
  const pattern: PatternDetails = {
    pattern_name: patternName,
    slug,
    difficulty: defaultDifficulty as any,
    family_name: familyName,
    overview: overview || "Core overview explaining structural elements.",
    recognition_signals: [
      "array of contiguous elements",
      "minimum size subarray",
      "sliding range constraints",
    ],
    mental_model: {
      analogy: `A dynamic viewport sliding over elements, adjusting bounds as constraints shift.`,
      description: `Imagine a transparent window overlaid on a sequence of items. The window expands to include new inputs, and shrinks from the tail to exclude invalidated ones.`,
    },
    brute_force_journey: {
      brute_force_description: `Iterate through all possible subsegments, recalculating properties from scratch on every step.`,
      inefficiency_observation: `Overlapping bounds evaluate identical elements multiple times, resulting in quadratic runtimes.`,
      optimization_concept: `Reuse metrics from overlapping segments by adjusting boundaries (adding entry element, subtracting exit element).`,
    },
    visualization_metadata: {
      type: slug === "linked-list-cycle" ? "linkedlist-cycle" : "array-pointers",
      initial_state: {
        array: [1, 3, 2, 6, -1, 4],
        window_size: 3,
      },
      animation_steps: [
        {
          action: "Initialize",
          description: "Initialize left and right boundaries at index 0.",
          state: { left: 0, right: 0 },
        },
        {
          action: "Expand",
          description: "Move right pointer to expand the range.",
          state: { left: 0, right: 2 },
        },
        {
          action: "Shrink",
          description: "Slide the window forward: shift left boundary.",
          state: { left: 1, right: 3 },
        },
      ],
    },
    polyglot_boilerplates: {
      cpp: `// C++ Template\nvoid solvePattern(vector<int>& nums) {\n    int start = 0;\n    for(int end = 0; end < nums.size(); ++end) {\n        // logic\n    }\n}`,
      python: `# Python Template\ndef solve_pattern(nums):\n    start = 0\n    for end in range(len(nums)):\n        # logic\n        pass`,
      java: `// Java Template\npublic void solvePattern(int[] nums) {\n    int start = 0;\n    for(int end = 0; end < nums.length; ++end) {\n        // logic\n    }\n}`,
    },
    variants: [
      {
        name: "Fixed-size Range",
        description: "The sliding bounds maintain a constant diameter throughout execution.",
      },
      {
        name: "Variable-size Range",
        description: "The bounds expand or shrink dynamically to satisfy complex constraints.",
      },
    ],
    common_mistakes: [
      {
        mistake_title: "Off-by-One Range Limit",
        description: "Failing to validate boundary bounds before checking element values.",
      },
    ],
    interview_perspective: `Highly popular in FAANG/HFT rounds testing sliding/pointer array manipulation.`,
    related_patterns: ["two-pointers", "fast-slow-pointers"],
    question_ladder: questionLadder.length > 0 ? questionLadder : [
      {
        question_id: 209,
        title: "Minimum Size Subarray Sum",
        difficulty: "Medium",
        link: "https://leetcode.com/problems/minimum-size-subarray-sum/",
        type: "Introductory"
      }
    ],
    cheat_sheet: [
      "Always verify if the array is sorted.",
      "Check if contiguous subsegments are required.",
    ],
  };

  // 5. Run standard validation
  const validation = await validatePattern(pattern, options.checkSupabase);
  for (const err of validation.errors) {
    errors.push(err);
  }
  for (const warn of validation.warnings) {
    warnings.push(warn);
  }

  return {
    pattern,
    errors,
    warnings,
  };
}
