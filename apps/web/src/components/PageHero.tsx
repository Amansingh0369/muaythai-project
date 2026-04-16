"use client";

import { motion } from "motion/react";

interface PageHeroProps {
  title: string;
  subtitle?: string;
  image: string;
  label?: string;
}

const PageHero = ({ title, subtitle, image, label }: PageHeroProps) => {
  return (
    <section className="relative h-[60vh] min-h-[400px] overflow-hidden bg-black flex flex-col justify-end pb-16 md:pb-24">
      {/* Background Image with Overlays */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.6 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          src={image}
          alt={title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      <div className="relative z-10 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto w-full">
        {label && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="flex items-center gap-3 mb-6"
          >
            <span className="w-10 h-[2px] bg-primary" />
            <span className="font-grotesk text-[10px] md:text-xs tracking-[0.4em] uppercase text-primary font-bold">
              {label}
            </span>
          </motion.div>
        )}

        <div className="overflow-hidden">
          <motion.h1
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="font-barlow font-black italic text-5xl md:text-7xl lg:text-8xl text-white uppercase leading-[0.9] tracking-tighter"
          >
            {title}
          </motion.h1>
        </div>

        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-6 font-grotesk text-white/50 text-sm md:text-base max-w-xl leading-relaxed"
          >
            {subtitle}
          </motion.p>
        )}
      </div>

      {/* Decorative Brand Strip */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
      <div className="absolute bottom-0 right-0 w-1/2 h-[2px] bg-primary/30" />
    </section>
  );
};

export default PageHero;
