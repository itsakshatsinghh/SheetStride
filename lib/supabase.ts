if (typeof global !== "undefined" && typeof (global as any).WebSocket === "undefined") {
  (global as any).WebSocket = class {};
}

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase credentials missing. Check your .env.local file.");
}

// Fallback values prevent build/prerender errors during deployment (e.g., on Render) when environment variables are not available.
export const supabase = createClient(
  supabaseUrl || "https://placeholder-co-to-prevent-build-errors.supabase.co",
  supabaseAnonKey || "placeholder-key-to-prevent-build-errors"
);

