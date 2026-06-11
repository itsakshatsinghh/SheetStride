import { TerminalHomepage } from "@/components/shared/terminal-homepage";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SheetStride | Master the Algorithm",
  description: "A sophisticated, high-performance Retro Terminal meets SaaS tracker for DSA tracking and real-time analytics."
};

export default function HomePage() {
  return <TerminalHomepage />;
}
