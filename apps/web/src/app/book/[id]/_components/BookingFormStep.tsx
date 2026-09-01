"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ChevronRight, Loader2, Lock, Phone, Plane, ShieldAlert, User } from "lucide-react";
import type { EnrichedPackage } from "@/components/FightCampsSection/FightCampsSection.helpers";
import type { GuestInput } from "@/services/order.service";
import {
  AppliedCoupon,
  BookingField,
  BookingValues,
  ContentSection,
  FormErrors,
  GuestErrors,
  SHELL,
  fmtDiscount,
  fmtPrice,
  hasDiscount,
  missingFieldLabels,
  participantCount,
  priceView,
  sectionCompletion,
} from "../booking.helpers";
import BookingSummaryCard from "./BookingSummaryCard";
import GuestListSection from "./GuestListSection";
import { FormField, SectionHeader, SelectInput, TextInput } from "./FormControls";
import StepRail from "./StepRail";

interface BookingFormStepProps {
  pkg: EnrichedPackage;
  sections: ContentSection[];
  locationName: string;
  startDateLabel: string | null;
  isMultiLocation: boolean;
  values: BookingValues;
  errors: FormErrors;
  submitting: boolean;
  submitError: string | null;
  coupon: AppliedCoupon | null;
  /** Coupons can only change while the order is still PENDING. */
  couponLocked: boolean;
  onCouponApplied: (coupon: AppliedCoupon) => void;
  onCouponRemoved: () => void;
  onFieldChange: (field: BookingField, value: string) => void;
  /** The signed-in buyer, shown as the fixed first row of the guest list. */
  buyerEmail: string;
  guestErrors: GuestErrors;
  guestServerErrors: string[];
  onGuestAdd: () => void;
  onGuestChange: (index: number, field: keyof GuestInput, value: string) => void;
  onGuestRemove: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBackToDetails: () => void;
}

