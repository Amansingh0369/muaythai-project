"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X, MapPin, CalendarDays, Clock, ArrowUpRight, ImageOff } from "lucide-react";
import {
  packageService,
  packageLocationNames,
  type Package,
} from "@/services/package.service";
import {
  popupImageService,
  type PopupImage,
} from "@/services/popup-image.service";

const SESSION_KEY = "titmt_group_popup_shown";

/**
 * A departure stops being advertised once it is fewer than this many days
 * away — a camp starting on the 15th is announced up to and including the
 * 13th, then the popup moves on to the next one.
 */
const ANNOUNCE_LEAD_DAYS = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

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

/**
 * True while the departure is still far enough out to be worth announcing:
 * at least ANNOUNCE_LEAD_DAYS clear days from today. Both dates are floored
 * to midnight and the difference is rounded, so a DST shift can't turn two
 * whole days into 1.96.
 */
function hasAnnouncementLead(dateStr: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const daysAway = Math.round((target.getTime() - today.getTime()) / DAY_MS);
  return daysAway >= ANNOUNCE_LEAD_DAYS;
}

/**
 * One-time (per session) popup shown after the branding loader on the homepage.
 * Fetches every active package, keeps only those still far enough out to
 * announce, and highlights the single nearest departure. The poster is
 * whichever image an admin has made live in the dashboard.
 */
const GroupBatchPopup = () => {
  const router = useRouter();
  const [pkg, setPkg] = useState<Package | null>(null);
  const [open, setOpen] = useState(false);

  // Poster state is deliberately separate from `pkg`: the two requests are
  // independent and the image must never delay or suppress the popup.
  const [poster, setPoster] = useState<PopupImage | null>(null);
  const [posterResolved, setPosterResolved] = useState(false);
  const [posterBroken, setPosterBroken] = useState(false);

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
          .filter((p) => p.start_date && hasAnnouncementLead(p.start_date))
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

    // Fired alongside the package lookup, not after it: the popup opens as
    // soon as a departure resolves, and the poster fills in when it lands.
    popupImageService.getActivePopupImage().then((image) => {
      if (cancelled) return;
      setPoster(image);
      setPosterResolved(true);
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

  // Narrowed here so the JSX below can read poster.image without a non-null assertion.
  const hasPoster = poster !== null && !posterBroken;

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
            className="relative flex flex-col w-full max-w-md max-h-[92vh] bg-background border-2 border-primary rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.65)] overflow-hidden"
            initial={{ scale: 0.94, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
          >
            {/* Close — pinned above the poster, so it stays put while the
                details below scroll on short viewports. */}
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-3 right-3 z-20 grid place-items-center w-9 h-9 rounded-full bg-black/55 backdrop-blur-sm text-white/75 hover:text-white hover:bg-black/80 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Poster — the image an admin made live in the dashboard. The 4:3
                box is fixed regardless of what was uploaded, so an odd source
                size can't reshape the card. */}
            <div className="relative shrink-0 w-full aspect-[4/3] overflow-hidden">
              {hasPoster ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={poster.image}
                  alt={poster.alt_text}
                  width={1280}
                  height={960}
                  className="w-full h-full object-cover"
                  // Pre-signed S3 URLs expire; a stale one shows the notice
                  // rather than a broken-image icon.
                  onError={() => setPosterBroken(true)}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-white/[0.03] border-b border-white/10">
                  {/* Stay blank until the request settles, so the notice never
                      flashes in front of an image that is simply still loading. */}
                  {posterResolved && (
                    <>
                      <ImageOff size={28} className="text-white/20" />
                      <span className="font-grotesk text-[11px] tracking-[0.3em] uppercase text-white/30">
                        Image not available
                      </span>
                    </>
                  )}
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background to-transparent pointer-events-none" />
            </div>

            <div className="p-6 md:p-8 overflow-y-auto">
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
