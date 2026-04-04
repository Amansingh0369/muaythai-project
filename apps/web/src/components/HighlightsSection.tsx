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
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="section-padding relative">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <span className="font-heading text-xs tracking-[0.4em] uppercase text-primary">
              What Sets Us Apart
            </span>
            <h2 className="font-display text-4xl md:text-6xl text-foreground mt-2 mb-6">
              NOT JUST A<br />
              <span className="text-gradient-fire">WORKOUT</span>
            </h2>
            <p className="font-body text-muted-foreground text-sm leading-relaxed mb-8 max-w-md">
              We offer a complete Muay Thai experience. Our fight camps give you access to authentic, fighter-level training in the birthplace of Muay Thai. Beyond training, we're building a full ecosystem — gear, community, and experiences.
            </p>
            <p className="font-body text-foreground/80 text-sm italic">
              "Whether you're here to train, explore, or transform — this is where it starts."
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            initial={{ opacity: 0, x: 40 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {highlights.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-sm border border-transparent hover:border-border transition-colors"
                  initial={{ opacity: 0, y: 15 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.3 + index * 0.05, duration: 0.4 }}
                >
                  <Icon className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <span className="font-body text-sm text-foreground/80">{item.text}</span>
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
