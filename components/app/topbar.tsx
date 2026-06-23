"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { cn } from "@/lib/utils";

export function Topbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Sign out failed:", err);
    }
  };

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "OPERATOR";
  const avatarUrl = user?.user_metadata?.avatar_url;

  // Dynamically calculate navigation items based on authentication state
  const navItems = user
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/questions", label: "Questions" },
        { href: "/progress", label: "Progress" },
        { href: "/profile", label: "Profile" },
        { href: "/settings", label: "Settings" }
      ]
    : [];


  return (
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
  );
}
