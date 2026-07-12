"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Topbar } from "@/components/app/topbar";
import { QuestionDetailDrawer } from "@/components/shared/question-detail-drawer";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
  gridBackground = false
}: {
  children: React.ReactNode;
  className?: string;
  gridBackground?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background text-text selection:bg-primary-container selection:text-on-primary-container relative">
      {/* Sticky Top Nav */}
      <Topbar />

      {/* Animated Scanline overlay */}
      <div className="scanline" />

      {/* Main Content Layout with Transition Animation */}
      <main className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            className={cn(
              "min-h-screen pt-24 pb-12 px-gutter max-w-container-max mx-auto space-y-stack-lg",
              gridBackground && "terminal-grid",
              className
            )}
          >
            {/* Subpage back-to-main-page navigation bar */}
            {pathname !== "/dashboard" && pathname !== "/login" && pathname !== "/" && (
              <div className="flex items-center justify-between border border-[#2D2D2D]/60 bg-[#0C0C0C]/50 rounded-lg p-3 mb-6 select-none shadow-[0_2px_12px_rgba(0,0,0,0.1)]">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-mono text-[10px] text-outline uppercase tracking-wider">Subpage Workspace Active // Terminal Segment</span>
                </div>
                <Link href="/dashboard" className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[#2D2D2D] hover:border-primary/50 bg-[#111111]/80 hover:bg-[#181818]/92 text-outline hover:text-primary rounded font-mono text-[10px] uppercase tracking-wider transition-all">
                  <span className="material-symbols-outlined text-[12px] font-bold">arrow_back</span>
                  <span>Back to Main Page</span>
                </Link>
              </div>
            )}

            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Spaced repetition and interview note drawer */}
      <QuestionDetailDrawer />
    </div>
  );
}
