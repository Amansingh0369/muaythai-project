"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, MapPin, Navigation, Loader2, AlertCircle, Dumbbell } from "lucide-react";
import { locationService, type Location } from "@/services/location.service";
import { packageService, type Package } from "@/services/package.service";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ImageCarousel from "@/components/ImageCarousel";
import PackageRow from "@/components/PackageRow";

export default function LocationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const id = Number(params.id);

  const [location, setLocation] = useState<Location | null>(null);
  const [camps, setCamps] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id || Number.isNaN(id)) {
      setError("Invalid location.");
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);

      // 1) Location details — critical: if this fails, show the error state.
      //    NOTE: the single-retrieve endpoint (/locations/{id}/) currently returns
      //    403, so we read from the public list endpoint and find by id instead.
      try {
        const all = await locationService.getLocations();
        const loc = all.find((l) => l.id === id);
        if (!loc) throw new Error("Location not found");
        if (cancelled) return;
        setLocation(loc);
      } catch (err) {
        console.error("Failed to load location", err);
        if (!cancelled) {
          setError("We couldn't load this location. Please try again.");
          setIsLoading(false);
        }
        return;
      }

      // 2) Camps at this location — secondary: a failure just shows an empty list,
      //    it must not blank out the whole page. We fetch all individual camps and
      //    filter client-side (don't rely on the backend `?location=` filter being
      //    supported/honoured).
      try {
        const pkgs = await packageService.getPackages({ kind: "INDIVIDUAL" });
        const here = pkgs.filter((p) => (p.locations ?? []).some((l) => l.id === id));
        if (!cancelled) setCamps(here);
      } catch (err) {
        console.error("Failed to load camps for location", err);
        if (!cancelled) setCamps([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleSelectCamp = (pkg: Package) => {
    router.push(user ? `/book/${pkg.id}` : `/login?redirect=/book/${pkg.id}`);
  };

  const hasCoords = location?.latitude != null && location?.longitude != null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="pt-[88px] pb-24">
        <div className="max-w-6xl mx-auto px-5 md:px-10 lg:px-16">
          {/* Back */}
          <div className="pt-8 pb-6">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center gap-2 font-grotesk text-[13px] text-white/60 hover:text-white/80 transition-colors duration-200 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200" />
              Back
            </button>
          </div>

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
                  Loading Location…
                </p>
              </motion.div>
            ) : error || !location ? (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-32 gap-4 text-center"
              >
                <AlertCircle className="text-red-500/60 w-10 h-10" />
                <p className="text-white/60 text-sm font-grotesk">{error ?? "Location not found."}</p>
                <button
                  onClick={() => router.push("/locations")}
                  className="mt-2 px-8 py-3 border border-white/10 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all font-grotesk"
                >
                  Back to Locations
                </button>
              </motion.div>
            ) : (
              <motion.div key="content" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* ── Gallery ── */}
                <ImageCarousel
                  images={location.images ?? []}
                  className="w-full h-[42vh] min-h-[280px] md:h-[56vh] border border-white/10"
                />

                {/* ── Header / details ── */}
                <div className="mt-8 md:mt-10">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="inline-block w-6 h-[2px] bg-primary" />
                    <span className="font-grotesk text-[13px] tracking-[0.45em] uppercase text-primary font-medium">
                      Training Location
                    </span>
                  </div>

                  <h1 className="font-barlow font-black italic text-4xl md:text-6xl lg:text-7xl text-white uppercase leading-[0.9] tracking-tight">
                    {location.name}
                  </h1>

                  <div className="flex flex-wrap items-center gap-3 mt-5">
                    <span className="inline-flex items-center gap-2 font-grotesk text-[13px] text-white/70 bg-white/[0.05] border border-white/10 px-4 py-2">
                      <MapPin size={14} className="text-primary" />
                      {location.city}
                    </span>
                    <span className="inline-flex items-center gap-2 font-grotesk text-[13px] text-white/70 bg-white/[0.05] border border-white/10 px-4 py-2">
                      {location.address || "—"}
                    </span>
                    {hasCoords && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 font-grotesk text-[13px] text-white/70 bg-white/[0.05] border border-white/10 px-4 py-2 hover:border-primary/60 hover:text-primary transition-colors"
                      >
                        <Navigation size={14} className="text-primary" />
                        Open in Maps
                      </a>
                    )}
                  </div>
                </div>

                {/* ── Camps at this location ── */}
                <div className="mt-14 md:mt-20">
                  <div className="flex items-center gap-3 mb-6">
                    <Dumbbell size={18} className="text-primary" />
                    <h2 className="font-barlow font-black italic text-2xl md:text-3xl text-white uppercase leading-none">
                      Camps at {location.name}
                    </h2>
                  </div>

                  {camps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center border border-white/10 bg-white/[0.02]">
                      <Dumbbell className="text-white/10 w-12 h-12" />
                      <p className="font-grotesk text-sm text-white/60 max-w-sm">
                        No camps are currently open at this location. Check back soon.
                      </p>
                      <button
                        onClick={() => router.push("/camps")}
                        className="mt-2 px-6 py-2.5 border border-white/10 text-white text-[13px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all font-grotesk"
                      >
                        Browse All Camps
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {camps.map((pkg, i) => (
                        <PackageRow key={pkg.id} pkg={pkg} index={i} onSelect={handleSelectCamp} />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <Footer />
    </div>
  );
}
