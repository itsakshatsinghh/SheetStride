"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, ArrowRight, Building2, Layers, FolderOpen } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { supabase } from "@/lib/supabase";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";

interface CompanySummary {
  company_id: string;
  company_name: string;
  company_slug: string;
  question_count: number;
}

export default function CompanySheetsPage() {
  const [companies, setCompanies] = useState<CompanySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Stats
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    async function fetchCompanies() {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("view_company_summary")
          .select("*")
          .order("company_name", { ascending: true });

        if (error) throw error;

        if (data) {
          setCompanies(data);
          setTotalCompanies(data.length);
          const totalQ = data.reduce((sum, c) => sum + (c.question_count || 0), 0);
          setTotalQuestions(totalQ);
        }
      } catch (err) {
        console.error("Failed to load company sheets summary:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchCompanies();
  }, []);

  // Client-side search logic
  const filteredCompanies = companies.filter((c) =>
    c.company_name.toLowerCase().includes(search.toLowerCase())
  );

  // Framer Motion variants
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.03,
      },
    },
  };

  const cardReveal = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      {/* Breadcrumb HUD */}
      <Breadcrumbs items={[{ label: "Company Sheets" }]} />

      {/* Header Block */}
      <header className="mb-10 relative overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <span className="px-2.5 py-0.5 bg-[#f97316]/10 border border-[#f97316]/30 text-[#f97316] font-mono-label text-[10px] tracking-wider uppercase rounded">
            RECRUITING_INTEL
          </span>
          <span className="px-2.5 py-0.5 bg-primary/5 border border-primary/20 text-primary font-mono-label text-[10px] tracking-wider uppercase rounded">
            v2.0-STABLE
          </span>
        </div>
        <h1 className="font-display-arcade text-2xl md:text-4xl text-on-surface tracking-widest leading-tight uppercase">
          COMPANY <span className="text-[#f97316]">SHEETS</span>
        </h1>
        <p className="mt-4 font-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Practice interview-focused question sets curated from real company trends across FAANG, HFTs, SaaS companies, startups, and product-based organizations.
        </p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 select-none">
        <div className="bg-[#111111] border border-[#2D2D2D] p-5 rounded-xl flex items-center gap-4">
          <div className="h-12 w-12 bg-[#f97316]/10 border border-[#f97316]/20 rounded-xl flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-[#f97316]" />
          </div>
          <div>
            <span className="block font-mono-label text-[9px] text-outline/60 uppercase tracking-widest mb-0.5">COMPANIES_ACTIVE</span>
            {loading ? (
              <span className="font-mono-stats text-mono-stats text-on-surface animate-pulse">...</span>
            ) : (
              <span className="font-mono-stats text-mono-stats text-[#f97316] font-bold">{totalCompanies}</span>
            )}
          </div>
        </div>

        <div className="bg-[#111111] border border-[#2D2D2D] p-5 rounded-xl flex items-center gap-4">
          <div className="h-12 w-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shrink-0">
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span className="block font-mono-label text-[9px] text-outline/60 uppercase tracking-widest mb-0.5">TOTAL_MAPPED_QUESTIONS</span>
            {loading ? (
              <span className="font-mono-stats text-mono-stats text-on-surface animate-pulse">...</span>
            ) : (
              <span className="font-mono-stats text-mono-stats text-primary font-bold">{totalQuestions}</span>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="bg-surface-container-low border border-[#2D2D2D] rounded-xl p-4 mb-8 flex flex-col lg:flex-row gap-4 items-center justify-between">
        {/* Search Experience */}
        <div className="relative w-full lg:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline w-4 h-4 group-focus-within:text-[#f97316] transition-colors" />
          <input
            type="text"
            className="w-full bg-[#080808] border border-outline-variant/40 rounded-lg py-2.5 pl-10 pr-4 text-on-surface focus:outline-none focus:border-[#f97316] focus:ring-1 focus:ring-[#f97316]/30 transition-all font-body-sm text-body-sm"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Info label */}
        <div className="hidden lg:block text-[11px] font-mono text-outline/50 uppercase tracking-wider">
          {filteredCompanies.length} result{filteredCompanies.length !== 1 && "s"} found
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-[#f97316]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="font-mono-label text-mono-label tracking-[0.2em] text-[#f97316]">SYNCING_COMPANY_SHEETS...</p>
          </div>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 bg-[#111111] border border-[#2D2D2D] rounded-xl">
          <FolderOpen className="w-12 h-12 text-outline-variant/60" />
          <p className="font-mono-label text-mono-label text-outline uppercase tracking-widest">No matching company sheets found</p>
        </div>
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
        >
          {filteredCompanies.map((c) => (
            <motion.div key={c.company_id} variants={cardReveal}>
              <Link href={`/questions/company-sheets/${c.company_slug}`}>
                <div className="group relative bg-[#111111] border border-outline-variant/20 p-5 rounded-xl transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-[#f97316] hover:shadow-[0_8px_25px_-5px_rgba(249,115,22,0.22)] flex flex-col justify-between h-36 cursor-pointer">
                  {/* Decorative edge scanline */}
                  <div className="absolute top-0 left-0 w-[2px] h-0 bg-[#f97316] transition-all duration-300 group-hover:h-full rounded-l-xl" />
                  
                  <div>
                    <h2 className="font-display font-semibold text-sm text-on-surface group-hover:text-[#f97316] transition-colors line-clamp-1 mb-2">
                      {c.company_name}
                    </h2>
                    <span className="font-mono-label text-[10px] text-outline/60 uppercase tracking-widest">
                      {c.question_count} Question{c.question_count !== 1 && "s"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-outline/50 group-hover:text-[#f97316] transition-colors mt-4">
                    <span className="font-mono text-[10px] uppercase tracking-wider group-hover:underline">
                      Practice Sheet
                    </span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Page Footer */}
      <footer className="border-t border-outline-variant/20 py-stack-md mt-16 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-display-arcade text-display-arcade text-[#f97316]">SHEETSTRIDE</span>
          <span className="font-mono-label text-mono-label text-outline uppercase">v2.2.0-STABLE</span>
        </div>
        <div className="flex gap-6 font-mono-label text-outline">
          <a href="#" className="hover:text-primary transition-colors">System Status</a>
          <a href="#" className="hover:text-primary transition-colors">API Docs</a>
          <a href="#" className="hover:text-[#f97316] transition-colors">Changelog</a>
        </div>
      </footer>
    </AppShell>
  );
}
