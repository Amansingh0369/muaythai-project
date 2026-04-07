"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  CheckCircle,
  Users,
  Dumbbell,
  Globe,
  Award,
  Layers,
  UserCheck,
  Sparkles,
} from "lucide-react";
import { SITE_CONFIG } from "@repo/utils";

const iconMap = [
  CheckCircle,
  Globe,
  Users,
  UserCheck,
  Layers,
  Dumbbell,
  Award,
  Sparkles,
];

const highlights = SITE_CONFIG.highlights.map((item, index) => ({
  ...item,
  icon: iconMap[index],
}));

const HighlightsSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative z-30 bg-[#121212] px-6 md:px-12 lg:px-20 py-24 md:py-36"
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
        className="absolute top-1/2 left-0 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(24 95% 46% / 0.06) 0%, transparent 70%)" }}
      />

      {/* Horizontal rule top */}
      <div className="absolute top-0 left-6 md:left-12 lg:left-20 right-6 md:right-12 lg:right-20 h-px bg-white/[0.06]" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16 md:gap-24 items-start">

          {/* ── LEFT: Headline ── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.div
              className="flex items-center gap-3 mb-5"
              initial={{ opacity: 0, x: -20 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1, duration: 0.7 }}
            >
              <span className="inline-block w-6 h-[2px] bg-primary" />
              <span className="font-grotesk text-[10px] tracking-[0.45em] uppercase text-primary font-medium">
                What Sets Us Apart
              </span>
            </motion.div>

            <div className="overflow-hidden mb-3">
              <motion.h2
                className="font-barlow font-black italic text-[13vw] sm:text-[9vw] md:text-[7vw] lg:text-[6vw] xl:text-[5.5vw] leading-[0.88] tracking-[-0.01em] text-white uppercase"
                initial={{ y: "100%", opacity: 0 }}
                animate={isInView ? { y: 0, opacity: 1 } : {}}
                transition={{ delay: 0.25, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                NOT JUST A<br />
                <span className="text-gradient-fire">WORKOUT</span>
              </motion.h2>
            </div>

            <motion.div
              className="w-12 h-[2px] bg-primary mb-8"
              initial={{ scaleX: 0 }}
              animate={isInView ? { scaleX: 1 } : {}}
              transition={{ delay: 0.5, duration: 0.5, ease: "easeOut" }}
              style={{ transformOrigin: "left" }}
            />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.55, duration: 0.7 }}
              className="space-y-5"
            >
              <p className="font-grotesk text-[13px] md:text-sm text-white/45 leading-relaxed max-w-sm">
                We offer a complete Muay Thai experience. Our fight camps give you access to authentic, fighter-level training in the birthplace of Muay Thai.
              </p>
              <div className="flex items-start gap-4">
                <div className="w-[3px] self-stretch min-h-[2.5rem] bg-primary shrink-0" />
                <p className="font-barlow font-bold italic text-[15px] md:text-base tracking-[0.05em] uppercase text-primary/80">
                  "Whether you're here to train, explore, or transform — this is where it starts."
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── RIGHT: Grid ── */}
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  className="glass-surface group flex items-start gap-4 p-5 border border-white/[0.06] hover:border-primary/20 transition-all duration-500 relative overflow-hidden"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.35 + index * 0.06, duration: 0.5 }}
                >
                  {/* Hover glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 0% 0%, hsl(24 95% 46% / 0.05) 0%, transparent 60%)" }}
                  />
                  <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  <span className="font-grotesk text-[12px] md:text-sm text-white/60 group-hover:text-white/80 transition-colors duration-300 leading-relaxed">
                    {item.text}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HighlightsSection;
