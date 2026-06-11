"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/app/shell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";

export default function SettingsPage() {
  const { user, logout } = useAuth();

  // Appearance states
  const [darkTheme, setDarkTheme] = useState(true);
  const [pixelMode, setPixelMode] = useState(false);
  const [compactLayout, setCompactLayout] = useState(true);

  // Notification states
  const [dailyDigest, setDailyDigest] = useState(true);
  const [weeklyProgress, setWeeklyProgress] = useState(false);
  const [pushAlerts, setPushAlerts] = useState(true);

  // Privacy states
  const [publicProfile, setPublicProfile] = useState(false);
  const [showProgress, setShowProgress] = useState(true);

  // Account details
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState("");

  // Load initial settings
  useEffect(() => {
    if (user) {
      setDisplayName(user.user_metadata?.full_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "User");
      setEmail(user.email || "");
    }

    // Load appearance settings from localStorage if they exist
    const localDark = localStorage.getItem("setting_dark_theme");
    const localPixel = localStorage.getItem("setting_pixel_mode");
    const localCompact = localStorage.getItem("setting_compact_layout");

    if (localDark !== null) setDarkTheme(localDark === "true");
    if (localPixel !== null) setPixelMode(localPixel === "true");
    if (localCompact !== null) setCompactLayout(localCompact === "true");
  }, [user]);

  // Save settings helpers
  const handleToggle = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
    
    // Add custom class body adjustments for retro styles
    if (key === "setting_pixel_mode") {
      if (value) {
        document.documentElement.classList.add("pixel-retro");
      } else {
        document.documentElement.classList.remove("pixel-retro");
      }
    }
  };

  const handleUpdateIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    try {
      setIsUpdating(true);
      setUpdateMsg("");
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() }
      });
      if (error) throw error;
      setUpdateMsg("IDENTITY_UPDATED_SUCCESSFULLY");
      setTimeout(() => setUpdateMsg(""), 3000);
    } catch (err: any) {
      setUpdateMsg(`ERR: ${err.message || "Failed to update identity"}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleExportJSON = () => {
    try {
      const backupData = {
        exportedAt: new Date().toISOString(),
        userId: user?.id,
        userEmail: user?.email,
        localStorageKeys: {
          solvedQuestionsTimestamps: localStorage.getItem("solved_questions_timestamps"),
          settingDarkTheme: localStorage.getItem("setting_dark_theme"),
          settingPixelMode: localStorage.getItem("setting_pixel_mode"),
          settingCompactLayout: localStorage.getItem("setting_compact_layout"),
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
    } catch (err) {
      alert("Failed to export configuration node.");
    }
  };

  const handlePurgeAllData = async () => {
    const confirmPurge = confirm("WARNING: Proceeding will erase all locally cached parameters and delete your solved question progress records from the database. Are you sure?");
    if (!confirmPurge) return;
    
    try {
      setIsUpdating(true);
      
      // Delete user progress from database
      if (user) {
        const { error } = await supabase
          .from("user_progress")
          .delete()
          .eq("user_id", user.id);
        if (error) console.error("Error purging database logs:", error);
      }
      
      // Clear localStorage
      localStorage.clear();
      
      alert("System purged. Redirecting to initialization deck.");
      await logout();
    } catch (err: any) {
      alert(`Purge interrupted: ${err.message}`);
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
        
        {/* APPEARANCE */}
        <motion.div variants={revealItem} className="bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl hover:border-outline-variant/60 transition-colors shadow-md space-y-6 flex flex-col justify-between">
          <div>
            <div className="mb-6 border-b border-[#2B2B2B] pb-4">
              <h2 className="font-headline-md text-headline-md text-primary uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-xl">palette</span> Appearance
              </h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-lg font-semibold text-on-surface">Dark Theme</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Optimize for low light environments</p>
                </div>
                <Switch checked={darkTheme} onCheckedChange={(val) => handleToggle("setting_dark_theme", val, setDarkTheme)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-lg font-semibold text-on-surface">Pixel Mode</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Enable retro typography sharpness</p>
                </div>
                <Switch checked={pixelMode} onCheckedChange={(val) => handleToggle("setting_pixel_mode", val, setPixelMode)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-lg font-semibold text-on-surface">Compact Layout</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Maximize screen information density</p>
                </div>
                <Switch checked={compactLayout} onCheckedChange={(val) => handleToggle("setting_compact_layout", val, setCompactLayout)} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* NOTIFICATIONS */}
        <motion.div variants={revealItem} className="bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl hover:border-outline-variant/60 transition-colors shadow-md space-y-6 flex flex-col justify-between">
          <div>
            <div className="mb-6 border-b border-[#2B2B2B] pb-4">
              <h2 className="font-headline-md text-headline-md text-secondary uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-xl">notifications</span> Notifications
              </h2>
            </div>
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-lg font-semibold text-on-surface">Daily Digest</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Every morning solving updates at 08:00</p>
                </div>
                <Switch checked={dailyDigest} onCheckedChange={(val) => handleToggle("setting_daily_digest", val, setDailyDigest)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-lg font-semibold text-on-surface">Weekly Progress</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Sunday performance evaluation report</p>
                </div>
                <Switch checked={weeklyProgress} onCheckedChange={(val) => handleToggle("setting_weekly_progress", val, setWeeklyProgress)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-lg font-semibold text-on-surface">Push Alerts</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Real-time desktop system alerts</p>
                </div>
                <Switch checked={pushAlerts} onCheckedChange={(val) => handleToggle("setting_push_alerts", val, setPushAlerts)} />
              </div>
            </div>
          </div>
        </motion.div>

        {/* ACCOUNT IDENTITY */}
        <motion.form variants={revealItem} onSubmit={handleUpdateIdentity} className="h-full">
          <div className="bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl hover:border-outline-variant/60 transition-colors shadow-md space-y-6 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-[#2B2B2B] pb-4">
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
                  className="w-full bg-[#080808] text-on-surface border border-outline-variant/50 rounded-lg px-3 py-2 text-body-sm font-body-sm focus:outline-none focus:border-primary transition-all" 
                  value={displayName} 
                  onChange={(e) => setDisplayName(e.target.value)} 
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-mono-label text-outline uppercase tracking-wider text-[11px]">Email Address</label>
                <input 
                  type="email"
                  className="w-full bg-[#080808]/40 text-outline border border-[#2B2B2B] rounded-lg px-3 py-2 text-body-sm font-body-sm cursor-not-allowed select-none" 
                  value={email} 
                  disabled 
                  readOnly
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              className="w-full bg-primary text-on-primary font-mono-label text-mono-label font-bold py-3 px-4 rounded-lg uppercase tracking-wider hover:shadow-[0_0_15px_rgba(178,210,255,0.4)] active:scale-95 transition-all mt-4" 
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-background" /> : "Update Identity"}
            </button>
          </div>
        </motion.form>

        {/* PRIVACY & SECURITY */}
        <motion.div variants={revealItem} className="bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl hover:border-outline-variant/60 transition-colors shadow-md space-y-6 flex flex-col justify-between">
          <div>
            <div className="mb-6 border-b border-[#2B2B2B] pb-4">
              <h2 className="font-headline-md text-headline-md text-error uppercase flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-xl">security</span> Privacy & Security
              </h2>
            </div>
            <div className="space-y-5 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-lg font-semibold text-on-surface">Public Profile</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Make logs visible to the global leaderboard</p>
                </div>
                <Switch checked={publicProfile} onCheckedChange={(val) => handleToggle("setting_public_profile", val, setPublicProfile)} />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-lg font-semibold text-on-surface">Show Progress</p>
                  <p className="text-[10px] text-outline uppercase tracking-wider">Broadcast achievements on dashboard feed</p>
                </div>
                <Switch checked={showProgress} onCheckedChange={(val) => handleToggle("setting_show_progress", val, setShowProgress)} />
              </div>
            </div>
          </div>
          
          <button 
            type="button" 
            className="w-full bg-surface-container border border-outline-variant/30 text-on-surface font-mono-label text-mono-label font-bold py-3 px-4 rounded-lg uppercase tracking-wider hover:bg-surface-variant/20 active:scale-95 transition-all"
            onClick={() => alert("Multi-Factor authentication core protocols are currently locked. System is stable.")}
          >
            Manage Two-Factor Auth
          </button>
        </motion.div>

        {/* LOCAL DATA STORAGE */}
        <motion.div variants={revealItem} className="bg-[#1C1C1C] border border-[#2B2B2B] p-6 rounded-xl hover:border-outline-variant/60 transition-colors shadow-md space-y-6 md:col-span-2">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center border-b border-[#2B2B2B] pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 items-center justify-center border border-outline-variant/30 bg-[#0E0E0E] rounded-lg">
                <span className="material-symbols-outlined text-primary text-3xl">database</span>
              </div>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface uppercase font-bold">Local Data Storage</h2>
                <p className="text-body-sm text-outline uppercase text-[10px] tracking-wider mt-1">
                  Manage your offline cache database node aggregates.
                </p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-3 sm:w-auto sm:grid-cols-2">
              <button 
                type="button" 
                className="bg-surface-container border border-outline-variant/30 text-on-surface px-6 py-2.5 rounded-lg font-mono-label text-mono-label font-semibold uppercase hover:bg-surface-variant/20 transition-all active:scale-95 shadow-md" 
                onClick={handleExportJSON}
              >
                Export JSON
              </button>
              <button 
                type="button" 
                className="bg-[#93000A]/30 border border-error text-[#FFDAD6] px-6 py-2.5 rounded-lg font-mono-label text-mono-label font-bold uppercase hover:bg-[#93000A] transition-all active:scale-95 shadow-md" 
                onClick={handlePurgeAllData} 
                disabled={isUpdating}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-danger" /> : "Purge All Data"}
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4 select-none">
            <div className="border border-[#2B2B2B] bg-[#0E0E0E]/50 p-4 rounded">
              <p className="text-[10px] text-outline uppercase font-mono-label tracking-wider">Local Cache State</p>
              <p className="mt-2 font-mono-stats text-mono-stats text-primary text-base">CONNECTED</p>
            </div>
            <div className="border border-[#2B2B2B] bg-[#0E0E0E]/50 p-4 rounded">
              <p className="text-[10px] text-outline uppercase font-mono-label tracking-wider">Storage Quota</p>
              <p className="mt-2 font-mono-stats text-mono-stats text-secondary text-base">5.0 MB MAX</p>
            </div>
            <div className="border border-[#2B2B2B] bg-[#0E0E0E]/50 p-4 rounded">
              <p className="text-[10px] text-outline uppercase font-mono-label tracking-wider">Last Sync Event</p>
              <p className="mt-2 font-mono-stats text-mono-stats text-tertiary text-base">JUST NOW</p>
            </div>
            <div className="border border-[#2B2B2B] bg-[#0E0E0E]/50 p-4 rounded">
              <p className="text-[10px] text-outline uppercase font-mono-label tracking-wider">Stability Index</p>
              <p className="mt-2 font-mono-stats text-mono-stats text-on-surface text-base">99.8% STABLE</p>
            </div>
          </div>
        </motion.div>
      </motion.section>

      {/* Footer metadata */}
      <footer className="border-t border-[#2B2B2B] py-stack-md mt-12 flex flex-col md:flex-row justify-between items-center gap-4 opacity-50 text-xs">
        <div className="flex items-center gap-4">
          <span className="font-display-arcade text-display-arcade text-primary">SHEETSTRIDE</span>
          <span className="font-mono-label text-mono-label text-outline uppercase">v2.0.0-STABLE</span>
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
