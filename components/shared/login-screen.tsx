"use client";

import { useEffect, useRef } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function GoogleIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
      <path
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.36-2.08 4.44-1.28 1.2-3.12 2.16-5.76 2.16-4.68 0-8.52-3.8-8.52-8.48s3.84-8.48 8.52-8.48c2.52 0 4.44.96 5.84 2.32l2.32-2.32C18.6 1.84 15.88 0 12.48 0 5.6 0 0 5.6 0 12.48s5.6 12.48 12.48 12.48c3.76 0 6.6-1.24 8.76-3.52 2.24-2.24 2.96-5.36 2.96-7.88 0-.56-.04-1.08-.12-1.64h-11.6z"
        fill="#EA4335"
      />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.49 11.49 0 0 1 12 5.8c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.798 24 17.301 24 12 24 5.373 18.627 0 12 0Z" />
    </svg>
  );
}

function LoginButtons() {
  const baseButton =
    "group h-12 w-full justify-start gap-4 border border-outline bg-surface px-4 text-body-lg font-bold hover:border-primary-strong hover:bg-surface-high";

  return (
    <div className="space-y-3">
      <Button className={baseButton}>
        <GoogleIcon />
        <span>Continue with Google</span>
        <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
      </Button>
      <Button className={baseButton}>
        <GithubIcon />
        <span>Continue with GitHub</span>
        <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
      </Button>
      <div className="flex items-center gap-4 py-2">
        <div className="h-px flex-1 bg-outline" />
        <span className="text-label-caps text-muted">OR</span>
        <div className="h-px flex-1 bg-outline" />
      </div>
      <Button className={baseButton}>
        <Mail className="h-5 w-5 text-muted" />
        <span>Continue with Email</span>
        <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
      </Button>
    </div>
  );
}

function LoginRightPanel() {
  const items = [
    {
      title: "Track Progress",
      text: "Visualize your DSA journey with detailed logs and time-complexity breakdowns.",
      color: "text-secondary border-secondary"
    },
    {
      title: "Build Streaks",
      text: "Gamify your learning process. Don't break the chain of consistent problem solving.",
      color: "text-primary border-primary"
    },
    {
      title: "Master DSA",
      text: "Optimized paths for top-tier algorithms. From Big O to Dynamic Programming.",
      color: "text-tertiary border-tertiary"
    }
  ];

  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-surface p-6 md:flex md:p-12">
      <div className="absolute bottom-0 right-0 p-2 opacity-20 rotate-12">
        <span className="font-display text-[120px] text-primary opacity-5">S_</span>
      </div>
      <div className="relative z-10 space-y-12">
        <div className="space-y-8">
          {items.map((item) => (
            <div key={item.title} className="flex items-start gap-6">
              <div className={cn("flex h-12 w-12 items-center justify-center border bg-[#282A2C]", item.color)}>
                <div className="h-5 w-5 border border-current" />
              </div>
              <div>
                <h3 className={cn("font-body text-headline-sm mb-2", item.color.split(" ")[0])}>
                  {item.title}
                </h3>
                <p className="max-w-[420px] text-body-lg leading-10 text-muted">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="relative z-10 mt-12 border-t border-outline pt-6">
        <div className="border-l-4 border-secondary bg-[#323537] px-6 py-5">
          <p className="font-data text-data-md leading-none text-secondary">SYSTEM_READY</p>
          <p className="mt-2 text-body-lg text-muted">Connection established via secure protocols.</p>
        </div>
      </div>
    </div>
  );
}

function MatrixBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrame = 0;
    const fontSize = 16;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>[]{}/\\|+=*&^%$#@!~".split("");
    let columns = 0;
    let drops: number[] = [];
    let speeds: number[] = [];

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.floor(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => Math.random() * -canvas.height);
      speeds = Array.from({ length: columns }, () => 1 + Math.random() * 2);
    };

    const draw = () => {
      ctx.fillStyle = "rgba(11, 11, 11, 0.15)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#2A2A2A";
      ctx.font = `${fontSize}px JetBrains Mono`;
      for (let index = 0; index < drops.length; index += 1) {
        const text = chars[Math.floor(Math.random() * chars.length)];
        ctx.fillText(text, index * fontSize, drops[index] * fontSize);
        if (drops[index] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[index] = 0;
        }
        drops[index] += speeds[index] * 0.2;
      }
      animationFrame = window.requestAnimationFrame(draw);
    };

    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("resize", init);
      window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-[1] pointer-events-none" />;
}

export function LoginScreen({ variant = "default" }: { variant?: "default" | "matrix" }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-text">
      {variant === "matrix" ? <MatrixBackground /> : null}
      <div className="fixed inset-0 z-[2] pointer-events-none">
        <div className={cn("absolute inset-0 code-grid", variant === "matrix" ? "opacity-20" : "opacity-40")} />
        <div className={cn("scanline", variant === "matrix" ? "bg-primary/5" : "bg-primary/10")} />
        <div className="absolute inset-0 flex flex-wrap gap-12 overflow-hidden p-12 text-primary opacity-5">
          {[
            "function solve(dsa) { return progress++; }",
            "const streak = 100; // Mastery achieved",
            "while(learning) { stride(); }",
            'git commit -m "another day, another problem"',
            "01100110 01100111 01101000",
            "struct Node { int val; Node *next; };",
            "SELECT * FROM growth WHERE status = 'active';",
            "npm install confidence"
          ].map((line) => (
            <div key={line} className="whitespace-pre text-body-md">
              {line}
            </div>
          ))}
        </div>
      </div>
      <main className="relative z-10 flex min-h-screen items-center justify-center p-margin-mobile md:p-margin-desktop">
        <div
          className={cn(
            "grid w-full max-w-[1000px] overflow-hidden border border-outline md:grid-cols-2",
            variant === "matrix"
              ? "bg-[#191c1ef2] shadow-[0_0_50px_rgba(0,0,0,0.5)] backdrop-blur-sm"
              : "bg-[#191c1e] shadow-2xl"
          )}
        >
          <div className="flex flex-col justify-center border-b border-outline p-6 md:border-b-0 md:border-r md:p-12">
            <div className="mb-12">
              <h1 className="flex items-center font-display text-headline-lg text-primary">
                SHEETSTRIDE_
                <span className="ml-1 block h-5 w-3 bg-primary animate-blink" />
              </h1>
              <p className="mt-4 border-l-2 border-primary-strong pl-4 text-body-lg italic text-muted">
                "Every solved problem is a step forward."
              </p>
            </div>
            <LoginButtons />
            <div className="mt-12 text-center text-body-lg text-muted">
              New here? <span className="text-primary">Initialize profile_</span>
            </div>
          </div>
          <LoginRightPanel />
        </div>
      </main>
      <footer className="fixed bottom-0 z-20 w-full p-4 text-center">
        <p className="text-label-caps uppercase tracking-[0.2em] text-muted/40">
          v1.0.4-stable // sheets_stride_engine_v3
        </p>
      </footer>
    </div>
  );
}
