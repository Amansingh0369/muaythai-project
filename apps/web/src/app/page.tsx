"use client";

import { useState, useCallback } from "react";
import IntroAnimation from "@/components/IntroAnimation";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DirectoryTiles from "@/components/DirectoryTiles";
import BurnStrip from "@/components/BurnStrip";
import Footer from "@/components/Footer";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  return (
    <div className="bg-background min-h-screen">
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}
      {!showIntro && (
        <main className="relative z-10">
          <Navbar />
          <HeroSection />
          <DirectoryTiles />
          <BurnStrip />
          <Footer />
        </main>
      )}
    </div>
  );
}
