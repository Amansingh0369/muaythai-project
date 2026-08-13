"use client";

import { cn } from "@repo/utils";
import { CouponStatus } from "../coupon.helpers";

interface CouponStatusBadgeProps {
  status: CouponStatus;
}

const STATUS_STYLES: Record<CouponStatus, string> = {
  ACTIVE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  SCHEDULED: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  EXPIRED: "text-white/40 bg-white/5 border-white/10",
  EXHAUSTED: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  INACTIVE: "text-rose-400 bg-rose-500/10 border-rose-500/20",
};

const DOT_STYLES: Record<CouponStatus, string> = {
  ACTIVE: "bg-emerald-400",
  SCHEDULED: "bg-blue-400",
  EXPIRED: "bg-white/30",
  EXHAUSTED: "bg-amber-400",
  INACTIVE: "bg-rose-400",
};

export function CouponStatusBadge({ status }: CouponStatusBadgeProps) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.INACTIVE;
  const dot = DOT_STYLES[status] ?? DOT_STYLES.INACTIVE;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest",
        style
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", dot)} />
      {status}
    </span>
  );
}
