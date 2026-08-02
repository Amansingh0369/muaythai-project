"use client";

import { motion } from "framer-motion";
import { MapPin, CalendarDays } from "lucide-react";
import { type Package, packageLocationNames } from "@/services/package.service";

function fmtPrice(price: string | number) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

function fmtDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface PackageRowProps {
  pkg: Package;
  index: number;
  highlighted?: boolean;
  onSelect: (pkg: Package) => void;
}

/** A single bookable camp row — shared by the Camps and Packages listings. */
const PackageRow = ({ pkg, index, highlighted = false, onSelect }: PackageRowProps) => {
  return (
    <motion.div
      id={`pkg-${pkg.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onSelect(pkg)}
      className={`group cursor-pointer border bg-black/40 hover:border-primary/40 hover:bg-white/[0.03] transition-all duration-500 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6 scroll-mt-28 ${
        highlighted
          ? "border-primary ring-2 ring-primary/60 shadow-[0_0_45px_rgba(255,80,0,0.25)]"
          : "border-white/20"
      }`}
    >
      {/* Left — location + name */}
      <div className="flex-1 min-w-0">
        <p className="font-grotesk text-[13px] tracking-[0.4em] uppercase text-primary mb-1">
          {packageLocationNames(pkg)}
        </p>
        <h3 className="font-barlow font-black italic text-2xl md:text-3xl text-white uppercase leading-tight mb-2 truncate">
          {pkg.name}
        </h3>
        <p className="font-grotesk text-[13px] text-white/60 leading-relaxed line-clamp-2">
          {pkg.description}
        </p>
      </div>

      {/* Middle — meta chips */}
      <div className="flex flex-wrap sm:flex-col gap-2 sm:gap-3 shrink-0">
        <span className="inline-flex items-center gap-1.5 font-grotesk text-[13px] tracking-wide text-white/60 bg-white/[0.06] border border-white/[0.08] px-3 py-1.5">
          <MapPin size={10} className="text-primary" />
          {packageLocationNames(pkg)}
        </span>
        {pkg.start_date && (
          <span className="inline-flex items-center gap-1.5 font-grotesk text-[13px] tracking-wide text-white/60 bg-white/[0.06] border border-white/[0.08] px-3 py-1.5">
            <CalendarDays size={10} className="text-primary" />
            {fmtDate(pkg.start_date)}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 font-grotesk text-[13px] tracking-wide text-white/60 bg-white/[0.06] border border-white/[0.08] px-3 py-1.5">
          {pkg.duration_days} Days
        </span>
      </div>

      {/* Right — price + CTA */}
      <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-3">
        <span className="font-barlow font-black italic text-3xl text-white">{fmtPrice(pkg.price)}</span>
        <span className="font-grotesk text-[13px] tracking-[0.3em] uppercase text-white/55 border border-white/10 px-4 py-2 group-hover:border-primary group-hover:text-primary transition-colors duration-300">
          Book Now →
        </span>
      </div>
    </motion.div>
  );
};

export default PackageRow;
