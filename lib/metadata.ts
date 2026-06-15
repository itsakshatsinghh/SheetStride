import { supabase } from "@/lib/supabase";
import { slugifyPattern } from "@/lib/slugs";

export async function getPatternBySlug(slug: string) {
  // Fetch only titles to match slug first (lightweight check to avoid heavy template parsing)
  const { data: titleList, error: listError } = await supabase
    .from("pattern_metadata")
    .select("pattern_name");

  if (listError || !titleList) {
    console.error("Error fetching pattern title list:", listError);
    return null;
  }

  const matched = titleList.find((p) => slugifyPattern(p.pattern_name) === slug);
  if (!matched) return null;

  // Query only the matched record
  const { data: patternList, error } = await supabase
    .from("pattern_metadata")
    .select("*")
    .eq("pattern_name", matched.pattern_name)
    .limit(1);

  if (error || !patternList || patternList.length === 0) {
    console.error(`Error fetching pattern metadata for ${matched.pattern_name}:`, error);
    return null;
  }

  return patternList[0];
}
