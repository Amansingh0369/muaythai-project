import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { SITE_CONFIG } from "@repo/utils";

interface IntroAnimationProps {
  onComplete: () => void;
}

const IntroAnimation = ({ onComplete }: IntroAnimationProps) => {
  const [phase, setPhase] = useState<"scale" | "exit">("scale");

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("exit"), 2400);
    const timer2 = setTimeout(() => onComplete(), 3200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? null : null}
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-background"
        initial={{ opacity: 1 }}
        animate={phase === "exit" ? { opacity: 0 } : { opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
        onAnimationComplete={() => {
          if (phase === "exit") onComplete();
        }}
      >
        <div className="relative flex flex-col items-center">
          {/* Orange glow behind */}
          <motion.div
            className="absolute w-[300px] h-[300px] md:w-[500px] md:h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(24 95% 46% / 0.15) 0%, transparent 70%)",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 2, opacity: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />


          {/* MUAY THAI */}
          <motion.h1
            className="font-display text-7xl md:text-[10rem] lg:text-[14rem] leading-none text-gradient-fire relative z-10"
            initial={{ scale: 0.3, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              duration: 1.2,
              ease: [0.16, 1, 0.3, 1],
              delay: 0.5,
            }}
          >
            {SITE_CONFIG.brand.split(" ").slice(2).join(" ")}
          </motion.h1>

          {/* Horizontal lines */}
          {/* <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-0"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
          >
            <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </motion.div> */}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default IntroAnimation;
