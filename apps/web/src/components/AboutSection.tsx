"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import trainingImg from "@/assets/training.jpg";
import { SITE_CONFIG } from "@repo/utils";

const AboutSection = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <section
      id="about"
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
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(24 95% 46% / 0.07) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">

        {/* ── IMAGE SIDE ── */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Eyebrow above image */}
          <motion.div
            className="flex items-center gap-3 mb-5"
            initial={{ opacity: 0, x: -20 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.15, duration: 0.7 }}
          >
            <span className="inline-block w-6 h-[2px] bg-primary" />
            <span className="font-grotesk text-[10px] tracking-[0.45em] uppercase text-primary font-medium">
              Our Story
            </span>
          </motion.div>

          <div className="relative overflow-hidden">
            <motion.img
              src={trainingImg.src}
              alt="Muay Thai training"
              className="w-full h-[420px] md:h-[540px] object-cover"
              style={{ y: imgY }}
              loading="lazy"
              width={1200}
              height={800}
            />
            {/* Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          </div>

          {/* Corner accents */}
          <div className="absolute -bottom-4 -right-4 w-20 h-20 border-r-2 border-b-2 border-primary/25" />
          <div className="absolute -top-4 -left-4 w-20 h-20 border-l-2 border-t-2 border-primary/25" />

          {/* Floating stat badge */}
          <motion.div
            className="absolute bottom-8 left-6 glass-surface border border-white/10 px-5 py-3 backdrop-blur-md"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.7 }}
          >
            <span className="font-barlow font-black italic text-3xl text-white leading-none">5</span>
            <span className="font-grotesk text-[10px] tracking-[0.3em] uppercase text-white/40 block mt-0.5">
              Locations · Thailand
            </span>
          </motion.div>
        </motion.div>

        {/* ── TEXT SIDE ── */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Headline */}
          <div className="overflow-hidden mb-3">
            <motion.h2
              className="font-barlow font-black italic text-[13vw] sm:text-[9vw] md:text-[7vw] lg:text-[6vw] xl:text-[5.5vw] leading-[0.88] tracking-[-0.01em] text-white uppercase"
              initial={{ y: "100%", opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              BORN FROM<br />
              <span className="text-gradient-fire">EXPERIENCE</span>
            </motion.h2>
          </div>

          {/* Divider */}
          <motion.div
            className="w-12 h-[2px] bg-primary mb-8"
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ delay: 0.55, duration: 0.5, ease: "easeOut" }}
            style={{ transformOrigin: "left" }}
          />

          <motion.div
            className="space-y-5"
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            <p className="font-grotesk text-[13px] md:text-sm text-white/45 leading-relaxed">
              It started as something new to try. A trip to Thailand introduced Muay Thai — but what stood out wasn't just the techniques, it was the way people trained. The discipline, the routine, the mindset.
            </p>
            <p className="font-grotesk text-[13px] md:text-sm text-white/45 leading-relaxed">
              Training wasn't just about fitness — it was about improvement, structure, and pushing limits every day.
            </p>
            <p className="font-grotesk text-[13px] md:text-sm text-white/70 leading-relaxed">
              "{SITE_CONFIG.brand}" was built to bring that same experience to others — to give people access to something more challenging, more real, and more rewarding than routine workouts.
            </p>

            {/* Accent quote */}
            <div className="flex items-start gap-4 pt-2">
              <div className="w-[3px] h-full bg-primary shrink-0 self-stretch min-h-[2.5rem]" />
              <p className="font-barlow font-bold italic text-[15px] md:text-base tracking-[0.05em] uppercase text-primary/80">
                Because once you experience it the right way, training is never the same again.
              </p>
            </div>
          </motion.div>

          {/* CTA */}
          <motion.div
            className="mt-10"
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.75, duration: 0.6 }}
          >
            <a
              href="#camps"
              className="group relative inline-flex items-center gap-3 bg-primary px-7 py-3.5 font-barlow font-black text-[12px] tracking-[0.25em] uppercase text-black overflow-hidden"
            >
              <span className="relative z-10">Explore Camps</span>
              <span className="relative z-10 translate-x-0 group-hover:translate-x-1 transition-transform duration-300">→</span>
              <span className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500 skew-x-12" />
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
