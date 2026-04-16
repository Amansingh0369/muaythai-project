"use client";

import React, { ReactNode } from "react";
import { SITE_CONFIG } from "@repo/utils";
import { TextHoverEffect } from "@/components/ui/hover-footer";

interface StickyRevealProps {
  children: ReactNode;
}

export default function StickyReveal({ children }: StickyRevealProps) {
  return (
    <div className="relative min-h-screen bg-primary">
      {/* 
        MAIN CONTENT LAYER
        We give it a bottom margin matching the height of the reveal area.
        Using a solid background and higher z-index so it covers the footer when scrolled up.
      */}
      <main className="relative z-10 min-h-screen bg-background mb-[16vw] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-b border-white/5">
        {children}
      </main>

      {/* 
        REVEAL LAYER (Brand Signature)
        This stays fixed at the bottom of the viewport with a lower z-index.
        It is revealed as the main content's margin-bottom passes through the viewport.
      */}
      <footer className="fixed bottom-0 left-0 w-full h-[18vw] z-0 bg-primary overflow-hidden flex items-end justify-center">
        <div className="w-full relative z-10 flex items-end justify-center px-4">
          <TextHoverEffect text={SITE_CONFIG.brand} className="w-full h-auto translate-y-[2%]" />
        </div>
      </footer>
    </div>
  );
}
