"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, CalendarDays, Loader2, AlertCircle, Flame, Swords, Crown } from "lucide-react";
import { packageService, Package } from "@/services/package.service";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const TYPE_META: Record<string, { label: string; subtitle: string; duration: string; icon: any; accent: string }> = {
  BEGINNER: {
    label: "Beginner Experience",
    subtitle: "Your First Fight Camp · 7 Days",
    duration: "7 Days",
    icon: Flame,
    accent: "from-primary to-orange-deep",
  },
  INTERMEDIATE: {
    label: "Intermediate Training",
    subtitle: "Level Up Your Game · 14 Days",
    duration: "14 Days",
    icon: Swords,
    accent: "from-blue-electric to-blue-deep",
  },
  ADVANCED: {
    label: "Fighter Camp",
    subtitle: "Intensive. Relentless. · 21 Days",
    duration: "21 Days",
    icon: Crown,
    accent: "from-primary to-orange-glow",
  },
};

function fmt(price: string | number) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SelectPackagePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const type = (params.type as string)?.toUpperCase();

  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const meta = TYPE_META[type];
  const Icon = meta?.icon ?? Flame;

  useEffect(() => {
    if (!meta) return;
    const load = async () => {
      try {
        setIsLoading(true);
        const data = await packageService.getPackagesByType(type);
        setPackages(data);
      } catch {
        setError("Failed to load available camps. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [type]);

  const handleSelect = (pkg: Package) => {
    if (!user) {
      router.push(`/login?redirect=/book/${pkg.id}`);
    } else {
      router.push(`/book/${pkg.id}`);
    }
  };

  if (!meta) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center px-6">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle size={32} className="text-red-400" />
          <p className="font-grotesk text-white/60 text-sm">Invalid camp type.</p>
          <button onClick={() => router.push("/#camps")} className="px-6 py-2.5 font-barlow font-bold text-[11px] tracking-[0.2em] uppercase bg-primary text-black">
            Back to Camps
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />

      <div className="pt-[88px] pb-24">
        {/* Back */}
        <div className="max-w-6xl mx-auto px-5 md:px-10 lg:px-16 pt-8 pb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 font-grotesk text-xs text-white/40 hover:text-white/80 transition-colors duration-200 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Camps
          </button>
        </div>

        {/* Header */}
        <div className="max-w-6xl mx-auto px-5 md:px-10 lg:px-16 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block w-6 h-[2px] bg-primary" />
            <span className="font-grotesk text-[10px] tracking-[0.45em] uppercase text-primary font-medium">Select Your Slot</span>
          </div>
          <div className="flex items-start gap-5">
            <div className={`w-16 h-16 bg-gradient-to-br ${meta.accent} flex items-center justify-center shrink-0`}>
              <Icon className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="font-barlow font-black italic text-5xl md:text-6xl lg:text-7xl text-white uppercase leading-[0.88] tracking-tight">
                {meta.label}
              </h1>
              <p className="font-grotesk text-sm text-white/40 mt-2">{meta.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-6xl mx-auto px-5 md:px-10 lg:px-16">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-6"
              >
                <Loader2 className="animate-spin text-primary w-10 h-10" />
                <p className="font-grotesk text-[10px] tracking-[0.4em] uppercase text-white/30 animate-pulse">
                  Loading Available Camps…
                </p>
              </motion.div>
            ) : error ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-24 gap-4 text-center"
              >
                <AlertCircle className="text-red-500/50 w-10 h-10" />
                <p className="text-white/40 text-sm font-grotesk">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-8 py-3 bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all font-grotesk"
                >
                  Retry
                </button>
              </motion.div>
            ) : packages.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-4 text-center"
              >
                <Icon className="text-white/10 w-16 h-16" />
                <h3 className="text-white font-black text-2xl uppercase tracking-tighter font-barlow italic">No Slots Available</h3>
                <p className="text-white/40 text-sm max-w-sm font-grotesk">
                  No {meta.label.toLowerCase()} camps are currently open for booking. Check back soon.
                </p>
                <button
                  onClick={() => router.push("/#camps")}
                  className="mt-4 px-8 py-3 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/5 transition-all font-grotesk"
                >
                  View Other Camps
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="font-grotesk text-[10px] tracking-[0.4em] uppercase text-white/30 mb-6">
                  {packages.length} slot{packages.length !== 1 ? "s" : ""} available — pick your location & date
                </p>

                <div className="flex flex-col gap-4">
                  {packages.map((pkg, i) => (
                    <motion.div
                      key={pkg.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => handleSelect(pkg)}
                      className="group cursor-pointer border border-white/[0.08] bg-black/40 hover:border-primary/40 hover:bg-white/[0.03] transition-all duration-500 p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-6"
                    >
                      {/* Left — location + name */}
                      <div className="flex-1 min-w-0">
                        <p className="font-grotesk text-[9px] tracking-[0.4em] uppercase text-primary mb-1">
                          {pkg.location_details?.city || pkg.location_details?.name || "Thailand"}
                        </p>
                        <h3 className="font-barlow font-black italic text-2xl md:text-3xl text-white uppercase leading-tight mb-2 truncate">
                          {pkg.name}
                        </h3>
                        <p className="font-grotesk text-xs text-white/40 leading-relaxed line-clamp-2">{pkg.description}</p>
                      </div>

                      {/* Middle — meta chips */}
                      <div className="flex flex-wrap sm:flex-col gap-2 sm:gap-3 shrink-0">
                        {pkg.location_details && (
                          <span className="inline-flex items-center gap-1.5 font-grotesk text-[10px] tracking-wide text-white/60 bg-white/[0.06] border border-white/[0.08] px-3 py-1.5">
                            <MapPin size={10} className="text-primary" />
                            {pkg.location_details.city || pkg.location_details.name}
                          </span>
                        )}
                        {(pkg as any).start_date && (
                          <span className="inline-flex items-center gap-1.5 font-grotesk text-[10px] tracking-wide text-white/60 bg-white/[0.06] border border-white/[0.08] px-3 py-1.5">
                            <CalendarDays size={10} className="text-primary" />
                            {formatDate((pkg as any).start_date)}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 font-grotesk text-[10px] tracking-wide text-white/60 bg-white/[0.06] border border-white/[0.08] px-3 py-1.5">
                          {pkg.duration_days} Days
                        </span>
                      </div>

                      {/* Right — price + CTA */}
                      <div className="shrink-0 flex flex-row sm:flex-col items-center sm:items-end gap-4 sm:gap-3">
                        <span className="font-barlow font-black italic text-3xl text-white">{fmt(pkg.price)}</span>
                        <span className="font-grotesk text-[10px] tracking-[0.3em] uppercase text-white/30 border border-white/10 px-4 py-2 group-hover:border-primary group-hover:text-primary transition-colors duration-300">
                          Book Now →
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
