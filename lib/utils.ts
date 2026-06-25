import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function sanitizeSocialInput(value: string, platform: "github" | "linkedin" | "instagram"): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  // If it starts with a protocol, parse and validate it as a URL
  if (/^(https?:\/\/)/i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      const host = url.hostname.toLowerCase();
      const domainMap = {
        github: "github.com",
        linkedin: "linkedin.com",
        instagram: "instagram.com"
      };
      const expectedDomain = domainMap[platform];
      if (host === expectedDomain || host.endsWith("." + expectedDomain)) {
        return `https://${url.hostname}${url.pathname}${url.search}`;
      } else {
        throw new Error(`URL must belong to ${expectedDomain}`);
      }
    } catch {
      throw new Error(`Invalid URL format for ${platform}`);
    }
  }

  // If it's a raw username, restrict characters to safe alphanumeric ones
  if (/^[a-zA-Z0-9_\-\.]+$/.test(trimmed)) {
    return trimmed;
  }

  throw new Error(`Invalid username or URL format for ${platform}`);
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export async function fetchWithCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttlMs = 300000 // 5 minutes default
): Promise<T> {
  if (typeof window === "undefined") {
    return fetchFn();
  }

  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed: CacheItem<T> = JSON.parse(cached);
      const isExpired = Date.now() - parsed.timestamp > ttlMs;
      if (!isExpired) {
        return parsed.data;
      }
    }
  } catch (err) {
    console.warn(`Cache read failed for key ${key}:`, err);
  }

  const freshData = await fetchFn();

  try {
    const cacheItem: CacheItem<T> = {
      data: freshData,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheItem));
  } catch (err) {
    console.warn(`Cache write failed for key ${key}:`, err);
  }

  return freshData;
}

// Invalidate dynamic user-progress cache keys on solve state changes
if (typeof window !== "undefined") {
  const handleCacheClear = () => {
    try {
      const keysToClear = [
        "dashboard_data_cache",
        "user_progress_cache"
      ];
      // Clear exact matching dashboard/progress keys
      keysToClear.forEach(k => localStorage.removeItem(k));
      
      // Clear dynamic company/pattern questions checklist caches (using prefix)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (
          key.startsWith("company_questions_cache_") || 
          key.startsWith("pattern_questions_cache_") ||
          key.startsWith("topic_patterns_cache_") ||
          key.startsWith("core_topics_cache_") ||
          key.startsWith("questions_hub_stats_") ||
          key.startsWith("profile_data_cache_") ||
          key.startsWith("progress_data_cache_") ||
          key.startsWith("user_solves_cache_") ||
          key.startsWith("leetcode_universe_questions_cache_")
        )) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));
    } catch (err) {
      console.warn("Failed to clear local caches on solve event:", err);
    }
  };

  window.addEventListener("question-solved", handleCacheClear);
}


