// WebSocket polyfill for Node.js 20 Supabase compatibility
if (typeof global.WebSocket === "undefined") {
  (global as any).WebSocket = class {};
}

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

import { parsePatternMarkdown } from "../lib/pattern-atlas/builder/compiler";
import { generateAtlasIndex } from "../lib/pattern-atlas/search/index-generator";
import { PatternDetails } from "../lib/pattern-atlas/types/pattern";

// 1. Load local environment variables for Supabase lookup
dotenv.config({ path: ".env.local" });

const PATTERNS_DIR = path.join(
  process.cwd(),
  "Several-Coding-Patterns-for-Solving-Data-Structures-and-Algorithms-Problems-during-Interviews"
);
const OUTPUT_DIR = path.join(process.cwd(), "lib", "pattern-atlas", "generated");

async function runCompiler() {
  console.log("=================================================");
  console.log("        SHEETSTRIDE PATTERN ATLAS COMPILER       ");
  console.log("=================================================");

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  // Find all pattern markdown files
  if (!fs.existsSync(PATTERNS_DIR)) {
    console.error(`Error: Raw patterns directory not found at: ${PATTERNS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(PATTERNS_DIR)
    .filter(f => f.endsWith(".md") && f !== "README.md");

  if (files.length === 0) {
    console.log("No pattern files found to compile.");
    return;
  }

  console.log(`Found ${files.length} pattern files to ingest.`);

  const compiledPatterns: PatternDetails[] = [];
  const audits: Record<string, { success: boolean; errors: string[]; warnings: string[] }> = {};

  const dryRun = process.argv.includes("--dry-run");
  const skipDb = process.argv.includes("--skip-db");

  for (const file of files) {
    const filePath = path.join(PATTERNS_DIR, file);
    console.log(`\nProcessing: ${file}...`);

    try {
      const { pattern, errors, warnings } = await parsePatternMarkdown(filePath, {
        checkSupabase: !skipDb,
      });

      const success = errors.length === 0;
      audits[pattern.pattern_name] = { success, errors, warnings };

      if (success) {
        compiledPatterns.push(pattern);
        if (!dryRun) {
          const outPath = path.join(OUTPUT_DIR, `${pattern.slug}.json`);
          fs.writeFileSync(outPath, JSON.stringify(pattern, null, 2), "utf-8");
          console.log(`  ✅ Written JSON: ${pattern.slug}.json`);
        } else {
          console.log(`  [Dry-Run] Passed validation check`);
        }
      } else {
        console.error(`  ❌ Validation failed:`);
        errors.forEach(err => console.error(`     - ${err}`));
      }

      if (warnings.length > 0) {
        console.warn(`  ⚠️  Warnings:`);
        warnings.forEach(w => console.warn(`     - ${w}`));
      }
    } catch (err: any) {
      console.error(`  💥 Fatal parser crash on file: ${file}`);
      console.error(err.message || err);
      audits[file] = { success: false, errors: [err.message || "Fatal error"], warnings: [] };
    }
  }

  // Generate Search Index if we have successful patterns
  if (compiledPatterns.length > 0 && !dryRun) {
    console.log("\nCompiling Search Index...");
    try {
      const index = await generateAtlasIndex(compiledPatterns, !skipDb);
      const indexOut = path.join(OUTPUT_DIR, "atlas-index.json");
      fs.writeFileSync(indexOut, JSON.stringify({ patterns: index }, null, 2), "utf-8");
      console.log(`  ✅ Written Search Index: atlas-index.json (${index.length} entries)`);
    } catch (err: any) {
      console.error("  ❌ Failed to build search index:", err.message || err);
    }
  }

  // Print Audit Report
  console.log("\n=================================================");
  console.log("            PATTERN ATLAS AUDIT SUMMARY          ");
  console.log("=================================================");
  let passedCount = 0;
  let failedCount = 0;

  for (const [name, audit] of Object.entries(audits)) {
    const marker = audit.success ? "✅ PASS" : "❌ FAIL";
    console.log(`${marker} - ${name}`);
    if (audit.errors.length > 0) {
      audit.errors.forEach(e => console.log(`  - ERR: ${e}`));
    }
    if (audit.warnings.length > 0) {
      audit.warnings.forEach(w => console.log(`  - WRN: ${w}`));
    }
    if (audit.success) passedCount++;
    else failedCount++;
  }

  console.log("\n=================================================");
  console.log(`Results: ${passedCount} passed, ${failedCount} failed.`);
  console.log("=================================================");

  if (failedCount > 0 && !dryRun) {
    console.log("\n⚠️ Compilation completed with some failures. Fix validation errors to compile missing profiles.");
  } else {
    console.log("\n🎉 Ingestion foundation executed successfully!");
  }
}

runCompiler();
