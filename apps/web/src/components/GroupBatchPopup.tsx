"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, MapPin, CalendarDays, Clock, ArrowUpRight } from "lucide-react";
import {
  packageService,
  packageLocationNames,
  type Package,
} from "@/services/package.service";

const SESSION_KEY = "titmt_group_popup_shown";

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

/** True if the package's start date is today or later (i.e. still upcoming). */
function isUpcoming(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  return target.getTime() >= today.getTime();
}

/**
 * One-time (per session) popup shown after the branding loader on the homepage.
 * Fetches every active package, keeps only those with an upcoming start date,
 * and highlights the single nearest departure.
 */
const GroupBatchPopup = () => {
  const router = useRouter();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only once per browser session.
    if (typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY)) {
      return;
    }

    let cancelled = false;

    packageService
      .getPackages()
      .then((packages) => {
        if (cancelled) return;

        const nearest = packages
          .filter((p) => p.start_date && isUpcoming(p.start_date))
          .sort(
            (a, b) =>
              new Date(a.start_date as string).getTime() -
              new Date(b.start_date as string).getTime()
          )[0];

        if (nearest) {
          setPkg(nearest);
          setOpen(true);
          sessionStorage.setItem(SESSION_KEY, "1");
        }
      })
      .catch(() => {
        /* fail silently — no popup on error */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Close on ESC.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);

  const goToBooking = () => {
    if (!pkg) return;
    setOpen(false);
    router.push(`/book/${pkg.id}`);
  };

  if (!pkg) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-5 sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={close}
          />

          {/* Card */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Upcoming group departure"
            className="relative w-full max-w-md bg-background border-2 border-primary rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.65)] overflow-hidden"
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            <div className="p-6 md:p-8">
              {/* Close */}
              <button
                onClick={close}
                aria-label="Close"
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              {/* Eyebrow */}
              <div className="flex items-center flex-wrap gap-3 mb-5">
                <div className="flex items-center gap-2">
                  <span className="font-grotesk text-[12px] tracking-[0.4em] uppercase text-primary font-bold">
                    Next Departure
                  </span>
                </div>
                <span className="font-barlow font-bold text-[12px] tracking-[0.2em] uppercase text-primary bg-primary/10 border border-primary/30 px-2.5 py-1">
                  Upcoming Batch
                </span>
              </div>

              {/* Name */}
              <h2 className="font-barlow font-black italic text-2xl md:text-3xl text-white uppercase leading-[0.95] mb-4">
                {pkg.name}
              </h2>

              {/* Meta rows */}
              <div className="space-y-2.5 mb-6">
                <div className="flex items-center gap-3 text-white/70">
                  <MapPin size={15} className="text-primary shrink-0" />
                  <span className="font-grotesk text-sm">
                    {packageLocationNames(pkg)}
                  </span>
                </div>
                {pkg.start_date && (
                  <div className="flex items-center gap-3 text-white/70">
                    <CalendarDays size={15} className="text-primary shrink-0" />
                    <span className="font-grotesk text-sm">
                      {fmtDate(pkg.start_date)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3 text-white/70">
                  <Clock size={15} className="text-primary shrink-0" />
                  <span className="font-grotesk text-sm">
                    {pkg.duration_days} Days
                  </span>
                </div>
              </div>

              {/* Price + CTA */}
              <div className="flex items-center justify-between gap-4 mt-6">
                <div className="flex flex-col">
                  <span className="font-grotesk text-[12px] tracking-[0.25em] uppercase text-white/60">
                    From
                  </span>
                  <span className="font-barlow font-black italic text-2xl text-white">
                    {fmtPrice(pkg.price)}
                  </span>
                </div>

                <button
                  onClick={goToBooking}
                  className="group relative inline-flex items-center gap-2 bg-primary px-6 py-3.5 font-barlow font-black text-[13px] tracking-[0.2em] uppercase text-black overflow-hidden"
                >
                  <span className="relative z-10">Reserve Spot</span>
                  <ArrowUpRight
                    size={14}
                    className="relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200"
                  />
                  <span className="absolute inset-0 bg-white/25 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GroupBatchPopup;
