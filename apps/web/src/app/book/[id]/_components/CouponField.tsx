"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Loader2, Tag, X } from "lucide-react";
import { couponService } from "@/services/coupon.service";
import {
  AppliedCoupon,
  capPreviewToMinimum,
  fmtPrice,
  MIN_PAYABLE_AMOUNT,
} from "../booking.helpers";

interface CouponFieldProps {
  packageId: number;
  coupon: AppliedCoupon | null;
  /** True once the booking is in flight or done — a coupon can only change while PENDING. */
  locked: boolean;
  onApplied: (coupon: AppliedCoupon) => void;
  onRemoved: () => void;
}

/** Coupon entry on the form step. No order exists yet here, so this only ever previews —
 *  the code is actually applied to the order at submit time. */
export default function CouponField({ packageId, coupon, locked, onApplied, onRemoved }: CouponFieldProps) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    const trimmed = code.trim();
    if (!trimmed || checking) return;
    setChecking(true);
    setError(null);
    try {
      const preview = await couponService.preview(trimmed, packageId);
      setCode(preview.coupon.code);
      onApplied(capPreviewToMinimum(preview, preview.coupon.code));
    } catch (err: any) {
      // The backend writes this copy for the customer — show it as-is, and keep what they
      // typed so a typo can be corrected instead of retyped.
      setError(err?.message || "Could not apply that coupon.");
    } finally {
      setChecking(false);
    }
  };

  if (coupon) {
    return (
      <div className="border border-primary/25 bg-primary/[0.06] px-4 py-3.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-grotesk text-[13px] tracking-[0.35em] uppercase text-primary mb-1.5">Coupon Applied</p>
          <p className="font-barlow font-black italic text-lg uppercase leading-none text-white truncate">
            {coupon.code}
          </p>
          <p className="font-grotesk text-[13px] text-white/60 mt-1.5">
            You save {fmtPrice(coupon.discount_amount)}
          </p>
          {coupon.isCapped && (
            <p className="font-grotesk text-[13px] text-white/45 mt-1.5 leading-snug">
              This coupon covers your whole booking, but card payments can&apos;t go below{" "}
              {fmtPrice(MIN_PAYABLE_AMOUNT)} — so {fmtPrice(MIN_PAYABLE_AMOUNT)} is all you pay.
            </p>
          )}
        </div>
        {!locked && (
          <button
            type="button"
            onClick={() => {
              onRemoved();
              setError(null);
              setOpen(true);
            }}
            className="shrink-0 inline-flex items-center gap-1.5 font-grotesk text-[13px] text-white/50 hover:text-white/80 transition-colors"
          >
            <X size={11} /> Remove
          </button>
        )}
      </div>
    );
  }

  if (locked) return null;

  return (
    <div>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-2 font-grotesk text-[13px] text-white/55 hover:text-primary transition-colors"
        >
          <Tag size={12} /> Have a coupon?
        </button>
      ) : (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          <p className="font-grotesk text-[13px] tracking-[0.35em] uppercase text-white/60 font-bold mb-2">
            Coupon Code
          </p>
          <div className="flex gap-2">
            <input
              value={code}
              autoFocus
              spellCheck={false}
              placeholder="SUMMER20"
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  void apply();
                }
              }}
              className={`flex-1 min-w-0 bg-white/[0.06] border px-3 py-2.5 text-sm font-grotesk tracking-[0.15em] uppercase text-white outline-none focus:bg-white/[0.10] transition-colors duration-200 placeholder:text-white/25 placeholder:tracking-normal ${
                error ? "border-red-500/50 focus:border-red-500/70" : "border-white/12 focus:border-primary/50"
              }`}
            />
            <button
              type="button"
              onClick={apply}
              disabled={checking || !code.trim()}
              className="shrink-0 px-5 py-2.5 font-barlow font-black text-[13px] tracking-[0.2em] uppercase bg-primary text-black disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-200 flex items-center justify-center gap-2"
            >
              {checking ? <Loader2 size={13} className="animate-spin" /> : "Apply"}
            </button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-grotesk text-[13px] text-red-400 flex items-start gap-1.5 mt-2"
              >
                <AlertCircle size={11} className="shrink-0 mt-0.5" /> {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
