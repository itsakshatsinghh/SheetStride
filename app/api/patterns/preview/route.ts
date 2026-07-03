import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { parsePatternMarkdown } from "@/lib/pattern-atlas/builder/compiler";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");
  const raw = searchParams.get("raw") === "true";

  if (!slug) {
    return NextResponse.json(
      { error: "Query parameter 'slug' is required (e.g., ?slug=sliding-window)" },
      { status: 400 }
    );
  }

  const generatedPath = path.join(
    process.cwd(),
    "lib",
    "pattern-atlas",
    "generated",
    `${slug}.json`
  );

  // 1. If raw is true, parse directly from raw markdown file on-the-fly
  if (raw) {
    const rawDir = path.join(
      process.cwd(),
      "Several-Coding-Patterns-for-Solving-Data-Structures-and-Algorithms-Problems-during-Interviews"
    );

    if (!fs.existsSync(rawDir)) {
      return NextResponse.json(
        { error: "Raw patterns directory not found." },
        { status: 500 }
      );
    }

    const files = fs.readdirSync(rawDir);
    // Find the file whose parsed slug matches the requested slug
    let matchedFile: string | null = null;
    
    // Look for matching slug in filename first as quick heuristic
    const cleanSlug = slug.toLowerCase().replace(/-/g, "");
    for (const file of files) {
      if (file.endsWith(".md") && file !== "README.md") {
        const fileClean = file.toLowerCase().replace(/[^a-z0-9]/g, "");
        if (fileClean.includes(cleanSlug)) {
          matchedFile = file;
          break;
        }
      }
    }

    if (!matchedFile) {
      return NextResponse.json(
        { error: `No raw markdown pattern file matches slug: '${slug}'` },
        { status: 404 }
      );
    }

    try {
      const filePath = path.join(rawDir, matchedFile);
      const parsed = await parsePatternMarkdown(filePath, {
        checkSupabase: false, // skip dynamic DB checks for instant previews
      });
      return NextResponse.json({
        source: "raw-parsed-on-the-fly",
        file: matchedFile,
        errors: parsed.errors,
        warnings: parsed.warnings,
        data: parsed.pattern,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: `Fatal parser error: ${err.message}` },
        { status: 500 }
      );
    }
  }

  // 2. Otherwise load compiled static JSON
  if (!fs.existsSync(generatedPath)) {
    return NextResponse.json(
      {
        error: `Pattern '${slug}' is not compiled yet. Run 'npm run compile-patterns' or use '?raw=true' to parse on-the-fly.`,
      },
      { status: 404 }
    );
  }

  try {
    const fileContent = fs.readFileSync(generatedPath, "utf-8");
    const data = JSON.parse(fileContent);
    return NextResponse.json({
      source: "compiled-static-json",
      data,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: `Failed to read compiled JSON: ${err.message}` },
      { status: 500 }
    );
  }
}
