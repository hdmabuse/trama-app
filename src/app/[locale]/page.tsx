import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Suspense } from "react";
import { HeroSectionWrapper } from "@/components/landing/HeroSectionWrapper";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { FinalCTA } from "@/components/landing/FinalCTA";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TRAMA — Análise Qualitativa Reflexiva",
  description:
    "O dado não existia antes do encontro. Você o produziu. Ferramenta de análise qualitativa sem IA, sem nuvem, em português. AGPL-3.0.",
};

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main>
      <Suspense fallback={<div className="min-h-screen" />}>
        <HeroSectionWrapper />
      </Suspense>
      <HowItWorks />
      <FinalCTA />
    </main>
  );
}
