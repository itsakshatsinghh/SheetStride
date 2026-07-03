import { PatternDetails, PatternAtlasIndexItem } from "../types/pattern";
import { supabase } from "../../supabase";

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

    indexItems.push({
      pattern_name: pattern.pattern_name,
      slug: pattern.slug,
      difficulty: pattern.difficulty,
      family_name: pattern.family_name,
      recognition_signals: pattern.recognition_signals,
      variants: pattern.variants.map(v => v.name),
      companies,
      questions_count: pattern.question_ladder.length,
    });
  }

  return indexItems;
}
