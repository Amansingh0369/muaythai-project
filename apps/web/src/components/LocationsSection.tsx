import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import phuketImg from "@/assets/phuket.jpg";
import bangkokImg from "@/assets/bangkok.jpg";
import chiangmaiImg from "@/assets/chiangmai.jpg";
import krabiImg from "@/assets/krabi.jpg";
import kohsamuiImg from "@/assets/kohsamui.jpg";
import { SITE_CONFIG } from "@repo/utils";

// Map local images to location data from config
const locationImages = {
  "Phuket": phuketImg,
  "Bangkok": bangkokImg,
  "Chiang Mai": chiangmaiImg,
  "Krabi": krabiImg,
  "Koh Samui": kohsamuiImg,
};

const locations = SITE_CONFIG.locations.map(loc => ({
  ...loc,
  image: locationImages[loc.name as keyof typeof locationImages],
}));

const LocationsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="locations" ref={ref} className="section-padding relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="font-heading text-xs tracking-[0.4em] uppercase text-primary">
            Where It All Happens
          </span>
          <h2 className="font-display text-5xl md:text-7xl text-foreground mt-2">
            TRAINING <span className="text-gradient-fire">LOCATIONS</span>
          </h2>
          <p className="font-body text-muted-foreground mt-4 max-w-2xl mx-auto">
            Our experiences are based in Thailand — the home of Muay Thai. Each location is carefully selected for authentic training and a complete experience.
          </p>
        </motion.div>

        <div className="space-y-8">
          {locations.map((location, index) => (
            <motion.div
              key={location.name}
              className="group grid md:grid-cols-2 gap-0 border border-border rounded-sm overflow-hidden hover:border-primary/30 transition-colors duration-500"
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              {/* Image */}
              <div className={`relative h-64 md:h-80 overflow-hidden ${index % 2 === 1 ? "md:order-2" : ""}`}>
                <img
                  src={location.image.src}
                  alt={`${location.name}, Thailand`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                  width={800}
                  height={1024}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-background/40" />
                <div className="absolute bottom-4 left-4 md:bottom-6 md:left-6">
                  <h3 className="font-display text-4xl md:text-5xl text-foreground">{location.name}</h3>
                  <p className="font-heading text-xs tracking-[0.2em] uppercase text-primary">{location.vibe}</p>
                </div>
              </div>

              {/* Details */}
              <div className="p-6 md:p-10 flex flex-col justify-center bg-card/30">
                <p className="font-body text-muted-foreground text-sm leading-relaxed mb-6">
                  {location.description}
                </p>

                <div className="space-y-4">
                  <div>
                    <p className="font-heading text-xs tracking-[0.2em] uppercase text-primary mb-1">Best For</p>
                    <p className="font-body text-sm text-foreground/80">{location.bestFor}</p>
                  </div>
                  <div>
                    <p className="font-heading text-xs tracking-[0.2em] uppercase text-primary mb-1">Training Schedule</p>
                    <p className="font-body text-sm text-foreground/80">{location.schedule}</p>
                  </div>
                </div>

                <a
                  href="#camps"
                  className="mt-6 inline-flex items-center gap-2 font-heading text-xs tracking-[0.2em] uppercase text-primary hover:text-accent transition-colors"
                >
                  Explore Camps in {location.name} →
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LocationsSection;
