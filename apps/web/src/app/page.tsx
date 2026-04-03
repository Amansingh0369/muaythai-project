"use client";

import { useState, useCallback } from "react";
import IntroAnimation from "@/components/IntroAnimation";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import AboutSection from "@/components/AboutSection";
import HighlightsSection from "@/components/HighlightsSection";
import FightCampsSection from "@/components/FightCampsSection";
import LocationsSection from "@/components/LocationsSection";
import MuayThaiSection from "@/components/MuayThaiSection";
import Footer from "@/components/Footer";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  return (
    <>
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      {!showIntro && (
        <div className="bg-background min-h-screen">
          <Navbar />
          <HeroSection />
          <AboutSection />
          <HighlightsSection />
          <FightCampsSection />
          <LocationsSection />
          <MuayThaiSection />
          <Footer />
        </div>
      )}
    </>
  );
}
