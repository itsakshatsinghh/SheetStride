import { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/app/shell";
import { PatternsListClient } from "./patterns-list-client";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: "Pattern Handbook: Algorithm Templates & Core Ideas | SheetStride",
  description: "Explore SheetStride's directory of 94 core algorithmic design patterns. Learn complexity bounds, recognition signals, and templates.",
  keywords: ["DSA Patterns", "LeetCode Patterns", "Coding Interview Templates", "Time Complexity", "Algorithms"],
  alternates: {
    canonical: "https://sheetstride.com/patterns"
  }
};

export default async function PatternsPage() {
  // Fetch pattern records at build time
  const { data: patterns, error } = await supabase
    .from("pattern_metadata")
    .select("pattern_name, topic_name, core_idea, tc, sc, difficulty, recognition_keywords")
    .order("pattern_name", { ascending: true });

  if (error) {
    console.error("Failed to load pattern metadata:", error);
  }

  const safePatterns = patterns || [];

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      <header className="mb-12 relative overflow-hidden">
        <nav className="flex items-center gap-2 mb-4 text-on-surface-variant font-mono-label text-mono-label uppercase">
          <span className="text-on-surface">Handbook</span>
        </nav>
        <h1 className="font-display-arcade text-3xl md:text-4xl text-on-surface tracking-widest leading-tight uppercase">
          PATTERN <span className="text-primary">HANDBOOK</span>
        </h1>
        <p className="mt-4 font-body-lg text-on-surface-variant max-w-2xl">
          A public index of 94 core software engineering patterns designed to speed up algorithmic mastery and coding interview success.
        </p>
      </header>

      {/* Delegate search/filtering interactive HUD to Client component */}
      <PatternsListClient initialPatterns={safePatterns} />
    </AppShell>
  );
}
