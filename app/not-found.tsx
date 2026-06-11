"use client";

import Link from "next/link";
import { useState } from "react";
import { Pacman } from "@/components/shared/pacman";
import { cn } from "@/lib/utils";

export default function NotFound() {
  const [showError, setShowError] = useState(false);
  const [diagnosticsRunning, setDiagnosticsRunning] = useState(false);
  const [progressState, setProgressState] = useState("idle"); // idle | loading | done

  const handleRunDiagnostics = () => {
    setDiagnosticsRunning(true);
    setProgressState("loading");
    setTimeout(() => {
      setProgressState("done");
      setShowError(true);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-between terminal-grid relative select-none font-sans overflow-x-hidden">
      {/* Scanline overlay */}
      <div className="scanline" />

      {/* Main Container */}
      <main className="flex-grow flex flex-col items-center justify-center relative px-gutter pt-12">
        
        {/* Loading Screen Overlay when rebooting or running diagnostics */}
        {progressState === "loading" && (
          <div className="w-full max-w-container-max mx-auto py-stack-lg flex flex-col items-center">
            <div className="w-full max-w-xl mb-6">
              <Pacman mode="loading" duration={2} />
            </div>
            <p className="font-mono-label text-mono-label text-primary animate-pulse uppercase tracking-[0.2em] text-center">
              DECRYPTING_DATA_STRUCTURES_NODE...
            </p>
          </div>
        )}

        {/* 404 Section */}
        {progressState !== "loading" && (
          <section className="w-full max-w-2xl flex flex-col items-center text-center space-y-8 py-stack-lg z-10">
            <div className="relative group">
              <h1 
                className="font-display-arcade text-[80px] md:text-[120px] text-primary glitch-text select-none leading-none" 
                data-text="404"
              >
                404
              </h1>
              <div className="absolute -bottom-6 left-0 right-0 h-1 flex justify-center">
                <span className="w-2 h-2 rounded bg-tertiary block animate-ping" />
              </div>
            </div>

            <div className="space-y-stack-sm mt-8">
              <p className="font-mono-label text-mono-label text-secondary uppercase tracking-widest text-sm">
                STATUS_CODE: 404
              </p>
              <h2 className="font-headline-lg text-headline-lg uppercase text-on-surface">
                PAGE_NOT_FOUND
              </h2>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mx-auto leading-relaxed">
                The requested data segment is corrupted or has been relocated to an unreachable memory address.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-stack-md pt-stack-md justify-center w-full max-w-md mx-auto">
              <Link href="/dashboard" className="w-full">
                <button className="w-full px-8 py-3 bg-primary text-[#001c37] font-mono-label font-bold uppercase tracking-wider rounded-lg transition-all hover:shadow-[0_0_20px_rgba(178,210,255,0.4)] active:scale-95 duration-200">
                  Reboot System
                </button>
              </Link>
              <button 
                onClick={handleRunDiagnostics}
                className="w-full px-8 py-3 border border-outline-variant text-on-surface-variant font-mono-label font-semibold uppercase tracking-wider rounded-lg hover:bg-surface-variant/20 transition-all duration-200 active:scale-95"
              >
                Run Diagnostics
              </button>
            </div>
          </section>
        )}

        {/* Critical Failure Diagnostics Overlay Modal */}
        {showError && (
          <section className="fixed inset-0 z-[100] flex items-center justify-center p-gutter bg-background/85 backdrop-blur-sm">
            <div className="w-full max-w-xl bg-[#1C1C1C] border border-error/40 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
              <div className="bg-error/10 border-b border-error/30 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-error">
                  <span className="material-symbols-outlined text-[20px]">report</span>
                  <span className="font-display-arcade text-xs tracking-wider">SYSTEM_FAILURE</span>
                </div>
                <button 
                  onClick={() => {
                    setShowError(false);
                    setProgressState("idle");
                  }} 
                  className="text-on-surface-variant hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px] font-bold block">close</span>
                </button>
              </div>
              <div className="p-6 space-y-stack-md">
                <div className="bg-[#080808] p-4 border border-outline-variant/35 rounded font-mono-label text-mono-label overflow-x-auto text-on-surface-variant leading-relaxed text-xs">
                  <p className="text-error font-bold mb-2">[CRITICAL_KERNEL_ERROR]</p>
                  <p>&gt; Timestamp: <span className="text-on-surface">{new Date().toISOString()}</span></p>
                  <p>&gt; Module: <span className="text-on-surface">DATA_ORCHESTRATOR_V3</span></p>
                  <p>&gt; Trace ID: <span className="text-on-surface">0x7FFD-STRIDE-0021</span></p>
                  <p className="mt-4 text-error font-bold">&gt; SIGSEGV: Segmentation fault at address 0x00000000</p>
                  <p>&gt; Connection timed out after 30000ms</p>
                  <p className="mt-2 text-secondary">&gt; Auto-recovery protocol: <span className="animate-pulse font-bold">INITIALIZING...</span></p>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                  Our servers encountered an unexpected exception while processing your DSA progress. Engineers have been notified.
                </p>
                <div className="flex justify-end gap-stack-sm pt-4 border-t border-[#2B2B2B]">
                  <button 
                    className="px-6 py-2 border border-outline-variant text-on-surface-variant font-mono-label text-xs uppercase rounded hover:bg-surface-variant/20 transition-all active:scale-95" 
                    onClick={() => {
                      setShowError(false);
                      setProgressState("idle");
                    }}
                  >
                    Dismiss
                  </button>
                  <button 
                    className="px-6 py-2 bg-error text-on-error font-mono-label text-xs font-bold uppercase rounded hover:shadow-[0_0_15px_rgba(255,180,171,0.3)] transition-all active:scale-95" 
                    onClick={() => window.location.reload()}
                  >
                    Force Reset
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-outline-variant/20 bg-background w-full py-stack-md z-10 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-center px-gutter max-w-container-max mx-auto gap-4">
          <div className="font-display-arcade text-display-arcade text-primary uppercase text-xs">
            SHEETSTRIDE v2.0.0-STABLE
          </div>
          <div className="flex gap-stack-lg">
            <a className="font-mono-label text-mono-label uppercase text-outline hover:text-primary transition-colors duration-200" href="#">System Status</a>
            <a className="font-mono-label text-mono-label uppercase text-outline hover:text-primary transition-colors duration-200" href="#">API Docs</a>
            <a className="font-mono-label text-mono-label uppercase text-outline hover:text-primary transition-colors duration-200" href="#">Changelog</a>
          </div>
          <div className="font-mono-label text-mono-label uppercase text-secondary text-xs">
            © 2026 TERMINAL_CMD
          </div>
        </div>
      </footer>
    </div>
  );
}
