import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import { ChevronRight, Layers } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { PatternDetails } from "@/lib/pattern-atlas/types/pattern";
import { PatternDetailClient } from "./pattern-detail-client";

import { Breadcrumbs } from "@/components/shared/breadcrumbs";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const dynamic = "force-static";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const filePath = path.join(process.cwd(), "lib", "pattern-atlas", "generated", `${slug}.json`);

  if (!fs.existsSync(filePath)) {
    return {
      title: "Pattern Blueprint Not Found | SheetStride",
    };
  }

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const json = JSON.parse(raw) as PatternDetails;
    return {
      title: `${json.pattern_name}: Algorithmic Blueprint | SheetStride`,
      description: json.overview || `Master the ${json.pattern_name} pattern for software engineering interviews.`,
    };
  } catch {
    return {
      title: "Pattern Blueprint Details | SheetStride",
    };
  }
}

export async function generateStaticParams() {
  const generatedDir = path.join(process.cwd(), "lib", "pattern-atlas", "generated");
  if (!fs.existsSync(generatedDir)) return [];

  const files = fs.readdirSync(generatedDir);
  return files
    .filter((f) => f.endsWith(".json") && f !== "atlas-index.json")
    .map((f) => ({
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
    const content = fs.readFileSync(filePath, "utf-8");
    pattern = JSON.parse(content);
  } catch (err) {
    console.error("Failed to parse pattern detail JSON:", err);
    notFound();
  }

  const mappedQuestions = pattern.question_ladder.map((q, index) => ({
    Sheet_order: index + 1,
    question_id: q.question_id || (9999 + index),
    title: q.title,
    difficulty: q.difficulty,
    link: q.link,
    topics: pattern.family_name,
    acceptance_rate: null,
    is_reference_only: !q.question_id
  }));

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Patterns", href: "/patterns" },
    { label: pattern.pattern_name }
  ];

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      <Breadcrumbs items={breadcrumbItems} />

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

      {/* Logical Section tab views */}
      <PatternDetailClient pattern={pattern} mappedQuestions={mappedQuestions} />
    </AppShell>
  );
}
