"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Topbar } from "@/components/app/topbar";
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
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
