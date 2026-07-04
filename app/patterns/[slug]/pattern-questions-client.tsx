"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Question {
  Sheet_order: number;
  question_id: number;
  title: string;
  difficulty: string;
  link: string;
  topics: string;
  acceptance_rate: number | null;
  is_reference_only?: boolean;
}

export function PatternQuestionsClient({
  initialQuestions,
}: {
  initialQuestions: Question[];
  patternName: string;
}) {
  const formatID = (id: number) => {
    if (id < 10) return `00${id}`;
    if (id < 100) return `0${id}`;
    return `${id}`;
  };

  return (
    <div className="relative">
      {/* Table container */}
      <div className="border border-outline-variant/15 rounded-lg overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#090909]/50 border-b border-outline-variant/20 select-none text-[10px] uppercase font-mono-label text-outline/65">
                <th className="px-5 py-3.5">#</th>
                <th className="px-5 py-3.5">Title</th>
                <th className="px-5 py-3.5">Difficulty</th>
                <th className="px-5 py-3.5 text-right">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {initialQuestions.map((row) => {
                return (
                  <tr
                    key={row.question_id}
                    className="transition-all duration-200 hover:bg-primary/[0.01]"
                  >
                    {/* Index */}
                    <td className="px-5 py-4 font-mono text-[11px] text-outline/50 select-none">
                      {formatID(row.Sheet_order)}
                    </td>

                    {/* Title */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("open-question-drawer", {
                          detail: {
                            questionId: row.question_id,
                            title: row.title,
                            difficulty: row.difficulty,
                            link: row.link,
                            mode: "description"
                          }
                        }))}
                        className="font-headline-md text-xs font-semibold tracking-wide transition-colors hover:text-primary cursor-pointer text-left text-text"
                      >
                        {row.title}
                      </button>
                    </td>

                    {/* Difficulty */}
                    <td className="px-5 py-4 select-none">
                      <Badge
                        tone={
                          row.difficulty.toLowerCase() === "easy" ? "secondary" :
                          row.difficulty.toLowerCase() === "medium" ? "tertiary" : "danger"
                        }
                      >
                        {row.difficulty.toUpperCase()}
                      </Badge>
                    </td>

                    {/* Leetcode Link */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end">
                        <a
                          href={row.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-outline/60 hover:text-primary transition-colors inline-flex items-center"
                          title="Open LeetCode"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
