"use client";

import React, { useState, useEffect } from "react";

export function CoffeeButton() {
  const [dismissed, setDismissed] = useState(true); // default to true to prevent flash before mount

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isDismissed = localStorage.getItem("coffee_button_dismissed") === "true";
      setDismissed(isDismissed);
    }
  }, []);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering redirect
    setDismissed(true);
    localStorage.setItem("coffee_button_dismissed", "true");
  };

  const handleCoffeeRedirect = () => {
    window.open("https://rzp.io/rzp/sheetstride", "_blank", "noopener,noreferrer");
  };

  if (dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[999] pointer-events-auto font-press-start select-none">
      <button
        onClick={handleCoffeeRedirect}
        className="group relative flex items-center gap-3 pl-4 pr-10 py-3 rounded-lg border text-[10px] tracking-widest uppercase transition-all duration-300 active:scale-95 bg-[#131313]/90 hover:bg-[#1c1c1c]/95 border-white/10 hover:border-tertiary text-text hover:text-tertiary hover:shadow-[0_0_15px_rgba(249,203,19,0.25)] backdrop-blur-md"
      >
        {/* Custom Pixelated Coffee Cup Icon */}
        <div className="relative w-5 h-5 flex items-center justify-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="group-hover:scale-110 transition-transform duration-200"
            style={{ imageRendering: "pixelated" }}
          >
            {/* Steam lines */}
            <rect x="4" y="1" width="1" height="2" className="opacity-70 group-hover:animate-pulse" />
            <rect x="7" y="0" width="1" height="2" className="opacity-70 group-hover:animate-pulse [animation-delay:0.15s]" />
            <rect x="10" y="1" width="1" height="2" className="opacity-70 group-hover:animate-pulse [animation-delay:0.3s]" />
            {/* Cup Rim */}
            <rect x="2" y="4" width="10" height="1" />
            {/* Cup Body */}
            <rect x="3" y="5" width="8" height="6" />
            <rect x="4" y="11" width="6" height="1" />
            {/* Handle */}
            <rect x="11" y="6" width="2" height="1" />
            <rect x="12" y="7" width="1" height="2" />
            <rect x="11" y="9" width="2" height="1" />
          </svg>
        </div>

        <div className="flex flex-col items-start leading-tight">
          <span className="text-[7px] text-outline tracking-wider font-mono-label mb-0.5">SUPPORT_DEV_</span>
          <span className="text-xs group-hover:text-tertiary transition-colors">WHAT ABOUT A COFFEE?</span>
        </div>

        {/* Close / Dismiss Button */}
        <span
          onClick={handleDismiss}
          role="button"
          aria-label="Dismiss Coffee Alert"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-outline/50 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all duration-200 pointer-events-auto"
          title="Dismiss support button"
        >
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="1" y1="1" x2="7" y2="7" />
            <line x1="7" y1="1" x2="1" y2="7" />
          </svg>
        </span>
      </button>
    </div>
  );
}
