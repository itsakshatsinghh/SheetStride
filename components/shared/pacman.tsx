"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface PacmanProps {
  mode: "login" | "loading" | "milestone";
  duration?: number;
}

export function Pacman({ mode, duration }: PacmanProps) {
  const [eatenDots, setEatenDots] = useState<number[]>([]);

  // Number of dots
  const numDots = mode === "login" ? 16 : 8;
  const animDuration = duration || (mode === "login" ? 12 : mode === "milestone" ? 1.8 : 2.5);

  useEffect(() => {
    // Loop: Reset eaten dots when the Pacman animation loop restarts
    const dotDisappearInterval = (animDuration * 1000) / numDots;
    const timers: NodeJS.Timeout[] = [];
    
    const startEating = () => {
      setEatenDots([]);
      for (let i = 0; i < numDots; i++) {
        const t = setTimeout(() => {
          setEatenDots(prev => [...prev, i]);
        }, dotDisappearInterval * i + (mode === "login" ? 150 : 80));
        timers.push(t);
      }
    };

    startEating();
    
    // Repeat loop timing
    const loopTimer = setInterval(() => {
      startEating();
    }, animDuration * 1000 + (mode === "login" ? 1000 : 0));

    return () => {
      clearInterval(loopTimer);
      timers.forEach(clearTimeout);
    };
  }, [mode, animDuration, numDots]);

  if (mode === "login") {
    return (
      <div className="relative w-full h-12 flex items-center justify-between border-y border-primary/20 bg-[#0f0f0f]/90 backdrop-blur px-8 select-none overflow-hidden">
        {/* Pac-Man Dots Track */}
        <div className="absolute inset-x-8 flex justify-between items-center z-10 w-[95%]">
          {Array.from({ length: numDots }).map((_, i) => {
            const isEaten = eatenDots.includes(i);
            return (
              <motion.div
                key={i}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={isEaten ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 0.8 }}
                transition={{ duration: 0.15 }}
                className="w-2.5 h-2.5 bg-tertiary rounded-full"
              />
            );
          })}
        </div>

        {/* Walking Pacman */}
        <motion.div
          initial={{ left: "-30px" }}
          animate={{ left: "105%" }}
          transition={{
            duration: animDuration,
            ease: "linear",
            repeat: Infinity,
            repeatDelay: 1
          }}
          className="absolute w-5 h-5 bg-tertiary rounded-full flex items-center justify-center z-20"
        >
          {/* Animated chomper mouth inside Pacman */}
          <div 
            className="w-full h-full bg-[#f9cb13] rounded-full relative overflow-hidden" 
            style={{
              clipPath: "polygon(100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 50%)"
            }}
          >
            <motion.div
              animate={{
                clipPath: [
                  "polygon(100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 50%)",
                  "polygon(100% 25%, 100% 75%, 0% 100%, 0% 0%, 50% 50%)",
                  "polygon(100% 0%, 100% 100%, 0% 100%, 0% 0%, 50% 50%)"
                ]
              }}
              transition={{
                duration: 0.35,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-[#080808]"
              style={{
                clipPath: "polygon(100% 25%, 100% 75%, 50% 50%, 100% 75%, 100% 25%)"
              }}
            />
          </div>
        </motion.div>
      </div>
    );
  }

  // Loading Mode (Small inline progress line)
  return (
    <div className="relative w-full h-12 flex items-center border-y border-outline-variant/20 bg-surface-container-lowest overflow-hidden">
      {/* Dots */}
      <div className="absolute inset-x-10 flex justify-between items-center z-10 w-[90%]">
        {Array.from({ length: numDots }).map((_, i) => {
          const isEaten = eatenDots.includes(i);
          return (
            <motion.div
              key={i}
              initial={{ scale: 1, opacity: 0.2 }}
              animate={isEaten ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 0.2 }}
              transition={{ duration: 0.15 }}
              className="w-2.5 h-2.5 bg-primary rounded-full"
            />
          );
        })}
      </div>

      {/* Loading Pac-Man Chomper */}
      <motion.div
        initial={{ left: "-20px" }}
        animate={{ left: "105%" }}
        transition={{
          duration: animDuration,
          ease: "linear",
          repeat: Infinity
        }}
        className="absolute w-7 h-7 bg-tertiary rounded-full z-20 flex items-center justify-center"
      >
        <div className="relative w-full h-full bg-[#f9cb13] rounded-full">
          <motion.div
            animate={{
              clipPath: [
                "polygon(100% 50%, 50% 50%, 100% 50%, 100% 50%)",
                "polygon(100% 50%, 50% 50%, 100% 0%, 100% 100%)",
                "polygon(100% 50%, 50% 50%, 100% 50%, 100% 50%)"
              ]
            }}
            transition={{
              duration: 0.3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute inset-0 bg-[#131313]"
            style={{
              clipPath: "polygon(100% 50%, 50% 50%, 100% 0%, 100% 100%)"
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
