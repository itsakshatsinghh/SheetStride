import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Cpu, Tag, FolderOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/app/shell";
import { TOPIC_SLUGS, TOPIC_DISPLAY_NAMES, slugifyPattern } from "@/lib/slugs";
import { cn } from "@/lib/utils";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

interface TopicPageProps {
  params: Promise<{ topic: string }>;
}

const getKeywordsArray = (keywords: any): string[] => {
  if (!keywords) return [];
  if (Array.isArray(keywords)) return keywords;
  try {
    const parsed = JSON.parse(keywords);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return [];
};

export async function generateMetadata({ params }: TopicPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const dbTopicName = TOPIC_SLUGS[resolvedParams.topic];
  
  if (!dbTopicName) {
    return {
      title: "Topic Not Found | SheetStride",
    };
  }

  const topicDisplayName = TOPIC_DISPLAY_NAMES[resolvedParams.topic] || dbTopicName;

  return {
    title: `${topicDisplayName} Coding Patterns & Algorithms | SheetStride`,
    description: `Master cycle loops, window boundaries, and optimal complexity bounds for ${topicDisplayName} templates.`,
    alternates: {
      canonical: `https://sheetstride.com/topics/${resolvedParams.topic}`,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(TOPIC_SLUGS).map((topicSlug) => ({
    topic: topicSlug,
  }));
}

export default async function TopicDetailPage({ params }: TopicPageProps) {
  const resolvedParams = await params;
  const dbTopicName = TOPIC_SLUGS[resolvedParams.topic];

  if (!dbTopicName) {
    notFound();
  }

  const topicDisplayName = TOPIC_DISPLAY_NAMES[resolvedParams.topic] || dbTopicName;

  // Fetch all patterns under this topic at build time
  const { data: patterns, error } = await supabase
    .from("pattern_metadata")
    .select("pattern_name, core_idea, tc, sc, difficulty, recognition_keywords")
    .eq("topic_name", dbTopicName)
    .order("pattern_name", { ascending: true });

  if (error) {
    console.error("Failed to load topic patterns:", error);
  }

  const safePatterns = patterns || [];

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      {/* Breadcrumbs HUD */}
      <nav className="flex items-center gap-2 mb-6 text-on-surface-variant font-mono-label text-mono-label uppercase tracking-widest text-[11px] overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-primary transition-colors">HOME</Link>
        <ChevronRight className="h-3 w-3 text-outline/40 flex-shrink-0" />
        <Link href="/topics" className="hover:text-primary transition-colors">TOPICS</Link>
        <ChevronRight className="h-3 w-3 text-outline/40 flex-shrink-0" />
        <span className="text-on-surface">{topicDisplayName.toUpperCase()}</span>
      </nav>

      {/* Topic Header Block */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <FolderOpen className="h-6 w-6 text-primary" />
          <span className="text-[11px] font-mono-label text-outline/50 uppercase tracking-widest">TOPIC_MODULE</span>
        </div>
        <h1 className="font-display-arcade text-2xl md:text-3xl text-on-surface tracking-widest uppercase">
          {topicDisplayName}
        </h1>
        <p className="mt-4 font-body-lg text-on-surface-variant max-w-2xl">
          Dive into the core pattern templates for {topicDisplayName}. Study the mechanics, complexities, and structures of each algorithmic blueprint.
        </p>
      </header>

      {/* Grid of Patterns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safePatterns.length === 0 ? (
          <div className="col-span-full text-center py-16 border border-dashed border-outline-variant/30 rounded-xl">
            <p className="font-mono text-outline uppercase tracking-widest text-xs">NO_PATTERNS_REGISTERED_UNDER_THIS_TOPIC</p>
          </div>
        ) : (
          safePatterns.map((pattern) => {
            const patternSlug = slugifyPattern(pattern.pattern_name);
            const keywords = getKeywordsArray(pattern.recognition_keywords).slice(0, 3);

            return (
              <div
                key={pattern.pattern_name}
                className="group relative bg-[#131313] border border-outline-variant/30 hover:border-primary p-5 transition-all duration-300 rounded-xl hover:-translate-y-1 flex flex-col justify-between hover:shadow-[0_8px_25px_-10px_rgba(178,210,255,0.15)]"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <h2 className="font-display font-bold tracking-wider group-hover:text-primary transition-colors text-[14px]">
                      <Link href={`/patterns/${patternSlug}`}>
                        {pattern.pattern_name}
                      </Link>
                    </h2>
                    {pattern.difficulty && (
                      <span className={cn(
                        "text-[9px] font-mono uppercase px-2 py-0.5 rounded border tracking-wider",
                        pattern.difficulty === "Easy" && "bg-secondary/5 border-secondary/20 text-secondary",
                        pattern.difficulty === "Medium" && "bg-primary/5 border-primary/20 text-primary",
                        pattern.difficulty === "Hard" && "bg-danger/5 border-danger/20 text-danger"
                      )}>
                        {pattern.difficulty}
                      </span>
                    )}
                  </div>

                  <p className="font-body text-xs text-on-surface-variant leading-relaxed line-clamp-3 mb-6">
                    {pattern.core_idea || "No description provided."}
                  </p>
                </div>

                <div>
                  <div className="grid grid-cols-2 gap-2 border-t border-outline-variant/15 pt-3 mb-4 text-[10px] font-mono uppercase tracking-wider text-outline/80">
                    <div className="flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-secondary" />
                      <span>TC: {pattern.tc || "O(?)"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Tag className="h-3 w-3 text-primary" />
                      <span>SC: {pattern.sc || "O(?)"}</span>
                    </div>
                  </div>

                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {keywords.map((word, index) => (
                        <span
                          key={index}
                          className="text-[10px] font-mono bg-[#1c1c1c] border border-outline-variant/20 px-2 py-0.5 rounded text-outline/90"
                        >
                          {word}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
