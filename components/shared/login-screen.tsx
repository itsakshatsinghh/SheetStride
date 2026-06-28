"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Pacman } from "@/components/shared/pacman";
import PixelSnow from "@/components/ui/pixel-snow";

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
    <div className="relative min-h-screen bg-[#000000] text-white flex items-center justify-center overflow-hidden font-sans selection:bg-[#FFD400] selection:text-black">
      
      {/* Dynamic WebGL Pixelated Falling Snow Background */}
      <div className="fixed inset-0 z-0 opacity-[0.45] pointer-events-none overflow-hidden">
        <PixelSnow 
          className="w-full h-full"
          color="#FFD400"
          flakeSize={0.015}
          minFlakeSize={1.5}
          pixelResolution={160}
          speed={0.9}
          density={0.25}
          direction={135}
          brightness={1}
        />
        {/* Dark radial center focus overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#000000_90%)]" />
      </div>

      {/* Decorative scanline overlay */}
      <div className="scanline" />

      {/* Main Authentication Card */}
      <main className="z-10 w-full max-w-[420px] px-6">
        <div className="border border-[#FFD400]/20 bg-[#0A0A0A]/85 backdrop-blur-[16px] p-8 rounded-2xl flex flex-col items-center space-y-8 shadow-[0_0_50px_rgba(255,212,0,0.08)] relative overflow-hidden transition-all duration-300 hover:border-[#FFD400]/40 hover:shadow-[0_0_60px_rgba(255,212,0,0.15)]">
          {/* Neon Top Accent Bar */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FFD400] to-transparent animate-pulse" />
          
          {/* Brand Header */}
          <div className="text-center space-y-3 w-full">
            <span className="font-vt323 text-[#FFD400] text-lg tracking-[0.25em] bg-[#FFD400]/10 px-3 py-1 border border-[#FFD400]/20 rounded-md">
              [ SECURE_ACCESS ]
            </span>
            <h1 className="font-press-start text-xl md:text-2xl text-white tracking-tighter uppercase pt-2 select-none">
              SHEETSTRIDE
            </h1>
            <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest typewriter">
              INITIALIZE DECRYPTION KEYS
            </p>
          </div>

          {/* Error Message logs */}
          {status === "error" && (
            <div className="w-full border border-red-500/30 bg-red-500/10 p-3 rounded text-left font-mono text-xs text-red-400">
              ERR: {errorMsg}
            </div>
          )}

          {/* Form Actions Deck */}
          <div className="w-full space-y-4">
            
            {/* GitHub Button */}
            <button 
              onClick={handleGithub}
              disabled={status === "loading"}
              className="w-full bg-[#FFD400] hover:bg-[#FFE14D] text-black py-4 rounded-lg font-bold flex items-center justify-center space-x-3 transition-all duration-300 hover:shadow-[0_0_20px_rgba(255,212,0,0.35)] disabled:opacity-50 text-xs uppercase tracking-widest cursor-pointer"
            >
              <span>Continue with GitHub</span>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
            </button>

            {/* Google Button */}
            <button 
              onClick={handleGoogle}
              disabled={status === "loading"}
              className="w-full border border-white/10 hover:bg-white/5 text-white py-4 rounded-lg font-bold flex items-center justify-center space-x-3 transition-all duration-300 disabled:opacity-50 text-xs uppercase tracking-widest cursor-pointer"
            >
              <span>Continue with Google</span>
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.51 0-6.355-2.845-6.355-6.355s2.845-6.355 6.355-6.355c1.61 0 3.08.597 4.22 1.59l3.05-3.05C19.1 2.378 15.89 1 12.24 1 5.756 1 .5 6.256.5 12.74S5.756 24.48 12.24 24.48c6.485 0 11.74-5.255 11.74-11.74 0-.82-.075-1.62-.215-2.455H12.24z"/>
              </svg>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
