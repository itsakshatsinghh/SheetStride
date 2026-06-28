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
  ChevronDown,
  Coffee,
  Linkedin,
  Instagram,
  Code,
  Award,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { TerminalShader } from "./terminal-shader";
import { cn } from "@/lib/utils";
import Dither from "@/components/ui/dither";

export function TerminalHomepage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const terminalRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  // RequestAnimationFrame throttled scroll tracking
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
          if (totalScroll > 0) {
            setScrollProgress(window.scrollY / totalScroll);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Initialize once
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parallax Tilt Effect on interactive Mock Terminal
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const terminal = terminalRef.current;
      if (!terminal) return;
      const xAxis = (window.innerWidth / 2 - e.clientX) / 75;
      const yAxis = (window.innerHeight / 2 - e.clientY) / 75;
      terminal.style.transform = `perspective(1000px) rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  if (loading || user) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-full max-w-md px-6 text-center space-y-6 flex flex-col items-center">
          <div className="inline-block border border-[#FFD400]/30 bg-[#FFD400]/10 px-3 py-1 text-[11px] font-mono-label uppercase text-[#FFD400] tracking-widest animate-pulse">
            REDIRECTING_TO_WORKSPACE
          </div>
        </div>
      </div>
    );
  }

  const ctaLink = user ? "/dashboard" : "/login";
  const ctaLabel = user ? "Go to Dashboard" : "Initialize Session";

  // Dynamic colors & waves shifting based on user scroll progress
  const r = 1.0 - scrollProgress * 0.03;
  const g = 0.83 - scrollProgress * 0.38;
  const b = 0.0 + scrollProgress * 0.09;
  const ditherColor: [number, number, number] = [r, g, b];
  const ditherSpeed = 0.08 + scrollProgress * 0.12;
  const ditherFrequency = 2.8 + scrollProgress * 2.2;
  const ditherAmplitude = 0.3 + scrollProgress * 0.15;

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-[#FFD400] selection:text-black">
      
      {/* Dynamic Scroll-driven WebGL Dither Wave Background */}
      <div className="fixed inset-0 z-0 opacity-[0.14] pointer-events-none overflow-hidden">
        <Dither
          waveColor={ditherColor}
          pixelSize={3}
          colorNum={3}
          waveSpeed={ditherSpeed}
          waveFrequency={ditherFrequency}
          waveAmplitude={ditherAmplitude}
          enableMouseInteraction={true}
          mouseRadius={0.4}
        />
        {/* Ambient center grid vignette filter overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,#050505_95%)]" />
      </div>

      {/* Top Header HUD Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 md:px-12 h-20 flex items-center justify-between pointer-events-none select-none">
        <div className="pointer-events-auto">
          <Link href="/">
            <h1 className="font-press-start text-lg md:text-xl text-[#FFD400] tracking-tighter drop-shadow-[0_0_8px_rgba(255,212,0,0.5)] transition-all hover:scale-105 active:scale-95">
              SHEETSTRIDE
            </h1>
          </Link>
        </div>
        <div className="pointer-events-auto flex gap-4 items-center bg-black/45 border border-white/5 px-4 py-2 rounded-full backdrop-blur-md shadow-lg">
          <span className="font-vt323 text-base text-[#FFD400]/80 tracking-widest">
            SYS_STATUS: OPTIMAL
          </span>
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" />
        </div>
      </header>

      <main className="relative z-10 w-full">
        {/* ================= HERO SECTION ================= */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-32 pb-16 text-center max-w-6xl mx-auto relative">
          
          <div className="space-y-6 max-w-3xl mx-auto mb-12 animate-fade-in">
            <div className="inline-block">
              <span className="font-vt323 text-[#FFD400] text-xl tracking-[0.25em] bg-[#FFD400]/10 px-4 py-1.5 border border-[#FFD400]/20 rounded-md shadow-sm">
                [ ENGINE_V3.0_ONLINE ]
              </span>
            </div>
            
            <h2 className="font-press-start text-3xl md:text-5xl lg:text-6xl leading-[1.3] text-white select-none tracking-tight">
              MASTER THE
              <br />
              <span className="text-[#FFD400] drop-shadow-[0_0_12px_rgba(255,212,0,0.3)]">ALGORITHM</span>
              <span className="inline-block w-4 h-9 lg:w-5 lg:h-12 bg-[#FFD400] ml-2 cursor-blink shadow-[0_0_10px_rgba(255,212,0,0.8)] align-middle" />
            </h2>

            <p className="font-sans text-[#A0A0A5] text-base md:text-xl max-w-2xl mx-auto leading-relaxed">
              The premium, retro-industrial training facility designed for deliberate algorithmic pattern mastery. Stop grinding. Start mastering.
            </p>
          </div>

          {/* Action area */}
          <div className="flex flex-col items-center gap-4 mb-16 z-20">
            <Link href={ctaLink}>
              <button className="relative group overflow-hidden bg-[#FFD400] text-black font-sans font-bold text-sm uppercase tracking-widest px-12 py-5 rounded-md transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(255,212,0,0.3)] hover:bg-[#FFE14D] active:bg-[#FFB800]">
                <span className="relative z-10 flex items-center gap-3">
                  {ctaLabel} <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
            </Link>
            
            <div className="flex gap-8 font-vt323 text-lg text-white/40 select-none tracking-wide mt-2">
              <span>MEM_USAGE: 42MB</span>
              <span>LATENCY: 12ms</span>
              <span>LOAD_FACTOR: 0.12</span>
            </div>
          </div>

          {/* Centered Floating Mock IDE Terminal Showcase */}
          <div className="w-full max-w-3xl px-4 z-15 mt-4">
            <div
              ref={terminalRef}
              className="terminal-glass rounded-xl h-[340px] md:h-[400px] flex flex-col overflow-hidden transition-all duration-200 ease-out border border-white/10 bg-black/60 backdrop-blur-md shadow-2xl select-none"
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* IDE Window Title Bar */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-brand-surface-high/60 backdrop-blur-md">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
                </div>
                <div className="font-vt323 text-sm text-white/60 tracking-wide">
                  solver_session.cpp — sheetstride_host
                </div>
                <div className="flex gap-3 text-white/30">
                  <Search className="w-4 h-4" />
                  <Settings className="w-4 h-4" />
                </div>
              </div>

              {/* IDE Body Area */}
              <div className="flex flex-1 overflow-hidden font-mono text-xs md:text-sm text-left">
                {/* Left Icon Sidebar */}
                <div className="w-12 border-r border-white/5 bg-black/40 flex flex-col items-center py-4 gap-5 text-white/30">
                  <FileCode className="w-5 h-5 text-[#FFD400]" />
                  <GitFork className="w-5 h-5" />
                  <History className="w-5 h-5" />
                  <TerminalIcon className="w-5 h-5" />
                </div>

                {/* Line Numbers Column */}
                <div className="w-10 py-4 flex flex-col items-end pr-3 font-vt323 text-white/20 border-r border-white/5 leading-6">
                  {Array.from({ length: 15 }, (_, index) => (
                    <span key={index}>{index + 1}</span>
                  ))}
                </div>

                {/* Main Code Editor Panel */}
                <div className="flex-1 p-4 relative overflow-hidden bg-black/10 backdrop-blur-xs">
                  <div className="leading-6 text-white/80 space-y-0.5">
                    <div className="flex gap-2">
                      <span className="text-orange-400">#include</span>
                      <span className="text-white/50">&lt;stride_core.h&gt;</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-orange-400">#include</span>
                      <span className="text-white/50">"spaced_rep_engine.h"</span>
                    </div>
                    <div className="h-4" />
                    <div className="flex gap-2">
                      <span className="text-sky-400">class</span>
                      <span className="text-[#FFD400]">AlgorithmicMastery</span>
                      <span>{"{"}</span>
                    </div>
                    <div className="flex gap-2 pl-4">
                      <span className="text-sky-400">public</span>
                      <span>:</span>
                    </div>
                    <div className="flex gap-2 pl-8">
                      <span className="text-sky-400">void</span>
                      <span className="text-emerald-400">masterPatterns</span>
                      <span>()</span>
                      <span>{"{"}</span>
                    </div>
                    <div className="flex gap-2 pl-12 text-white/60">
                      <span>stride::load_roadmap(SHEETSTRIDE_CORE);</span>
                    </div>
                    <div className="flex gap-2 pl-12 text-white/60">
                      <span>stride::spaced_rep::schedule_revisions();</span>
                    </div>
                    <div className="flex gap-2 pl-12 text-emerald-400 font-bold">
                      <span>stride::visualize_mastery_hud(); // 100% SUCCESS</span>
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
              <div className="h-8 border-t border-white/10 bg-black/60 backdrop-blur-md flex items-center justify-between px-4">
                <div className="flex gap-4 font-vt323 text-xs text-emerald-400">
                  <span>workspace*</span>
                  <span>UTF-8</span>
                </div>
                <div className="flex gap-4 font-vt323 text-xs text-white/40">
                  <span>Ln 9, Col 24</span>
                  <span>C++20</span>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll Hint */}
          <div className="flex items-center gap-3 animate-bounce opacity-40 select-none mt-16">
            <ChevronDown className="w-5 h-5 text-[#FFD400]" />
            <span className="font-vt323 text-base uppercase tracking-widest">
              Scroll down to view platform insights
            </span>
          </div>
        </section>

        {/* ================= PLATFORM INSIGHTS SECTION ================= */}
        <section className="py-24 px-6 relative max-w-6xl mx-auto border-t border-white/5">
          <div className="text-center mb-16 space-y-4">
            <span className="font-vt323 text-[#FFD400] text-lg uppercase tracking-widest">
              // STRUCTURAL_SOLUTIONS
            </span>
            <h3 className="font-press-start text-xl md:text-3xl text-white">
              WHAT IS SHEETSTRIDE?
            </h3>
            <p className="font-sans text-[#A0A0A5] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              We replace standard mindless grinding with deliberate algorithmic curriculum paths.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-black/30 border border-white/5 p-8 rounded-xl backdrop-blur-md hover:border-[#FFD400]/20 transition-all group hover:scale-[1.02] flex flex-col justify-between min-h-[260px]">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[#FFD400]/10 border border-[#FFD400]/20 flex items-center justify-center text-[#FFD400] group-hover:bg-[#FFD400]/20 transition-colors">
                  <Code className="w-6 h-6" />
                </div>
                <h4 className="font-press-start text-sm text-white uppercase group-hover:text-[#FFD400] transition-colors">
                  Pattern-First DSA
                </h4>
                <p className="font-sans text-[#8A8A90] text-sm leading-relaxed">
                  Focus on 15 core curriculum tracks (Converging Pointers, Sliding Window, Graph traversals) mapped cleanly into structural roadmap sheets.
                </p>
              </div>
              <div className="font-vt323 text-xs text-[#FFD400]/40 group-hover:text-[#FFD400]/75 uppercase tracking-widest mt-4">
                [ STRIDE_CORE_ROADMAPS ]
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-black/30 border border-white/5 p-8 rounded-xl backdrop-blur-md hover:border-[#FFD400]/20 transition-all group hover:scale-[1.02] flex flex-col justify-between min-h-[260px]">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[#FFD400]/10 border border-[#FFD400]/20 flex items-center justify-center text-[#FFD400] group-hover:bg-[#FFD400]/20 transition-colors">
                  <Award className="w-6 h-6" />
                </div>
                <h4 className="font-press-start text-sm text-white uppercase group-hover:text-[#FFD400] transition-colors">
                  High-Fidelity HUD
                </h4>
                <p className="font-sans text-[#8A8A90] text-sm leading-relaxed">
                  Track consistency using dark-mode git-style contribution heatmaps, weekly solved bars, and circular topic completion gauges.
                </p>
              </div>
              <div className="font-vt323 text-xs text-[#FFD400]/40 group-hover:text-[#FFD400]/75 uppercase tracking-widest mt-4">
                [ VISUAL_METRICS_DASHBOARD ]
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-black/30 border border-white/5 p-8 rounded-xl backdrop-blur-md hover:border-[#FFD400]/20 transition-all group hover:scale-[1.02] flex flex-col justify-between min-h-[260px]">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-[#FFD400]/10 border border-[#FFD400]/20 flex items-center justify-center text-[#FFD400] group-hover:bg-[#FFD400]/20 transition-colors">
                  <Zap className="w-6 h-6" />
                </div>
                <h4 className="font-press-start text-sm text-white uppercase group-hover:text-[#FFD400] transition-colors">
                  Revision Engine
                </h4>
                <p className="font-sans text-[#8A8A90] text-sm leading-relaxed">
                  Solidify algorithmic layouts with automated spaced repetition multiplier algorithms, study diaries, and timeline study logs.
                </p>
              </div>
              <div className="font-vt323 text-xs text-[#FFD400]/40 group-hover:text-[#FFD400]/75 uppercase tracking-widest mt-4">
                [ COGNITIVE_REVISION_QUEUE ]
              </div>
            </div>
          </div>
        </section>

        {/* ================= SOCIAL & CHEER SECTION ================= */}
        <section className="py-20 px-6 relative max-w-4xl mx-auto border-t border-white/5 text-center space-y-12">
          <div className="space-y-4">
            <span className="font-vt323 text-[#FFD400] text-lg uppercase tracking-widest animate-pulse">
              // CONNECT_WITH_DEVELOPERS
            </span>
            <h3 className="font-press-start text-xl md:text-2xl text-white">
              JOIN THE ENGINE NETWORK
            </h3>
            <p className="font-sans text-[#8A8A90] text-sm md:text-base leading-relaxed max-w-md mx-auto">
              Follow our developments, connect with core maintainers, or support the project with a coffee.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
            {/* Buy Me a Coffee */}
            <a
              href="https://buymeacoffee.com/sheetstride"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 border border-[#FFD400]/20 hover:border-[#FFD400] bg-[#FFD400]/5 hover:bg-[#FFD400]/10 text-[#FFD400] rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 group font-sans text-sm font-semibold tracking-wide"
            >
              <Coffee className="w-5 h-5 transition-transform group-hover:rotate-12" />
              <span>Buy me a Coffee</span>
            </a>

            {/* LinkedIn */}
            <a
              href="https://linkedin.com/in/itsakshatsinghh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 border border-white/5 hover:border-white/20 bg-white/2 hover:bg-white/5 text-white/80 hover:text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 group font-sans text-sm font-semibold tracking-wide"
            >
              <Linkedin className="w-5 h-5" />
              <span>Connect on LinkedIn</span>
            </a>

            {/* Instagram */}
            <a
              href="https://instagram.com/itsakshatsinghh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-6 py-3 border border-white/5 hover:border-white/20 bg-white/2 hover:bg-white/5 text-white/80 hover:text-white rounded-xl transition-all duration-300 hover:scale-105 active:scale-95 group font-sans text-sm font-semibold tracking-wide"
            >
              <Instagram className="w-5 h-5" />
              <span>Follow on Instagram</span>
            </a>
          </div>
        </section>

        {/* Minimal Footer */}
        <footer className="w-full py-12 px-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-white/20 text-xs font-vt323 tracking-wider select-none relative z-10">
          <div>© 2026 SHEETSTRIDE SYSTEMS // ALL RIGHTS RESERVED</div>
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
      </main>
    </div>
  );
}
