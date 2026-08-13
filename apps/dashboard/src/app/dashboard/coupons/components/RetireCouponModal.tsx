"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, PowerOff, Info, AlertCircle } from "lucide-react";
import { Coupon } from "@/services/coupon.service";

interface RetireCouponModalProps {
  coupon: Coupon | null;
  onClose: () => void;
  onDeactivate: () => void;
  onDelete: () => void;
  isSubmitting: boolean;
  /** Set when the server refused the delete because orders still reference the coupon. */
  conflictMessage: string | null;
  /** Any other failure — rendered as a genuine error. */
  error: string | null;
}

export function RetireCouponModal({
  coupon,
  onClose,
  onDeactivate,
  onDelete,
  isSubmitting,
  conflictMessage,
  error,
}: RetireCouponModalProps) {
  const isConflict = conflictMessage !== null;

  return (
    <AnimatePresence>
      {coupon && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-black border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
          >
            {/* Background Glow */}
            <div
              className={`absolute -top-24 -left-24 w-48 h-48 blur-[80px] opacity-20 ${
                isConflict ? "bg-amber-500" : "bg-primary"
              }`}
            />

            <div className="relative z-10 text-center">
              <div
                className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 border ${
                  isConflict
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-primary/10 border-primary/20 text-primary"
                }`}
              >
                <PowerOff className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-tight">
                {isConflict ? "Keep the history" : "Retire Coupon?"}
              </h2>
              <p className="font-mono text-xs font-black tracking-[0.3em] text-primary mb-4">
                {coupon.code}
              </p>

              {isConflict ? (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left mb-8">
                  <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200/90 leading-relaxed">
                    {conflictMessage}
                  </p>
                </div>
              ) : (
                <p className="text-white/50 text-sm leading-relaxed mb-8">
                  {coupon.is_used
                    ? "This code has already been applied to an order. Deactivating stops new redemptions while those records keep their discount intact — deleting it will most likely be refused."
                    : "Deactivating stops new redemptions but keeps the code on file. Deleting removes it permanently."}
                </p>
              )}

              {error && (
                <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-left mb-6">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                <button
                  onClick={onDeactivate}
                  disabled={isSubmitting || !coupon.is_active}
                  className="w-full px-6 py-4 rounded-2xl bg-primary hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {coupon.is_active
                    ? isConflict
                      ? "Deactivate instead"
                      : "Deactivate"
                    : "Already deactivated"}
                </button>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 font-bold text-xs uppercase tracking-widest transition-all"
                  >
                    Cancel
                  </button>
                  {/* Hidden once the server has told us the delete cannot go through */}
                  {!isConflict && (
                    <button
                      onClick={onDelete}
                      disabled={isSubmitting}
                      className="flex-1 px-6 py-3.5 rounded-2xl bg-transparent border border-white/10 text-white/40 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/5 font-bold text-xs uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      Delete permanently
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-white/20 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
