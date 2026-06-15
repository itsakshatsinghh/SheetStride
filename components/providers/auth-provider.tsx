"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithGithub: () => Promise<void>;
  loginWithEmail: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getMockDevSession(): Session {
  const mockUser: User = {
    id: "00000000-0000-0000-0000-000000000000",
    email: "developer@sheetstride.com",
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    role: "authenticated"
  };
  return {
    access_token: "mock-token",
    token_type: "bearer",
    expires_in: 3600,
    refresh_token: "mock-refresh",
    user: mockUser
  };
}

function syncSessionCookies(session: Session | null) {
  if (typeof document === "undefined") return;
  if (session) {
    document.cookie = `sb-access-token=${session.access_token}; path=/; max-age=${session.expires_in}; SameSite=Lax; Secure`;
    document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; max-age=604800; SameSite=Lax; Secure`;
  } else {
    document.cookie = `sb-access-token=; path=/; max-age=0; SameSite=Lax; Secure`;
    document.cookie = `sb-refresh-token=; path=/; max-age=0; SameSite=Lax; Secure`;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session && process.env.NODE_ENV === "development") {
        const mockSession = getMockDevSession();
        setSession(mockSession);
        setUser(mockSession.user);
        syncSessionCookies(mockSession);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      syncSessionCookies(session);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session && process.env.NODE_ENV === "development") {
        const mockSession = getMockDevSession();
        setSession(mockSession);
        setUser(mockSession.user);
        syncSessionCookies(mockSession);
        setLoading(false);
        return;
      }
      setSession(session);
      setUser(session?.user ?? null);
      syncSessionCookies(session);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const loginWithGithub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const loginWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) throw error;
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        loginWithGoogle,
        loginWithGithub,
        loginWithEmail,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
