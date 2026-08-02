"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ShoppingBag } from "lucide-react";
import { SITE_CONFIG } from "@repo/utils";

const ShopComingSoon = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section
      ref={ref}
      className="relative z-30 bg-[#121212] px-6 md:px-12 lg:px-20 py-28 md:py-40 overflow-hidden"
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
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(24 95% 46% / 0.07) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-3xl mx-auto flex flex-col items-center text-center">
        {/* Badge */}
        <motion.div
          className="flex items-center gap-3 mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
        >
          <span className="font-grotesk text-[12px] tracking-[0.45em] uppercase text-primary font-medium">
            Stay Tuned
          </span>
        </motion.div>

        {/* Icon */}
        <motion.div
          className="relative mb-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full" />
          <div className="relative w-20 h-20 md:w-24 md:h-24 flex items-center justify-center border border-primary/30 bg-primary/10 rounded-full">
            <ShoppingBag className="w-9 h-9 md:w-10 md:h-10 text-primary" />
          </div>
        </motion.div>

        {/* Headline */}
        <div className="overflow-hidden">
          <motion.h2
            className="font-barlow font-black italic text-[16vw] sm:text-[12vw] md:text-[8vw] lg:text-7xl leading-[0.88] tracking-[-0.01em] text-white uppercase"
            initial={{ y: "100%", opacity: 0 }}
            animate={isInView ? { y: 0, opacity: 1 } : {}}
            transition={{ delay: 0.2, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            Merch Is<br />
            <span className="text-gradient-fire">Coming Soon</span>
          </motion.h2>
        </div>

        <div className="my-8" />

        {/* Subtext */}
        <motion.p
          className="font-grotesk text-[13px] md:text-base text-white/65 leading-relaxed max-w-lg"
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.55, duration: 0.7 }}
        >
          We're building a collection worthy of the art. Authentic apparel, fighter-grade gear, and camp essentials — engineered for those who live the discipline. Stay tuned.
        </motion.p>
      </div>

      {/* Coming Soon Ticker Strip */}
      <div className="absolute bottom-12 md:bottom-16 left-0 right-0 border-t border-b border-white/[0.06] bg-black/30 backdrop-blur-sm -skew-y-2">
        <motion.div
          className="flex gap-8 whitespace-nowrap py-4 w-max"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ repeat: Infinity, duration: 22, ease: "linear" }}
        >
          {[...Array(8)].map((_, i) => (
            <span
              key={i}
              className="font-barlow font-black text-[13px] md:text-base tracking-[0.4em] uppercase px-6 flex items-center gap-6"
            >
              <span className="text-gradient-fire">Coming Soon</span>
              <span className="text-white/20">·</span>
              <span className="text-white/25">{SITE_CONFIG.brand} Merch</span>
              <span className="text-white/20">·</span>
              <span className="text-white/25">Stay Tuned</span>
              <span className="text-white/20">·</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default ShopComingSoon;
