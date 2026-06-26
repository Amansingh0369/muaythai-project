"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Flame, Swords, Crown } from "lucide-react";
import { SITE_CONFIG } from "@repo/utils";
import { useAuth } from "@/context/AuthContext";

const HARDCODED_CAMPS = [
  {
    type: "BEGINNER",
    icon: Flame,
    title: "Beginner Experience",
    subtitle: "Your First Fight Camp",
    duration: "7 Days",
    idealFor: "First-timers / Fitness Enthusiasts",
    includes: [
      "2 training sessions per day",
      "Basic Muay Thai techniques",
      "Pad work & conditioning",
      "Beginner-friendly coaching",
      "Full gym access",
    ],
    outcome: "Learn fundamentals + experience real training",
    accent: "from-primary to-orange-deep",
    featured: false,
  },
  {
    type: "INTERMEDIATE",
    icon: Swords,
    title: "Intermediate Training",
    subtitle: "Level Up Your Game",
    duration: "14 Days",
    idealFor: "Regular Trainees / Returning Participants",
    includes: [
      "Advanced techniques & combinations",
      "Sparring sessions",
      "Clinch training",
      "Conditioning & endurance work",
      "Trainer feedback & correction",
    ],
    outcome: "Improved technique + fight understanding",
    accent: "from-blue-electric to-blue-deep",
    featured: true,
  },
  {
    type: "ADVANCED",
    icon: Crown,
    title: "Fighter Camp",
    subtitle: "Intensive. Relentless.",
    duration: "21 Days",
    idealFor: "Serious Trainees / Fighters",
    includes: [
      "High-intensity training (2 daily sessions)",
      "Sparring + clinch-heavy sessions",
      "Fight conditioning programs",
      "Optional fight preparation",
      "Personalized guidance",
    ],
    outcome: "Peak conditioning + real fight readiness",
    accent: "from-primary to-orange-glow",
    featured: false,
  },
];

