"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/app/shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/components/providers/auth-provider";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

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

  return (
    <AppShell className="max-w-[1120px] mx-auto">
      <section className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div>
          <h1 className="font-display text-headline-lg text-text">SYSTEM_PREFERENCES</h1>
          <p className="mt-3 text-body-lg text-muted">
            Configure global workspace parameters and user identity settings.
          </p>
        </div>
        <Button 
          variant="danger" 
          disabled={isUpdating}
          className="md:self-end h-10 border-danger/40 hover:bg-danger/10" 
          onClick={handleLogout}
        >
          {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-danger" /> : "DEAUTHENTICATE_SESSION (LOGOUT)"}
        </Button>
      </section>

      <section className="grid grid-cols-1 gap-gutter md:grid-cols-2">
        
        {/* APPEARANCE */}
        <Card className="space-y-6 p-6">
          <div className="mb-6 border-b border-border pb-4">
            <h2 className="font-display text-headline-sm text-primary">APPEARANCE</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-lg text-text">Dark Theme</p>
              <p className="text-[10px] text-muted">OPTIMIZE FOR LOW LIGHT</p>
            </div>
            <div className="self-start sm:self-auto">
              <Switch checked={darkTheme} onCheckedChange={(val) => handleToggle("setting_dark_theme", val, setDarkTheme)} />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-lg text-text">Pixel Mode</p>
              <p className="text-[10px] text-muted">ENABLE RETRO SHARPENING</p>
            </div>
            <div className="self-start sm:self-auto">
              <Switch checked={pixelMode} onCheckedChange={(val) => handleToggle("setting_pixel_mode", val, setPixelMode)} />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-lg text-text">Compact Layout</p>
              <p className="text-[10px] text-muted">MAXIMIZE DATA DENSITY</p>
            </div>
            <div className="self-start sm:self-auto">
              <Switch checked={compactLayout} onCheckedChange={(val) => handleToggle("setting_compact_layout", val, setCompactLayout)} />
            </div>
          </div>
        </Card>

        {/* NOTIFICATIONS */}
        <Card className="space-y-6 p-6">
          <div className="mb-6 border-b border-border pb-4">
            <h2 className="font-display text-headline-sm text-secondary">NOTIFICATIONS</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-lg text-text">Daily Digest</p>
              <p className="text-[10px] text-muted">EVERY MORNING AT 08:00</p>
            </div>
            <div className="self-start sm:self-auto">
              <Switch checked={dailyDigest} onCheckedChange={(val) => handleToggle("setting_daily_digest", val, setDailyDigest)} />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-lg text-text">Weekly Progress</p>
              <p className="text-[10px] text-muted">SUNDAY PERFORMANCE RECAP</p>
            </div>
            <div className="self-start sm:self-auto">
              <Switch checked={weeklyProgress} onCheckedChange={(val) => handleToggle("setting_weekly_progress", val, setWeeklyProgress)} />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-lg text-text">Push Alerts</p>
              <p className="text-[10px] text-muted">BROWSER SYSTEM PING</p>
            </div>
            <div className="self-start sm:self-auto">
              <Switch checked={pushAlerts} onCheckedChange={(val) => handleToggle("setting_push_alerts", val, setPushAlerts)} />
            </div>
          </div>
        </Card>

        {/* ACCOUNT */}
        <form onSubmit={handleUpdateIdentity}>
          <Card className="space-y-6 p-6 h-full">
            <div className="mb-6 border-b border-border pb-4">
              <h2 className="font-display text-headline-sm text-tertiary">ACCOUNT</h2>
            </div>
            {updateMsg && (
              <div className={`text-[10px] uppercase font-data ${updateMsg.startsWith("ERR") ? "text-danger" : "text-primary"}`}>
                STATUS: {updateMsg}
              </div>
            )}
            <div>
              <label className="mb-2 block text-label-caps text-muted">DISPLAY NAME</label>
              <input 
                className="sharp-input w-full bg-[#1d2022] text-text border border-outline px-3 py-2" 
                value={displayName} 
                onChange={(e) => setDisplayName(e.target.value)} 
                required
              />
            </div>
            <div>
              <label className="mb-2 block text-label-caps text-muted">EMAIL ADDRESS</label>
              <input 
                className="sharp-input w-full bg-[#1d2022]/40 text-muted border border-outline px-3 py-2 cursor-not-allowed" 
                value={email} 
                disabled 
                readOnly
              />
            </div>
            <Button type="submit" variant="primary" className="h-10 w-full" disabled={isUpdating}>
              {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-background" /> : "UPDATE IDENTITY"}
            </Button>
          </Card>
        </form>

        {/* PRIVACY & SECURITY */}
        <Card className="space-y-6 p-6">
          <div className="mb-6 border-b border-border pb-4">
            <h2 className="font-display text-headline-sm text-danger">PRIVACY & SECURITY</h2>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-lg text-text">Public Profile</p>
              <p className="text-[10px] text-muted">VISIBLE TO THE ECOSYSTEM</p>
            </div>
            <div className="self-start sm:self-auto">
              <Switch checked={publicProfile} onCheckedChange={(val) => handleToggle("setting_public_profile", val, setPublicProfile)} />
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-body-lg text-text">Show Progress</p>
              <p className="text-[10px] text-muted">BROADCAST ACHIEVEMENTS</p>
            </div>
            <div className="self-start sm:self-auto">
              <Switch checked={showProgress} onCheckedChange={(val) => handleToggle("setting_show_progress", val, setShowProgress)} />
            </div>
          </div>
          <Button 
            type="button" 
            className="h-10 w-full hover:bg-surface-high border-outline"
            onClick={() => alert("Multi-Factor authentication core protocols are currently locked. System is stable.")}
          >
            MANAGE TWO-FACTOR AUTH
          </Button>
        </Card>

        {/* LOCAL DATA STORAGE */}
        <Card className="space-y-8 p-6 md:col-span-2">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 items-center justify-center border border-outline bg-[#282A2C]">
                <div className="h-6 w-6 rounded-full border-2 border-primary" />
              </div>
              <div>
                <h2 className="font-display text-headline-sm">LOCAL DATA STORAGE</h2>
                <p className="text-body-lg text-muted">
                  Manage your encrypted offline database nodes.
                </p>
              </div>
            </div>
            <div className="grid w-full grid-cols-1 gap-4 sm:w-auto sm:grid-cols-2">
              <Button type="button" className="w-full sm:min-w-[144px] hover:bg-surface-high" onClick={handleExportJSON}>
                EXPORT JSON
              </Button>
              <Button type="button" variant="danger" className="w-full sm:min-w-[172px]" onClick={handlePurgeAllData} disabled={isUpdating}>
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin text-danger" /> : "PURGE ALL DATA"}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-border bg-surface-dim p-4">
              <p className="text-[10px] text-muted">LOCAL CACHE STATE</p>
              <p className="mt-2 font-data text-data-md text-primary">CONNECTED</p>
            </div>
            <div className="border border-border bg-surface-dim p-4">
              <p className="text-[10px] text-muted">STORAGE QUOTA</p>
              <p className="mt-2 font-data text-data-md text-secondary">5.0 MB MAX</p>
            </div>
            <div className="border border-border bg-surface-dim p-4">
              <p className="text-[10px] text-muted">LAST SYNC EVENT</p>
              <p className="mt-2 font-data text-data-md text-tertiary">JUST NOW</p>
            </div>
            <div className="border border-border bg-surface-dim p-4">
              <p className="text-[10px] text-muted">STABILITY INDEX</p>
              <p className="mt-2 font-data text-data-md text-text">99.8% STABLE</p>
            </div>
          </div>
        </Card>
      </section>

      <footer className="mt-16 border-t border-outline pt-8 text-center">
        <p className="font-data text-data-md tracking-[0.3em] text-border opacity-50">
          SHEETSTRIDE // TERMINAL SETTINGS // 0X44A2
        </p>
      </footer>
    </AppShell>
  );
}
