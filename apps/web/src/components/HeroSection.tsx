import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";
import heroImg from "@/assets/hero-fighter.jpg";
import { SITE_CONFIG } from "@repo/utils";

const HeroSection = () => {
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "40%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  return (
    <section ref={ref} className="relative h-screen overflow-hidden bg-black">
      {/* Parallax background */}
      <motion.div className="absolute inset-0" style={{ y, scale }}>
        <AnimatePresence>
          <motion.video
            key="hero-video"
            autoPlay
            loop
            muted
            playsInline
            onLoadedData={() => setIsVideoLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: isVideoLoaded ? 1 : 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="w-full h-full object-cover"
          >
            <source src="/videos/hero.mp4" type="video/mp4" />
          </motion.video>
        </AnimatePresence>
        
        {/* Fallback/Overlay during load */}
        {!isVideoLoaded && (
          <div className="absolute inset-0 bg-background" />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-transparent" />
      </motion.div>

      {/* Content */}
      <motion.div
        className="relative z-10 h-full flex flex-col justify-end pb-20 md:pb-32 px-6 md:px-12 lg:px-20 max-w-7xl mx-auto"
        style={{ opacity }}
      >
        <motion.p
          className="font-heading text-sm md:text-base tracking-[0.4em] uppercase text-primary mb-4"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {SITE_CONFIG.taglines.heroSub}
        </motion.p>

        <motion.h1
          className="font-display text-5xl md:text-7xl lg:text-8xl leading-[0.9] text-foreground mb-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          {SITE_CONFIG.taglines.heroMain[0]}<br />
          <span className="text-gradient-fire">{SITE_CONFIG.taglines.heroMain[1]}</span><br />
          {SITE_CONFIG.taglines.heroMain[2]}
        </motion.h1>

        <motion.p
          className="font-body text-base md:text-lg text-muted-foreground max-w-lg mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          {SITE_CONFIG.taglines.heroDesc}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <a
            href="#camps"
            className="bg-gradient-fire px-8 py-4 font-heading text-sm tracking-[0.3em] uppercase text-primary-foreground hover:opacity-90 transition-opacity text-center"
          >
            Explore Fight Camps
          </a>
          <a
            href="#about"
            className="border border-foreground/20 px-8 py-4 font-heading text-sm tracking-[0.3em] uppercase text-foreground hover:border-primary/50 hover:text-primary transition-colors text-center"
          >
            Our Story
          </a>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="font-heading text-[10px] tracking-[0.3em] text-muted-foreground uppercase">Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-primary/50 to-transparent" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
