import { Metadata } from "next";
import { AppShell } from "@/components/app/shell";
import { PatternsLandingClient } from "./patterns-landing-client";

export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "Patterns & Challenges Hub | SheetStride",
  description: "Learn core algorithmic blueprints in the Pattern Atlas or test coding interview intuition in the Training Ground.",
};

export default function PatternsPage() {
  return (
    <AppShell className="max-w-container-max mx-auto px-gutter py-6" gridBackground>
      <PatternsLandingClient />
    </AppShell>
  );
}
