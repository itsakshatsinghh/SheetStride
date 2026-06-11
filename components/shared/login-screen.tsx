"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Pacman } from "@/components/shared/pacman";

export function LoginScreen() {
  const { loginWithGoogle, loginWithGithub, loginWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleGoogle = async () => {
    try {
      setStatus("loading");
      await loginWithGoogle();
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to log in with Google.");
    }
  };

  const handleGithub = async () => {
    try {
      setStatus("loading");
      await loginWithGithub();
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to log in with GitHub.");
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      setStatus("loading");
      await loginWithEmail(email);
      setStatus("success");
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message || "Failed to send magic link.");
    }
  };

  // Background dynamic log simulations for retro-terminal aesthetics
  const [bgLogs, setBgLogs] = useState<string[]>([
    "GET /api/v2.0.0/auth/status 200",
    "Pinging sheetstride-db-01... CONNECTED",
    "Initializing OAuth Handshake...",
    "Loading user_profile_metadata...",
    "Checking DSA_PROGRESS_SNAPSHOT...",
    "Ready for user input."
  ]);

  useEffect(() => {
    const logsPool = [
      "GET /api/v2.0.0/auth/status 200",
      "Pinging sheetstride-db-01... CONNECTED",
      "Initializing OAuth Handshake...",
      "Loading user_profile_metadata...",
      "Checking DSA_PROGRESS_SNAPSHOT...",
      "Ready for user input.",
      "SECURE_GATEWAY_UPTIME: 99.998%",
      "NODES_ACTIVE: 1024",
      "ENCRYPTION: AES-256-GCM [OK]"
    ];

    const timer = setInterval(() => {
      setBgLogs(prev => {
        const nextLog = logsPool[Math.floor(Math.random() * logsPool.length)];
        const updated = [...prev.slice(1), nextLog];
        return updated;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative min-h-screen bg-[#080808] text-on-background flex items-center justify-center terminal-grid overflow-hidden">
      {/* Decorative scanline */}
      <div className="scanline" />

      {/* Decorative Terminal Text (Top Left) */}
      <div className="absolute top-10 left-10 opacity-10 font-mono-label text-mono-label pointer-events-none select-none hidden lg:block text-left">
        <p>STRIDE_OS [Version 2.0.0-STABLE]</p>
        <p>CONNECTING TO DSA_CORE_CLUSTER...</p>
        <p>HANDSHAKE: [OK]</p>
        {bgLogs.map((log, i) => (
          <p key={i} className="opacity-80 font-mono-label">&gt; {log}</p>
        ))}
      </div>

      {/* Decorative Terminal Text (Bottom Right) */}
      <div className="absolute bottom-16 right-10 opacity-10 font-mono-label text-mono-label text-right pointer-events-none select-none hidden lg:block">
        <p>NODES_ACTIVE: 1024</p>
        <p>UPTIME: 99.998%</p>
        <p>SYS_BUILD: 2.0.0.STABLE</p>
      </div>

      {/* Main Authentication Container */}
      <main className="z-20 w-full max-w-[440px] px-margin-mobile md:px-0">
        <div className="glass-card p-stack-lg rounded-xl flex flex-col items-center space-y-stack-lg border-primary/20 bg-[#1C1C1C]/90 backdrop-blur-md">
          
          {/* Brand Header */}
          <div className="text-center space-y-stack-sm w-full">
            <h1 className="font-display-arcade text-[24px] md:text-[32px] text-primary tracking-tighter uppercase mb-4 select-none glitch-hover">
              SHEETSTRIDE
            </h1>
            <div className="inline-block h-6">
              <p className="font-mono-label text-on-surface-variant uppercase tracking-widest text-[10px] md:text-[12px] typewriter">
                INITIALIZE YOUR STRIDE
              </p>
            </div>
          </div>

          {/* Error message displays */}
          {status === "error" && (
            <div className="w-full border border-danger/30 bg-danger/10 p-3 rounded text-left font-mono-label text-xs text-danger">
              ERR: {errorMsg}
            </div>
          )}

          {/* Form Actions Deck */}
          <div className="w-full space-y-4">
            {/* GitHub Button */}
            <button 
              onClick={handleGithub}
              disabled={status === "loading"}
              className="w-full bg-primary hover:bg-primary-strong text-background py-3.5 rounded-lg font-headline-md flex items-center justify-center space-x-3 group overflow-hidden relative transition-all duration-300 hover:shadow-[0_0_20px_rgba(124,184,255,0.4)] disabled:opacity-50 font-bold"
            >
              <span className="font-headline-md uppercase tracking-wider">CONTINUE WITH GITHUB</span>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </button>

            {/* Google Button */}
            <button 
              onClick={handleGoogle}
              disabled={status === "loading"}
              className="w-full border border-outline-variant/30 hover:bg-surface-variant/20 text-on-surface transition-all py-3.5 rounded-lg flex items-center justify-center space-x-3 font-body-lg disabled:opacity-50 font-bold"
            >
              <span className="font-body-lg uppercase tracking-wider">Continue with Google</span>
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.355-2.845-6.355-6.355s2.845-6.355 6.355-6.355c1.61 0 3.08.597 4.22 1.59l3.05-3.05C19.1 2.378 15.89 1 12.24 1 5.756 1 .5 6.256.5 12.74S5.756 24.48 12.24 24.48c6.485 0 11.74-5.255 11.74-11.74 0-.82-.075-1.62-.215-2.455H12.24z"/>
              </svg>
            </button>
          </div>

          {/* Footer Meta */}
          <div className="pt-stack-md w-full border-t border-outline-variant/10 flex flex-col items-center space-y-2">
            <p className="font-mono-label text-outline text-[11px] uppercase opacity-60">
              Auth Status: <span className={status === "loading" ? "text-tertiary" : "text-secondary"}>{status === "loading" ? "INITIALIZING" : "READY"}</span>
            </p>
            <div className="flex space-x-4">
              <a className="font-mono-label text-[10px] text-outline hover:text-primary transition-colors uppercase" href="#">System Specs</a>
              <a className="font-mono-label text-[10px] text-outline hover:text-primary transition-colors uppercase" href="#">Security Protocols</a>
            </div>
          </div>
        </div>

        {/* System build metadata footnote */}
        <p className="mt-8 text-center font-mono-label text-outline/30 text-[10px] uppercase tracking-tighter">
          System build 2.0.0.stable // Access restricted to verified developers
        </p>
      </main>

      {/* Signature Visual Element: Looping Pac-Man at the bottom */}
      <div className="absolute bottom-6 left-0 w-full z-30">
        <Pacman mode="login" />
      </div>

      {/* Decorative Gradients */}
      <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-secondary/30 to-transparent"></div>
    </div>
  );
}
