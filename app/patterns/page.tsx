import { Metadata } from "next";
import fs from "fs";
import path from "path";
import { AppShell } from "@/components/app/shell";
import { PatternsListClient } from "./patterns-list-client";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Pattern Atlas: Core Algorithmic Blueprints | SheetStride",
  description: "Master 16 core algorithmic patterns to solve data structures and algorithms problems during interviews.",
  keywords: ["DSA Patterns", "LeetCode Patterns", "Coding Interview Templates", "Time Complexity", "Algorithms"],
  alternates: {
    canonical: "https://sheetstride.com/patterns"
  }
};

export default async function PatternsPage() {
  const indexPath = path.join(
    process.cwd(),
    "lib",
    "pattern-atlas",
    "generated",
    "atlas-index.json"
  );

  let patterns: any[] = [];
  try {
    if (fs.existsSync(indexPath)) {
      const content = fs.readFileSync(indexPath, "utf-8");
      patterns = JSON.parse(content).patterns || [];
    }
  } catch (err) {
    console.error("Failed to read atlas-index.json in page compiler:", err);
  }

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      <header className="mb-12 relative overflow-hidden">
        <nav className="flex items-center gap-2 mb-4 text-on-surface-variant font-mono-label text-mono-label uppercase">
          <span className="text-on-surface">Blueprint Atlas</span>
        </nav>
        <h1 className="font-display-arcade text-3xl md:text-4xl text-on-surface tracking-widest leading-tight uppercase">
          PATTERN <span className="text-primary">ATLAS</span>
        </h1>
        <p className="mt-4 font-body-lg text-on-surface-variant max-w-2xl">
          A high-fidelity directory of core algorithmic blueprints. Grouped by design families, mapped to curated interview exercise paths, and verified offline.
        </p>
      </header>

      {/* Renders interactive filters and search HUD using local index content */}
      <PatternsListClient initialPatterns={patterns} />
    </AppShell>
  );
}
