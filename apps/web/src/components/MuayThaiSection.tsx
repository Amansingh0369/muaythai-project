import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, Zap, Heart, Brain, Target, Flame, Move, Trophy } from "lucide-react";
import { SITE_CONFIG } from "@repo/utils";

const iconMap = [
  Zap,
  Flame,
  Shield,
  Brain,
  Target,
  Heart,
  Move,
  Trophy,
];

const benefits = SITE_CONFIG.benefits.map((benefit, index) => ({
  ...benefit,
  icon: iconMap[index],
}));

const MuayThaiSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="muaythai" ref={ref} className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-dark" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-5"
        style={{ background: "radial-gradient(circle, hsl(210 100% 50%) 0%, transparent 70%)" }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          className="max-w-3xl mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="font-heading text-xs tracking-[0.4em] uppercase text-primary">
            The Art of Eight Limbs
          </span>
          <h2 className="font-display text-5xl md:text-7xl text-foreground mt-2 mb-6">
            WHAT IS <span className="text-gradient-fire">MUAY THAI</span>
          </h2>
          <div className="space-y-4 font-body text-muted-foreground text-sm md:text-base leading-relaxed">
            <p>
              Muay Thai is a striking martial art from Thailand that uses punches, kicks, elbows, and knees. But beyond techniques, it's a system built on discipline, conditioning, and control.
            </p>
            <p>
              Every movement has purpose. Every session builds both physical and mental strength. It's not just about learning how to fight — it's about learning how to push limits, stay composed under pressure, and develop real confidence.
            </p>
          </div>
        </motion.div>

        {/* History strip */}
        <motion.div
          className="glass-surface rounded-sm p-8 md:p-12 mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <h3 className="font-display text-2xl md:text-3xl text-foreground mb-4">
            FROM ANCIENT BATTLEFIELDS TO MODERN STADIUMS
          </h3>
          <p className="font-body text-muted-foreground text-sm leading-relaxed max-w-3xl">
            Muay Thai originated in Thailand centuries ago as a battlefield combat system. Over time, it evolved from survival into a national sport deeply rooted in Thai culture. From ancient warriors to modern stadiums, it has remained true to its core — discipline, respect, and resilience. Today, it is practiced worldwide, but its heart still lies in Thailand.
          </p>
        </motion.div>

        {/* Benefits grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <h3 className="font-display text-3xl text-foreground mb-8">WHY MUAY THAI</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  className="border border-border rounded-sm p-5 hover:border-primary/30 transition-all duration-300 group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.4 + index * 0.05, duration: 0.4 }}
                >
                  <Icon className="w-5 h-5 text-primary mb-3 group-hover:scale-110 transition-transform" />
                  <h4 className="font-heading text-xs tracking-wider uppercase text-foreground mb-1">{benefit.title}</h4>
                  <p className="font-body text-xs text-muted-foreground">{benefit.desc}</p>
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
