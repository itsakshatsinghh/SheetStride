"use client";

import { useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, RotateCcw, Cpu } from "lucide-react";
import { cn } from "@/lib/utils";

interface VisualizationStep {
  action: string;
  description: string;
  state: Record<string, any>;
}

interface VisualizationMetadata {
  type: "array-pointers" | "linkedlist-cycle" | "tree-traversal" | "heap-relations" | "custom";
  initial_state: Record<string, any>;
  animation_steps: VisualizationStep[];
}

export function PatternVisualizer({
  metadata,
}: {
  metadata: VisualizationMetadata;
}) {
  const steps = metadata?.animation_steps || [];
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying || steps.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % steps.length);
    }, 2000);

    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  if (steps.length === 0) {
    return (
      <div className="text-center py-6 text-outline/50 font-mono text-xs">
        NO VISUALIZATION DATA DEFINED
      </div>
    );
  }

  const activeStep = steps[currentFrame];
  const totalFrames = steps.length;

  const handlePrev = () => {
    setIsPlaying(false);
    setCurrentFrame((prev) => (prev - 1 + totalFrames) % totalFrames);
  };

  const handleNext = () => {
    setIsPlaying(false);
    setCurrentFrame((prev) => (prev + 1) % totalFrames);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentFrame(0);
  };

  // Rendering Helper: Array Pointers
  const renderArrayPointers = () => {
    const array = metadata.initial_state?.array || [1, 3, 2, 6, -1, 4];
    const left = activeStep.state.left !== undefined ? activeStep.state.left : -1;
    const right = activeStep.state.right !== undefined ? activeStep.state.right : -1;

    return (
      <div className="space-y-6 py-4">
        {/* Array grid */}
        <div className="flex justify-center items-center gap-2">
          {array.map((val: number, idx: number) => {
            const inRange = idx >= left && idx <= right && left !== -1 && right !== -1;
            return (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-12 h-12 border rounded-lg flex items-center justify-center font-mono font-bold text-sm transition-all duration-300",
                    inRange
                      ? "border-primary bg-primary/10 text-primary shadow-[0_0_15px_rgba(255,212,0,0.15)]"
                      : "border-outline-variant/30 bg-[#090909] text-outline/80"
                  )}
                >
                  {val}
                </div>
                <div className="text-[10px] text-outline/40 font-mono mt-1">[{idx}]</div>
              </div>
            );
          })}
        </div>

        {/* Pointers mapping overlay */}
        <div className="flex justify-center gap-10 font-mono text-xs border-t border-outline-variant/10 pt-3">
          {left !== -1 && (
            <div className="flex items-center gap-1.5 text-secondary">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary block" />
              <span>Left Pointer: index {left}</span>
            </div>
          )}
          {right !== -1 && (
            <div className="flex items-center gap-1.5 text-primary">
              <span className="w-2.5 h-2.5 rounded-full bg-primary block" />
              <span>Right Pointer: index {right}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Rendering Helper: LinkedList Cycle
  const renderLinkedListCycle = () => {
    const nodes = metadata.initial_state?.nodes || [3, 2, 0, -4];
    const slow = activeStep.state.slow !== undefined ? activeStep.state.slow : -1;
    const fast = activeStep.state.fast !== undefined ? activeStep.state.fast : -1;

    return (
      <div className="space-y-6 py-4">
        <div className="flex justify-center items-center gap-3">
          {nodes.map((val: number, idx: number) => {
            const isSlow = idx === slow;
            const isFast = idx === fast;

            return (
              <div key={idx} className="flex items-center gap-1">
                {/* Node circle */}
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      "w-12 h-12 rounded-full border-2 flex items-center justify-center font-mono text-xs font-bold transition-all duration-300 relative",
                      isSlow && isFast && "border-primary bg-primary/5 text-primary shadow-[0_0_15px_rgba(255,212,0,0.15)]",
                      isSlow && !isFast && "border-secondary bg-secondary/5 text-secondary shadow-[0_0_15px_rgba(255,100,0,0.15)]",
                      isFast && !isSlow && "border-primary-strong bg-primary-strong/5 text-primary-strong",
                      !isSlow && !isFast && "border-outline-variant/30 bg-[#090909] text-outline/80"
                    )}
                  >
                    {val}
                    
                    {/* Pointers tags inside node bubble */}
                    <div className="absolute -top-6 flex gap-1 font-mono text-[9px] uppercase tracking-wide">
                      {isSlow && <span className="text-secondary bg-secondary/10 px-1 border border-secondary/20 rounded">SLOW</span>}
                      {isFast && <span className="text-primary bg-primary/10 px-1 border border-primary/20 rounded">FAST</span>}
                    </div>
                  </div>
                </div>

                {/* Arrow connector */}
                {idx < nodes.length - 1 && (
                  <span className="text-outline-variant/40 font-mono text-sm select-none">→</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Rendering Helper: Tree Traversal
  const renderTreeTraversal = () => {
    const active = activeStep.state.active !== undefined ? activeStep.state.active : null;

    return (
      <div className="space-y-4 py-4 flex flex-col items-center">
        {/* Simple visual hierarchical node grid */}
        <div className="space-y-5 flex flex-col items-center">
          <div
            className={cn(
              "w-10 h-10 rounded-full border flex items-center justify-center font-mono text-xs font-bold",
              active === 1 ? "border-primary bg-primary/15 text-primary" : "border-outline-variant/30 bg-[#090909] text-outline/70"
            )}
          >
            1
          </div>
          <div className="flex gap-10">
            <div
              className={cn(
                "w-10 h-10 rounded-full border flex items-center justify-center font-mono text-xs font-bold",
                active === 2 ? "border-primary bg-primary/15 text-primary" : "border-outline-variant/30 bg-[#090909] text-outline/70"
              )}
            >
              2
            </div>
            <div
              className={cn(
                "w-10 h-10 rounded-full border flex items-center justify-center font-mono text-xs font-bold",
                active === 3 ? "border-primary bg-primary/15 text-primary" : "border-outline-variant/30 bg-[#090909] text-outline/70"
              )}
            >
              3
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Rendering Helper: Heap Relations
  const renderHeapRelations = () => {
    const val = activeStep.state.active_val !== undefined ? activeStep.state.active_val : "-";
    return (
      <div className="space-y-4 py-6 flex flex-col items-center">
        <div className="flex gap-6 items-center">
          <div className="border border-outline-variant/20 bg-[#0A0A0A] p-4 rounded-xl text-center w-28">
            <span className="block font-mono text-[9px] text-outline/50 uppercase tracking-wider mb-2">MAX HEAP</span>
            <div className="h-10 flex items-center justify-center border border-dashed border-outline-variant/30 rounded font-mono text-xs">
              {val}
            </div>
          </div>
          <div className="text-outline/40 font-mono text-sm">⇄</div>
          <div className="border border-outline-variant/20 bg-[#0A0A0A] p-4 rounded-xl text-center w-28">
            <span className="block font-mono text-[9px] text-outline/50 uppercase tracking-wider mb-2">MIN HEAP</span>
            <div className="h-10 flex items-center justify-center border border-dashed border-outline-variant/30 rounded font-mono text-xs">
              {val}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="border border-outline-variant/25 bg-[#111111]/90 rounded-xl p-5 backdrop-blur-md space-y-4">
      {/* Visual Header */}
      <div className="flex justify-between items-center border-b border-outline-variant/20 pb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-primary" />
          <h3 className="font-mono text-xs uppercase text-text tracking-wider">Visualization Playground</h3>
        </div>
        <span className="font-mono text-[10px] text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded uppercase">
          {metadata.type}
        </span>
      </div>

      {/* Render Active Area */}
      <div className="min-h-[120px] flex items-center justify-center border border-outline-variant/10 rounded-lg bg-[#090909]/40 relative overflow-hidden">
        {metadata.type === "array-pointers" && renderArrayPointers()}
        {metadata.type === "linkedlist-cycle" && renderLinkedListCycle()}
        {metadata.type === "tree-traversal" && renderTreeTraversal()}
        {metadata.type === "heap-relations" && renderHeapRelations()}
        {metadata.type === "custom" && (
          <div className="font-mono text-xs text-outline/60 uppercase tracking-wider">Custom Layout Canvas</div>
        )}
      </div>

      {/* Traversal State HUD */}
      <div className="border border-outline-variant/25 p-3 rounded-lg bg-[#070707] space-y-1.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.8)]">
        <div className="flex justify-between items-center text-[10px] font-mono uppercase text-primary tracking-wider">
          <span>FRAME: {currentFrame + 1} / {totalFrames}</span>
          <span className="text-secondary font-bold">{activeStep.action}</span>
        </div>
        <p className="font-mono text-xs text-text/95 leading-relaxed">
          {activeStep.description}
        </p>
      </div>

      {/* Playback HUD Controls */}
      <div className="flex items-center justify-between gap-4 pt-1 select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="p-1.5 border border-outline-variant/20 hover:border-outline bg-surface-container rounded hover:text-text cursor-pointer transition-colors text-outline"
            title="Previous Frame"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 border border-primary/20 hover:border-primary bg-primary/5 rounded hover:text-primary cursor-pointer transition-all text-text shadow-[0_0_8px_rgba(255,212,0,0.05)]"
            title={isPlaying ? "Pause Autoplay" : "Start Autoplay"}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5 text-primary" /> : <Play className="h-3.5 w-3.5 text-text" />}
          </button>

          <button
            onClick={handleNext}
            className="p-1.5 border border-outline-variant/20 hover:border-outline bg-surface-container rounded hover:text-text cursor-pointer transition-colors text-outline"
            title="Next Frame"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>

          <button
            onClick={handleReset}
            className="p-1.5 border border-outline-variant/20 hover:border-outline bg-surface-container rounded hover:text-text cursor-pointer transition-colors text-outline"
            title="Reset Simulation"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Range Frame Slider */}
        <input
          type="range"
          min="0"
          max={totalFrames - 1}
          value={currentFrame}
          onChange={(e) => {
            setIsPlaying(false);
            setCurrentFrame(parseInt(e.target.value));
          }}
          className="flex-1 max-w-[140px] h-1 bg-[#1A1A1A] rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>
    </div>
  );
}
