import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import { ChevronRight, Cpu, Tag, AlertCircle, Layers, Play, CheckCircle, Activity, ShieldAlert, Award } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { PatternQuestionsClient } from "./pattern-questions-client";
import { PatternDetails } from "@/lib/pattern-atlas/types/pattern";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-static";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const filePath = path.join(process.cwd(), "lib", "pattern-atlas", "generated", `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    return { title: "Pattern Not Found | SheetStride" };
  }

  try {
    const pattern: PatternDetails = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return {
      title: `${pattern.pattern_name} Coding Pattern: Visuals & Complexity | SheetStride`,
      description: pattern.overview.substring(0, 155) + "...",
      keywords: pattern.recognition_signals,
    };
  } catch {
    return { title: "Pattern Details | SheetStride" };
  }
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "lib", "pattern-atlas", "generated");
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter(f => f.endsWith(".json") && f !== "atlas-index.json");
  return files.map((f) => ({
    slug: f.replace(".json", ""),
  }));
}

export default async function PatternDetailPage({ params }: PageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const filePath = path.join(process.cwd(), "lib", "pattern-atlas", "generated", `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    notFound();
  }

  let pattern: PatternDetails;
  try {
    pattern = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.error("Failed to parse pattern JSON:", err);
    notFound();
  }

  // Map search schema to match expected checklist components
  const mappedQuestions = pattern.question_ladder.map((q, index) => ({
    Sheet_order: index + 1,
    question_id: q.question_id || (9999 + index),
    title: q.title,
    difficulty: q.difficulty,
    link: q.link,
    topics: pattern.family_name,
    acceptance_rate: null
  }));

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      {/* Breadcrumbs HUD */}
      <nav className="flex items-center gap-2 mb-6 text-on-surface-variant font-mono-label text-mono-label uppercase tracking-widest text-[11px] overflow-x-auto whitespace-nowrap select-none">
        <Link href="/" className="hover:text-primary transition-colors">HOME</Link>
        <ChevronRight className="h-3 w-3 text-outline/40 flex-shrink-0" />
        <Link href="/patterns" className="hover:text-primary transition-colors">PATTERN_ATLAS</Link>
        <ChevronRight className="h-3 w-3 text-outline/40 flex-shrink-0" />
        <span className="text-on-surface">{pattern.pattern_name.toUpperCase()}</span>
      </nav>

      {/* Hero Header */}
      <header className="mb-10 relative overflow-hidden bg-[#111111]/40 border border-outline-variant/20 p-6 rounded-xl backdrop-blur-md">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none select-none">
          <Layers className="h-32 w-32" />
        </div>
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="px-2.5 py-0.5 bg-primary/10 border border-primary/20 text-primary font-mono-label text-[10px] tracking-wider uppercase rounded">
            {pattern.family_name}
          </span>
          <span className={`text-[10px] font-mono-label uppercase px-2.5 py-0.5 rounded border tracking-wider ${
            pattern.difficulty === "Beginner" ? "bg-secondary/5 border-secondary/20 text-secondary" :
            pattern.difficulty === "Intermediate" ? "bg-primary/5 border-primary/20 text-primary" :
            "bg-danger/5 border-danger/20 text-danger"
          }`}>
            {pattern.difficulty}
          </span>
        </div>
        <h1 className="font-display-arcade text-2xl md:text-3xl text-on-surface tracking-widest uppercase">
          {pattern.pattern_name}
        </h1>
      </header>

      {/* Two Column Main Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content (2 Cols) */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Overview */}
          <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl relative overflow-hidden">
            <h2 className="font-mono text-outline uppercase tracking-widest text-[11px] mb-4">01 // OVERVIEW</h2>
            <p className="font-body text-text leading-relaxed text-sm whitespace-pre-line">
              {pattern.overview}
            </p>
          </section>

          {/* Mental Model Analogy */}
          <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
            <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">02 // MENTAL_MODEL</h2>
            <div className="bg-[#090909] border border-primary/20 p-4 rounded-lg flex gap-4 items-start">
              <Award className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-mono text-xs text-primary font-bold uppercase tracking-wider mb-2">ANALOGY: {pattern.mental_model.analogy}</h3>
                <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                  {pattern.mental_model.description}
                </p>
              </div>
            </div>
          </section>

          {/* Brute Force to Optimal Journey */}
          <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
            <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">03 // OPTIMIZATION_JOURNEY</h2>
            <div className="space-y-4">
              <div className="border border-outline-variant/15 p-4 rounded-lg bg-[#090909]/40">
                <span className="block font-mono text-[9px] text-danger uppercase tracking-widest mb-1">BRUTE_FORCE</span>
                <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                  {pattern.brute_force_journey.brute_force_description}
                </p>
              </div>
              <div className="border border-outline-variant/15 p-4 rounded-lg bg-[#090909]/40">
                <span className="block font-mono text-[9px] text-warning uppercase tracking-widest mb-1">INEFFICIENCY_OBSERVATION</span>
                <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                  {pattern.brute_force_journey.inefficiency_observation}
                </p>
              </div>
              <div className="border border-primary-strong/20 p-4 rounded-lg bg-[#090909]/60">
                <span className="block font-mono text-[9px] text-primary uppercase tracking-widest mb-1">OPTIMIZED_PATTERN</span>
                <p className="font-body text-xs text-text leading-relaxed">
                  {pattern.brute_force_journey.optimization_concept}
                </p>
              </div>
            </div>
          </section>

          {/* Boilerplate templates */}
          <section className="bg-[#111111] border border-outline-variant/30 rounded-xl overflow-hidden">
            <div className="bg-[#090909] border-b border-outline-variant/20 px-6 py-3 flex justify-between items-center">
              <span className="font-mono text-outline uppercase tracking-widest text-[11px]">04 // ALGORITHM_BLUEPRINT (PYTHON)</span>
              <span className="font-mono text-[10px] text-primary-strong">PYTHON_EXEC</span>
            </div>
            <div className="p-6 overflow-x-auto bg-[#090909]">
              <pre className="font-mono text-xs text-text/90 leading-relaxed whitespace-pre">
                <code>{pattern.polyglot_boilerplates.python}</code>
              </pre>
            </div>
          </section>

          {/* Variants section */}
          {pattern.variants.length > 0 && (
            <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
              <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">05 // PATTERN_VARIANTS</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pattern.variants.map((v, i) => (
                  <div key={i} className="border border-outline-variant/20 p-4 rounded-lg bg-[#090909]/40 hover:border-outline transition-colors">
                    <h3 className="font-display font-semibold text-xs text-text uppercase tracking-wider mb-2">{v.name}</h3>
                    <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                      {v.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Common Mistakes */}
          {pattern.common_mistakes.length > 0 && (
            <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
              <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">06 // COMMON_PITFALLS</h2>
              <div className="space-y-3">
                {pattern.common_mistakes.map((m, i) => (
                  <div key={i} className="border border-l-4 border-danger/40 border-outline-variant/20 p-4 rounded-lg bg-danger/[0.02] flex gap-3 items-start">
                    <ShieldAlert className="h-4 w-4 text-danger flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-mono text-xs text-danger font-bold uppercase tracking-wider mb-1">{m.mistake_title}</h3>
                      <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                        {m.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Practice checklist */}
          <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl">
            <h2 className="font-mono text-outline uppercase tracking-widest text-[11px] mb-6">07 // QUESTION_JOURNEY</h2>
            <PatternQuestionsClient initialQuestions={mappedQuestions} patternName={pattern.pattern_name} />
          </section>

        </div>

        {/* Sidebar Panel (1 Col) */}
        <div className="space-y-8">
          
          {/* Metadata driven visualization panel preview */}
          <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-5 relative">
            <div className="absolute top-0 right-0 p-3 opacity-20 text-[10px] font-mono select-none">
              <Play className="h-4.5 w-4.5" />
            </div>
            <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">VISUALIZATION_ENGINE</h2>
            
            <div className="border border-[#222222] bg-[#090909] p-4 rounded-lg font-mono text-[11px] space-y-3 text-outline/80">
              <div className="flex justify-between border-b border-[#222222] pb-1.5">
                <span>LAYOUT_TYPE:</span>
                <span className="text-secondary uppercase">{pattern.visualization_metadata.type}</span>
              </div>
              <div className="flex justify-between border-b border-[#222222] pb-1.5">
                <span>INITIAL_ELEMENTS:</span>
                <span className="text-primary truncate max-w-[120px]" title={JSON.stringify(pattern.visualization_metadata.initial_state)}>
                  {JSON.stringify(pattern.visualization_metadata.initial_state.array || "")}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#222222] pb-1.5">
                <span>LOOP_FRAMES:</span>
                <span className="text-text">{pattern.visualization_metadata.animation_steps.length} frames</span>
              </div>
            </div>

            {/* Loop Steps preview list */}
            <div className="space-y-3">
              <span className="block font-mono text-[9px] text-outline/50 uppercase tracking-widest">TRAVERSAL_TIMELINE</span>
              {pattern.visualization_metadata.animation_steps.map((step, idx) => (
                <div key={idx} className="flex gap-3 items-start text-xs border border-outline-variant/10 p-2.5 rounded bg-[#090909]/30">
                  <span className="font-mono text-[10px] text-primary flex-shrink-0 mt-0.5">F_0{idx}</span>
                  <div>
                    <span className="block font-mono text-[10px] text-text font-bold uppercase">{step.action}</span>
                    <p className="font-body text-[11px] text-on-surface-variant leading-relaxed mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recognition keywords tags */}
          <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
            <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">RECOGNITION_SIGNALS</h2>
            <div className="flex flex-wrap gap-2">
              {pattern.recognition_signals.map((sig, i) => (
                <span key={i} className="text-xs font-mono bg-[#090909] border border-outline-variant/20 px-3 py-1 rounded text-outline-variant flex items-center gap-1.5">
                  <Tag className="h-3 w-3 text-primary-strong" />
                  <span>{sig}</span>
                </span>
              ))}
            </div>
          </section>

          {/* Cheat Sheet tips */}
          <section className="bg-[#111111] border border-outline-variant/30 p-6 rounded-xl space-y-4">
            <h2 className="font-mono text-outline uppercase tracking-widest text-[11px]">CHEV_SHEET</h2>
            <ul className="space-y-2.5">
              {pattern.cheat_sheet.map((tip, i) => (
                <li key={i} className="flex gap-2.5 items-start text-xs text-on-surface-variant leading-relaxed">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Interview tips perspective */}
          <section className="bg-primary/5 border border-primary/20 p-6 rounded-xl flex items-start gap-4">
            <AlertCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <span className="block font-mono text-[9px] text-primary uppercase tracking-widest mb-1">INTERVIEW_ADVICE</span>
              <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                {pattern.interview_perspective}
              </p>
            </div>
          </section>

        </div>

      </div>
    </AppShell>
  );
}
