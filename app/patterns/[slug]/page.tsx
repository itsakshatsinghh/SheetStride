import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Cpu, Tag, AlertCircle, RefreshCw, Layers } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { AppShell } from "@/components/app/shell";
import { getPatternBySlug } from "@/lib/metadata";
import { slugifyPattern, slugifyTopic } from "@/lib/slugs";
import { PatternQuestionsClient } from "./pattern-questions-client";

export const dynamic = "force-static";
export const revalidate = 86400; // 24 hours

interface PageProps {
  params: Promise<{ slug: string }>;
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

// Optimized dynamic metadata retrieval
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const pattern = await getPatternBySlug(resolvedParams.slug);

  if (!pattern) {
    return {
      title: "Pattern Not Found | SheetStride",
    };
  }

  const trimmedDesc = pattern.core_idea
    ? pattern.core_idea.substring(0, 155) + "..."
    : "Explore this algorithmic coding pattern, view C++ templates, and practice questions.";

  return {
    title: `${pattern.pattern_name} Coding Pattern: Code Templates & Complexity | SheetStride`,
    description: trimmedDesc,
    keywords: getKeywordsArray(pattern.recognition_keywords),
    alternates: {
      canonical: `https://sheetstride.com/patterns/${resolvedParams.slug}`,
    },
    openGraph: {
      title: `${pattern.pattern_name} Coding Pattern | SheetStride`,
      description: trimmedDesc,
      type: "article",
      url: `https://sheetstride.com/patterns/${resolvedParams.slug}`,
    },
  };
}

export async function generateStaticParams() {
  const { data: patterns } = await supabase
    .from("pattern_metadata")
    .select("pattern_name");

  if (!patterns) return [];

  return patterns.map((p) => ({
    slug: slugifyPattern(p.pattern_name),
  }));
}

