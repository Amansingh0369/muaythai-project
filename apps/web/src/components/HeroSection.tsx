"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { SITE_CONFIG } from "@repo/utils";
import { ArrowDown } from "lucide-react";

const HeroSection = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [tick, setTick] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Force video playback constraints specifically for strict mobile engines (iOS Safari / Low Power Mode)
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;
      videoRef.current.play().catch(e => {
        console.log("Mobile browser blocked autoplay (likely Low Power Mode):", e);
      });
    }
  }, []);

  // Fallback to show the video/poster if the network or mobile battery saver blocks `onLoadedData`
  useEffect(() => {
    const timer = setTimeout(() => setIsVideoLoaded(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.05]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "5%"]);

  // Cycled sub-taglines
  const sublines = SITE_CONFIG.taglines.heroMain ?? [
    "THAILAND'S ELITE TRAINING",
    "BUILT FOR FIGHTERS",
    "FORGE YOUR LIMITS",
  ];
  useEffect(() => {
    const t = setInterval(() => setTick((n) => (n + 1) % sublines.length), 2800);
    return () => clearInterval(t);
  }, [sublines.length]);

  return (
    <section
      id="hero"
      ref={ref}
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-black"
    >
      {/* ── BACKGROUND ──────────────────────────────────────────── */}
      <motion.div className="absolute inset-0" style={{ y: bgY, scale: bgScale }}>
        {/* Video */}
        <AnimatePresence>
          <motion.video
            ref={videoRef}
            key="hero-video"
            autoPlay
            loop
            muted={true}
            playsInline={true}
            preload="auto"
            onLoadedData={() => setIsVideoLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: isVideoLoaded ? 1 : 0 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
          </motion.video>
        </AnimatePresence>

        {/* Fallback while loading */}
        {!isVideoLoaded && (
          <div className="absolute inset-0 bg-[#080808]" />
        )}

        {/* Layered overlays */}
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      </motion.div>

      {/* ── NOISE GRAIN TEXTURE (very subtle) ─────────────────── */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />

      {/* ── CONTENT ──────────────────────────────────────────────── */}
      <motion.div
        className="relative z-10 h-full flex flex-col justify-end"
        style={{ opacity: contentOpacity, y: contentY }}
      >
        <div className="px-6 md:px-12 lg:px-20 pb-10 md:pb-14 lg:pb-20">

          {/* ── TOP EYEBROW ─── */}
          <motion.div
            className="flex items-center gap-3 mb-5 md:mb-7"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            <span className="inline-block w-6 h-[2px] bg-primary" />
            <span className="font-grotesk text-[10px] md:text-[11px] tracking-[0.45em] uppercase text-primary font-medium">
              Thailand's Premier Muay Thai Experience
            </span>
          </motion.div>

          {/* ── MAIN HEADLINE ─── */}
          <div className="overflow-hidden mb-3 md:mb-4">
            <motion.h1
              className="font-barlow font-black italic text-[17vw] sm:text-[13vw] md:text-[11vw] lg:text-[9.5vw] xl:text-[9vw] leading-[0.88]  tracking-[-0.01em] text-white uppercase"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              {SITE_CONFIG.brand}
            </motion.h1>
          </div>

          {/* ── ROTATING TAGLINE STRIP ─── */}
          <div className="flex items-center gap-0 overflow-hidden mb-7 md:mb-10">
            <motion.div
              className="bg-primary h-[2.5rem] md:h-[3rem] w-[4px] shrink-0 mr-4"
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: 0.9, duration: 0.5 }}
            />
            <div className="overflow-hidden h-[2.5rem] md:h-[3rem] flex items-center">
              <AnimatePresence mode="wait">
                <motion.span
                  key={tick}
                  className="block font-barlow font-bold text-[1.35rem] md:text-[1.65rem] tracking-[0.12em] uppercase text-white/80"
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -40, opacity: 0 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                >
                  {sublines[tick]}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          {/* ── BOTTOM ROW: description + CTA ─── */}
          <motion.div
            className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.7 }}
          >
            {/* Description */}
            <p className="font-grotesk text-[13px] md:text-sm text-white/45 max-w-[320px] leading-relaxed">
              Immersive Muay Thai training camps across Thailand's most iconic locations.
            </p>

            {/* CTA buttons */}
            <div className="flex items-center gap-4">
              <motion.a
                href="#camps"
                className="group relative inline-flex items-center gap-3 bg-primary px-7 py-3.5 font-barlow font-black text-[12px] tracking-[0.25em] uppercase text-black overflow-hidden"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="relative z-10">Explore Camps</span>
                <span className="relative z-10 translate-x-0 group-hover:translate-x-1 transition-transform duration-300">→</span>
                {/* Shimmer on hover */}
                <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
              </motion.a>

              <a
                href="#about"
                className="font-grotesk text-[11px] tracking-[0.2em] uppercase text-white/40 hover:text-white transition-colors duration-300 border-b border-white/10 hover:border-white/40 pb-0.5"
              >
                Our Story
              </a>
            </div>
          </motion.div>

          {/* ── LOCATION BADGES ─── */}
          <motion.div
            className="flex gap-3 flex-wrap mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2, duration: 0.7 }}
          >
            {["Bangkok", "Phuket", "Chiang Mai", "Krabi", "Koh Samui"].map((loc) => (
              <span
                key={loc}
                className="font-grotesk text-[10px] tracking-[0.2em] uppercase text-white/30 border border-white/[0.08] px-3 py-1.5 hover:text-white/60 hover:border-white/20 transition-colors cursor-default"
              >
                {loc}
              </span>
            ))}
          </motion.div>
        </div>

        {/* ── SCROLL INDICATOR ─── */}
        <motion.div
          className="absolute bottom-8 right-6 md:right-12 lg:right-20 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
        >
          <motion.div
            animate={{ y: [0, 7, 0] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
          >
            <ArrowDown size={14} className="text-white/30" />
          </motion.div>
          <div className="w-px h-10 bg-gradient-to-b from-white/20 to-transparent" />
        </motion.div>

        {/* ── SIDE VERTICAL TEXT ─── */}
        <div className="absolute right-6 md:right-10 top-1/2 -translate-y-1/2 hidden lg:flex flex-col items-center gap-3">
          <span
            className="font-grotesk text-[9px] tracking-[0.4em] uppercase text-white/20 rotate-90 origin-center whitespace-nowrap"
            style={{ writingMode: "vertical-rl" }}
          >
            Scroll to explore
          </span>
        </div>
      </motion.div>

      {/* ── BOTTOM BRAND TICKER ─── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 overflow-hidden border-t border-white/[0.05]">
        <motion.div
          className="flex gap-8 whitespace-nowrap py-2.5 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 24, ease: "linear" }}
        >
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="font-barlow font-black text-[11px] tracking-[0.4em] uppercase text-white/10 px-4"
            >
              {SITE_CONFIG.brand} · Muay Thai Thailand · Train Hard · Fight Strong ·
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
