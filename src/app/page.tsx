"use client";

import { useState, useCallback } from "react";
import { useAudio } from "@/components/providers/AudioProvider";
import { LoadingScreen } from "@/components/sections/LoadingScreen";
import { Navbar } from "@/components/sections/Navbar";
import { Hero } from "@/components/sections/Hero";
import { EventsSection } from "@/components/sections/EventsSection";
import { OfficersSection } from "@/components/sections/OfficersSection";
import { DepartmentsSection } from "@/components/sections/DepartmentsSection";
import { GallerySection } from "@/components/sections/GallerySection";
import { AboutSection } from "@/components/sections/AboutSection";
import { MembershipForm } from "@/components/sections/MembershipForm";
import { SkillsSection } from "@/components/sections/SkillsSection";
import { ExperienceSection } from "@/components/sections/ExperienceSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { SectionDivider } from "@/components/layout/SectionDivider";
import { MusicPlayer } from "@/components/ui/MusicPlayer";

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
          <main>
            <Hero />
            <SectionDivider />
            <EventsSection />
            <SectionDivider />
            <OfficersSection />
            <SectionDivider />
            <DepartmentsSection />
            <SectionDivider />
            <GallerySection />
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
          <MusicPlayer />
        </>
      )}
    </>
  );
}
