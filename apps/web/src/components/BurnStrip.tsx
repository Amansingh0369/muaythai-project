"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { BurnTransitionBottom } from "./BurnCanvas";
import { SITE_CONFIG } from "@repo/utils";

export default function BurnStrip() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const contentY = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.95, 1.05]);

  return (
    <section ref={ref} className="relative w-full overflow-hidden h-[80svh] min-h-[600px] flex items-center justify-center bg-[#2c0404] z-10">
      {/* Dynamic Background that blends into the canvas unburned #2c0404 color */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-700 via-red-900 to-[#2c0404] opacity-90" />

      {/* Noise grain texture */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Main Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center text-center px-6 w-full"
        style={{ y: contentY, scale }}
      >
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span className="inline-block w-8 h-[2px] bg-primary" />
          <span className="font-grotesk text-[10px] md:text-xs tracking-[0.45em] uppercase text-primary font-medium">
            Next Level Training
          </span>
          <span className="inline-block w-8 h-[2px] bg-primary" />
        </motion.div>

        <motion.h2
          className="font-barlow font-black italic text-[15vw] sm:text-[12vw] md:text-[10vw] lg:text-[8vw] leading-[0.85] tracking-[-0.01em] text-white uppercase mix-blend-plus-lighter"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: true }}
        >
          EMBRACE<br />
          <span className="text-gradient-fire">THE BURN</span>
        </motion.h2>

        <motion.p
          className="font-grotesk text-sm md:text-base text-white/50 max-w-lg mt-8 leading-relaxed"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          viewport={{ once: true }}
        >
          Push beyond your limits. When you step into our camps, you leave your comfort zone behind.
        </motion.p>
      </motion.div>

      {/* Ticker from HeroSection, placed near bottom but slightly above the burn canvas overhang */}
      <div className="absolute bottom-32 left-0 right-0   border-t border-b border-white/[0.05] bg-black/20 backdrop-blur-sm -skew-y-2 translate-y-8">
        <motion.div
          className="flex gap-8 whitespace-nowrap py-3 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
        >
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="font-barlow font-black text-[12px] md:text-sm tracking-[0.4em] uppercase text-white/20 px-6"
            >
              {SITE_CONFIG.brand} · FORGE YOUR LEGACY · BURN THE BOATS ·
            </span>
          ))}
        </motion.div>
      </div>

      {/* The overlapping Burn Component */}
      <BurnTransitionBottom height={950} />
    </section>
  );
}
