"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Loader2, AlertCircle, User, Users, Clock, MapPin, ChevronDown, SlidersHorizontal } from "lucide-react";
import { packageService, type Package } from "@/services/package.service";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PackageRow from "@/components/PackageRow";

type Kind = "INDIVIDUAL" | "GROUP";

const KIND_META: Record<Kind, { slug: string; label: string; blurb: string; icon: typeof User }> = {
  INDIVIDUAL: {
    slug: "individual",
    label: "Individual Camps",
    blurb: "Train at a single location — pick your camp, dates, and level.",
    icon: User,
  },
  GROUP: {
    slug: "group",
    label: "Group Camps",
    blurb: "A journey across multiple locations, trained together as a squad.",
    icon: Users,
  },
};

function resolveKind(raw?: string): Kind | null {
  const value = raw?.toUpperCase();
  return value === "INDIVIDUAL" || value === "GROUP" ? value : null;
}

function GuidedHint({ icon: Icon, text }: { icon: typeof Clock; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center border border-white/10 bg-white/[0.02]">
      <Icon className="w-10 h-10 text-white/15" />
      <p className="font-grotesk text-sm text-white/60 max-w-xs">{text}</p>
    </div>
  );
}

const selectClass =
  "appearance-none w-full bg-white/[0.05] border border-white/15 text-white font-grotesk text-sm px-4 py-3.5 pr-10 focus:outline-none focus:border-primary/60 transition-colors cursor-pointer [&>option]:bg-black [&>option]:text-white";

