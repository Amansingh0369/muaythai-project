"use client";

import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import { benefits } from "./MuayThaiSection.helpers";

const MuayThaiSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section
      id="muaythai"
      ref={ref}
      className="relative bg-black overflow-hidden px-6 md:px-12 lg:px-20 py-24 md:py-36"
    >
      {/* Noise grain */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* Ambient glow */}
      <div
        className="absolute bottom-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(24 95% 46% / 0.06) 0%, transparent 70%)" }}
      />

      {/* Horizontal rule top */}
      <div className="absolute top-0 left-6 md:left-12 lg:left-20 right-6 md:right-12 lg:right-20 h-px bg-white/[0.06]" />

      <div className="relative z-10 max-w-7xl mx-auto">

        {/* ── HEADER ── */}
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-end mb-16 md:mb-24">
          <div>
            <motion.div
              className="flex items-center gap-3 mb-5"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.7 }}
            >
              <span className="inline-block w-6 h-[2px] bg-primary" />
              <span className="font-grotesk text-[10px] tracking-[0.45em] uppercase text-primary font-medium">
                The Art of Eight Limbs
              </span>
            </motion.div>

            <div className="overflow-hidden">
              <motion.h2
                className="font-barlow font-black italic text-[13vw] sm:text-[9vw] md:text-[7vw] lg:text-[6vw] xl:text-[5.5vw] leading-[0.88] tracking-[-0.01em] text-white uppercase"
                initial={{ y: "100%", opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                WHAT IS<br />
                <span className="text-gradient-fire">MUAY THAI</span>
              </motion.h2>
            </div>

            <motion.div
              className="w-12 h-[2px] bg-primary mt-6"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
              style={{ transformOrigin: "left" }}
            />
          </div>

          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.45, duration: 0.7 }}
          >
            <p className="font-grotesk text-[13px] md:text-sm text-white/45 leading-relaxed">
              Muay Thai is a striking martial art from Thailand that uses punches, kicks, elbows, and knees. But beyond techniques, it's a system built on discipline, conditioning, and control.
            </p>
            <p className="font-grotesk text-[13px] md:text-sm text-white/45 leading-relaxed">
              Every movement has purpose. Every session builds both physical and mental strength. It's not just about learning how to fight — it's about learning how to push limits, stay composed under pressure, and develop real confidence.
            </p>
          </motion.div>
        </div>

        {/* ── HISTORY STRIP ── */}
        <motion.div
          className="glass-surface border border-white/[0.06] p-8 md:p-12 mb-16 md:mb-24 relative overflow-hidden group"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.55, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Left accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary" />

          <div className="pl-6 md:pl-8">
            <span className="font-grotesk text-[10px] tracking-[0.45em] uppercase text-primary font-medium block mb-4">
              History
            </span>
            <h3 className="font-barlow font-black italic text-2xl md:text-4xl text-white uppercase leading-[0.9] mb-5">
              FROM ANCIENT BATTLEFIELDS<br className="hidden md:block" /> TO MODERN STADIUMS
            </h3>
            <p className="font-grotesk text-[13px] md:text-sm text-white/45 leading-relaxed max-w-3xl">
              Muay Thai originated in Thailand centuries ago as a battlefield combat system. Over time, it evolved from survival into a national sport deeply rooted in Thai culture. From ancient warriors to modern stadiums, it has remained true to its core — discipline, respect, and resilience. Today, it is practiced worldwide, but its heart still lies in Thailand.
            </p>
          </div>

          {/* Hover glow */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
            style={{ background: "radial-gradient(circle at 0% 50%, hsl(24 95% 46% / 0.04) 0%, transparent 60%)" }}
          />
        </motion.div>

        {/* ── WHY MUAY THAI ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.65, duration: 0.6 }}
        >
          <div className="flex items-center gap-3 mb-10">
            <span className="inline-block w-6 h-[2px] bg-primary" />
            <span className="font-grotesk text-[10px] tracking-[0.45em] uppercase text-primary font-medium">
              Why Muay Thai
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              const isActive = activeIndex === index;
              return (
                <motion.div
                  key={benefit.title}
                  className="glass-surface group relative border border-white/[0.06] p-5 md:p-6 overflow-hidden cursor-default transition-all duration-500 hover:border-primary/20"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.7 + index * 0.06, duration: 0.5 }}
                  onHoverStart={() => setActiveIndex(index)}
                  onHoverEnd={() => setActiveIndex(null)}
                >
                  {/* Hover glow */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 50% 0%, hsl(24 95% 46% / 0.07) 0%, transparent 70%)" }}
                  />

                  <Icon className="w-5 h-5 text-primary mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10" />

                  <h4 className="font-barlow font-bold italic text-[13px] md:text-sm tracking-[0.1em] uppercase text-white mb-2 relative z-10">
                    {benefit.title}
                  </h4>
                  <p className="font-grotesk text-[11px] md:text-xs text-white/40 group-hover:text-white/60 transition-colors duration-300 leading-relaxed relative z-10">
                    {benefit.desc}
                  </p>

                  {/* Bottom accent line */}
                  <motion.div
                    className="absolute bottom-0 left-0 h-[2px] bg-primary"
                    initial={{ width: "0%" }}
                    animate={{ width: isActive ? "100%" : "0%" }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  />
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MuayThaiSection;
