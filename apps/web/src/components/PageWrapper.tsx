"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { ReactNode } from "react";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";
import { SITE_CONFIG } from "@repo/utils";

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const { scrollYProgress } = useScroll();

  // Top of page: scale 0.96, rounded corners.
  // Slightly scrolled (0.05): full screen, square corners.
  // Near bottom (0.95): full screen, square corners.
  // Very bottom (1.0): scale 0.96, rounded corners.

  const scale = useTransform(scrollYProgress, [0, 0.009, 0.96, 1], [0.97, 1, 1, 0.96]);
  const borderRadius = useTransform(scrollYProgress, [0, 0.009, 0.96, 1], ["40px", "0px", "0px", "64px"]);
  const originY = useTransform(scrollYProgress, [0, 1], [1, 0]);

  return (
    <div className="bg-primary min-h-screen w-full select-none">
      {/* 
        This motion div shrinks slightly at the top and bottom to reveal the orange background.
        We use an inner box shadow or ring for a cleaner edge when zooming out.
      */}
      <motion.main
        style={{ scale, borderRadius, originY }}
        className="bg-background min-h-screen w-full overflow-clip flex flex-col will-change-transform shadow-[0_0_100px_rgba(0,0,0,0.6)] border border-white/5 relative z-10"
      >
        {children}
      </motion.main>

      {/* Massive parallax footer text underneath the main site content */}
      <div className="relative w-full h-[12vw] z-0 overflow-hidden bg-primary pointer-events-auto flex items-end justify-center">
        <FooterBackgroundGradient />
        <motion.div
          className="w-full relative z-10 flex items-end justify-center px-4"
        >
          <TextHoverEffect text={SITE_CONFIG.brand} className="w-full h-auto translate-y-[2%]" />
        </motion.div>
      </div>
    </div>
  );
}
