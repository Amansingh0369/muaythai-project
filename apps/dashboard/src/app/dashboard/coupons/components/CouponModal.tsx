"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Loader2,
  AlertCircle,
  Percent,
  IndianRupee,
  Lock,
  CalendarClock,
  Hash,
  Ticket,
  Activity,
  Sparkles,
} from "lucide-react";
import {
  Coupon,
  CouponFieldErrors,
  CouponFormData,
  DiscountType,
} from "@/services/coupon.service";
import { buildPreviewLine, hasLockedFields, isFieldLocked, LockableField } from "../coupon.helpers";

interface CouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingCoupon: Coupon | null;
  formData: CouponFormData;
  setFormData: (data: CouponFormData) => void;
  fieldErrors: CouponFieldErrors;
  formError: string | null;
}

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p className="text-[11px] text-red-400 flex items-center gap-1.5 ml-1">
      <AlertCircle className="w-3 h-3 shrink-0" /> {messages.join(", ")}
    </p>
  );
}

const INPUT_BASE =
  "w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all";
const LOCKED_INPUT = "opacity-40 cursor-not-allowed hover:border-white/10";

export function CouponModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingCoupon,
  formData,
  setFormData,
  fieldErrors,
  formError,
}: CouponModalProps) {
  // Server-declared locks. On create `editingCoupon` is null, so nothing is locked.
  const locked = (field: LockableField) => isFieldLocked(editingCoupon, field);
  const anyLocked = hasLockedFields(editingCoupon);
  const lockClass = (field: LockableField) => (locked(field) ? LOCKED_INPUT : "");

  const isPercentage = formData.discount_type === "PERCENTAGE";
  const preview = buildPreviewLine(formData);

  const setDiscountType = (discount_type: DiscountType) => {
    // A cap has no meaning on a flat-rupee coupon; clear it so a stale value
    // cannot resurface if the admin switches back and forth.
    setFormData({
      ...formData,
      discount_type,
      max_discount_amount:
        discount_type === "FIXED" ? "" : formData.max_discount_amount,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-black border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[min(92vh,900px)]"
          >
            <div className="p-10 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">
                    {editingCoupon ? "Update" : "New"} <span className="text-primary">Coupon</span>
                  </h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">
                    {editingCoupon
                      ? `Refining ${editingCoupon.code}`
                      : "Issue a new discount code"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Top-level error banner */}
              {formError && (
                <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{formError}</p>
                </div>
              )}

              {/* Read-only redemption stats — displayed, never submitted */}
              {editingCoupon && (
                <div className="mb-6 grid grid-cols-2 gap-3">
                  <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                      Times Redeemed
                    </p>
                    <p className="text-lg font-bold text-white tabular-nums">
                      {editingCoupon.times_redeemed}
                    </p>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                      Exhausted
                    </p>
                    <p
                      className={`text-lg font-bold ${
                        editingCoupon.is_exhausted ? "text-amber-400" : "text-white"
                      }`}
                    >
                      {editingCoupon.is_exhausted ? "Yes" : "No"}
                    </p>
                  </div>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-6">
                {/* ── Discount terms — the group the server freezes once in use ── */}
                <div className="space-y-6 rounded-[2rem] border border-white/5 p-5">
                  <div className="flex items-center gap-2">
                    <Ticket className="w-3.5 h-3.5 text-primary" />
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                      Discount Terms
                    </p>
                  </div>

                  {/* One explanation for the whole locked group, not one per field */}
                  {anyLocked && (
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-200/90 leading-relaxed">
                        This coupon is already in use, so its discount terms can&apos;t be
                        changed. Deactivate it and create a new one to offer different terms.
                      </p>
                    </div>
                  )}

                  {/* Code */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">
                      Coupon Code
                    </label>
                    <input
                      required
                      type="text"
                      disabled={locked("code")}
                      placeholder="e.g. FIGHT20"
                      className={`${INPUT_BASE} font-mono tracking-[0.2em] uppercase ${lockClass("code")}`}
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value.toUpperCase() })
                      }
                    />
                    <FieldError messages={fieldErrors.code} />
                  </div>

                  {/* Discount type selector */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">
                      Discount Type
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {([
                        {
                          value: "PERCENTAGE",
                          label: "Percentage",
                          icon: Percent,
                          hint: "Share of the order",
                        },
                        {
                          value: "FIXED",
                          label: "Fixed",
                          icon: IndianRupee,
                          hint: "Flat rupee amount",
                        },
                      ] as const).map(({ value, label, icon: Icon, hint }) => {
                        const selected = formData.discount_type === value;
                        const isDisabled = locked("discount_type");
                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => setDiscountType(value)}
                            className={`flex items-center gap-3 rounded-2xl border p-4 transition-all text-left ${
                              selected
                                ? "bg-primary/10 border-primary/50 text-white"
                                : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                            } ${isDisabled ? "opacity-40 cursor-not-allowed hover:text-white/40" : ""}`}
                          >
                            <Icon
                              className={`w-5 h-5 shrink-0 ${selected ? "text-primary" : ""}`}
                            />
                            <div>
                              <p className="text-sm font-bold uppercase tracking-wide">{label}</p>
                              <p className="text-[10px] uppercase tracking-widest opacity-60">
                                {hint}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <FieldError messages={fieldErrors.discount_type} />
                  </div>

                  {/* Value + optional cap */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                        {isPercentage ? (
                          <>
                            <Percent className="w-3 h-3 text-primary" /> Percentage off (%)
                          </>
                        ) : (
                          <>
                            <IndianRupee className="w-3 h-3 text-primary" /> Amount off (₹)
                          </>
                        )}
                      </label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        min={isPercentage ? 1 : undefined}
                        max={isPercentage ? 100 : undefined}
                        disabled={locked("value")}
                        placeholder={isPercentage ? "e.g. 20" : "e.g. 1000"}
                        className={`${INPUT_BASE} ${lockClass("value")}`}
                        value={formData.value}
                        onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      />
                      <FieldError messages={fieldErrors.value} />
                    </div>

                    {/* A cap only exists on percentage coupons — unmounted for FIXED */}
                    {isPercentage && (
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                          <IndianRupee className="w-3 h-3 text-primary" /> Maximum discount{" "}
                          <span className="opacity-50">(optional)</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min={0}
                          disabled={locked("max_discount_amount")}
                          placeholder="e.g. 5000"
                          className={`${INPUT_BASE} ${lockClass("max_discount_amount")}`}
                          value={formData.max_discount_amount}
                          onChange={(e) =>
                            setFormData({ ...formData, max_discount_amount: e.target.value })
                          }
                        />
                        <FieldError messages={fieldErrors.max_discount_amount} />
                      </div>
                    )}
                  </div>

                  {/* Minimum order */}
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                      <IndianRupee className="w-3 h-3 text-primary" /> Minimum order amount{" "}
                      <span className="opacity-50">(optional)</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      disabled={locked("min_order_amount")}
                      placeholder="e.g. 10000"
                      className={`${INPUT_BASE} ${lockClass("min_order_amount")}`}
                      value={formData.min_order_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, min_order_amount: e.target.value })
                      }
                    />
                    <FieldError messages={fieldErrors.min_order_amount} />
                  </div>

                  {/* Live preview */}
                  <div className="flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-white/[0.03] border border-white/10">
                    <Sparkles className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                        Customer sees
                      </p>
                      <p
                        className={`text-sm mt-0.5 ${
                          preview ? "text-white" : "text-white/25 italic"
                        }`}
                      >
                        {preview || "Enter a discount value to preview"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── Availability — always editable ── */}
                <div className="space-y-6 rounded-[2rem] border border-white/5 p-5">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-3.5 h-3.5 text-primary" />
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                      Availability
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">
                      Description <span className="opacity-50">(optional)</span>
                    </label>
                    <textarea
                      placeholder="Internal note, e.g. Diwali campaign for returning students"
                      className={`${INPUT_BASE} h-20 resize-none text-sm`}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                    />
                    <FieldError messages={fieldErrors.description} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                        <CalendarClock className="w-3 h-3 text-primary" /> Valid from{" "}
                        <span className="opacity-50">(optional)</span>
                      </label>
                      <input
                        type="datetime-local"
                        className={`${INPUT_BASE} [color-scheme:dark]`}
                        value={formData.valid_from}
                        onChange={(e) =>
                          setFormData({ ...formData, valid_from: e.target.value })
                        }
                      />
                      <FieldError messages={fieldErrors.valid_from} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                        <CalendarClock className="w-3 h-3 text-primary" /> Valid until{" "}
                        <span className="opacity-50">(optional)</span>
                      </label>
                      <input
                        type="datetime-local"
                        className={`${INPUT_BASE} [color-scheme:dark]`}
                        value={formData.valid_until}
                        onChange={(e) =>
                          setFormData({ ...formData, valid_until: e.target.value })
                        }
                      />
                      <FieldError messages={fieldErrors.valid_until} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Hash className="w-3 h-3 text-primary" /> Max redemptions{" "}
                        <span className="opacity-50">(blank = unlimited)</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        step="1"
                        placeholder="Unlimited"
                        className={INPUT_BASE}
                        value={formData.max_redemptions}
                        onChange={(e) =>
                          setFormData({ ...formData, max_redemptions: e.target.value })
                        }
                      />
                      <FieldError messages={fieldErrors.max_redemptions} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-primary" /> Status
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, is_active: !formData.is_active })
                        }
                        className={`w-full h-[58px] rounded-2xl border transition-all flex items-center justify-center font-bold text-xs tracking-widest uppercase ${
                          formData.is_active
                            ? "bg-green-500/10 border-green-500/50 text-green-500"
                            : "bg-white/5 border-white/10 text-white/40"
                        }`}
                      >
                        {formData.is_active ? "Live / Redeemable" : "Paused / Hidden"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-black uppercase tracking-[0.2em] py-5 rounded-[2rem] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin w-6 h-6" />
                        PROCESSING...
                      </>
                    ) : editingCoupon ? (
                      "UPDATE COUPON"
                    ) : (
                      "ISSUE COUPON"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
