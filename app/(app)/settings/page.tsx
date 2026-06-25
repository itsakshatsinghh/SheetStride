"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { cn, sanitizeSocialInput } from "@/lib/utils";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  // Spacing / Spacing configuration state
  const [compactLayout, setCompactLayout] = useState(true);

  // Form profile states
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("C++");
  const [leetcodeUsername, setLeetcodeUsername] = useState("");
  const [bio, setBio] = useState("");
  const [instagram, setInstagram] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  // Load initial settings
  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function loadProfile() {
      try {
        setIsUpdating(true);
        setEmail(currentUser.email || "");

        // 1. Try querying profiles table first
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name, preferred_language, leetcode_username, bio, instagram, linkedin, github")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (profile) {
          setDisplayName(profile.display_name || "");
          setPreferredLanguage(profile.preferred_language || "C++");
          setLeetcodeUsername(profile.leetcode_username || "");
          setBio(profile.bio || "");
          setInstagram(profile.instagram || "");
          setLinkedin(profile.linkedin || "");
          setGithub(profile.github || "");
        } else {
          // Fallback to auth metadata
          setDisplayName(currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || currentUser.email?.split("@")[0] || "User");
          setPreferredLanguage(currentUser.user_metadata?.preferred_language || "C++");
          setLeetcodeUsername(currentUser.user_metadata?.leetcode_username || "");
          setBio(currentUser.user_metadata?.bio || "");
          setInstagram(currentUser.user_metadata?.instagram || "");
          setLinkedin(currentUser.user_metadata?.linkedin || "");
          setGithub(currentUser.user_metadata?.github || "");
        }
      } catch (err) {
        console.warn("Profiles query failed, falling back to auth metadata:", err);
        setDisplayName(currentUser.user_metadata?.full_name || currentUser.user_metadata?.display_name || currentUser.email?.split("@")[0] || "User");
        setPreferredLanguage(currentUser.user_metadata?.preferred_language || "C++");
        setLeetcodeUsername(currentUser.user_metadata?.leetcode_username || "");
        setBio(currentUser.user_metadata?.bio || "");
        setInstagram(currentUser.user_metadata?.instagram || "");
        setLinkedin(currentUser.user_metadata?.linkedin || "");
        setGithub(currentUser.user_metadata?.github || "");
      } finally {
        setIsUpdating(false);
      }
    }

    loadProfile();

    // Load appearance settings from localStorage if they exist
    const localCompact = localStorage.getItem("setting_compact_layout");
    if (localCompact !== null) setCompactLayout(localCompact === "true");
  }, [user]);

  // Save layout state helper
  const handleToggleCompact = (val: boolean) => {
    setCompactLayout(val);
    localStorage.setItem("setting_compact_layout", String(val));
  };

  const getWordCount = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  };

  // Profile update handler
  const handleUpdateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    if (getWordCount(bio) > 75) {
      setUpdateMsg("ERR: Bio cannot exceed 75 words.");
      return;
    }

    try {
      setIsUpdating(true);
      setUpdateMsg("");

      // Sanitize social inputs to prevent Stored XSS
      let sanitizedGithub = "";
      let sanitizedLinkedin = "";
      let sanitizedInstagram = "";

      try {
        sanitizedGithub = sanitizeSocialInput(github, "github");
      } catch (err: any) {
        setUpdateMsg(`ERR: GitHub Link Invalid - ${err.message}`);
        setIsUpdating(false);
        return;
      }

      try {
        sanitizedLinkedin = sanitizeSocialInput(linkedin, "linkedin");
      } catch (err: any) {
        setUpdateMsg(`ERR: LinkedIn Link Invalid - ${err.message}`);
        setIsUpdating(false);
        return;
      }

      try {
        sanitizedInstagram = sanitizeSocialInput(instagram, "instagram");
      } catch (err: any) {
        setUpdateMsg(`ERR: Instagram Link Invalid - ${err.message}`);
        setIsUpdating(false);
        return;
      }

      // Update local states to normalized values
      setGithub(sanitizedGithub);
      setLinkedin(sanitizedLinkedin);
      setInstagram(sanitizedInstagram);

      // 1. Attempt profiles database upsert
      try {
        await supabase
          .from("profiles")
          .upsert({
            id: user?.id,
            display_name: displayName.trim(),
            preferred_language: preferredLanguage,
            leetcode_username: leetcodeUsername.trim(),
            bio: bio.trim(),
            instagram: sanitizedInstagram,
            linkedin: sanitizedLinkedin,
            github: sanitizedGithub
          });
      } catch (err) {
        console.warn("profiles table update skipped (table may not exist):", err);
      }

      // 2. Direct Sync into Supabase raw user metadata
      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          full_name: displayName.trim(),
          preferred_language: preferredLanguage,
          leetcode_username: leetcodeUsername.trim(),
          bio: bio.trim(),
          instagram: sanitizedInstagram,
          linkedin: sanitizedLinkedin,
          github: sanitizedGithub
        }
      });

      if (authErr) throw authErr;

      if (user?.id) {
        localStorage.removeItem(`profile_data_cache_${user.id}`);
        localStorage.removeItem(`leetcode_live_stats_cache_${leetcodeUsername.trim()}`);
      }
      window.dispatchEvent(new Event("question-solved"));

      setUpdateMsg("IDENTITY_UPDATED_SUCCESSFULLY");
      setTimeout(() => setUpdateMsg(""), 3000);
    } catch (err: any) {
      setUpdateMsg(`ERR: ${err.message || "Failed to update identity"}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Client-side progress logs export builder
  const handleExportJSON = async () => {
    if (!user) return;
    try {
      setIsUpdating(true);
      
      const { data: userProgress, error } = await supabase
        .from("user_progress")
        .select(`
          question_id,
          completed,
          "completed-at"
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      let progressData: any[] = [];
      if (userProgress && userProgress.length > 0) {
        const questionIds = userProgress.map((row: any) => row.question_id);
        const { data: questionsData, error: questionsError } = await supabase
          .from("questions")
          .select("ID, Title, Difficulty, Topics")
          .in("ID", questionIds);

        if (questionsError) throw questionsError;

        const questionsMap = new Map(questionsData?.map((q: any) => [q.ID, q]));
        progressData = userProgress.map((row: any) => {
          const q = questionsMap.get(row.question_id);
          return {
            question_id: row.question_id,
            completed: row.completed,
            "completed-at": row["completed-at"],
            questions: q ? {
              Title: q.Title,
              Difficulty: q.Difficulty,
              Topics: q.Topics
            } : null
          };
        });
      }

      const backupData = {
        exportedAt: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email,
        progress: progressData,
        settings: {
          compactLayout
        }
      };
      
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sheetstride_backup_${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Failed to export progress data: ${err.message || err}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Erase progress records handler
  const handlePurgeAllData = async () => {
    if (!user) return;
    const confirmPurge = confirm("Are you sure you want to reset all your progress?");
    if (!confirmPurge) return;
    
    try {
      setIsUpdating(true);
      
      const { error } = await supabase
        .from("user_progress")
        .delete()
        .eq("user_id", user.id);
      
      if (error) throw error;
      
      // Clear solved cache
      localStorage.removeItem("solved_questions_timestamps");
      
      alert("Progress successfully reset.");
      
      // Dispatch solve event to update dashboard graphs
      window.dispatchEvent(new Event("question-solved"));
    } catch (err: any) {
      alert(`Reset progress failed: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsUpdating(true);
      await logout();
    } catch (err) {
      console.error("Sign out failed:", err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Stagger reveal animations
  const staggerContainer = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const revealItem = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } }
  };

  return (
    <AppShell className="max-w-[1120px] mx-auto px-gutter space-y-stack-lg" gridBackground>
      {/* Title Header */}
      <section className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end pt-6">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">System Preferences</h1>
          <p className="mt-3 text-body-lg text-muted">
            Configure global workspace parameters and user identity settings.
          </p>
        </div>
        <Button 
          variant="danger" 
          disabled={isUpdating}
          className="md:self-end h-10 border border-error bg-[#93000A]/30 text-[#FFDAD6] hover:bg-[#93000A] font-mono-label text-mono-label font-bold uppercase transition-all duration-300 active:scale-95 shadow-md" 
          onClick={handleLogout}
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-danger" /> : "Deauthenticate Session"}
        </Button>
      </section>

      {/* Preferences Bento Grid */}
      <motion.section 
        variants={staggerContainer}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-gutter md:grid-cols-2"
      >
        
        {/* ACCOUNT IDENTITY */}
        <motion.form variants={revealItem} onSubmit={handleUpdateIdentity} className="h-full">
          <div className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-6 rounded-xl hover:border-outline-variant/60 transition-all duration-300 shadow-md space-y-6 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-[#2D2D2D] pb-4">
                <h2 className="font-headline-md text-headline-md text-tertiary uppercase font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-tertiary text-xl">person</span> Account Identity
                </h2>
              </div>
              
              {updateMsg && (
                <div className={`text-[10px] uppercase font-mono-label tracking-wider ${updateMsg.startsWith("ERR") ? "text-error" : "text-secondary"}`}>
                  Status: {updateMsg}
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">Display Name</label>
                <input 
                  type="text"
                  className="w-full bg-[#0A0A0A] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm font-body-sm focus:outline-none focus:border-primary transition-all" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">Preferred Language</label>
                <select 
                  className="w-full bg-[#0A0A0A] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm font-body-sm focus:outline-none focus:border-primary transition-all cursor-pointer font-mono" 
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                >
                  <option value="C++">C++</option>
                  <option value="Java">Java</option>
                  <option value="Python">Python</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">Email Address</label>
                <input 
                  type="email"
                  className="w-full bg-[#0A0A0A]/40 text-outline border border-[#2D2D2D] rounded-lg px-3 py-2 text-body-sm font-body-sm cursor-not-allowed select-none" 
                  value={email} 
                  disabled 
                  readOnly
                />
              </div>

              <div className="border-t border-[#2D2D2D] my-4 pt-4">
                <h3 className="text-body-lg font-bold text-primary uppercase tracking-wide text-xs mb-3">Integrations & Socials</h3>
              </div>

              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">LeetCode Username</label>
                <input 
                  type="text"
                  className="w-full bg-[#0A0A0A] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm font-body-sm focus:outline-none focus:border-primary transition-all" 
                  placeholder="e.g. alfaarghya"
                  value={leetcodeUsername} 
                  onChange={(e) => setLeetcodeUsername(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">Short Bio</label>
                  <span className={cn(
                    "text-[10px] font-mono-label tracking-wider",
                    getWordCount(bio) > 75 ? "text-error" : "text-outline"
                  )}>
                    {getWordCount(bio)}/75 Words
                  </span>
                </div>
                <textarea 
                  className="w-full bg-[#0A0A0A] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm font-body-sm focus:outline-none focus:border-primary transition-all h-20 resize-none" 
                  placeholder="Tell us about yourself (max 75 words)..."
                  value={bio} 
                  onChange={(e) => setBio(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">GitHub Profile/Username</label>
                <input 
                  type="text"
                  className="w-full bg-[#0A0A0A] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm font-body-sm focus:outline-none focus:border-primary transition-all" 
                  placeholder="e.g. githubusername"
                  value={github} 
                  onChange={(e) => setGithub(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">LinkedIn Profile/Username</label>
                <input 
                  type="text"
                  className="w-full bg-[#0A0A0A] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm font-body-sm focus:outline-none focus:border-primary transition-all" 
                  placeholder="e.g. linkedinusername"
                  value={linkedin} 
                  onChange={(e) => setLinkedin(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">Instagram Profile/Username</label>
                <input 
                  type="text"
                  className="w-full bg-[#0A0A0A] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm font-body-sm focus:outline-none focus:border-primary transition-all" 
                  placeholder="e.g. instagramusername"
                  value={instagram} 
                  onChange={(e) => setInstagram(e.target.value)} 
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-primary text-on-primary font-mono-label text-mono-label font-bold py-3 px-4 rounded-lg uppercase tracking-wider hover:shadow-[0_0_15px_rgba(255,212,0,0.4)] active:scale-95 transition-all mt-4" 
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-background" /> : "Update Identity"}
            </button>
          </div>
        </motion.form>
        
        {/* APPEARANCE */}
        <motion.div variants={revealItem} className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-6 rounded-xl hover:border-outline-variant/60 transition-all duration-300 shadow-md space-y-6 flex flex-col justify-between hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)]">
          <div>
            <div className="mb-6 border-b border-[#2D2D2D] pb-4">
              <h2 className="font-headline-md text-headline-md text-primary uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">palette</span> Appearance
              </h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-lg font-semibold text-on-surface">Compact Layout</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Maximize screen information density</p>
                </div>
                <Switch checked={compactLayout} onCheckedChange={handleToggleCompact} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* DATA MANAGEMENT */}
        <motion.div variants={revealItem} className="bg-[#111111]/72 border border-[#2D2D2D] backdrop-blur-[12px] p-6 rounded-xl hover:border-outline-variant/60 transition-all duration-300 shadow-md space-y-6 md:col-span-2 hover:bg-[#181818]/92 hover:border-[#FFD400] hover:-translate-y-[2px] hover:shadow-[0_0_24px_rgba(255,212,0,0.12)]">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 items-center justify-center border border-outline-variant/30 bg-[#090909] rounded-lg">
                <span className="material-symbols-outlined text-primary text-3xl">database</span>
              </div>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface uppercase font-bold">Data Management</h2>
                <p className="text-body-sm text-outline uppercase text-[10px] tracking-wider mt-1">
                  Manage your cloud and local progress nodes.
                </p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
              <button 
                type="button" 
                className="bg-surface-container border border-outline-variant/30 text-on-surface px-6 py-2.5 rounded-lg font-mono-label text-mono-label font-semibold uppercase hover:bg-surface-variant/20 transition-all active:scale-95 shadow-md cursor-pointer" 
                onClick={handleExportJSON}
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" /> : "Export JSON"}
              </button>
              <button 
                type="button" 
                className="bg-[#93000A]/30 border border-error text-[#FFDAD6] px-6 py-2.5 rounded-lg font-mono-label text-mono-label font-bold uppercase hover:bg-[#93000A] transition-all active:scale-95 shadow-md cursor-pointer" 
                onClick={handlePurgeAllData} 
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-danger mx-auto" /> : "Reset Progress"}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Footer metadata */}
      <footer className="border-t border-[#2D2D2D] py-stack-md mt-12 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-display-arcade text-display-arcade text-primary">SHEETSTRIDE</span>
          <span className="font-mono-label text-mono-label text-outline uppercase">v2.2.0-STABLE</span>
        </div>
        <div className="flex gap-6 font-mono-label text-outline">
          <a href="#" className="hover:text-primary transition-colors">System Status</a>
          <a href="#" className="hover:text-primary transition-colors">API Docs</a>
          <a href="#" className="hover:text-primary transition-colors">Changelog</a>
        </div>
      </footer>
    </AppShell>
  );
}