export default async function PatternDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const pattern = await getPatternBySlug(resolvedParams.slug);

  if (!pattern) {
    notFound();
  }

  const keywords = getKeywordsArray(pattern.recognition_keywords);

  // 1. Fetch related questions from view_sheet_questions (build-time query)
  const { data: questions, error: questionsError } = await supabase
    .from("view_sheet_questions")
    .select("*")
    .eq("pattern_name", pattern.pattern_name)
    .order("Sheet_order", { ascending: true });

  if (questionsError) {
    console.error("Failed to load questions for pattern:", questionsError);
  }

  // 2. Query sibling patterns for "Related Patterns" (same topic)
  let relatedPatterns: any[] = [];
  if (pattern.topic_name) {
    const { data: siblings } = await supabase
      .from("pattern_metadata")
      .select("pattern_name, core_idea, difficulty")
      .eq("topic_name", pattern.topic_name)
      .neq("pattern_name", pattern.pattern_name)
      .limit(3);
    
    relatedPatterns = siblings || [];
  }

  // JSON-LD Structured Data Schema for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "headline": `${pattern.pattern_name} Coding Pattern`,
    "description": pattern.core_idea || "",
    "inLanguage": "en",
    "programmingLanguage": {
      "@type": "ComputerLanguage",
      "name": "C++"
    },
    "dependencies": "LeetCode, Data Structures & Algorithms",
    "about": keywords.map(kw => ({
      "@type": "Thing",
      "name": kw
    }))
  };

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      {/* Inject JSON-LD Schema markup */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumbs HUD */}
      <nav className="flex items-center gap-2 mb-6 text-on-surface-variant font-mono-label text-mono-label uppercase tracking-widest text-[11px] overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-primary transition-colors">HOME</Link>
        <ChevronRight className="h-3 w-3 text-outline/40 flex-shrink-0" />
        <Link href="/patterns" className="hover:text-primary transition-colors">PATTERNS</Link>
        {pattern.topic_name && (
          <>
            <ChevronRight className="h-3 w-3 text-outline/40 flex-shrink-0" />
            <Link 
              href={`/topics/${slugifyTopic(pattern.topic_name)}`}
              className="hover:text-primary transition-colors"
            >
              {pattern.topic_name.replace(/^[A-Z]+\.\s+/, "").toUpperCase()}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 text-outline/40 flex-shrink-0" />
        <span className="text-on-surface">{pattern.pattern_name.toUpperCase()}</span>
      </nav>

      {/* Pattern Title Block */}
      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          {pattern.topic_name && (
            <span className="px-2.5 py-0.5 bg-[#1b1b1b] border border-primary-strong/30 text-primary font-mono-label text-[10px] tracking-wider uppercase rounded">
              {pattern.topic_name.split(".")[1]?.trim() || pattern.topic_name}
            </span>
          )}
          {pattern.difficulty && (
            <span className={`text-[10px] font-mono-label uppercase px-2.5 py-0.5 rounded border tracking-wider ${
              pattern.difficulty === "Easy" ? "bg-secondary/5 border-secondary/20 text-secondary" :
              pattern.difficulty === "Medium" ? "bg-primary/5 border-primary/20 text-primary" :
              "bg-danger/5 border-danger/20 text-danger"
            }`}>
              {pattern.difficulty}
            </span>
          )}
        </div>
        <h1 className="font-display-arcade text-2xl md:text-3xl text-on-surface tracking-widest uppercase">
          {pattern.pattern_name}
        </h1>
      </header>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Area (2 Cols wide) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Core Concept Overview */}
          <section className="bg-[#131313] border border-outline-variant/30 p-6 rounded-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3 flex items-center gap-1.5 opacity-30 text-[10px] font-mono">
              <Layers className="h-3.5 w-3.5" />
              <span>CORE_BLUEPRINT</span>
            </div>
            <h2 className="font-mono text-outline uppercase tracking-widest text-[12px] mb-4">CORE_IDEA</h2>
            <p className="font-body text-text leading-relaxed text-sm whitespace-pre-line">
              {pattern.core_idea || "No conceptual explanation provided yet."}
            </p>

            {/* Keyword Tags */}
            {keywords.length > 0 && (
              <div className="mt-6 pt-4 border-t border-outline-variant/15">
                <span className="block font-mono text-[10px] text-outline/50 uppercase tracking-widest mb-2">RECOGNITION_SIGNALS</span>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((word, i) => (
                    <span key={i} className="text-xs font-mono bg-[#1c1c1c] border border-outline-variant/20 px-3 py-1 rounded text-outline-variant">
                      {word}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Practice Questions (Client-Hydrated Toggle Overlay) */}
          <section className="bg-[#131313] border border-outline-variant/30 p-6 rounded-xl">
            <h2 className="font-mono text-outline uppercase tracking-widest text-[12px] mb-4">PRACTICE_QUESTIONS</h2>
            <PatternQuestionsClient initialQuestions={questions || []} patternName={pattern.pattern_name} />
          </section>

          {/* C++ Code Template */}
          {pattern.cpp_template && (
            <section className="bg-[#131313] border border-outline-variant/30 rounded-xl overflow-hidden">
              <div className="bg-[#1b1b1b] border-b border-outline-variant/20 px-6 py-3 flex justify-between items-center">
                <span className="font-mono text-outline uppercase tracking-widest text-[11px]">C++ CODE TEMPLATE</span>
                <span className="font-mono text-[10px] text-primary-strong">CPP_STDLIB</span>
              </div>
              <div className="p-6 overflow-x-auto bg-[#0d0d0d]">
                <pre className="font-mono text-xs text-text/90 leading-relaxed whitespace-pre">
                  <code>{pattern.cpp_template}</code>
                </pre>
              </div>
            </section>
          )}
        </div>

        {/* Sidebar Panel (1 Col wide) */}
        <div className="space-y-8">
          
          {/* Complexity analysis card */}
          <section className="bg-[#131313] border border-outline-variant/30 p-6 rounded-xl space-y-5">
            <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">COMPLEXITY_BUDGET</h2>
            
            <div className="flex items-center gap-4 border-b border-outline-variant/15 pb-4">
              <div className="h-10 w-10 bg-secondary/10 border border-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Cpu className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <span className="block font-mono text-[9px] text-outline/60 uppercase">TIME_COMPLEXITY</span>
                <span className="font-mono text-sm text-text font-bold uppercase">{pattern.tc || "O(?)"}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Tag className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="block font-mono text-[9px] text-outline/60 uppercase">SPACE_COMPLEXITY</span>
                <span className="font-mono text-sm text-text font-bold uppercase">{pattern.sc || "O(?)"}</span>
              </div>
            </div>
          </section>

          {/* Related patterns sidebar */}
          {relatedPatterns.length > 0 && (
            <section className="bg-[#131313] border border-outline-variant/30 p-6 rounded-xl space-y-4">
              <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">RELATED_PATTERNS</h2>
              <div className="space-y-4">
                {relatedPatterns.map((rel) => {
                  const relSlug = slugifyPattern(rel.pattern_name);
                  return (
                    <div 
                      key={rel.pattern_name}
                      className="group border border-outline-variant/20 hover:border-primary/50 p-4 rounded-lg bg-[#181818]/60 transition-all hover:bg-[#181818]"
                    >
                      <h3 className="font-display font-bold text-[13px] text-text mb-1 group-hover:text-primary transition-colors">
                        <Link href={`/patterns/${relSlug}`}>{rel.pattern_name}</Link>
                      </h3>
                      <p className="text-[11px] font-body text-on-surface-variant line-clamp-2 leading-relaxed">
                        {rel.core_idea}
                      </p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Protip/Hint HUD */}
          <section className="bg-primary/5 border border-primary/20 p-6 rounded-xl flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <span className="block font-mono text-[9px] text-primary uppercase tracking-widest mb-1">PRO_TIP</span>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                Study the recognition signals. Coding tests reward candidates who can categorize problems into these 94 templates within the first 5 minutes.
              </p>
            </div>
          </section>

        </div>
      </div>
    </AppShell>
  );
}
