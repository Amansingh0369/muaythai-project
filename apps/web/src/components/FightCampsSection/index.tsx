"use client";

import { Suspense, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Loader2 } from "lucide-react";
import GroupCampsBrowser from "./GroupCampsBrowser";

/** Group camps listing, under the "Fight Camps" banner. */
const FightCampsSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="camps" ref={ref} className="relative bg-[#050505] py-24 md:py-36 pb-32">
      <div
        className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[#0a0a0a] to-black z-[2]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
        {/* ── HEADER ── */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex justify-center items-center gap-3 mb-6">
            <span className="inline-block w-8 h-[2px] bg-primary" />
            <span className="font-grotesk text-[12px] md:text-[13px] tracking-[0.45em] uppercase text-primary font-medium">
              Choose Your Experience
            </span>
            <span className="inline-block w-8 h-[2px] bg-primary" />
          </div>

          <h2 className="font-barlow font-black italic text-[14vw] sm:text-[10vw] md:text-[8vw] lg:text-[7vw] leading-[0.85] tracking-[-0.02em] text-white uppercase mix-blend-plus-lighter">
            FIGHT <span className="text-gradient-fire">CAMPS</span>
          </h2>

          <p className="font-grotesk text-sm md:text-base text-white/70 mt-6 max-w-2xl mx-auto leading-relaxed">
            A journey across multiple locations, trained together as a squad. Pick your month and
            we'll show you every camp heading out.
          </p>
        </motion.div>

        {/* ── GROUP CAMPS ── */}
        <Suspense
          fallback={
            <div className="flex justify-center py-24">
              <Loader2 className="animate-spin text-primary w-10 h-10" />
            </div>
          }
        >
          <GroupCampsBrowser />
        </Suspense>
      </div>
    </section>
  );
};

export default FightCampsSection;
