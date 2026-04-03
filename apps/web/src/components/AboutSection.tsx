import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import trainingImg from "@/assets/training.jpg";
import { SITE_CONFIG } from "@repo/utils";

const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" ref={ref} className="section-padding bg-background relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, hsl(24 95% 46%) 0%, transparent 70%)" }}
      />

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center">
        {/* Image */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, x: -50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="relative overflow-hidden">
            <img
              src={trainingImg.src}
              alt="Muay Thai training"
              className="w-full h-[400px] md:h-[500px] object-cover"
              loading="lazy"
              width={1200}
              height={800}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
          </div>
          <div className="absolute -bottom-4 -right-4 w-24 h-24 border-r-2 border-b-2 border-primary/30" />
          <div className="absolute -top-4 -left-4 w-24 h-24 border-l-2 border-t-2 border-primary/30" />
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <span className="font-heading text-xs tracking-[0.4em] uppercase text-primary">Our Story</span>
          <h2 className="font-display text-4xl md:text-6xl text-foreground mt-2 mb-6">
            BORN FROM<br />
            <span className="text-gradient-fire">EXPERIENCE</span>
          </h2>
          <div className="space-y-4 font-body text-muted-foreground text-sm md:text-base leading-relaxed">
            <p>
              It started as something new to try. A trip to Thailand introduced Muay Thai — but what stood out wasn't just the techniques, it was the way people trained. The discipline, the routine, the mindset.
            </p>
            <p>
              Training wasn't just about fitness — it was about improvement, structure, and pushing limits every day.
            </p>
            <p className="text-foreground font-medium">
              "{SITE_CONFIG.brand}" was built to bring that same experience to others — to give people access to something more challenging, more real, and more rewarding than routine workouts.
            </p>
            <p className="text-primary font-heading tracking-wider text-sm">
              Because once you experience it the right way, training is never the same again.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
