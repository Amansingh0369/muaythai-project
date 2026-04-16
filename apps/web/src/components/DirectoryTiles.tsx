"use client";

import { motion } from "motion/react";
import { ArrowUpRight, Info, MapPin, Sword, Users } from "lucide-react";
import Link from "next/link";
import aboutImg from "@/assets/training.jpg";
import locationsImg from "@/assets/download.png";

const TILES = [
  {
    title: "About Us",
    description: "Our philosophy, our heritage, and why we do what we do.",
    href: "/about",
    icon: <Info size={24} />,
    image: aboutImg.src,
    accent: "from-blue-500/20 to-transparent",
  },
  {
    title: "Camps & Locations",
    description: "Intensive training camps across Thailand's most iconic locations.",
    href: "/locations",
    icon: <MapPin size={24} />,
    image: locationsImg.src,
    accent: "from-primary/20 to-transparent",
  },
];

const DirectoryTiles = () => {
  return (
    <section className="py-24 md:py-32 px-6 md:px-12 lg:px-20 bg-black overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 md:mb-16 gap-6">
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
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-grotesk text-white/40 text-sm md:text-base max-w-sm leading-relaxed"
          >
            Whether you're looking for professional training or seeking to understand the culture, start your experience here.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-5xl mx-auto">
          {TILES.map((tile, idx) => (
            <motion.div
              key={tile.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
              viewport={{ once: true }}
            >
              <Link
                href={tile.href}
                className="group relative block aspect-[3/4] overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all duration-500 hover:border-primary/50 hover:shadow-[0_0_40px_rgba(var(--primary-rgb),0.15)]"
              >
                {/* Background Image with Overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src={tile.image}
                    alt={tile.title}
                    className="h-full w-full object-cover transition-transform duration-700 opacity-40 group-hover:opacity-60"
                  />
                  <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80`} />
                  <div className={`absolute inset-0 bg-gradient-to-br ${tile.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
                </div>

                {/* Content */}
                <div className="relative z-10 h-full flex flex-col justify-end p-8">
                  <div className="mb-6 h-12 w-12 bg-white/5 border border-white/10 flex items-center justify-center text-white/60 group-hover:text-primary group-hover:scale-110 transition-all duration-500">
                    {tile.icon}
                  </div>

                  <h3 className="font-barlow font-black italic text-2xl md:text-3xl text-white uppercase mb-2 tracking-wide group-hover:text-primary transition-colors">
                    {tile.title}
                  </h3>

                  <p className="font-grotesk text-xs md:text-sm text-white/50 leading-relaxed mb-6 line-clamp-2 md:translate-y-4 md:opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    {tile.description}
                  </p>

                  <div className="flex items-center gap-2 font-barlow font-bold text-[10px] tracking-[0.2em] uppercase text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500">
                    Discover More <ArrowUpRight size={14} />
                  </div>

                  {/* Top Right Index */}
                  <div className="absolute top-8 right-8 font-barlow font-black italic text-4xl text-white/5 tracking-tighter group-hover:text-primary/10 transition-colors">
                    0{idx + 1}
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
