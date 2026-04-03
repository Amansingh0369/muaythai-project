import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { SITE_CONFIG } from "@repo/utils";
import logo from "@/assets/logo.png";

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    // Start curtain-raise exit transition
    const timer1 = setTimeout(() => setPhase("exit"), 2400);
    // Remove component entirely
    const timer2 = setTimeout(() => onComplete(), 3200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden"
        initial={{ y: 0 }}
        animate={phase === "exit" ? { y: "-100vh" } : { y: 0 }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      >
        <div className="relative flex flex-col items-center justify-center w-full">
          {/* Intense ambient fire glow behind logo */}
          <motion.div
            className="absolute w-[200px] h-[200px] md:w-[400px] md:h-[400px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 60%)",
              filter: "blur(40px)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1.5, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />

          {/* Premium Clean Logo Reveal */}
          <motion.img
            src={logo.src}
            alt="Brand Logo"
            className="w-24 h-24 md:w-32 md:h-32 mb-6 rounded-full shadow-[0_0_50px_hsl(var(--primary)/0.3)] relative z-20 border border-primary/20"
            initial={{ scale: 0.8, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          />

          {/* MUAY THAI - massive impact */}
          <motion.h1
            className="font-display text-5xl md:text-[8rem] lg:text-[12rem] leading-none text-foreground relative z-20 tracking-tight"
            initial={{ scale: 0.9, opacity: 0, filter: "blur(5px)", y: 10 }}
            animate={{ scale: 1, opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{
              duration: 1,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.7,
            }}
          >
            MUAY THAI
          </motion.h1>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntroAnimation;
