"use client";

import { Clock, MapPin } from "lucide-react";
import type { EnrichedPackage } from "@/components/FightCampsSection/FightCampsSection.helpers";
import {
  AppliedCoupon,
  ContentSection,
  NOISE_OVERLAY,
  PriceView,
  fmtDiscount,
  fmtPrice,
  splitPoints,
} from "../booking.helpers";
import CouponField from "./CouponField";
import PointList from "./PointList";

interface BookingSummaryCardProps {
  pkg: EnrichedPackage;
  sections: ContentSection[];
  locationName: string;
  startDateLabel: string | null;
  coupon: AppliedCoupon | null;
  couponLocked: boolean;
  /** Priced once for everyone the booking covers — see `priceView`. */
  price: PriceView;
  onCouponApplied: (coupon: AppliedCoupon) => void;
  onCouponRemoved: () => void;
  onBackToDetails: () => void;
}

/** Sticky reminder of what's being paid for, alongside the form. */
export default function BookingSummaryCard({
  pkg,
  sections,
  locationName,
  startDateLabel,
  coupon,
  couponLocked,
  price,
  onCouponApplied,
  onCouponRemoved,
  onBackToDetails,
}: BookingSummaryCardProps) {
  const Icon = pkg.icon;
  const highlight = sections[sections.length - 1];

  return (
    <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 lg:sticky lg:top-28">
      <div className="border border-white/[0.08] bg-white/[0.02] overflow-hidden">
        {/* Card header */}
        <div className={`p-6 bg-gradient-to-br ${pkg.accent} relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={NOISE_OVERLAY} />
          <div className="w-12 h-12 bg-black/30 flex items-center justify-center mb-4">
            <Icon size={22} className="text-white" />
          </div>
          <p className="font-grotesk text-[13px] tracking-[0.4em] uppercase text-white/70 mb-1">{pkg.subtitle}</p>
          <h2 className="font-barlow font-black italic text-4xl text-white uppercase leading-[0.88] mb-3">
            {pkg.title}
          </h2>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 font-grotesk text-[13px] tracking-wide text-white/70 bg-black/20 px-2.5 py-1">
              <MapPin size={10} /> {locationName}
            </span>
            <span className="inline-flex items-center gap-1.5 font-grotesk text-[13px] tracking-wide text-white/70 bg-black/20 px-2.5 py-1">
              <Clock size={10} /> {pkg.duration}
            </span>
          </div>
        </div>

        {/* Card body */}
        <div className="p-6 flex flex-col gap-6">
          <div className="border border-white/[0.08] bg-white/[0.03] p-5">
            <div className="flex items-end justify-between mb-3">
              <span className="font-grotesk text-[13px] tracking-[0.35em] uppercase text-white/60">
                Total Amount
              </span>
              {/* Every amount here comes from the API — the per-person price from
                  the package, the discount from the coupon preview. */}
              <span className="font-barlow font-black italic text-3xl text-white">
                {fmtPrice(price.total)}
              </span>
            </div>
            <div className="space-y-1.5">
              <PriceRow
                label="Camp fee"
                value={
                  price.count > 1
                    ? `${fmtPrice(price.perPerson)} × ${price.count}`
                    : fmtPrice(price.perPerson)
                }
              />
              {price.discount !== null && (
                <>
                  <PriceRow label="Package price" value={fmtPrice(price.subtotal)} />
                  <PriceRow
                    label={`Discount (${price.couponCode})`}
                    value={fmtDiscount(price.discount)}
                    accent
                  />
                </>
              )}
              <PriceRow label="Duration" value={`${pkg.duration_days} days`} />
              {startDateLabel && <PriceRow label="Start date" value={startDateLabel} />}
            </div>
          </div>

          <CouponField
            packageId={pkg.id}
            participantCount={price.count}
            coupon={coupon}
            locked={couponLocked}
            onApplied={onCouponApplied}
            onRemoved={onCouponRemoved}
          />

          {/* Condensed reminder of what they just read */}
          {highlight && (
            <div>
              <h4 className="font-barlow font-black italic text-lg uppercase tracking-wide text-white mb-3">
                {highlight.label}
              </h4>
              <PointList
                points={splitPoints(highlight.items).slice(0, 5)}
                className="text-[13px] text-white/80"
                gap="gap-2.5"
                spacing="space-y-2.5"
              />
            </div>
          )}

          <button
            onClick={onBackToDetails}
            className="font-grotesk text-[13px] text-white/50 hover:text-primary transition-colors text-left underline underline-offset-4"
          >
            See full camp details again
          </button>
        </div>
      </div>
    </div>
  );
}

function PriceRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className={`font-grotesk text-[13px] truncate ${accent ? "text-primary" : "text-white/60"}`}>{label}</span>
      <span className={`font-grotesk text-[13px] shrink-0 ${accent ? "text-primary" : "text-white/60"}`}>{value}</span>
    </div>
  );
}
