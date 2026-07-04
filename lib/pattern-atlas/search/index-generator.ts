import { PatternDetails, PatternAtlasIndexItem } from "../types/pattern";
import { supabase } from "../../supabase";

function getPatternSearchMetadata(slug: string): { aliases: string[]; data_structures: string[]; keywords: string[] } {
  const metadata: Record<string, { aliases: string[]; data_structures: string[]; keywords: string[] }> = {
    "sliding-window": {
      aliases: ["two pointers", "sliding range", "contiguous subarray"],
      data_structures: ["array", "string", "linked list"],
      keywords: ["average", "substring", "min-size", "max-sum"]
    },
    "two-pointers": {
      aliases: ["converging pointers", "dual pointers", "two-way sweep"],
      data_structures: ["array", "string"],
      keywords: ["sorted", "pair", "triplet", "target-sum", "palindrome"]
    },
    "fast-slow-pointers": {
      aliases: ["hare and tortoise", "cycle detection"],
      data_structures: ["linked list", "array"],
      keywords: ["loop", "cycle", "middle", "start-node", "happy-number"]
    },
    "merge-intervals": {
      aliases: ["overlapping intervals", "interval intersection"],
      data_structures: ["array", "interval"],
      keywords: ["insert", "merge", "meeting-rooms", "free-time"]
    },
    "cyclic-sort": {
      aliases: ["in-place sort", "index mapping"],
      data_structures: ["array"],
      keywords: ["missing-number", "duplicates", "corrupted", "range"]
    },
    "in-place-reversal-of-a-linkedlist": {
      aliases: ["reverse list", "pointer reversal"],
      data_structures: ["linked list"],
      keywords: ["sub-list", "k-elements", "rotate", "alternate"]
    },
    "tree-breadth-first-search": {
      aliases: ["level order traversal", "layer traversal"],
      data_structures: ["binary tree", "queue"],
      keywords: ["zigzag", "averages", "minimum-depth", "successor"]
    },
    "tree-depth-first-search": {
      aliases: ["dfs traversal", "recursive tree paths"],
      data_structures: ["binary tree"],
      keywords: ["sum-path", "all-paths", "max-path-sum", "backtracking"]
    },
    "two-heaps": {
      aliases: ["min-max heap", "split heap"],
      data_structures: ["heap", "priority queue"],
      keywords: ["median", "sliding-median", "stream", "next-interval"]
    },
    "subsets": {
      aliases: ["power set", "permutations", "backtracking"],
      data_structures: ["array", "string"],
      keywords: ["abbreviations", "parentheses", "case-combinations"]
    },
    "modified-binary-search": {
      aliases: ["bisection search", "logarithmic search"],
      data_structures: ["array"],
      keywords: ["rotated", "sorted", "infinite", "peak", "bitonic", "bounds"]
    },
    "bitwise-xor": {
      aliases: ["xor operation", "bit manipulation"],
      data_structures: ["integer"],
      keywords: ["missing", "single-number", "complement", "flip"]
    },
    "top-k-elements": {
      aliases: ["k-largest", "heap filter"],
      data_structures: ["heap", "priority queue"],
      keywords: ["frequency", "closest", "k-frequent", "scheduling"]
    },
    "k-way-merge": {
      aliases: ["multi-way merge", "sorted streams merge"],
      data_structures: ["heap", "priority queue", "linked list"],
      keywords: ["k-sorted", "matrix-binary-search", "smallest-range"]
    },
    "0-1-knapsack-dynamic-programming": {
      aliases: ["knapsack dp", "bounded knapsack", "subset sum"],
      data_structures: ["matrix", "array"],
      keywords: ["target-sum", "partition-equal", "subset-difference", "ways"]
    },
    "topological-sort-graph": {
      aliases: ["kahn's algorithm", "dependency resolution", "dag sort"],
      data_structures: ["graph", "queue", "hash map"],
      keywords: ["scheduling", "prerequisites", "alien-dictionary", "mht"]
    }
  };
  return metadata[slug] || { aliases: [], data_structures: [], keywords: [] };
}

export async function generateAtlasIndex(
  patterns: PatternDetails[],
  checkSupabase: boolean = true
): Promise<PatternAtlasIndexItem[]> {
  const indexItems: PatternAtlasIndexItem[] = [];

  for (const pattern of patterns) {
    const questionIds = pattern.question_ladder
      .map(q => q.question_id)
      .filter((id): id is number => typeof id === "number");
    let companies: string[] = [];

    // Query database for companies asking these questions if online
    if (checkSupabase && questionIds.length > 0) {
      const hasCredentials =
        process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

      if (hasCredentials) {
        try {
          const { data, error } = await supabase
            .from("company_questions")
            .select("companies (company_name)")
            .in("question_id", questionIds);

          if (!error && data) {
            const rawCompanies = data
              .map((row: any) => row.companies?.company_name)
              .filter(Boolean);
            companies = Array.from(new Set(rawCompanies));
          }
        } catch {
          // ignore error and fallback to empty
        }
      }
    }

    const meta = getPatternSearchMetadata(pattern.slug);

    indexItems.push({
      pattern_name: pattern.pattern_name,
      slug: pattern.slug,
      difficulty: pattern.difficulty,
      family_name: pattern.family_name,
      recognition_signals: pattern.recognition_signals,
      variants: pattern.variants.map(v => v.name),
      companies,
      questions_count: pattern.question_ladder.length,
      aliases: meta.aliases,
      data_structures: meta.data_structures,
      keywords: meta.keywords,
      question_ids: questionIds
    });
  }

  return indexItems;
}