export default function CampsByKindPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const kind = resolveKind(params.kind as string);
  const meta = kind ? KIND_META[kind] : null;

  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<number | null>(null);

  // A specific camp to scroll to + flash (e.g. arriving from a map camp click).
  const highlightParam = searchParams.get("highlight");

  // Guided filters: "" = not chosen yet, "ALL" = no filter, else a specific value.
  const [durationSel, setDurationSel] = useState<string>("");
  const [citySel, setCitySel] = useState<string>("");

  // Distinct durations present in the data (ascending).
  const durations = useMemo(
    () => Array.from(new Set(packages.map((p) => p.duration_days))).sort((a, b) => a - b),
    [packages]
  );

  // Cities available for the chosen duration (cascades from the duration pick).
  const cities = useMemo(() => {
    const pool =
      durationSel === "" || durationSel === "ALL"
        ? packages
        : packages.filter((p) => p.duration_days === Number(durationSel));
    const set = new Set<string>();
    pool.forEach((p) => (p.locations ?? []).forEach((l) => l.city && set.add(l.city)));
    return Array.from(set).sort();
  }, [packages, durationSel]);

  // Camps matching both filters — only once both have been chosen.
  const filtered = useMemo(() => {
    if (durationSel === "" || citySel === "") return [];
    return packages.filter((p) => {
      const durationOk = durationSel === "ALL" || p.duration_days === Number(durationSel);
      const cityOk = citySel === "ALL" || (p.locations ?? []).some((l) => l.city === citySel);
      return durationOk && cityOk;
    });
  }, [packages, durationSel, citySel]);

  const handleDurationChange = (value: string) => {
    setDurationSel(value);
    setCitySel(""); // re-choose the city whenever the duration changes
  };

  useEffect(() => {
    if (!kind) return;
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await packageService.getPackages({ kind });
        if (!cancelled) setPackages(data);
      } catch {
        if (!cancelled) setError("Failed to load available camps. Please try again.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [kind]);

  // Once the list is rendered, scroll the highlighted camp into view and flash it.
  useEffect(() => {
    if (isLoading || !highlightParam || packages.length === 0) return;
    const id = Number(highlightParam);
    if (!packages.some((p) => p.id === id)) return;
    const scrollTimer = setTimeout(() => {
      document.getElementById(`pkg-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedId(id);
    }, 200);
    const clearTimer = setTimeout(() => setHighlightedId(null), 3000);
    return () => {
      clearTimeout(scrollTimer);
      clearTimeout(clearTimer);
    };
  }, [isLoading, highlightParam, packages]);

  const handleSelect = (pkg: Package) => {
    router.push(user ? `/book/${pkg.id}` : `/login?redirect=/book/${pkg.id}`);
  };

  if (!meta) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center px-6">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle size={32} className="text-red-400" />
          <p className="font-grotesk text-white/60 text-sm">Invalid camp type.</p>
          <button
            onClick={() => router.push("/camps")}
            className="px-6 py-2.5 font-barlow font-bold text-[13px] tracking-[0.2em] uppercase bg-primary text-black"
          >
            Back to Camps
          </button>
        </div>
      </div>
    );
  }

  const Icon = meta.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-[88px] pb-24">
        {/* Back */}
        <div className="max-w-6xl mx-auto px-5 md:px-10 lg:px-16 pt-8 pb-6">
          <button
            onClick={() => router.push("/camps")}
            className="inline-flex items-center gap-2 font-grotesk text-[13px] text-white/60 hover:text-white/80 transition-colors duration-200 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Camps
          </button>
        </div>

        {/* Header */}
        <div className="max-w-6xl mx-auto px-5 md:px-10 lg:px-16 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-block w-6 h-[2px] bg-primary" />
            <span className="font-grotesk text-[13px] tracking-[0.45em] uppercase text-primary font-medium">
              Select Your Slot
            </span>
          </div>
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-orange-deep flex items-center justify-center shrink-0">
              <Icon className="w-8 h-8 text-black" />
            </div>
            <div>
              <h1 className="font-barlow font-black italic text-5xl md:text-6xl lg:text-7xl text-white uppercase leading-[0.88] tracking-tight">
                {meta.label}
              </h1>
              <p className="font-grotesk text-sm text-white/60 mt-2">{meta.blurb}</p>
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
                <p className="font-grotesk text-[13px] tracking-[0.4em] uppercase text-white/55 animate-pulse">
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
                <p className="text-white/60 text-sm font-grotesk">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-2 px-8 py-3 bg-white/5 border border-white/10 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all font-grotesk"
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
                <h3 className="text-white font-black text-2xl uppercase tracking-tighter font-barlow italic">
                  No Camps Available
                </h3>
                <p className="text-white/60 text-sm max-w-sm font-grotesk">
                  No {meta.label.toLowerCase()} are currently open for booking. Check back soon.
                </p>
                <button
                  onClick={() => router.push("/camps")}
                  className="mt-4 px-8 py-3 border border-white/10 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all font-grotesk"
                >
                  Back to Camps
                </button>
              </motion.div>
            ) : (
              <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Filter header */}
                <div className="flex items-center gap-3 mb-6">
                  <SlidersHorizontal size={16} className="text-primary" />
                  <span className="font-grotesk text-[13px] tracking-[0.3em] uppercase text-primary/80 border border-primary/20 px-2.5 py-1">
                    {meta.label}
                  </span>
                  <p className="font-grotesk text-[13px] tracking-[0.3em] uppercase text-white/55">
                    Filter to find your camp
                  </p>
                </div>

                {/* Cascading dropdowns: Duration → City */}
                <div className="flex flex-col sm:flex-row gap-4 mb-10">
                  <div className="flex-1 space-y-2">
                    <label className="flex items-center gap-2 font-grotesk text-[12px] tracking-[0.3em] uppercase text-white/50">
                      <Clock size={13} className="text-primary" /> Duration
                    </label>
                    <div className="relative">
                      <select
                        value={durationSel}
                        onChange={(e) => handleDurationChange(e.target.value)}
                        className={selectClass}
                      >
                        <option value="" disabled>
                          Select duration…
                        </option>
                        <option value="ALL">All durations</option>
                        {durations.map((d) => (
                          <option key={d} value={String(d)}>
                            {d} {d === 1 ? "Day" : "Days"}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                    </div>
                  </div>

                  <AnimatePresence>
                    {durationSel !== "" && (
                      <motion.div
                        className="flex-1 space-y-2"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                      >
                        <label className="flex items-center gap-2 font-grotesk text-[12px] tracking-[0.3em] uppercase text-white/50">
                          <MapPin size={13} className="text-primary" /> City
                        </label>
                        <div className="relative">
                          <select
                            value={citySel}
                            onChange={(e) => setCitySel(e.target.value)}
                            className={selectClass}
                          >
                            <option value="" disabled>
                              Select city…
                            </option>
                            <option value="ALL">All cities</option>
                            {cities.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                          <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Guided reveal: duration → city → results */}
                {durationSel === "" ? (
                  <GuidedHint icon={Clock} text="Select a duration to get started." />
                ) : citySel === "" ? (
                  <GuidedHint icon={MapPin} text="Now choose a city to see matching camps." />
                ) : filtered.length === 0 ? (
                  <GuidedHint icon={AlertCircle} text="No camps match these filters. Try 'All' or a different combination." />
                ) : (
                  <>
                    <p className="font-grotesk text-[13px] tracking-[0.4em] uppercase text-white/55 mb-6">
                      {filtered.length} camp{filtered.length !== 1 ? "s" : ""} found
                    </p>
                    <div className="flex flex-col gap-4">
                      {filtered.map((pkg, i) => (
                        <PackageRow
                          key={pkg.id}
                          pkg={pkg}
                          index={i}
                          highlighted={highlightedId === pkg.id}
                          onSelect={handleSelect}
                        />
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </div>
  );
}
