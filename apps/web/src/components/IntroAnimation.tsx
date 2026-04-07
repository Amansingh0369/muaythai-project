import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { SITE_CONFIG } from "@repo/utils";

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    // Shorter, punchier intro duration for GenZ feel
    const timer1 = setTimeout(() => setPhase("exit"), 2000);
    const timer2 = setTimeout(() => onComplete(), 2800);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black overflow-hidden"
        initial={{ y: 0 }}
        animate={phase === "exit" ? { y: "-100vh" } : { y: 0 }}
        transition={{ duration: 0.7, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* Film grain noise over the intro */}
        <div
          className="absolute inset-0 z-[1] opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />

        <div className="relative z-10 flex flex-col items-center justify-center w-full px-4">
          
          {/* Eyebrow text flashing in */}
          <motion.div
            className="font-grotesk text-[10px] md:text-[12px] tracking-[0.45em] uppercase text-primary mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: [0, 1, 0, 1], scale: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            Initializing
          </motion.div>

          <div className="relative">
            {/* The primary massive logo text */}
            <motion.h1
              className="font-barlow font-black italic text-[18vw] sm:text-[14vw] md:text-[12vw] leading-none text-white uppercase text-center"
              style={{ paddingRight: "0.05em" }}
              initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {SITE_CONFIG.brand}
            </motion.h1>

             {/* An orange glitch/echo block sliding behind */}
            <motion.div
               className="absolute inset-0 bg-primary mix-blend-difference"
               initial={{ x: "-100%" }}
               animate={{ x: "100%" }}
               transition={{ duration: 0.8, delay: 0.5, ease: "easeInOut" }}
            />
          </div>

          {/* Loading bar */}
          <motion.div 
            className="w-48 h-[2px] bg-white/20 mt-12 overflow-hidden relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <motion.div 
              className="absolute top-0 bottom-0 left-0 bg-primary"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2, delay: 0.7, ease: "circInOut" }}
            />
          </motion.div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntroAnimation;
