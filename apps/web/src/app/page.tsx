"use client";

import { CtaShowcaseSection } from "@/features/landing/ui/CtaShowcaseSection";
import { LandingFollowupSection } from "@/features/landing/ui/LandingFollowupSection";
import { LandingHeader } from "@/features/landing/ui/LandingHeader";
import { LandingHeroSection } from "@/features/landing/ui/LandingHeroSection";
import { LandingInterviewerSection } from "@/features/landing/ui/LandingInterviewerSection";
import { LearningShowcaseSection } from "@/features/landing/ui/LearningShowcaseSection";
import { ReportShowcaseSection } from "@/features/landing/ui/ReportShowcaseSection";
import { useLandingAuth } from "@/features/landing/model/useLandingAuth";

export default function HomePage() {
  const { isLoggedIn, isLoginLoading, handleLogin, handleLogout } = useLandingAuth();

  return (
    <div className="relative flex min-h-dvh flex-col bg-white font-display">
      <LandingHeader isLoggedIn={isLoggedIn} isLoginLoading={isLoginLoading} onLogin={handleLogin} onLogout={handleLogout} />

      <main className="relative z-[1] flex flex-1 flex-col">
        <LandingHeroSection />

        <section className="bg-white px-6 py-24 md:py-32">
          <div className="mx-auto max-w-6xl space-y-32">
            <LandingInterviewerSection />
            <LandingFollowupSection />

            <div className="space-y-24">
              <ReportShowcaseSection />
              <LearningShowcaseSection />
            </div>

            <CtaShowcaseSection />
          </div>
        </section>
      </main>
    </div>
  );
}
