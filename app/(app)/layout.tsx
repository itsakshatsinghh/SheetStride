"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Pacman } from "@/components/shared/pacman";

export default function AppRoutesLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#131313] text-primary">
        <div className="w-full max-w-md px-6 text-center space-y-6 flex flex-col items-center">
          <div className="inline-block border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-mono-label uppercase text-primary tracking-widest animate-pulse">
            SECURE_CONNECTION_INITIALIZING
          </div>
          <h1 className="font-display-arcade text-display-arcade tracking-wider animate-pulse text-on-surface">BOOTING_SHEETSTRIDE_</h1>
          <Pacman mode="loading" />
          <p className="font-mono-label text-mono-label text-outline tracking-[0.2em] uppercase">v2.0.0-stable // authorization_gate</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting to /login
  }

  return children;
}
