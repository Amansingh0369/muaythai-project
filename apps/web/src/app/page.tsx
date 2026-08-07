"use client";

import { useState, useCallback, useEffect } from "react";
import IntroAnimation from "@/components/IntroAnimation";
import GroupBatchPopup from "@/components/GroupBatchPopup";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import DirectoryTiles from "@/components/DirectoryTiles";
import MapSection from "@/components/MapSection";
import BurnStrip from "@/components/BurnStrip";
import Footer from "@/components/Footer";

export default function Home() {
  const [showIntro, setShowIntro] = useState(true);

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false);
  }, []);

  // The intro covers the viewport, so keep the page from scrolling behind it.
  useEffect(() => {
    if (!showIntro) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [showIntro]);

  return (
    <div className="bg-background min-h-screen">
      {showIntro && <IntroAnimation onComplete={handleIntroComplete} />}

      {/* Mounted underneath the intro rather than after it, so the hero video
          buffers and reaches PLAYING during the ~2.8s the splash is up. */}
      <main className="relative z-10">
        <Navbar />
        <HeroSection />
        <DirectoryTiles />
        <MapSection />
        <BurnStrip />
        <Footer />
        <GroupBatchPopup />
      </main>
    </div>
  );
}
