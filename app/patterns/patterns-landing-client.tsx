"use client";

import Link from "next/link";
import { BookOpen, Trophy, ArrowRight } from "lucide-react";
import { TerminalShader } from "@/components/shared/terminal-shader";

export function PatternsLandingClient() {
  return (
    <div className="relative min-h-[75vh] w-full rounded-2xl overflow-hidden border border-[#222]/60 bg-[#050505]">
      {/* Background WebGL Shader */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        <TerminalShader />
      </div>

      {/* Main Overlay Content */}
      <div className="relative z-10 max-w-container-max mx-auto px-8 py-16 flex flex-col justify-center min-h-[75vh]">
        <header className="mb-12 text-center max-w-2xl mx-auto space-y-4">
          <nav className="flex items-center justify-center gap-2 mb-2 text-on-surface-variant font-mono uppercase text-[10px] tracking-widest select-none">
            <span className="text-primary font-bold">Patterns Hub</span>
          </nav>
          <h1 className="font-display text-4xl md:text-5xl text-on-surface tracking-widest leading-tight uppercase font-black">
            ALGORITHMIC <span className="text-primary">PATTERNS</span>
          </h1>
          <p className="font-body text-sm text-outline leading-relaxed font-semibold">
            Master the foundational templates of coding interviews. Grouped by design families for reference study, or structured as rapid mental drills.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto pt-6 select-none w-full">
          {/* Card 1: Pattern Atlas */}
          <Link
            href="/patterns/atlas"
            className="group block relative bg-[#090909]/90 backdrop-blur-sm border border-outline-variant/30 hover:border-primary/50 p-10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(255,212,0,0.15)] flex flex-col justify-between h-72"
          >
            <div>
              <div className="h-12 w-12 rounded-xl bg-primary/5 border border-outline-variant/20 group-hover:border-primary/30 flex items-center justify-center mb-6 transition-colors">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl md:text-2xl text-text uppercase tracking-wider group-hover:text-primary transition-colors">
                Pattern Atlas
              </h2>
              <p className="mt-3 font-body text-sm text-outline leading-relaxed font-medium">
                Explore the 16 core algorithmic blueprints. Inspect mental analogies, visual dynamic simulations, complexity trade-offs, and annotated C++ boilerplate code templates.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-primary uppercase tracking-widest font-bold mt-6">
              Enter Atlas Directory <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* Card 2: Pattern Challenges */}
          <Link
            href="/practice"
            className="group block relative bg-[#090909]/90 backdrop-blur-sm border border-outline-variant/30 hover:border-primary/50 p-10 rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-10px_rgba(255,212,0,0.15)] flex flex-col justify-between h-72"
          >
            <div>
              <div className="h-12 w-12 rounded-xl bg-primary/5 border border-outline-variant/20 group-hover:border-primary/30 flex items-center justify-center mb-6 transition-colors">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl md:text-2xl text-text uppercase tracking-wider group-hover:text-primary transition-colors">
                Practice Sessions
              </h2>
              <p className="mt-3 font-body text-sm text-outline leading-relaxed font-medium">
                Practice your algorithmic instincts in the Practice Center. Run pattern recognition sessions or compile daily practice sets targeting specific topics.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-mono text-primary uppercase tracking-widest font-bold mt-6">
              Enter Practice Center <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
