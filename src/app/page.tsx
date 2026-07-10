"use client";

import { useState, useCallback } from "react";
import { useAudio } from "@/components/providers/AudioProvider";
import { LoadingScreen } from "@/components/sections/LoadingScreen";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { DynamicEvents } from "@/components/sections/DynamicEvents";
import { DynamicAnnouncements } from "@/components/sections/DynamicAnnouncements";
import { DynamicGallery } from "@/components/sections/DynamicGallery";
import { OfficersSection } from "@/components/sections/OfficersSection";
import { DepartmentsSection } from "@/components/sections/DepartmentsSection";
import { AboutSection } from "@/components/sections/AboutSection";
import { MembershipForm } from "@/components/sections/MembershipForm";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { PremiumFooter } from "@/components/sections/Footer";
import { SectionDivider } from "@/components/layout/SectionDivider";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const { play } = useAudio();

  const handleLoadingComplete = useCallback(() => {
    setLoading(false);
    play();
  }, [play]);

  return (
    <>
      {loading && <LoadingScreen onComplete={handleLoadingComplete} />}
      {!loading && (
        <>
          <Navbar />
          <main id="main-content">
            <Hero />
            <SectionDivider />
            <DynamicAnnouncements />
            <SectionDivider />
            <DynamicEvents />
            <SectionDivider />
            <OfficersSection />
            <SectionDivider />
            <DepartmentsSection />
            <SectionDivider />
            <DynamicGallery />
            <SectionDivider />
            <AboutSection />
            <SectionDivider />
            <MembershipForm />
            <SectionDivider />
            <SkillsSection />
            <SectionDivider />
            <ExperienceSection />
            <SectionDivider />
            <ContactSection />
          </main>
          <PremiumFooter />
        </>
      )}
    </>
  );
}
