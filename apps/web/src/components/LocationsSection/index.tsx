"use client";

import { motion, useInView, AnimatePresence, useScroll, useMotionValueEvent } from "motion/react";
import { useRef, useState, useMemo } from "react";
import { SITE_CONFIG } from "@repo/utils";
import { TextRotate, TextRotateRef } from "@/components/ui/text-rotate";
import { MapPin, Clock, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { locations } from "./LocationsSection.helpers";

const LocationsSection = () => {
  const { user } = useAuth();
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const textRotateRef = useRef<TextRotateRef>(null);
  const vibeRotateRef = useRef<TextRotateRef>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const handleSecureSpotClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push("/login?redirect=/#camps");
    }
  };

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const sectionCount = locations.length;
    const newIndex = Math.min(Math.floor(latest * sectionCount), sectionCount - 1);
    if (newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      textRotateRef.current?.jumpTo(newIndex);
      vibeRotateRef.current?.jumpTo(newIndex);
    }
  });

  const activeLocation = locations[activeIndex];
  const totalHeight = useMemo(() => `${locations.length * 100}svh`, []);

  return (
    <section
      id="locations"
      ref={sectionRef}
      className="relative bg-black transition-colors duration-1000"
      style={{ height: totalHeight, "--loc-theme": activeLocation.themeColor } as React.CSSProperties}
    >
      {/* Sticky Content Wrapper */}
      <div className="sticky top-0 h-[100dvh] w-full overflow-hidden">

        {/* Immersive Background Images */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeLocation.name}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={activeLocation.image.src}
                alt={activeLocation.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-black/20 to-black/80" />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col justify-center h-full px-4 sm:px-6 md:px-12 lg:px-20 pt-28 md:pt-32 pb-12">
          <div className="w-full md:w-4/5 lg:w-[80%] grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 lg:gap-8 mt-10 md:mt-0 mr-auto">

            {/* Tile 1: Location Name */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="glass-surface p-6 sm:p-8 md:p-10 lg:p-12 border border-white/10 shadow-2xl backdrop-blur-md md:col-span-12 overflow-hidden relative group"
            >
              <div
                className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none"
                style={{ backgroundColor: activeLocation.themeColor }}
              />
              <span
                className="font-grotesk text-[10px] md:text-xs tracking-[0.4em] md:tracking-[0.5rem] uppercase mb-4 md:mb-6 block transition-colors duration-1000 font-bold"
                style={{ color: activeLocation.themeColor }}
              >
                EXPERIENCE REALITY
              </span>
              <div className="flex items-end overflow-hidden w-full">
                <TextRotate
                  ref={textRotateRef}
                  texts={locations.map((l) => l.name)}
                  mainClassName="font-barlow font-black italic text-4xl sm:text-5xl md:text-7xl lg:text-8xl xl:text-[9rem] text-white uppercase leading-[0.85] tracking-[0.4em] md:tracking-[0.5rem] break-words"
                  staggerDuration={0.03}
                  auto={false}
                  loop={false}
                  transition={{ type: "spring", duration: 0.5, bounce: 0 }}
                  initial={{ opacity: 0, y: 60 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -60 }}
                />
              </div>
            </motion.div>

            {/* Tile 2: Vibe & Description */}
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="glass-surface p-6 sm:p-8 md:p-10 border border-white/10 shadow-xl backdrop-blur-md md:col-span-12 lg:col-span-6 flex flex-col justify-center relative group overflow-hidden"
            >
              <div
                className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none"
                style={{ backgroundColor: activeLocation.themeColor }}
              />
              <div className="mb-4 md:mb-6 transition-colors duration-1000" style={{ color: activeLocation.themeColor }}>
                <TextRotate
                  ref={vibeRotateRef}
                  texts={locations.map((l) => l.vibe)}
                  mainClassName="font-barlow font-bold text-[10px] sm:text-xs md:text-sm lg:text-base tracking-[0.2em] md:tracking-[0.3em] uppercase italic line-clamp-2"
                  auto={false}
                  loop={false}
                  staggerDuration={0.01}
                  transition={{ type: "spring", duration: 0.5 }}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                />
              </div>
              <p className="font-grotesk text-white/70 text-xs sm:text-sm md:text-base leading-relaxed">
                {activeLocation.description}
              </p>
            </motion.div>

            {/* Tile 3: Schedule & Goals */}
            <motion.div
              key={`details-${activeIndex}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="glass-surface p-6 sm:p-8 md:p-10 border border-white/10 shadow-xl backdrop-blur-md md:col-span-6 lg:col-span-3 flex flex-col justify-center relative group overflow-hidden gap-4 md:gap-6"
            >
              <div
                className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700 pointer-events-none"
                style={{ backgroundColor: activeLocation.themeColor }}
              />
              <div className="space-y-1 md:space-y-2 relative z-10">
                <div className="flex items-center gap-2 transition-colors duration-1000" style={{ color: activeLocation.themeColor }}>
                  <Star size={14} className="fill-current" />
                  <span className="font-grotesk font-bold text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-white/60">Target Goal</span>
                </div>
                <p className="font-barlow font-bold text-xs md:text-sm text-white uppercase italic">{activeLocation.bestFor}</p>
              </div>
              <div className="space-y-1 md:space-y-2 relative z-10">
                <div className="flex items-center gap-2 transition-colors duration-1000" style={{ color: activeLocation.themeColor }}>
                  <Clock size={14} />
                  <span className="font-grotesk font-bold text-[9px] md:text-[10px] tracking-[0.3em] uppercase text-white/60">Sessions</span>
                </div>
                <p className="font-barlow font-bold text-xs md:text-sm text-white uppercase italic">{activeLocation.schedule}</p>
              </div>
            </motion.div>

            {/* Tile 4: Call to Action */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.2 }}
              className="glass-surface p-6 sm:p-8 border border-white/10 shadow-lg transition-colors duration-500 backdrop-blur-sm md:col-span-6 lg:col-span-3 flex flex-col justify-center items-center group relative overflow-hidden text-center"
            >
              <div
                className="absolute top-0 left-0 w-full h-full opacity-0 group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none"
                style={{ backgroundColor: activeLocation.themeColor }}
              />
              <a
                href="#camps"
                onClick={handleSecureSpotClick}
                className="flex flex-col items-center gap-3 md:gap-4 w-full h-full justify-center relative z-10"
              >
                <div
                  className="h-12 w-12 md:h-16 md:w-16 lg:h-14 lg:w-14 xl:h-16 xl:w-16 border flex items-center justify-center transition-all duration-[800ms] group-hover:scale-110 shadow-none group-hover:shadow-[0_0_20px_var(--loc-theme)]"
                  style={{ borderColor: activeLocation.themeColor + "40" }}
                >
                  <MapPin size={22} className="lg:w-6 lg:h-6 transition-colors duration-[800ms]" style={{ color: activeLocation.themeColor }} />
                </div>
                <div className="px-2">
                  <span className="font-grotesk font-bold text-[9px] sm:text-[10px] md:text-xs lg:text-[10px] xl:text-xs tracking-[0.3em] md:tracking-[0.4em] uppercase text-white block transition-colors duration-[800ms] mb-1 md:mb-2 group-hover:text-[var(--loc-theme)]">
                    Secure Spot
                  </span>
                  <span
                    className="font-barlow font-bold text-[8px] sm:text-[9px] md:text-[10px] uppercase tracking-[0.2em] leading-tight block break-words max-w-[120px] mx-auto transition-colors duration-[800ms] italic"
                    style={{ color: activeLocation.themeColor + "99" }}
                  >
                    {activeLocation.name} · TH
                  </span>
                </div>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Dynamic Nav Indicator (Right) */}
        <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-8">
          {locations.map((loc, idx) => (
            <motion.div
              key={idx}
              className="group flex items-center gap-4 cursor-pointer"
              onClick={() => {
                const targetScroll = (idx / locations.length) * (sectionRef.current?.offsetHeight || 0);
                window.scrollTo({
                  top: (sectionRef.current?.offsetTop || 0) + targetScroll,
                  behavior: "smooth",
                });
              }}
            >
              <span
                className={`font-barlow font-bold text-[11px] tracking-widest uppercase transition-all duration-[800ms] ${idx === activeIndex ? "opacity-100" : "text-white opacity-0 group-hover:opacity-40"
                  }`}
                style={idx === activeIndex ? { color: activeLocation.themeColor } : {}}
              >
                {loc.name}
              </span>
              <div
                className={`w-1 transition-all duration-[800ms] rounded-full ${idx === activeIndex ? "h-12 bg-primary" : "bg-white/20 h-6 group-hover:bg-white/40"
                  }`}
                style={idx === activeIndex ? { backgroundColor: activeLocation.themeColor } : {}}
              />
            </motion.div>
          ))}
        </div>

        {/* Scroll Progress Bar (Bottom) */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5 z-20">
          <motion.div
            className="h-full origin-left transition-colors duration-[800ms]"
            style={{ scaleX: scrollYProgress, backgroundColor: activeLocation.themeColor }}
          />
        </div>
      </div>
    </section>
  );
};

export default LocationsSection;
