import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { SITE_CONFIG } from "@repo/utils";
import { camps } from "./FightCampsSection.helpers";

const FightCampsSection = () => {
  const { user } = useAuth();
  const router = useRouter();
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const handleBookClick = (e: React.MouseEvent, campId: string) => {
    if (!user) {
      e.preventDefault();
      router.push(`/login?redirect=/#camps`);
    } else {
      console.log(`Booking camp: ${campId}`);
    }
  };

  return (
    <section id="camps" ref={ref} className="section-padding relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-dark" />

      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="font-heading text-xs tracking-[0.4em] uppercase text-primary">
            Choose Your Experience
          </span>
          <h2 className="font-display text-5xl md:text-7xl text-foreground mt-2">
            FIGHT <span className="text-gradient-fire">CAMPS</span>
          </h2>
          <p className="font-body text-muted-foreground mt-4 max-w-2xl mx-auto">
            These aren't packages. They're experiences. No matter your level, your camp is waiting for you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {camps.map((camp, index) => {
            const Icon = camp.icon;
            return (
              <motion.div
                key={camp.title}
                className={`relative group cursor-pointer ${camp.featured ? "md:-mt-4 md:mb-4" : ""}`}
                initial={{ opacity: 0, y: 40 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.15 }}
              >
                <div className={`h-full border border-border rounded-sm p-8 transition-all duration-500 hover:border-primary/40 ${camp.featured ? "bg-card glow-orange" : "bg-card/50"}`}>
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-sm bg-gradient-to-br ${camp.accent} flex items-center justify-center mb-6`}>
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>

                  {/* Header */}
                  <p className="font-heading text-xs tracking-[0.3em] uppercase text-primary mb-1">
                    {camp.subtitle}
                  </p>
                  <h3 className="font-display text-3xl text-foreground mb-1">{camp.title}</h3>
                  <p className="font-heading text-sm text-muted-foreground mb-6">{camp.duration} · {camp.idealFor}</p>

                  {/* Includes */}
                  <ul className="space-y-3 mb-8">
                    {camp.includes.map((item) => (
                      <li key={item} className="flex items-start gap-3 text-sm font-body text-muted-foreground">
                        <span className="w-1 h-1 rounded-full bg-primary mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* Outcome */}
                  <div className="border-t border-border pt-4 mb-6">
                    <p className="text-xs font-heading tracking-wider uppercase text-muted-foreground mb-1">Outcome</p>
                    <p className="text-sm font-body text-foreground">{camp.outcome}</p>
                  </div>

                  {/* CTA */}
                  <a
                    href="#"
                    onClick={(e) => handleBookClick(e, camp.id)}
                    className={`block text-center py-3 font-heading text-sm tracking-[0.2em] uppercase transition-all duration-300 ${
                      camp.featured
                        ? "bg-gradient-fire text-primary-foreground hover:opacity-90"
                        : "border border-foreground/20 text-foreground hover:border-primary hover:text-primary"
                    }`}
                  >
                    Welcome, Fighter →
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Upcoming Batches */}
        <motion.div
          className="mt-20 glass-surface rounded-sm p-8 md:p-12"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h3 className="font-display text-3xl text-foreground mb-2">UPCOMING BATCHES</h3>
              <p className="font-body text-sm text-muted-foreground max-w-lg">
                Join a scheduled Muay Thai experience in Thailand. Each batch is limited in size to ensure focused training and a better overall experience.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              {SITE_CONFIG.batches.map((batch) => (
                <div key={batch.location} className="border-glow rounded-sm p-4 text-center min-w-[200px]">
                  <p className="font-display text-xl text-primary">{batch.location}</p>
                  <p className="font-body text-sm text-muted-foreground">{batch.date}</p>
                  <span className="inline-block mt-2 text-xs font-heading tracking-wider text-primary/70">{batch.status}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FightCampsSection;