/** Step 2 — participant details and payment, reached only when signed in. */
export default function BookingFormStep({
  pkg,
  sections,
  locationName,
  startDateLabel,
  isMultiLocation,
  values,
  errors,
  submitting,
  submitError,
  coupon,
  couponLocked,
  onCouponApplied,
  onCouponRemoved,
  onFieldChange,
  buyerEmail,
  guestErrors,
  guestServerErrors,
  onGuestAdd,
  onGuestChange,
  onGuestRemove,
  onSubmit,
  onBackToDetails,
}: BookingFormStepProps) {
  const missing = missingFieldLabels(values);
  const complete = sectionCompletion(values);
  // One place per person, discounted by whatever the coupon preview priced for
  // this booking size. The server still owns the real figure — this only keeps
  // the page honest about what is being bought.
  const price = priceView(pkg.price, coupon, participantCount(values));

  /** Every text input is the same wiring — label, field key, placeholder. */
  const text = (field: BookingField, placeholder: string) => ({
    placeholder,
    value: values[field],
    hasError: !!errors[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onFieldChange(field, e.target.value),
  });

  return (
    <>
      {/* Header */}
      <div className={`${SHELL} mb-8`}>
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-block w-6 h-[2px] bg-primary" />
          <span className="font-grotesk text-[13px] tracking-[0.45em] uppercase text-primary font-medium">
            Fight Camp Booking
          </span>
        </div>
        <h1 className="font-barlow font-black italic text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white uppercase leading-[0.88] tracking-tight mb-8">
          SECURE YOUR <span className="text-gradient-fire">SPOT</span>
        </h1>
        <StepRail step="form" />
      </div>

      {/* Missing fields banner */}
      <AnimatePresence>
        {missing.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`${SHELL} mb-8`}
          >
            <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-400/[0.06] border border-amber-400/20">
              <ShieldAlert size={15} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-grotesk text-[13px] text-amber-300 font-bold mb-0.5">A few details still needed</p>
                <p className="font-grotesk text-[13px] text-white/70">
                  Please fill in: <span className="text-amber-300">{missing.join(", ")}</span> before booking.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={SHELL}>
        <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-start">
          <BookingSummaryCard
            pkg={pkg}
            sections={sections}
            locationName={locationName}
            startDateLabel={startDateLabel}
            coupon={coupon}
            couponLocked={couponLocked}
            price={price}
            onCouponApplied={onCouponApplied}
            onCouponRemoved={onCouponRemoved}
            onBackToDetails={onBackToDetails}
          />

          <form onSubmit={onSubmit} className="flex-1 min-w-0 flex flex-col gap-6">
            {/* Personal details */}
            <FormCard>
              <SectionHeader icon={<User size={14} />} title="Personal Details" complete={complete.personal} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Full Name" required error={errors.fullName}>
                  <TextInput {...text("fullName", "John Doe")} />
                </FormField>
                <FormField label="Phone Number" required error={errors.phone}>
                  <TextInput {...text("phone", "+91 98765 43210")} />
                </FormField>
                <FormField label="Age">
                  <TextInput type="number" min="16" max="80" {...text("age", "25")} />
                </FormField>
                <FormField label="Gender">
                  <SelectInput
                    value={values.gender}
                    onChange={(e) => onFieldChange("gender", e.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </SelectInput>
                </FormField>
              </div>
            </FormCard>

            {/* Emergency contact */}
            <FormCard>
              <SectionHeader icon={<Phone size={14} />} title="Emergency Contact" complete={complete.emergency} />
              <p className="font-grotesk text-[13px] text-white/55 mb-5">
                Required for all camp participants — someone we can reach if needed.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Contact Name" required error={errors.emergencyName}>
                  <TextInput {...text("emergencyName", "Parent / Spouse name")} />
                </FormField>
                <FormField label="Contact Phone" required error={errors.emergencyPhone}>
                  <TextInput {...text("emergencyPhone", "+91 98765 43210")} />
                </FormField>
              </div>
            </FormCard>

            {/* Travel & health */}
            <FormCard>
              <SectionHeader icon={<Plane size={14} />} title="Travel & Health" complete={complete.travel} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Passport Number" required error={errors.passport}>
                  <TextInput {...text("passport", "A1234567")} />
                </FormField>
                <div className="sm:col-span-1" />
                <FormField label="Medical Conditions">
                  <TextInput {...text("medical", "e.g. Asthma, Diabetes (or leave blank)")} />
                </FormField>
                <FormField label="Allergies">
                  <TextInput {...text("allergies", "e.g. Peanuts, Shellfish (or leave blank)")} />
                </FormField>
              </div>
              <p className="font-grotesk text-[13px] text-white/55 mt-3">
                Medical info helps our coaches keep you safe during training. All data is confidential.
              </p>
            </FormCard>

            {/* Friends on the same booking */}
            <FormCard>
              <GuestListSection
                buyerName={values.fullName}
                buyerEmail={buyerEmail}
                guests={values.guests}
                errors={guestErrors}
                serverErrors={guestServerErrors}
                disabled={submitting}
                onAdd={onGuestAdd}
                onChange={onGuestChange}
                onRemove={onGuestRemove}
              />
            </FormCard>

            {/* Order summary + CTA */}
            <FormCard>
              <SectionHeader icon={<ChevronRight size={14} />} title="Order Summary" />

              <div className="space-y-3 mb-6">
                <SummaryRow label="Camp" value={pkg.title} bold />
                <SummaryRow label={isMultiLocation ? "Locations" : "Location"} value={locationName} />
                <SummaryRow label="Duration" value={`${pkg.duration_days} Days`} />
                {price.count > 1 && (
                  <SummaryRow
                    label="Camp fee"
                    value={`${fmtPrice(price.perPerson)} × ${price.count}`}
                  />
                )}
                {price.discount !== null && (
                  <>
                    <SummaryRow label="Package price" value={fmtPrice(price.subtotal)} />
                    <SummaryRow
                      label={`Discount (${price.couponCode})`}
                      value={fmtDiscount(price.discount)}
                      accent
                    />
                  </>
                )}
                <div className="flex justify-between items-center pt-3">
                  <span className="font-grotesk text-base text-white font-bold">Total</span>
                  <span className="font-barlow font-black italic text-3xl text-white">
                    {fmtPrice(price.total)}
                  </span>
                </div>
              </div>

              <AnimatePresence>
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2.5 px-4 py-3 bg-red-500/[0.07] border border-red-500/20 mb-5"
                  >
                    <AlertCircle size={14} className="text-red-400 shrink-0" />
                    <p className="font-grotesk text-[13px] text-red-300">{submitError}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={submitting}
                className="group relative w-full overflow-hidden py-4 px-6 sm:px-8 font-barlow font-black text-[13px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase bg-primary text-black hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-3"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Opening Payment…
                  </>
                ) : (
                  <>
                    Secure Your Spot · {fmtPrice(price.total)}
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 mt-4">
                <Lock size={11} className="text-white/55" />
                <p className="font-grotesk text-[13px] text-white/55 text-center leading-relaxed">
                  Secured by Razorpay · Your spot is confirmed only after payment succeeds.
                </p>
              </div>
            </FormCard>
          </form>
        </div>
      </div>
    </>
  );
}

function FormCard({ children }: { children: React.ReactNode }) {
  return <div className="border border-white/[0.08] bg-white/[0.015] p-5 sm:p-6 md:p-8">{children}</div>;
}

function SummaryRow({
  label,
  value,
  bold,
  accent,
}: {
  label: string;
  value: string;
  bold?: boolean;
  accent?: boolean;
}) {
  return (
    <div className="flex justify-between items-center gap-3 py-2.5 border-b border-white/[0.05]">
      <span className={`font-grotesk text-sm truncate ${accent ? "text-primary" : "text-white/70"}`}>{label}</span>
      <span
        className={`font-grotesk text-sm shrink-0 ${accent ? "text-primary" : "text-white"} ${bold ? "font-bold" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}
