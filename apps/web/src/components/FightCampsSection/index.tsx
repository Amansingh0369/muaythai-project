"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Users, ArrowRight } from "lucide-react";
import { packageService } from "@/services/package.service";

type Kind = "INDIVIDUAL" | "GROUP";

const KIND_CARDS: {
  kind: Kind;
  slug: string;
  icon: typeof User;
  title: string;
  description: string;
  accent: string;
  featured: boolean;
}[] = [
  {
    kind: "INDIVIDUAL",
    slug: "individual",
    icon: User,
    title: "Individual",
    description: "Train at a single location. Pick the camp, dates, and level that fit you.",
    accent: "from-primary to-orange-deep",
    featured: false,
  },
  {
    kind: "GROUP",
    slug: "group",
    icon: Users,
    title: "Group",
    description: "A journey across multiple locations, trained together as a squad.",
    accent: "from-blue-electric to-blue-deep",
    featured: true,
  },
];

const FightCampsSection = () => {
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  // Live counts of active camps per kind (across every level).
  const [counts, setCounts] = useState<Record<Kind, number | null>>({
    INDIVIDUAL: null,
    GROUP: null,
  });

  useEffect(() => {
    let cancelled = false;
    packageService
      .getPackages()
      .then((packages) => {
        if (cancelled) return;
        setCounts({
          INDIVIDUAL: packages.filter((p) => p.kind === "INDIVIDUAL").length,
          GROUP: packages.filter((p) => p.kind === "GROUP").length,
        });
      })
      .catch(() => {
        if (!cancelled) setCounts({ INDIVIDUAL: 0, GROUP: 0 });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="camps" ref={ref} className="relative bg-[#050505] py-24 md:py-36 pb-32">
      <div
        className="absolute inset-0 z-[1] opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "128px 128px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-[#0a0a0a] to-black z-[2]" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 md:px-12 lg:px-20">
        {/* ── HEADER ── */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="flex justify-center items-center gap-3 mb-6">
            <span className="inline-block w-8 h-[2px] bg-primary" />
            <span className="font-grotesk text-[12px] md:text-[13px] tracking-[0.45em] uppercase text-primary font-medium">
              Choose Your Experience
            </span>
            <span className="inline-block w-8 h-[2px] bg-primary" />
          </div>

          <h2 className="font-barlow font-black italic text-[14vw] sm:text-[10vw] md:text-[8vw] lg:text-[7vw] leading-[0.85] tracking-[-0.02em] text-white uppercase mix-blend-plus-lighter">
            FIGHT <span className="text-gradient-fire">CAMPS</span>
          </h2>

          <p className="font-grotesk text-sm md:text-base text-white/70 mt-6 max-w-2xl mx-auto leading-relaxed">
            These aren't packages. They're experiences. No matter your level, your camp is waiting for you.
          </p>
        </motion.div>

        {/* ── INDIVIDUAL / GROUP CARDS ── */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {KIND_CARDS.map((card, index) => {
            const Icon = card.icon;
            const count = counts[card.kind];
            return (
              <motion.button
                key={card.kind}
                type="button"
                onClick={() => router.push(`/camps/${card.slug}`)}
                className={`group text-left flex flex-col h-full border p-8 lg:p-10 transition-all [transition-duration:500ms] hover:border-primary/40 hover:bg-white/[0.04] ${
                  card.featured
                    ? "border-white/[0.12] bg-white/[0.03] shadow-[0_0_50px_-20px_rgba(255,80,0,0.25)]"
                    : "border-white/[0.08] bg-black/40 backdrop-blur-sm"
                }`}
                initial={{ opacity: 0, y: 50 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className={`w-14 h-14 bg-gradient-to-br ${card.accent} flex items-center justify-center mb-8 shrink-0`}>
                  <Icon className="w-7 h-7 text-black" />
                </div>

                <div className="flex items-baseline gap-3 mb-3">
                  <h3 className="font-barlow font-black italic text-4xl md:text-5xl text-white uppercase leading-[0.85]">
                    {card.title}
                  </h3>
                  <span className="font-grotesk text-[13px] tracking-[0.3em] uppercase text-primary">
                    {count === null ? "…" : `${count} ${count === 1 ? "Camp" : "Camps"}`}
                  </span>
                </div>

                <p className="font-grotesk text-[13px] md:text-sm text-white/60 leading-relaxed mb-10 flex-1">
                  {card.description}
                </p>

                <span
                  className={`inline-flex items-center justify-center gap-2 w-full py-4 font-barlow font-black text-[13px] tracking-[0.3em] uppercase transition-all duration-500 ${
                    card.featured
                      ? "bg-primary text-black group-hover:bg-white"
                      : "bg-transparent border border-white/20 text-white group-hover:border-primary group-hover:text-primary group-hover:bg-primary/5"
                  }`}
                >
                  View Camps
                  <ArrowRight
                    size={15}
                    className="group-hover:translate-x-1 transition-transform duration-300"
                  />
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FightCampsSection;
