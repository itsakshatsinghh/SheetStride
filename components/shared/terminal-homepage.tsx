"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Terminal as TerminalIcon,
  History,
  GitFork,
  FileCode,
  Settings,
  Search,
  ChevronDown
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { TerminalShader } from "./terminal-shader";
import { cn } from "@/lib/utils";

export function TerminalHomepage() {
  const { user } = useAuth();
  const terminalRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Parallax Tilt Effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const terminal = terminalRef.current;
      if (!terminal) return;
      // Calculate rotation based on cursor position relative to screen center
      const xAxis = (window.innerWidth / 2 - e.clientX) / 75;
      const yAxis = (window.innerHeight / 2 - e.clientY) / 75;
      terminal.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // IntersectionObserver Reveal on Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
        }
      },
      { threshold: 0.1 }
    );

    const el = revealRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, []);

  const ctaLink = user ? "/dashboard" : "/login";
  const ctaLabel = user ? "Go to Dashboard" : "Initialize Session";

  return (
    <div className="relative min-h-screen bg-brand-charcoal text-white overflow-x-hidden font-sans">
      {/* Top Header Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 px-8 h-16 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <Link href="/">
            <h1 className="font-press-start text-xl md:text-2xl text-[#2e5bff] tracking-tighter drop-shadow-[0_0_8px_rgba(46,91,255,0.6)] select-none">
              SHEETSTRIDE
            </h1>
          </Link>
        </div>
        <div className="pointer-events-auto flex gap-4 items-center bg-brand-charcoal/40 backdrop-blur-sm px-4 py-2 border border-white/5 rounded-full">
          <span className="font-vt323 text-lg text-[#2e5bff]/70 tracking-widest">
            SYS_STATUS: OPTIMAL
          </span>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
        </div>
      </header>

      {/* Split-Screen Main Layout */}
      <main>
        <section className="min-h-screen flex flex-col lg:flex-row items-stretch">
          {/* Left Column (Command Center) */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 md:px-16 lg:px-20 py-24 bg-brand-charcoal z-10">
            <div className="max-w-xl mx-auto lg:mx-0">
              <div className="mb-6">
                <span className="font-vt323 text-emerald-400 text-xl tracking-[0.25em] bg-emerald-500/10 px-3 py-1 border border-emerald-500/20 rounded-md">
                  [ ENGINE_V2.0 ]
                </span>
              </div>
              
              <h2 className="font-press-start text-3xl md:text-5xl lg:text-[46px] leading-[1.2] text-white mb-8 select-none">
                MASTER THE
                <br />
                ALGORITHM
                <span className="inline-block w-4 h-9 lg:w-5 lg:h-11 bg-[#2e5bff] ml-2 cursor-blink shadow-[0_0_10px_rgba(46,91,255,0.8)] align-middle" />
              </h2>

              <p className="font-sans text-brand-on-surface-variant text-base md:text-lg mb-10 leading-relaxed max-w-md">
                The premium DSA tracker engineered for high-performance engineers.
                <br />
                <span className="text-[#2e5bff] font-bold mt-2 inline-block">
                  Track. Solve. Excel.
                </span>
              </p>

              {/* Action area */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-16">
                <Link href={ctaLink}>
                  <button className="relative group overflow-hidden bg-[#2e5bff] text-white font-sans font-bold text-xs uppercase tracking-widest px-8 py-4 rounded-md transition-all duration-300 hover:scale-105 active:scale-95 inner-glow-top shadow-[0_4px_20px_rgba(46,91,255,0.4)]">
                    <span className="relative z-10 flex items-center gap-2">
                      {ctaLabel} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  </button>
                </Link>

                <div className="flex flex-col font-vt323 text-base text-white/50 border-l border-white/10 pl-6 space-y-1">
                  <span>MEM_USAGE: 42MB</span>
                  <span>LATENCY: 12ms</span>
                </div>
              </div>

              {/* Scroll Hint */}
              <div className="flex items-center gap-3 animate-bounce opacity-40 select-none">
                <ChevronDown className="w-5 h-5 text-[#2e5bff]" />
                <span className="font-vt323 text-base uppercase tracking-widest">
                  Scroll to explore
                </span>
              </div>
            </div>
          </div>

          {/* Right Column (Terminal Lab) */}
          <div className="w-full lg:w-1/2 relative bg-brand-surface-lowest overflow-hidden min-h-[500px] lg:min-h-screen flex items-center justify-center p-6 md:p-12">
            {/* Background Shader Backdrop */}
            <div className="absolute inset-0 z-0">
              <TerminalShader />
            </div>

            {/* Overlaid Terminal UI */}
            <div className="relative z-10 w-full max-w-lg lg:max-w-xl h-[420px] md:h-[480px] flex flex-col">
              <div
                ref={terminalRef}
                className="terminal-glass rounded-xl flex-1 flex flex-col overflow-hidden transition-all duration-200 ease-out"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* IDE Window Title Bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-brand-surface-high/60 backdrop-blur-md select-none">
                  <div className="flex gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-red-500/60" />
                    <div className="w-3.5 h-3.5 rounded-full bg-yellow-500/60" />
                    <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/60" />
                  </div>
                  <div className="font-vt323 text-sm text-brand-on-surface-variant/80 tracking-wide">
                    main.cpp — sheetstride_workspace
                  </div>
                  <div className="flex gap-3 text-white/40">
                    <Search className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                    <Settings className="w-4 h-4 cursor-pointer hover:text-white transition-colors" />
                  </div>
                </div>

                {/* IDE Body Area */}
                <div className="flex flex-1 overflow-hidden font-body text-sm">
                  {/* Left Icon Sidebar */}
                  <div className="w-12 border-r border-white/5 bg-brand-surface-low/30 flex flex-col items-center py-4 gap-5 text-white/40 select-none">
                    <FileCode className="w-5 h-5 text-[#2e5bff] cursor-pointer hover:text-white transition-colors" />
                    <GitFork className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                    <History className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                    <TerminalIcon className="w-5 h-5 cursor-pointer hover:text-white transition-colors" />
                  </div>

                  {/* Line Numbers Column */}
                  <div className="w-10 py-4 flex flex-col items-end pr-3 font-vt323 text-white/20 select-none border-r border-white/5 leading-6">
                    {Array.from({ length: 18 }, (_, index) => (
                      <span key={index}>{index + 1}</span>
                    ))}
                  </div>

                  {/* Main Code Editor Panel */}
                  <div className="flex-1 p-4 relative overflow-hidden bg-brand-charcoal/20 backdrop-blur-sm">
                    <div className="font-mono text-sm leading-6 text-white/95 pointer-events-none space-y-1">
                      <div className="flex gap-2">
                        <span className="text-emerald-400">#include</span>
                        <span className="text-brand-on-surface-variant">&lt;iostream&gt;</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-emerald-400">#include</span>
                        <span className="text-brand-on-surface-variant">"stride_core.h"</span>
                      </div>
                      <div className="h-4" />
                      <div className="flex gap-2">
                        <span className="text-sky-400">class</span>
                        <span className="text-white">DSASolver</span>
                        <span>{"{"}</span>
                      </div>
                      <div className="flex gap-2 pl-4">
                        <span className="text-sky-400">public</span>
                        <span>:</span>
                      </div>
                      <div className="flex gap-2 pl-8">
                        <span className="text-sky-400">void</span>
                        <span className="text-emerald-300">initializeSession</span>
                        <span>()</span>
                        <span>{"{"}</span>
                      </div>
                      <div className="flex gap-2 pl-12 opacity-60 text-white/80">
                        <span>stride::connect(USER_ID);</span>
                      </div>
                      <div className="flex gap-2 pl-12 opacity-60 text-white/80">
                        <span>stride::load_progress();</span>
                      </div>
                      <div className="flex gap-2 pl-8">
                        <span>{"}"}</span>
                      </div>
                      <div className="flex gap-2">
                        <span>{"};"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* IDE Window Status Footer */}
                <div className="h-8 border-t border-white/10 bg-brand-surface-low/60 backdrop-blur-md flex items-center justify-between px-4 select-none">
                  <div className="flex gap-4 font-vt323 text-xs text-emerald-400">
                    <span>main*</span>
                    <span>UTF-8</span>
                  </div>
                  <div className="flex gap-4 font-vt323 text-xs text-brand-on-surface-variant/70">
                    <span>Ln 12, Col 42</span>
                    <span>C++17</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Scroll-Triggered Secondary CTA Section */}
        <section
          ref={revealRef}
          className="min-h-screen bg-brand-surface-lowest flex flex-col items-center justify-center relative overflow-hidden px-8 py-24"
        >
          {/* Subtle horizontal grid lines */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {/* Ambient large watermark text */}
          <div className="absolute inset-0 flex items-center justify-center opacity-5 select-none pointer-events-none">
            <span className="font-press-start text-[20vw] text-[#2e5bff] tracking-tighter">
              STRIDE
            </span>
          </div>

          <div
            className={cn(
              "reveal-on-scroll max-w-4xl w-full text-center z-10 flex flex-col items-center",
              isRevealed && "visible"
            )}
          >
            <div className="inline-block px-4 py-1.5 border border-[#2e5bff]/30 bg-[#2e5bff]/10 rounded-full mb-8">
              <span className="font-vt323 text-[#2e5bff] text-lg uppercase tracking-widest">
                Ready to deploy your knowledge?
              </span>
            </div>

            <h2 className="font-press-start text-2xl md:text-4xl lg:text-5xl mb-8 text-white leading-tight">
              DATA STRUCTURES.
              <br />
              OPTIMIZED.
            </h2>

            <p className="font-sans text-brand-on-surface-variant text-base md:text-lg mb-12 max-w-2xl leading-relaxed">
              The gap between knowing and mastering is consistency. SheetStride provides
              the technical framework to bridge that gap with rigorous tracking and
              real-time analytics.
            </p>

            {/* Central CTAs with Glowing Shadows */}
            <div className="flex flex-col items-center mb-16">
              <Link href={ctaLink} className="group relative inline-flex items-center justify-center">
                {/* Shadow glow layer */}
                <div className="absolute inset-0 bg-[#2e5bff] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                {/* The Button */}
                <div className="relative bg-[#2e5bff] text-white border border-[#2e5bff]/50 font-sans font-bold text-base md:text-lg px-12 py-6 rounded-md hover:scale-105 transition-transform duration-200 active:scale-95 flex flex-col items-center gap-2">
                  <span className="uppercase tracking-widest">{ctaLabel}</span>
                  <span className="font-vt323 text-xs tracking-wider text-white/60">
                    SECURE_AUTH_LAYER_V4
                  </span>
                </div>
              </Link>
            </div>

            {/* Metrics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-20 w-full max-w-2xl border-t border-white/5 pt-12 select-none">
              <div className="text-center">
                <div className="font-vt323 text-4xl text-emerald-400">450+</div>
                <div className="font-vt323 text-xs text-brand-on-surface-variant/80 uppercase tracking-widest mt-2">
                  Curated Problems
                </div>
              </div>
              <div className="text-center">
                <div className="font-vt323 text-4xl text-[#2e5bff]">12ms</div>
                <div className="font-vt323 text-xs text-brand-on-surface-variant/80 uppercase tracking-widest mt-2">
                  Sync Latency
                </div>
              </div>
              <div className="text-center">
                <div className="font-vt323 text-4xl text-emerald-400">∞</div>
                <div className="font-vt323 text-xs text-brand-on-surface-variant/80 uppercase tracking-widest mt-2">
                  Scalability
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Footer */}
          <footer className="absolute bottom-6 w-full left-0 px-8 md:px-16 flex flex-col sm:flex-row justify-between items-center gap-4 text-white/30 text-xs font-vt323 tracking-wider z-10 select-none">
            <div>© 2024 SHEETSTRIDE SYSTEMS // ALL RIGHTS RESERVED</div>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">
                DOCS
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                API
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                LEGAL
              </Link>
            </div>
          </footer>
        </section>
      </main>
    </div>
  );
}
