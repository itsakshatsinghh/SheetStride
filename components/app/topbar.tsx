"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, Search, Loader2, ExternalLink } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Search Modal state
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard Shortcuts for Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchModalOpen(true);
      }
      if (e.key === "Escape") {
        setSearchModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus Search Input when modal opens
  useEffect(() => {
    if (searchModalOpen && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [searchModalOpen]);

  // Debounced database query logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const { data, error } = await supabase
          .from("questions")
          .select("ID, Title, Difficulty, Link")
          .ilike("Title", `%${searchQuery}%`)
          .limit(8);

        if (!error && data) {
          setSearchResults(data);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Failed to query questions:", err);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const selectQuestion = (q: any) => {
    // Close modal
    setSearchModalOpen(false);

    // Dispatch custom event to slide open global drawer
    window.dispatchEvent(
      new CustomEvent("open-question-drawer", {
        detail: {
          questionId: q.ID,
          title: q.Title,
          difficulty: q.Difficulty,
          link: q.Link,
          mode: "description",
        },
      })
    );
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "OPERATOR";
  const avatarUrl = user?.user_metadata?.avatar_url;

  // Dynamically calculate navigation items based on authentication state
  const navItems = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/questions", label: "Questions" },
        { href: "/progress", label: "Progress" },
        { href: "/patterns", label: "Pattern Atlas" },
        { href: "/profile", label: "Profile" },
        { href: "/settings", label: "Settings" }
      ]
    : [];

  return (
    <>
      <header className={cn(
        "fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b border-border/30 bg-[#050505]/80 backdrop-blur-md",
        scrolled ? "h-14 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" : "h-16 shadow-none"
      )}>
        <nav className="flex justify-between items-center px-gutter max-w-container-max mx-auto h-full w-full">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Link href={user ? "/dashboard" : "/"} className="active:scale-95 transition-all">
              <span className="font-display-arcade text-display-arcade text-primary uppercase tracking-wider hover:text-primary-strong transition-colors">
                SHEETSTRIDE
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "relative py-1.5 px-4 text-body-lg font-body transition-all duration-200 rounded-lg border",
                      active
                        ? "bg-[rgba(255,212,0,0.12)] border-[#FFD400] text-[#FFD400] font-bold"
                        : "border-transparent text-on-surface-variant hover:bg-[#181818] hover:border-[#2D2D2D] hover:text-text"
                    )}
                  >
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Nav Utilities */}
          <div className="flex items-center gap-4">
            {/* Global Search Button */}
            <button
              onClick={() => setSearchModalOpen(true)}
              className="px-3 py-1.5 border border-[#2D2D2D] hover:border-primary/50 bg-[#0C0C0C] hover:bg-[#151515] text-outline hover:text-primary rounded-lg transition-all cursor-pointer flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider"
              title="Search Questions (Ctrl+K)"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Search Question</span>
            </button>

            {user ? (
              <>
                {/* User profile bubble */}
                <Link href="/profile" className="flex items-center gap-3 active:scale-95 transition-all">
                  {avatarUrl ? (
                    <img
                      alt={displayName}
                      className="h-8 w-8 rounded-full border border-outline-variant object-cover grayscale hover:grayscale-0 transition-all cursor-pointer"
                      src={avatarUrl}
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full border border-outline-variant bg-surface-container flex items-center justify-center font-display text-primary text-[10px] cursor-pointer">
                      S_
                    </div>
                  )}
                </Link>

                {/* Logout Button */}
                <button 
                  onClick={handleLogout}
                  className="p-2 hover:bg-danger/10 text-on-surface-variant hover:text-danger rounded-xl transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-danger/20"
                  title="Logout Session"
                >
                  <LogOut className="h-5 w-5" strokeWidth={1.8} />
                </button>
              </>
            ) : (
              /* Login CTA for public visitors */
              <Link
                href="/login"
                className="px-4 py-1.5 border border-primary text-primary hover:bg-primary/10 rounded-lg font-mono-label text-xs uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(255,212,0,0.2)]"
              >
                LOGIN_OPERATOR
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 md:hidden hover:bg-surface-variant/20 rounded-xl text-on-surface-variant hover:text-text transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile Nav Menu Dropdown */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="absolute top-full left-0 w-full bg-[#050505] border-b border-border/30 flex flex-col md:hidden z-40 overflow-hidden shadow-2xl"
            >
              <div className="flex flex-col py-4 px-6 space-y-3">
                {navItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "py-2 px-4 rounded-lg font-body text-body-lg tracking-wide transition-all uppercase flex items-center justify-between border",
                        active
                          ? "bg-[rgba(255,212,0,0.12)] border-[#FFD400] text-[#FFD400] font-bold"
                          : "border-transparent text-on-surface-variant hover:bg-[#181818] hover:border-[#2D2D2D] hover:text-text"
                      )}
                    >
                      <span>{item.label}</span>
                      {active && <span className="text-[10px] text-[#FFD400]">●</span>}
                    </Link>
                  );
                })}
                
                {user && (
                  <button 
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="py-2 px-4 rounded-lg font-body text-body-lg text-danger hover:bg-danger/10 text-left uppercase flex items-center gap-2"
                  >
                    <LogOut className="h-4 w-4" strokeWidth={1.8} />
                    <span>Logout Session</span>
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Global Question Search Dialog Overlay */}
      <AnimatePresence>
        {searchModalOpen && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-start justify-center pt-20 px-4 font-mono">
            {/* Click outside backdrop triggers close */}
            <div className="absolute inset-0" onClick={() => setSearchModalOpen(false)} />

            {/* Search Dialog Box */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="relative w-full max-w-lg bg-[#111111] border border-[#222222] hover:border-primary/30 rounded-xl overflow-hidden shadow-2xl flex flex-col z-[101]"
            >
              {/* Search Header Input bar */}
              <div className="relative border-b border-[#222222]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-outline/50" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type to search questions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-14 py-4 bg-transparent text-sm text-text placeholder-outline/40 focus:outline-none font-mono"
                />
                <button
                  onClick={() => setSearchModalOpen(false)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] text-outline/50 border border-[#222] px-1.5 py-0.5 rounded uppercase hover:text-text hover:border-outline-variant transition-colors"
                >
                  ESC
                </button>
              </div>

              {/* Search Results lists */}
              <div className="max-h-[320px] overflow-y-auto divide-y divide-[#1A1A1A] custom-scrollbar bg-[#0C0C0C]/50">
                {searching && (
                  <div className="flex items-center justify-center py-8 gap-2 text-outline/60 text-xs">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    <span>Searching database...</span>
                  </div>
                )}

                {!searching && searchQuery.trim() !== "" && searchResults.length === 0 && (
                  <div className="text-center py-8 text-outline/40 text-xs uppercase tracking-wider">
                    No matching questions found
                  </div>
                )}

                {!searching && searchQuery.trim() === "" && (
                  <div className="text-center py-6 text-outline/30 text-[10px] uppercase tracking-widest select-none">
                    Search 3,600+ algorithms database
                  </div>
                )}

                {!searching &&
                  searchResults.map((q) => (
                    <button
                      key={q.ID}
                      onClick={() => selectQuestion(q)}
                      className="w-full text-left px-5 py-3 hover:bg-[#151515] transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <div className="min-w-0 flex-1 pr-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] text-outline/50">
                            #{q.ID < 10 ? `00${q.ID}` : q.ID < 100 ? `0${q.ID}` : q.ID}
                          </span>
                          <span className={cn(
                            "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border leading-none tracking-wider",
                            q.Difficulty.toLowerCase() === "easy" && "bg-secondary/5 border-secondary/20 text-secondary",
                            q.Difficulty.toLowerCase() === "medium" && "bg-primary/5 border-primary/20 text-primary",
                            q.Difficulty.toLowerCase() === "hard" && "bg-danger/5 border-danger/20 text-danger"
                          )}>
                            {q.Difficulty}
                          </span>
                        </div>
                        <p className="text-xs text-text font-semibold group-hover:text-primary transition-colors truncate">
                          {q.Title}
                        </p>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-outline/30 group-hover:text-primary transition-colors flex-shrink-0" />
                    </button>
                  ))}
              </div>

              {/* Dialog Footer helper banner */}
              <div className="bg-[#090909] px-4 py-2 border-t border-[#1C1C1C] flex justify-between items-center text-[9px] text-outline/45 select-none uppercase tracking-wider font-mono">
                <span>Ctrl + K shortcut</span>
                <span>Select to view details</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
