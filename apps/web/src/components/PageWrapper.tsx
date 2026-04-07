"use client";

import { motion, useScroll, useTransform, useSpring } from "motion/react";
import { ReactNode, useEffect, useState } from "react";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";
import { SITE_CONFIG } from "@repo/utils";

interface PageWrapperProps {
  children: ReactNode;
}

export default function PageWrapper({ children }: PageWrapperProps) {
  const { scrollYProgress } = useScroll();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile(); // Check immediately on mount
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Apply heavily damped, high-mass physics SPECIFICALLY for mobile
  // so fast swiping doesn't cause snappy jumps.
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: isMobile ? 60 : 150,
    damping: isMobile ? 40 : 35,
    mass: isMobile ? 1.5 : 0.5,
    restDelta: 0.001
  });

  // Top of page: scale 0.96, rounded corners.
  // Slightly scrolled: full screen, square corners.
  // On mobile we completely remove the shrinking wrapper effect to maintain a standard 100% width layout
  const scale = useTransform(
    smoothProgress,
    [0, 0.025, 0.97, 1],
    isMobile ? [1, 1, 1, 1] : [0.96, 1, 1, 0.96]
  );

  // 60FPS Optimization: Animating border-radius on a wrapper with overflow-hidden forces
  // layout mask repaints on mobile. We use STABLE rounded corners on mobile (no animating) 
  // so it still looks like a floating wrapper without tanking FPS.
  const borderRadius = useTransform(
    smoothProgress,
    [0, 0.025, 0.97, 1],
    isMobile ? ["0px", "0px", "0px", "0px"] : ["40px", "0px", "0px", "64px"]
  );

  const originY = useTransform(smoothProgress, [0, 1], [1, 0]);

  return (
    <div className="bg-primary min-h-screen w-full select-none">
      {/* 
        This motion div shrinks slightly at the top and bottom to reveal the orange background.
        We use an inner box shadow or ring for a cleaner edge when zooming out.
      */}
      <motion.main
        style={{ scale, borderRadius, originY }}
        className="bg-background min-h-screen w-full overflow-clip flex flex-col will-change-transform md:shadow-[0_0_100px_rgba(0,0,0,0.6)] border border-white/5 relative z-10"
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
