"use client";

import { motion } from "motion/react";
import { TextScramble } from "@/components/ui/text-scramble";
import { ArrowUpRight, Info, MapPin } from "lucide-react";
import Link from "next/link";
import aboutImg from "@/assets/training.jpg";
import locationsImg from "@/assets/download.png";

const TILES = [
  {
    title: "About Us",
    description: "Our philosophy, our heritage, and why we do what we do.",
    href: "/about",
    icon: <Info size={20} />,
    image: aboutImg.src,
    accent: "from-blue-500/20 to-transparent",
  },
  {
    title: "Camps & Locations",
    description: "Intensive training camps across Thailand's most iconic locations.",
    href: "/locations",
    icon: <MapPin size={20} />,
    image: locationsImg.src,
    accent: "from-primary/20 to-transparent",
  },
];

const DirectoryTiles = () => {
  return (
    <section className="py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14 gap-6">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-3 mb-4"
            >
              <span className="w-8 h-[2px] bg-primary" />
              <span className="font-grotesk text-[10px] md:text-xs tracking-[0.4em] uppercase text-primary font-bold">
                Bifurcate your journey
              </span>
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="font-barlow font-black italic text-4xl md:text-6xl text-white uppercase leading-tight"
            >
              Explore the <span className="text-primary italic">Muay Thai</span> Universe
            </motion.h2>
          </div>
          <TextScramble
            className="font-grotesk text-white/70 text-sm md:text-base max-w-sm leading-relaxed"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            duration={2.5}
            speed={0.06}
            scrambleClassName="text-primary"
          >
            Whether you're looking for professional training or seeking to understand the culture, start your experience here.
          </TextScramble>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 max-w-5xl mx-auto">
          {TILES.map((tile, idx) => (
            <motion.div
              key={tile.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <Link
                href={tile.href}
                className="group relative flex overflow-hidden border border-white/10
                           bg-white/[0.03] backdrop-blur-sm h-[220px] sm:h-[260px] md:h-[280px]
                           transition-all duration-500
                           hover:border-primary/50 hover:shadow-[0_0_40px_rgba(255,100,0,0.12)]"
              >
                {/* Background image */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="h-full w-full object-cover transition-transform duration-700
                               scale-100 group-hover:scale-105 opacity-35 group-hover:opacity-55"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/10" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${tile.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                </div>

                {/* Index watermark — top right */}
                <div className="absolute top-5 right-6 font-barlow font-black italic text-5xl text-white/[0.04] tracking-tighter group-hover:text-primary/10 transition-colors z-10 select-none">
                  0{idx + 1}
                </div>

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between w-full p-6 md:p-8">
                  {/* Icon */}
                  <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center
                                  text-white/50 group-hover:text-primary group-hover:border-primary/30
                                  transition-all duration-500 shrink-0">
                    {tile.icon}
                  </div>

                  {/* Bottom text */}
                  <div>
                    <h3 className="font-barlow font-black italic text-2xl md:text-3xl text-white uppercase
                                   mb-1.5 tracking-wide group-hover:text-primary transition-colors duration-300">
                      {tile.title}
                    </h3>
                    <p className="font-grotesk text-xs md:text-sm text-white/45 leading-relaxed mb-4
                                  translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100
                                  transition-all duration-500">
                      {tile.description}
                    </p>
                    <div className="flex items-center gap-2 font-barlow font-bold text-[10px] tracking-[0.2em]
                                    uppercase text-primary opacity-0 -translate-x-3
                                    group-hover:opacity-100 group-hover:translate-x-0
                                    transition-all duration-500">
                      Discover More <ArrowUpRight size={13} />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default DirectoryTiles;
