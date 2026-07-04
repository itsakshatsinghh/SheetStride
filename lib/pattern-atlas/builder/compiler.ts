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

// Map slugs to families (with fallback matching)
function getFamilyName(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes("sliding-window") || s.includes("two-pointers") || s.includes("fast-slow-pointers")) {
    return "Pointers";
  }
  if (s.includes("merge-intervals")) {
    return "Intervals";
  }
  if (s.includes("cyclic-sort")) {
    return "Sorting";
  }
  if (s.includes("in-place-reversal")) {
    return "LinkedLists";
  }
  if (s.includes("tree-breadth-first-search") || s.includes("tree-depth-first-search")) {
    return "Trees";
  }
  if (s.includes("two-heaps") || s.includes("top-k-elements") || s.includes("k-way-merge")) {
    return "Heaps";
  }
  if (s.includes("subsets")) {
    return "Backtracking";
  }
  if (s.includes("modified-binary-search")) {
    return "Binary Search";
  }
  if (s.includes("bitwise-xor")) {
    return "Bitwise";
  }
  if (s.includes("knapsack")) {
    return "Dynamic Programming";
  }
  if (s.includes("topological-sort")) {
    return "Graphs";
  }
  return "Algorithms";
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
      return null;
    }
    return data[0].ID;
  } catch {
    return null;
  }
}

// Dynamic markdown section extraction scanner
function getSectionContent(content: string, headingRegex: RegExp): string {
  const start = content.search(headingRegex);
  if (start === -1) return "";
  const endOfHeading = content.indexOf("\n", start);
  if (endOfHeading === -1) return "";
  const nextHeadingIndex = content.indexOf("\n## ", endOfHeading);
  return nextHeadingIndex !== -1
    ? content.substring(endOfHeading, nextHeadingIndex).trim()
    : content.substring(endOfHeading).trim();
}

