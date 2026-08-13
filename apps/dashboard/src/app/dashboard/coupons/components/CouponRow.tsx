"use client";

import { motion } from "motion/react";
import { Edit2, Trash2, PowerOff, Lock } from "lucide-react";
import { Coupon } from "@/services/coupon.service";
import { CouponStatusBadge } from "./CouponStatusBadge";
import {
  deriveStatus,
  formatDiscount,
  formatUsage,
  formatValidity,
} from "../coupon.helpers";

interface CouponRowProps {
  coupon: Coupon;
  index: number;
  onEdit: (coupon: Coupon) => void;
  onDeactivate: (coupon: Coupon) => void;
  onDelete: (coupon: Coupon) => void;
}

export function CouponRow({
  coupon,
  index,
  onEdit,
  onDeactivate,
  onDelete,
}: CouponRowProps) {
  const status = deriveStatus(coupon);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.04 }}
      className="glass-surface rounded-[1.5rem] p-4 border border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden grid grid-cols-12 items-center gap-4"
    >
      {/* Side Accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 group-hover:bg-primary/50 transition-all" />

      {/* Code + description — cols 1-3 */}
      <div className="col-span-12 md:col-span-3 min-w-0 pl-2">
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-mono text-base font-black tracking-wider text-white group-hover:text-primary transition-colors truncate">
            {coupon.code}
          </h3>
          {coupon.is_used && (
            <span
              title="Referenced by an existing order — discount terms are locked"
              className="inline-flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40"
            >
              <Lock className="w-2.5 h-2.5" /> In use
            </span>
          )}
        </div>
        <p className="text-xs text-white/40 truncate mt-0.5">
          {coupon.description?.trim() || "No description"}
        </p>
      </div>

      {/* Discount — cols 4-5 */}
      <div className="col-span-6 md:col-span-2">
        <p className="text-[10px] text-white/25 font-black uppercase tracking-widest md:hidden">
          Discount
        </p>
        <p className="text-sm font-bold text-white">{formatDiscount(coupon)}</p>
      </div>

      {/* Usage — col 6 */}
      <div className="col-span-6 md:col-span-1">
        <p className="text-[10px] text-white/25 font-black uppercase tracking-widest md:hidden">
          Used
        </p>
        <p className="text-sm text-white/70 tabular-nums">{formatUsage(coupon)}</p>
      </div>

      {/* Validity — cols 7-8 */}
      <div className="col-span-6 md:col-span-2">
        <p className="text-[10px] text-white/25 font-black uppercase tracking-widest md:hidden">
          Validity
        </p>
        <p className="text-xs text-white/40 truncate">{formatValidity(coupon)}</p>
      </div>

      {/* Status — cols 9-10 */}
      <div className="col-span-6 md:col-span-2">
        <CouponStatusBadge status={status} />
      </div>

      {/* Actions — cols 11-12 */}
      <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2 relative z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(coupon);
          }}
          className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95"
          title="Edit Coupon"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        {coupon.is_active && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeactivate(coupon);
            }}
            className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-amber-400 hover:border-amber-500/50 hover:bg-amber-500/10 transition-all active:scale-95"
            title="Deactivate Coupon"
          >
            <PowerOff className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(coupon);
          }}
          className="w-10 h-10 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all active:scale-95"
          title="Delete Coupon"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Decorative Glow */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 blur-[50px] pointer-events-none group-hover:bg-primary/10 transition-all" />
    </motion.div>
  );
}