const FightCampsSection = () => {
  const router = useRouter();
  const { user } = useAuth();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [kind, setKind] = useState<"INDIVIDUAL" | "GROUP">("INDIVIDUAL");

  // Sweep transition state: hide cards → play the big-word sweep → re-reveal cards.
  const [showCards, setShowCards] = useState(true);
  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepKey, setSweepKey] = useState(0);
  const sweepTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (sweepTimer.current) clearTimeout(sweepTimer.current);
    };
  }, []);

  const handleKindChange = (next: "INDIVIDUAL" | "GROUP") => {
    if (next === kind || isSweeping) return;
    setKind(next);
    setShowCards(false);
    setIsSweeping(true);
    setSweepKey((k) => k + 1);
    sweepTimer.current = setTimeout(() => {
      setIsSweeping(false);
      setShowCards(true);
    }, 1500);
  };

  const handleCampSelect = (type: string) => {
    const target = `/packages/${type}?kind=${kind}`;
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent(target)}`);
    } else {
      router.push(target);
    }
  };

  return (
    <section id="camps" ref={ref} className="relative bg-[#050505] py-24 md:py-36 pb-32">

      <div
        className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#050505] to-black z-[2]" />

      {/* ── FULL-SCREEN KIND-SWITCH SWEEP (intro-style takeover) ── */}
      <AnimatePresence>
        {isSweeping && (
          <motion.div
            key={sweepKey}
            className="fixed inset-0 z-[80] flex items-center justify-center overflow-hidden bg-black"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {/* Film grain, matching the intro */}
            <div
              className="absolute inset-0 z-[1] opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                backgroundSize: "128px 128px",
              }}
            />

            {/* Eyebrow caption */}
            <motion.span
              className="absolute top-[32%] font-grotesk text-[10px] md:text-xs tracking-[0.45em] uppercase text-primary z-[3]"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.4, ease: "easeOut" }}
            >
              {kind === "GROUP" ? "Multi-Location Journey" : "Single Location"}
            </motion.span>

            {/* Giant phrase sweeping full-width, left → right */}
            <motion.span
              className="relative z-[2] font-barlow font-black italic text-[12vw] md:text-[8vw] leading-none text-white uppercase whitespace-nowrap select-none"
              initial={{ x: "-55%", opacity: 0 }}
              animate={{ x: "55%", opacity: [0, 1, 1, 0] }}
              transition={{ duration: 1.4, ease: [0.76, 0, 0.24, 1] }}
            >
              {kind === "GROUP" ? "Group Locations" : "Individual Locations"}
            </motion.span>

            {/* Orange echo block sliding across the full screen */}
            <motion.div
              className="absolute inset-y-0 w-1/3 bg-primary mix-blend-difference z-[2]"
              initial={{ x: "-180%" }}
              animate={{ x: "300%" }}
              transition={{ duration: 1.4, ease: "easeInOut" }}
            />

            {/* Loading bar, intro-style */}
            <motion.div
              className="absolute bottom-[30%] w-48 h-[2px] bg-white/15 overflow-hidden z-[3]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <motion.div
                className="absolute top-0 bottom-0 left-0 bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.3, ease: "circInOut" }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-20">

        {/* ── HEADER ── */}
        <motion.div
          className="text-center mb-20"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex justify-center items-center gap-3 mb-6">
            <span className="inline-block w-8 h-[2px] bg-primary" />
            <span className="font-grotesk text-[10px] md:text-xs tracking-[0.45em] uppercase text-primary font-medium">
              Choose Your Experience
            </span>
            <span className="inline-block w-8 h-[2px] bg-primary" />
          </div>

          <h2 className="font-barlow font-black italic text-[14vw] sm:text-[10vw] md:text-[8vw] lg:text-[7vw] leading-[0.85] tracking-[-0.02em] text-white uppercase mix-blend-plus-lighter">
            FIGHT <span className="text-gradient-fire">CAMPS</span>
          </h2>

          <p className="font-grotesk text-sm md:text-base text-white/50 mt-6 max-w-2xl mx-auto leading-relaxed">
            These aren't packages. They're experiences. No matter your level, your camp is waiting for you.
          </p>
        </motion.div>

        {/* ── INDIVIDUAL / GROUP TOGGLE ── */}
        <motion.div
          className="flex flex-col items-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex justify-center p-1 border border-white/10 bg-black/40 backdrop-blur-sm">
            {(["INDIVIDUAL", "GROUP"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleKindChange(option)}
                className={`font-grotesk text-[10px] md:text-xs tracking-[0.3em] uppercase px-6 py-3 transition-all duration-300 ${
                  kind === option
                    ? "bg-primary text-black"
                    : "text-white/50 border border-white/10 hover:text-white/80"
                }`}
              >
                {option === "INDIVIDUAL" ? "Individual" : "Group"}
              </button>
            ))}
          </div>
          <p className="font-grotesk text-xs text-white/40 mt-4 text-center">
            {kind === "INDIVIDUAL"
              ? "Train at a single location"
              : "A journey across multiple locations"}
          </p>
        </motion.div>

        {/* ── CAMP CARDS (with kind-switch sweep) ── */}
        <div className="relative min-h-[560px] md:min-h-[620px]">

          {/* Cards — unmount during the sweep, then stagger back in */}
          <AnimatePresence mode="wait">
            {isInView && showCards && (
              <motion.div
                key={kind}
                className="grid md:grid-cols-3 gap-6 lg:gap-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.25 } }}
              >
                {HARDCODED_CAMPS.map((camp, index) => {
                  const Icon = camp.icon;
                  return (
                    <motion.div
                      key={camp.type}
                      className={`relative group cursor-pointer ${camp.featured ? "md:-mt-6 md:mb-6" : ""}`}
                      initial={{ opacity: 0, y: 50 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => handleCampSelect(camp.type)}
                    >
                <div className={`flex flex-col h-full border border-white/[0.08] p-8 lg:p-10 transition-all [transition-duration:600ms] group-hover:border-primary/40 group-hover:bg-white/[0.04] ${camp.featured ? "bg-white/[0.03] shadow-[0_0_50px_-20px_rgba(255,80,0,0.25)]" : "bg-black/40 backdrop-blur-sm"}`}>

                  <div className={`w-14 h-14 bg-gradient-to-br ${camp.accent} flex items-center justify-center mb-8 shrink-0`}>
                    <Icon className="w-7 h-7 text-black" />
                  </div>

                  <p className="font-grotesk text-[10px] tracking-[0.4em] uppercase text-primary mb-3">
                    {camp.subtitle}
                  </p>
                  <h3 className="font-barlow font-black italic text-3xl md:text-4xl lg:text-5xl text-white uppercase mb-3 leading-[0.85]">
                    {camp.title}
                  </h3>
                  <p className="font-grotesk text-xs text-white/40 mb-10 pb-6 border-b border-white/[0.05]">
                    <span className="text-white/70">{camp.idealFor}</span>
                  </p>

                  <ul className="space-y-4 mb-12 flex-1">
                    {camp.includes.map((item) => (
                      <li key={item} className="flex items-start gap-4">
                        <span className="w-1.5 h-1.5 bg-primary/70 mt-2 shrink-0 group-hover:scale-125 transition-transform duration-300" />
                        <span className="font-grotesk text-[13px] md:text-sm text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-white/[0.08] pt-6 mb-8 mt-auto">
                    <p className="font-grotesk text-[9px] tracking-[0.4em] uppercase text-white/30 mb-3">Outcome</p>
                    <p className="text-sm font-grotesk text-white/80 leading-relaxed">{camp.outcome}</p>
                  </div>

                  <div
                    className={`block w-full text-center py-4 font-barlow font-black text-xs tracking-[0.3em] uppercase transition-all duration-500 overflow-hidden relative isolate ${
                      camp.featured
                        ? "bg-primary text-black hover:bg-white hover:scale-[1.02]"
                        : "bg-transparent border border-white/20 text-white hover:border-primary hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <span className="relative z-10 transition-transform duration-500 group-hover:-translate-x-1 inline-block">Select</span>
                    <span className="relative z-10 mx-1">Camp</span>
                    <span className="relative z-10 transition-transform duration-500 translate-x-4 opacity-0 group-hover:translate-x-1 group-hover:opacity-100 inline-block font-sans">→</span>
                  </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};

export default FightCampsSection;