function getVisualizationMetadata(slug: string): {
  type: "array-pointers" | "linkedlist-cycle" | "tree-traversal" | "heap-relations" | "custom";
  initial_state: Record<string, any>;
  animation_steps: any[];
} {
  switch (slug) {
    case "sliding-window":
      return {
        type: "array-pointers",
        initial_state: { array: [2, 1, 5, 2, 3, 2], target: 7 },
        animation_steps: [
          { action: "Initialize", description: "Initialize left and right window pointers at index 0. Target sum = 7. Current sum = 2.", state: { left: 0, right: 0 } },
          { action: "Expand Window", description: "Expand window right pointer to index 1 (val 1). Current sum = 3 (less than target 7).", state: { left: 0, right: 1 } },
          { action: "Expand Window", description: "Expand window right pointer to index 2 (val 5). Current sum = 8 >= target 7. Valid window length = 3.", state: { left: 0, right: 2 } },
          { action: "Shrink Window", description: "Shrink window by advancing left pointer to index 1. Current sum = 6 (less than target 7).", state: { left: 1, right: 2 } },
          { action: "Expand Window", description: "Expand window right pointer to index 3 (val 2). Current sum = 8 >= target 7. Window length = 3.", state: { left: 1, right: 3 } },
          { action: "Shrink Window", description: "Shrink window by advancing left pointer to index 2. Current sum = 7 >= target 7. Found better minimum window length = 2!", state: { left: 2, right: 3 } }
        ]
      };
    case "two-pointers":
      return {
        type: "array-pointers",
        initial_state: { array: [1, 2, 3, 4, 6], target: 6 },
        animation_steps: [
          { action: "Initialize", description: "Initialize pointers at outer bounds: index 0 (val 1) and index 4 (val 6). Target = 6. Current sum = 7.", state: { left: 0, right: 4 } },
          { action: "Shrink Right", description: "Sum (7) is greater than target (6). Move right pointer left. Current sum = 1 + 4 = 5.", state: { left: 0, right: 3 } },
          { action: "Grow Left", description: "Sum (5) is less than target (6). Move left pointer right. Current sum = 2 + 4 = 6. Match found!", state: { left: 1, right: 3 } }
        ]
      };
    case "fast-slow-pointers":
      return {
        type: "linkedlist-cycle",
        initial_state: { nodes: [3, 2, 0, -4], cycle_pos: 1 },
        animation_steps: [
          { action: "Initialize", description: "Initialize slow and fast pointers at the head node.", state: { slow: 0, fast: 0 } },
          { action: "Step 1", description: "Advance slow by 1 step (node 2) and fast by 2 steps (node 0).", state: { slow: 1, fast: 2 } },
          { action: "Step 2", description: "Advance slow to node 0 and fast to node 2 (traversing the cycle).", state: { slow: 2, fast: 0 } },
          { action: "Meet", description: "Slow and fast meet at node -4! Cycle detected successfully.", state: { slow: 3, fast: 3 } }
        ]
      };
    case "merge-intervals":
      return {
        type: "array-pointers",
        initial_state: { array: [1, 3, 2, 6, 8, 10] },
        animation_steps: [
          { action: "Compare", description: "Compare interval [1, 3] and interval [2, 6]. Overlap detected since 2 <= 3.", state: { left: 0, right: 3 } },
          { action: "Merge", description: "Merge intervals into single combined interval: [1, 6].", state: { left: 0, right: 3 } },
          { action: "Compare Next", description: "Compare merged interval [1, 6] with next interval [8, 10]. No overlap.", state: { left: 4, right: 5 } }
        ]
      };
    case "cyclic-sort":
      return {
        type: "array-pointers",
        initial_state: { array: [3, 1, 5, 4, 2] },
        animation_steps: [
          { action: "Inspect", description: "Value 3 at index 0 is not in its correct position (should be at index 2). Swap index 0 and 2.", state: { left: 0, right: 0 } },
          { action: "Swap", description: "Perform swap: array becomes [5, 1, 3, 4, 2].", state: { left: 0, right: 2 } },
          { action: "Inspect", description: "Value 5 at index 0 is not in its correct position (should be at index 4). Swap index 0 and 4.", state: { left: 0, right: 0 } },
          { action: "Swap", description: "Perform swap: array becomes [2, 1, 3, 4, 5].", state: { left: 0, right: 4 } },
          { action: "Inspect", description: "Value 2 at index 0 is not in its correct position (should be at index 1). Swap index 0 and 1.", state: { left: 0, right: 0 } },
          { action: "Swap", description: "Perform swap: array becomes [1, 2, 3, 4, 5]. Sorted!", state: { left: 0, right: 1 } }
        ]
      };
    case "in-place-reversal-of-a-linked-list":
      return {
        type: "linkedlist-cycle",
        initial_state: { nodes: [1, 2, 3, 4], cycle_pos: -1 },
        animation_steps: [
          { action: "Initialize", description: "Set prev = NULL, curr = Head (node 1).", state: { slow: -1, fast: 0 } },
          { action: "Reverse 1", description: "Reverse pointer of node 1 to point to prev (NULL). Move prev to node 1, curr to node 2.", state: { slow: 0, fast: 1 } },
          { action: "Reverse 2", description: "Reverse pointer of node 2 to point to node 1. Move prev to node 2, curr to node 3.", state: { slow: 1, fast: 2 } },
          { action: "Reverse 3", description: "Reverse pointer of node 3 to point to node 2. Move prev to node 3, curr to node 4.", state: { slow: 2, fast: 3 } }
        ]
      };
    case "tree-breadth-first-search-bfs":
      return {
        type: "tree-traversal",
        initial_state: { root: 1, left: 2, right: 3 },
        animation_steps: [
          { action: "Visit Root", description: "Pop root node 1 from queue. Record values at level 0: [1]. Push children 2 and 3.", state: { active: 1 } },
          { action: "Visit Left", description: "Pop child node 2 from queue. Record value: [1, 2].", state: { active: 2 } },
          { action: "Visit Right", description: "Pop child node 3 from queue. Record value: [1, 2, 3]. Traversal finished.", state: { active: 3 } }
        ]
      };
    case "tree-depth-first-search-dfs":
      return {
        type: "tree-traversal",
        initial_state: { root: 1, left: 2, right: 3 },
        animation_steps: [
          { action: "Visit Root", description: "Traverse to root node 1. Push to path stack: [1].", state: { active: 1 } },
          { action: "Traverse Left", description: "Traverse down left branch to node 2. Stack path: [1, 2]. Leaf reached, backtrack.", state: { active: 2 } },
          { action: "Traverse Right", description: "Traverse down right branch to node 3. Stack path: [1, 3]. Traversal finished.", state: { active: 3 } }
        ]
      };
    case "two-heaps":
      return {
        type: "heap-relations",
        initial_state: { max_heap: [], min_heap: [] },
        animation_steps: [
          { action: "Insert 3", description: "Insert element 3. Balance dictates pushing to Max-Heap (stores smaller half).", state: { active_val: 3 } },
          { action: "Insert 5", description: "Insert element 5. Push to Min-Heap (stores larger half).", state: { active_val: 5 } },
          { action: "Find Median", description: "Calculate median: Average of Max-Heap top (3) and Min-Heap top (5) is 4.", state: { active_val: 4 } }
        ]
      };
    case "subsets":
      return {
        type: "array-pointers",
        initial_state: { array: [1, 3] },
        animation_steps: [
          { action: "Initialize", description: "Start with empty subset: [[]].", state: { left: -1, right: -1 } },
          { action: "Process 1", description: "Take element 1. Add it to existing subsets to form new subsets: [[], [1]].", state: { left: 0, right: 0 } },
          { action: "Process 3", description: "Take element 3. Add it to existing subsets to form: [[], [1], [3], [1, 3]].", state: { left: 1, right: 1 } }
        ]
      };
    case "modified-binary-search":
      return {
        type: "array-pointers",
        initial_state: { array: [2, 4, 6, 8, 10, 12, 14], target: 10 },
        animation_steps: [
          { action: "Initialize", description: "Set left pointer = 0, right pointer = 6. Midpoint = 3 (value 8). Target = 10.", state: { left: 0, right: 6 } },
          { action: "Narrow Search", description: "Target (10) > Midpoint (8). Shift left boundary to index 4. New mid = 5 (value 12).", state: { left: 4, right: 6 } },
          { action: "Narrow Search", description: "Target (10) < Midpoint (12). Shift right boundary to index 4. New mid = 4 (value 10). Target found!", state: { left: 4, right: 4 } }
        ]
      };
    case "bitwise-xor":
      return {
        type: "array-pointers",
        initial_state: { array: [4, 3, 4] },
        animation_steps: [
          { action: "Initialize", description: "Initialize XOR accumulator to index 0 (val 4).", state: { left: 0, right: 0 } },
          { action: "XOR index 1", description: "XOR with index 1 (val 3): 4 ^ 3 = 7.", state: { left: 0, right: 1 } },
          { action: "XOR index 2", description: "XOR with index 2 (val 4): 7 ^ 4 = 3 (duplicates cancel out). Final answer = 3.", state: { left: 0, right: 2 } }
        ]
      };
    case "top-k-elements":
      return {
        type: "heap-relations",
        initial_state: { max_heap: [], min_heap: [] },
        animation_steps: [
          { action: "Scan Element", description: "Process element 8. Push onto Min-Heap. Heap size = 1.", state: { active_val: 8 } },
          { action: "Scan Element", description: "Process element 2. Push onto Min-Heap. Heap size = 2 (exceeds K=1).", state: { active_val: 2 } },
          { action: "Pop Minimum", description: "Min-Heap size > K. Pop minimum element (2). Top elements remaining: [8].", state: { active_val: 8 } }
        ]
      };
    case "k-way-merge":
      return {
        type: "heap-relations",
        initial_state: { max_heap: [], min_heap: [] },
        animation_steps: [
          { action: "Insert Heads", description: "Push first element of each of the K sorted lists into the Min-Heap.", state: { active_val: 1 } },
          { action: "Extract Min", description: "Pop minimum element 1 from the heap. Append to result. Push next head from the same list.", state: { active_val: 1 } },
          { action: "Extract Min", description: "Pop next minimum 2 from heap. Append to result.", state: { active_val: 2 } }
        ]
      };
    case "-1-knapsack-dynamic-programming":
      return {
        type: "array-pointers",
        initial_state: { array: [2, 3, 4] },
        animation_steps: [
          { action: "Row 0 (Init)", description: "Initialize DP table with base cases (0 items or 0 capacity = 0 profit).", state: { left: -1, right: -1 } },
          { action: "Row 1 (Item 1)", description: "Evaluate item 1 (weight 2, profit 3). If capacity >= 2, profit is 3.", state: { left: 0, right: 0 } },
          { action: "Row 2 (Item 2)", description: "Evaluate item 2 (weight 3, profit 4). Maximum profit calculated by max(include, exclude).", state: { left: 0, right: 1 } }
        ]
      };
    case "topological-sort-graph":
      return {
        type: "tree-traversal",
        initial_state: { root: 0, left: 1, right: 2 },
        animation_steps: [
          { action: "Find Sources", description: "Identify all vertices with in-degree 0. Source node 0 identified, push to queue.", state: { active: 0 } },
          { action: "Process Node 0", description: "Pop node 0. Add to sorted list: [0]. Decrement in-degree of neighbors (1 and 2).", state: { active: 0 } },
          { action: "Queue Node 1", description: "In-degree of node 1 becomes 0. Pop from queue, add to sorted list: [0, 1].", state: { active: 1 } },
          { action: "Queue Node 2", description: "In-degree of node 2 becomes 0. Pop from queue, add to sorted list: [0, 1, 2]. Order complete.", state: { active: 2 } }
        ]
      };
    default:
      return {
        type: "array-pointers",
        initial_state: { array: [1, 3, 2, 6, -1, 4], target: 6 },
        animation_steps: [
          { action: "Initialize", description: "Set standard layout parameters.", state: { index: 0 } }
        ]
      };
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
  // Strip "Pattern XX: ", "Pattern", any leading/trailing digits, and symbol cleans
  let patternName = rawPatternName
    .replace(/^Pattern\s+\d+[:\s]*/i, "") // e.g. "Pattern 04: " -> ""
    .replace(/\s+Pattern$/i, "")         // e.g. "Sliding Window Pattern" -> "Sliding Window"
    .replace(/^Pattern\s+/i, "")         // e.g. "Pattern 08Tree..." -> "08Tree..."
    .replace(/[:|]/g, "")
    .trim();

  // Clean filename/folder edge cases like "08Tree Depth First Search"
  patternName = patternName.replace(/^\d+Tree\s+/i, "Tree "); // "08Tree Depth First Search" -> "Tree Depth First Search"
  patternName = patternName.replace(/^\d+\s*/, "");           // strip leading digits if any left
  
  const slug = slugify(patternName);
  const familyName = getFamilyName(slug);

  // 2. Parse Overview
  let overview = getSectionContent(content, /^##\s+Overview/mi);
  if (!overview) {
    // Fallback: search before the first H2 if ## Overview is not present
    const firstHeadingIndex = content.indexOf("\n## ");
    if (firstHeadingIndex !== -1) {
      overview = content.substring(nameMatch[0].length + nameMatch.index!, firstHeadingIndex).trim();
    } else {
      overview = content.substring(nameMatch[0].length + nameMatch.index!).trim();
    }
  }
  // Strip any leading/trailing dividers, spaces, or formatting block markers
  overview = overview
    .replace(/^[\s\r\n\-]+/, "")
    .replace(/[\s\r\n\-]+$/, "")
    .trim();

  // 3. Extract LeetCode questions from "## Representative Problems"
  const questionLadder: QuestionLadderItem[] = [];
  const problemsSection = getSectionContent(content, /^##\s+Representative\s+Problems/mi);
  
  if (problemsSection) {
    const lines = problemsSection.split(/\r?\n/);
    let currentCategory = "Medium";

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("###")) {
        currentCategory = trimmed.replace(/^###\s*/, "").trim();
      } else {
        const bulletMatch = trimmed.match(/^[\-\*]\s*\[(.+?)\]\((https?:\/\/[^\s\)]+)\)/i);
        if (bulletMatch) {
          const title = bulletMatch[1].replace(/^[🔎✅🙃\s]+/, "").trim();
          const link = bulletMatch[2].trim();

          // Determine difficulty
          let difficulty: "Easy" | "Medium" | "Hard" = "Medium";
          const lowerCat = currentCategory.toLowerCase();
          if (lowerCat.includes("easy")) {
            difficulty = "Easy";
          } else if (lowerCat.includes("hard") || lowerCat.includes("combination")) {
            difficulty = "Hard";
          } else {
            difficulty = "Medium";
          }

          // Determine type
          let type: "Introductory" | "Medium" | "Advanced" | "Classic" = "Medium";
          if (difficulty === "Easy") {
            type = "Introductory";
          } else if (difficulty === "Hard") {
            type = "Advanced";
          } else if (lowerCat.includes("classic")) {
            type = "Classic";
          }

          // Lookup Question ID from Supabase if active
          let questionId: number | undefined = undefined;
          if (options.checkSupabase) {
            const dbId = await lookupQuestionId(title);
            if (dbId !== null) {
              questionId = dbId;
            }
          }

          questionLadder.push({
            question_id: questionId,
            title,
            difficulty,
            link,
            type,
          });
        }
      }
    }
  }

  // 4. Extract Recognition Signals
  const signalsSection = getSectionContent(content, /^##\s+Recognition\s+Signals/mi);
  let recognition_signals: string[] = [];
  if (signalsSection) {
    const lines = signalsSection.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      const bulletMatch = trimmed.match(/^[\-\*]\s*(.+)$/);
      if (bulletMatch) {
        const cleaned = bulletMatch[1].replace(/^\*\*(.+?)\*\*:\s*/, "").replace(/\*|_/g, "").trim();
        if (cleaned) recognition_signals.push(cleaned);
      }
    }
  }
  if (recognition_signals.length === 0) {
    recognition_signals = ["Observe parameters bound to subsets or target ranges."];
  }

  // 5. Extract Mental Model
  const mmSection = getSectionContent(content, /^##\s+Mental\s+Model/mi);
  let mental_model = { analogy: "", description: "" };
  if (mmSection) {
    const paragraphs = mmSection.split(/\r?\n\r?\n/).map(p => p.trim()).filter(p => p && !p.startsWith("---"));
    if (paragraphs.length > 0) {
      mental_model.analogy = paragraphs[0].replace(/\*|_/g, "").substring(0, 150);
      mental_model.description = paragraphs.join("\n\n");
    }
  }
  if (!mental_model.analogy) {
    mental_model.analogy = "Real-world physical metaphor for the pattern execution.";
    mental_model.description = "Detailed cognitive walk-through of the pointer/state transformation.";
  }

  // 6. Extract Brute Force & Optimization Journey
  const bfSection = getSectionContent(content, /^##\s+Brute\s+Force\s+Approach/mi);
  let brute_force_description = "";
  if (bfSection) {
    const codeBlockIndex = bfSection.indexOf("```");
    brute_force_description = codeBlockIndex !== -1
      ? bfSection.substring(0, codeBlockIndex).trim()
      : bfSection;
    brute_force_description = brute_force_description.replace(/^[\s\r\n\-]+/, "").replace(/[\s\r\n\-]+$/, "");
  }
  if (!brute_force_description) {
    brute_force_description = "Recursive or nested search checking all possible combinations of elements.";
  }

  const ojSection = getSectionContent(content, /^##\s+Optimization\s+Journey/mi);
  let optimization_concept = "";
  let inefficiency_observation = "";
  if (ojSection) {
    optimization_concept = ojSection;
    inefficiency_observation = "Overlapping subsegments perform duplicate evaluations of identical elements.";
  } else {
    optimization_concept = "Maintain running state variables and update them incrementally to achieve linear time.";
    inefficiency_observation = "Overlapping subsegments perform duplicate evaluations of identical elements.";
  }

  // 7. Extract C++ Code Template
  const codeSection = getSectionContent(content, /^##\s+Code\s+Template/mi);
  let cppTemplate = "";
  if (codeSection) {
    const blockStart = codeSection.indexOf("```cpp");
    if (blockStart !== -1) {
      const blockEnd = codeSection.indexOf("```", blockStart + 6);
      if (blockEnd !== -1) {
        cppTemplate = codeSection.substring(blockStart + 6, blockEnd).trim();
      }
    }
  }
  if (!cppTemplate) {
    cppTemplate = `// C++ Template\nvoid solve() {\n    // logic\n}`;
  }

  // 8. Extract Variants
  const varSection = getSectionContent(content, /^##\s+Pattern\s+Variants/mi);
  const variants: { name: string; description: string }[] = [];
  if (varSection) {
    const lines = varSection.split(/\r?\n/);
    for (const line of lines) {
      if (line.includes("|") && !line.includes("---") && !line.toLowerCase().includes("variant |")) {
        const parts = line.split("|").map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          variants.push({
            name: parts[0],
            description: parts[1] + (parts[2] ? ` (${parts[2]})` : ""),
          });
        }
      }
    }
  }
  if (variants.length === 0) {
    variants.push({
      name: "Standard Blueprint",
      description: "The classic algorithmic implementation of the pattern.",
    });
  }

  // 9. Extract Common Mistakes
  const cmSection = getSectionContent(content, /^##\s+Common\s+Mistakes/mi) || getSectionContent(content, /^##\s+Common\s+Pitfalls/mi);
  const common_mistakes: { mistake_title: string; description: string }[] = [];
  if (cmSection) {
    const lines = cmSection.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      const bulletMatch = trimmed.match(/^[\-\*]\s*(.+)$/);
      if (bulletMatch) {
        const item = bulletMatch[1].trim();
        // Skip checklist boxes or headers
        if (!item.startsWith("[") && !item.startsWith("#")) {
          const boldMatch = item.match(/^\*\*(.+?)\*\*:\s*(.+)$/);
          if (boldMatch) {
            if (boldMatch[2].trim().length >= 10) {
              common_mistakes.push({
                mistake_title: boldMatch[1].trim(),
                description: boldMatch[2].trim(),
              });
            }
          } else if (item.length >= 10) {
            common_mistakes.push({
              mistake_title: "Key Pitfall",
              description: item,
            });
          }
        }
      }
    }
  }
  if (common_mistakes.length === 0) {
    common_mistakes.push({
      mistake_title: "Off-by-One Range Bounds",
      description: "Improper array index checks on boundary traversal conditions.",
    });
  }

  // 10. Extract Cheat Sheets (from SheetStride Notes)
  const csSection = getSectionContent(content, /^##\s+SheetStride\s+Notes/mi);
  let cheat_sheet: string[] = [];
  if (csSection) {
    const lines = csSection.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      const bulletMatch = trimmed.match(/^([>\-\*]\s*)+(.+)$/);
      if (bulletMatch) {
        const item = bulletMatch[2].trim();
        if (!item.startsWith("#") && !item.startsWith("[") && item.length >= 5) {
          cheat_sheet.push(item.replace(/\*|_/g, ""));
        }
      }
    }
  }
  if (cheat_sheet.length === 0) {
    cheat_sheet = [
      "Verify input constraints (sorted status, bounds size).",
      "Validate off-by-one pointer edge index cases."
    ];
  }

  // 11. Extract Related Patterns list
  const rpSection = getSectionContent(content, /^##\s+Related\s+Patterns/mi);
  const related_patterns: string[] = [];
  if (rpSection) {
    const lines = rpSection.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("`") && !trimmed.includes("↓") && !trimmed.includes("Prerequisites") && !trimmed.includes("Next Options")) {
        const cleaned = trimmed.replace(/^[\-\*>\s]+/, "").trim();
        if (cleaned) {
          related_patterns.push(slugify(cleaned));
        }
      }
    }
  }

  // 12. Setup Visualization Metadata based on pattern slug
  const visMeta = getVisualizationMetadata(slug);

  const defaultDifficulty =
    slug === "sliding-window" || slug === "two-pointers" ? "Beginner" : "Intermediate";

  // Assemble full Pattern Details object
  const pattern: PatternDetails = {
    pattern_name: patternName,
    slug,
    difficulty: defaultDifficulty as any,
    family_name: familyName,
    overview,
    recognition_signals,
    mental_model,
    brute_force_journey: {
      brute_force_description,
      inefficiency_observation,
      optimization_concept,
    },
    visualization_metadata: {
      type: visMeta.type,
      initial_state: visMeta.initial_state,
      animation_steps: visMeta.animation_steps,
    },
    polyglot_boilerplates: {
      cpp: cppTemplate,
      python: `# Python Template\ndef solve_pattern(nums):\n    pass`,
      java: `// Java Template\npublic void solvePattern(int[] nums) {\n}`,
    },
    variants,
    common_mistakes,
    interview_perspective: "Highly popular in FAANG/HFT rounds testing optimized traversals.",
    related_patterns,
    question_ladder: questionLadder.length > 0 ? questionLadder : [
      {
        question_id: 209,
        title: "Minimum Size Subarray Sum",
        difficulty: "Medium",
        link: "https://leetcode.com/problems/minimum-size-subarray-sum/",
        type: "Introductory"
      }
    ],
    cheat_sheet: cheat_sheet.length > 0 ? cheat_sheet : ["Observe input boundaries."],
  };

  // Run schema validation
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
