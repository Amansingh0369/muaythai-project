"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { SITE_CONFIG } from "@repo/utils";
import { camps } from "./FightCampsSection.helpers";

const FightCampsSection = () => {
  const { user } = useAuth();
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
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
    <section id="camps" ref={ref} className="relative bg-[#050505] py-24 md:py-36 pb-32">

      {/* Burn overlay background texture */}
      <div
        className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-[#050505] to-black z-[2]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12 lg:px-20">
        
        {/* ── HEADER ── */}
        <motion.div
           className="text-center mb-20"
           initial={{ opacity: 0, y: 40 }}
           animate={isInView ? { opacity: 1, y: 0 } : {}}
           transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex justify-center items-center gap-3 mb-6">
            <span className="inline-block w-8 h-[2px] bg-primary" />
            <span className="font-grotesk text-[10px] md:text-xs tracking-[0.45em] uppercase text-primary font-medium">
              Choose Your Experience
            </span>
            <span className="inline-block w-8 h-[2px] bg-primary" />
          </div>
          
          <h2 className="font-barlow font-black italic text-[14vw] sm:text-[10vw] md:text-[8vw] lg:text-[7vw] leading-[0.85] tracking-[-0.02em] text-white uppercase mix-blend-plus-lighter">
            FIGHT <span className="text-gradient-fire">CAMPS</span>
          </h2>
          
          <p className="font-grotesk text-sm md:text-base text-white/50 mt-6 max-w-2xl mx-auto leading-relaxed">
            These aren't packages. They're experiences. No matter your level, your camp is waiting for you.
          </p>
        </motion.div>

        {/* ── CAMP CARDS ── */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {camps.map((camp, index) => {
            const Icon = camp.icon;
            return (
              <motion.div
                key={camp.title}
                className={`relative group cursor-pointer ${camp.featured ? "md:-mt-6 md:mb-6" : ""}`}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.8, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={`flex flex-col h-full border border-white/[0.08] p-8 lg:p-10 transition-all duration-[600ms] group-hover:border-primary/40 group-hover:bg-white/[0.04] ${camp.featured ? "bg-white/[0.03] shadow-[0_0_50px_-20px_rgba(255,80,0,0.25)]" : "bg-black/40 backdrop-blur-sm"}`}>
                  
                  {/* Icon */}
                  <div className={`w-14 h-14 bg-gradient-to-br ${camp.accent} flex items-center justify-center mb-8 shrink-0`}>
                    <Icon className="w-7 h-7 text-black" />
                  </div>

                  {/* Header */}
                  <p className="font-grotesk text-[10px] tracking-[0.4em] uppercase text-primary mb-3">
                    {camp.subtitle}
                  </p>
                  <h3 className="font-barlow font-black italic text-3xl md:text-4xl lg:text-5xl text-white uppercase mb-3 leading-[0.85]">
                    {camp.title}
                  </h3>
                  <p className="font-grotesk text-xs text-white/40 mb-10 pb-6 border-b border-white-[0.05]">
                    {camp.duration} <span className="mx-2">·</span> <span className="text-white/70">{camp.idealFor}</span>
                  </p>

                  {/* Includes */}
                  <ul className="space-y-4 mb-12 flex-1">
                    {camp.includes.map((item) => (
                      <li key={item} className="flex items-start gap-4">
                        <span className="w-1.5 h-1.5 bg-primary/70 mt-2 shrink-0 group-hover:scale-125 transition-transform duration-300" />
                        <span className="font-grotesk text-[13px] md:text-sm text-white/60 leading-relaxed group-hover:text-white/80 transition-colors">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Outcome */}
                  <div className="border-t border-white/[0.08] pt-6 mb-8 mt-auto">
                    <p className="font-grotesk text-[9px] tracking-[0.4em] uppercase text-white/30 mb-3">Outcome</p>
                    <p className="text-sm font-grotesk text-white/80 leading-relaxed">{camp.outcome}</p>
                  </div>

                  {/* CTA */}
                  <a
                    href="#camps"
                    onClick={(e) => handleBookClick(e, camp.id)}
                    className={`block w-full text-center py-4 font-barlow font-black text-xs tracking-[0.3em] uppercase transition-all duration-500 overflow-hidden relative isolate ${
                      camp.featured
                        ? "bg-primary text-black hover:bg-white hover:scale-[1.02]"
                        : "bg-transparent border border-white/20 text-white hover:border-primary hover:text-primary hover:bg-primary/5"
                    }`}
                  >
                    <span className="relative z-10 transition-transform duration-500 group-hover:-translate-x-1 inline-block">Welcome,</span>
                    <span className="relative z-10 mx-1">Fighter</span>
                    <span className="relative z-10 transition-transform duration-500 translate-x-4 opacity-0 group-hover:translate-x-1 group-hover:opacity-100 inline-block font-sans">→</span>
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── UPCOMING BATCHES ── */}
        <motion.div
           className="mt-32 border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl rounded-sm p-8 md:p-12 lg:p-16 relative overflow-hidden"
           initial={{ opacity: 0, y: 40 }}
           animate={isInView ? { opacity: 1, y: 0 } : {}}
           transition={{ delay: 0.6, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
          
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-12 relative z-10">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-5">
                <span className="inline-block w-4 h-[2px] bg-primary/50" />
                <span className="font-grotesk text-[9px] tracking-[0.4em] uppercase text-primary/70">Secure Your Spot</span>
              </div>
              <h3 className="font-barlow font-black italic text-4xl sm:text-5xl md:text-6xl text-white uppercase mb-6 leading-[0.85]">
                UPCOMING <span className="text-gradient-fire">BATCHES</span>
              </h3>
              <p className="font-grotesk text-sm md:text-base text-white/50 leading-relaxed">
                Join our premium Muay Thai clinics in Thailand. Each intensive batch is rigorously restricted in size to enforce highly personalized coaching and an authentically immersive journey.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-5">
              {SITE_CONFIG.batches.map((batch) => (
                <div key={batch.location} className="border border-white/10 bg-black/60 p-6 md:p-8 text-center min-w-[210px] hover:border-primary/40 transition-colors duration-500 group flex flex-col justify-center">
                  <p className="font-barlow font-black italic text-2xl md:text-3xl text-white uppercase mb-2 group-hover:text-primary transition-colors duration-500">{batch.location}</p>
                  <p className="font-grotesk text-sm text-white/60 mb-5">{batch.date}</p>
                  <span className="inline-block px-3 py-1.5 border border-primary/20 bg-primary/[0.05] font-grotesk text-[9px] tracking-[0.3em] uppercase text-primary font-bold group-hover:bg-primary/20 transition-colors duration-500">
                    {batch.status}
                  </span>
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
