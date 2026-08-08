"use client";

import { CalendarDays, Clock, MapPin } from "lucide-react";
import type { EnrichedPackage } from "@/components/FightCampsSection/FightCampsSection.helpers";
import ImageCarousel from "@/components/ImageCarousel";
import {
  BOX_HEADING,
  ContentSection,
  NOISE_OVERLAY,
  SHELL,
  fmtPrice,
  isProse,
  splitPoints,
} from "../booking.helpers";
import PointList from "./PointList";
import StepRail from "./StepRail";

interface CampDetailsStepProps {
  pkg: EnrichedPackage;
  sections: ContentSection[];
  locationName: string;
  startDateLabel: string | null;
  isMultiLocation: boolean;
  isSignedIn: boolean;
  onBook: () => void;
}

/** Step 1 — the whole camp, readable by anyone. No sign-in until "I Want to Book". */
export default function CampDetailsStep({
  pkg,
  sections,
  locationName,
  startDateLabel,
  isMultiLocation,
  isSignedIn,
  onBook,
}: CampDetailsStepProps) {
  const Icon = pkg.icon;
  const hasRealDescription = pkg.description && pkg.description !== "Test";

  return (
    <>
      {/* Hero */}
      <div className={SHELL}>
        <div className={`relative overflow-hidden bg-gradient-to-br ${pkg.accent} p-7 sm:p-10 md:p-14`}>
          <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={NOISE_OVERLAY} />
          <div className="relative">
            <div className="w-14 h-14 bg-black/30 flex items-center justify-center mb-6">
              <Icon size={26} className="text-white" />
            </div>
            <p className="font-grotesk text-[13px] tracking-[0.45em] uppercase text-white/75 mb-2">{pkg.subtitle}</p>
            <h1 className="font-barlow font-black italic text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white uppercase leading-[0.88] tracking-tight mb-6 max-w-3xl">
              {pkg.title}
            </h1>
            <div className="flex items-center gap-2.5 flex-wrap">
              <HeroChip icon={<MapPin size={11} />} label={locationName} />
              <HeroChip icon={<Clock size={11} />} label={pkg.duration} />
              {startDateLabel && (
                <HeroChip icon={<CalendarDays size={11} />} label={`Starts ${startDateLabel}`} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress rail */}
      <div className={`${SHELL} mt-8`}>
        <StepRail step="details" />
      </div>

      {/* Description */}
      {hasRealDescription && (
        <div className={`${SHELL} mt-8`}>
          <p className="font-grotesk text-base sm:text-lg text-white/85 leading-relaxed max-w-3xl">
            {pkg.description}
          </p>
        </div>
      )}

      {/* Where you'll train — one block per location, so multi-stop camps show every gym */}
      {pkg.locations.length > 0 && (
        <div className={`${SHELL} mt-10`}>
          <h3 className={`${BOX_HEADING} mb-5`}>Where You&apos;ll Train</h3>
          <div className="flex flex-col gap-6">
            {pkg.locations.map((loc) => (
              <div key={loc.id} className="border border-white/[0.10] bg-white/[0.025] overflow-hidden">
                {(loc.images?.length ?? 0) > 0 && (
                  <ImageCarousel images={loc.images ?? []} className="w-full h-[38vh] min-h-[220px] md:h-[52vh]" />
                )}
                <div className="p-6 sm:p-7">
                  <h4 className="font-barlow font-black italic text-2xl sm:text-3xl uppercase text-white leading-tight mb-3">
                    {loc.name}
                  </h4>
                  <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-5">
                    {loc.city && (
                      <span className="inline-flex items-center gap-2 font-grotesk text-[15px] text-white/90 shrink-0">
                        <MapPin size={14} className="text-primary shrink-0" />
                        {loc.city}
                      </span>
                    )}
                    {loc.address && (
                      <span className="font-grotesk text-[15px] text-white/70 leading-relaxed break-words">
                        {loc.address}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Everything the camp includes */}
      <div className={`${SHELL} mt-10`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {sections.map((section) => {
            const points = splitPoints(section.items);
            return (
              <div key={section.label} className="border border-white/[0.10] bg-white/[0.025] p-6 sm:p-7">
                <h3 className={`${BOX_HEADING} mb-5`}>{section.label}</h3>
                {isProse(section.items) ? (
                  <p className="font-grotesk text-[15px] text-white/90 leading-relaxed">{points.join(" ")}</p>
                ) : (
                  <PointList points={points} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* At a glance */}
      <div className={`${SHELL} mt-5`}>
        <div className="border border-white/[0.10] bg-white/[0.04] p-6 sm:p-8">
          <h3 className={`${BOX_HEADING} mb-5`}>At a Glance</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <GlanceItem label={isMultiLocation ? "Locations" : "Location"} value={locationName} />
            <GlanceItem label="Duration" value={`${pkg.duration_days} Days`} />
            <GlanceItem label="Start Date" value={startDateLabel ?? "Flexible"} />
            <GlanceItem label="Total Price">
              <p className="font-barlow font-black italic text-2xl text-white leading-none">{fmtPrice(pkg.price)}</p>
            </GlanceItem>
          </div>
        </div>
      </div>

      {/* Inline CTA — for anyone who reads to the bottom */}
      <div className={`${SHELL} mt-10`}>
        <div className="bg-primary p-7 sm:p-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
          <div>
            <h2 className="font-barlow font-black italic text-3xl sm:text-4xl text-black uppercase leading-tight mb-2">
              Ready to Train?
            </h2>
            <p className="font-grotesk text-sm font-medium text-black/80 max-w-md">
              {isSignedIn
                ? "Next: fill in your details, then pay securely via Razorpay."
                : "Next: sign in, fill in your details, then pay securely via Razorpay."}
            </p>
          </div>
          <button
            onClick={onBook}
            className="group shrink-0 py-4 px-8 font-barlow font-black text-[13px] sm:text-sm tracking-[0.25em] uppercase bg-white text-black hover:shadow-[0_0_40px_rgba(0,0,0,0.35)] transition-all duration-500 flex items-center justify-center gap-3"
          >
            I Want to Book
            <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
          </button>
        </div>
      </div>
    </>
  );
}

function HeroChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-grotesk text-[13px] tracking-wide text-white/80 bg-black/25 px-3 py-1.5">
      {icon} {label}
    </span>
  );
}

function GlanceItem({
  label,
  value,
  children,
}: {
  label: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-grotesk text-[13px] font-bold uppercase tracking-[0.2em] text-white/70 mb-1.5">{label}</p>
      {children ?? <p className="font-grotesk text-[15px] text-white">{value}</p>}
    </div>
  );
}
