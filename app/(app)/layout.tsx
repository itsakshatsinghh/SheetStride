"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

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
      <div className="flex min-h-screen items-center justify-center bg-background text-primary font-display">
        <div className="space-y-4 text-center">
          <div className="inline-block border border-primary px-3 py-1 text-label-caps uppercase text-primary animate-pulse mb-2">
            SECURE_CONNECTION_INITIALIZING
          </div>
          <h1 className="text-headline-lg tracking-wider animate-pulse">BOOTING_SHEETSTRIDE_</h1>
          <p className="text-label-caps text-muted tracking-[0.2em]">v1.0.4-stable // authorization_gate</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Redirecting to /login
  }

  return children;
}
