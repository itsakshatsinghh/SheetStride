import { Metadata } from "next";
import Link from "next/link";
import { Layers, ChevronRight, Folder } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/app/shell";
import { TOPIC_SLUGS, TOPIC_DISPLAY_NAMES, slugifyTopic } from "@/lib/slugs";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

export const metadata: Metadata = {
  title: "Algorithmic Topics Directory: DSA Curricula | SheetStride",
  description: "Browse curated algorithms grouped into 15 structured DSA topics. Discover specialized problem-solving patterns.",
  keywords: ["Algorithm Topics", "Data Structures", "LeetCode Topics", "SheetStride Curriculum"],
  alternates: {
    canonical: "https://sheetstride.com/topics"
  }
};

export default async function TopicsIndexPage() {
  // Fetch patterns at build time to compute category counts
  const { data: patterns } = await supabase
    .from("pattern_metadata")
    .select("pattern_name, topic_name");

  // Calculate pattern counts per topic
  const counts: { [dbName: string]: number } = {};
  patterns?.forEach((p) => {
    if (p.topic_name) {
      counts[p.topic_name] = (counts[p.topic_name] || 0) + 1;
    }
  });

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      <header className="mb-12 relative overflow-hidden">
        <nav className="flex items-center gap-2 mb-4 text-on-surface-variant font-mono-label text-mono-label uppercase">
          <span className="text-on-surface">Curricula</span>
        </nav>
        <h1 className="font-display-arcade text-3xl md:text-4xl text-on-surface tracking-widest leading-tight uppercase">
          ALGORITHMIC <span className="text-primary">TOPICS</span>
        </h1>
        <p className="mt-4 font-body-lg text-on-surface-variant max-w-2xl">
          Browse the 15 algorithmic pillars. Each topic represents a structured set of patterns designed to break down Leetcode complexity.
        </p>
      </header>

      {/* Grid of Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(TOPIC_SLUGS).map(([slug, dbName]) => {
          const count = counts[dbName] || 0;
          const romanPrefix = dbName.match(/^([IVXLCDM]+)\./)?.[1] || "•";
          const cleanName = TOPIC_DISPLAY_NAMES[slug] || dbName.replace(/^[A-Z]+\.\s+/, "");

          return (
            <Link 
              key={slug} 
              href={`/topics/${slug}`}
              className="group block relative bg-[#131313] border border-outline-variant/30 hover:border-primary p-6 transition-all duration-300 rounded-xl hover:-translate-y-1 hover:shadow-[0_8px_25px_-10px_rgba(178,210,255,0.15)]"
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <span className="font-mono text-outline/40 text-[18px] group-hover:text-primary transition-colors font-bold">
                  {romanPrefix}
                </span>
                <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center border border-outline-variant/20 group-hover:border-primary/30 transition-colors">
                  <Folder className="h-4 w-4 text-primary" />
                </div>
              </div>

              <h2 className="font-display text-text font-bold tracking-wider text-[15px] mb-2 group-hover:text-primary transition-colors uppercase">
                {cleanName}
              </h2>

              <p className="font-body text-xs text-on-surface-variant leading-relaxed mb-6">
                Master Cycle detection, pointer sliding boundaries, and index manipulation patterns belonging to {cleanName}.
              </p>

              <div className="flex justify-between items-center border-t border-outline-variant/15 pt-4 text-[10px] font-mono uppercase tracking-wider text-outline/80">
                <span>{count} {count === 1 ? 'PATTERN' : 'PATTERNS'}</span>
                <span className="flex items-center text-primary-strong group-hover:translate-x-1 transition-transform">
                  EXPLORE <ChevronRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
