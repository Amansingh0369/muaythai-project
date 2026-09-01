"use client";

import { motion } from "motion/react";
import { Package as PackageIcon, Mail, Trash2, Loader2, ChevronDown, Share2 } from "lucide-react";
import { Order, OrderStatus } from "@/services/order.service";

interface OrderRowProps {
  order: Order;
  index: number;
  isUpdating: boolean;
  onStatusChange: (id: number, status: OrderStatus) => void;
  onDelete: (id: number) => void;
  /** Shares the student on this booking — their profile, not the booking. */
  onShare: (order: Order) => void;
}

const STATUS_OPTIONS: OrderStatus[] = ["PENDING", "PAID", "COMPLETED", "CANCELLED"];

const STATUS_STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  PAID: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  COMPLETED: "bg-sky-500/10 text-sky-400 border-sky-500/30",
  CANCELLED: "bg-rose-500/10 text-rose-400 border-rose-500/30",
};

const STATUS_DOT: Record<OrderStatus, string> = {
  PENDING: "bg-amber-400",
  PAID: "bg-emerald-400",
  COMPLETED: "bg-sky-400",
  CANCELLED: "bg-rose-400",
};

function formatAmount(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return String(amount);
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function OrderRow({ order, index, isUpdating, onStatusChange, onDelete, onShare }: OrderRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.04 }}
      className="glass-surface rounded-[2rem] p-4 pr-8 border border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden flex flex-col lg:flex-row lg:items-center gap-6 w-full"
    >
      {/* Side Accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 group-hover:bg-primary/50 transition-all" />

      {/* Icon + Camp */}
      <div className="flex items-center gap-4 min-w-0 lg:w-[26%]">
        <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-all border border-white/5">
          <PackageIcon className="text-primary w-7 h-7" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">Order #{order.id}</p>
          <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors truncate">
            {order.package_name}
          </h3>
        </div>
      </div>

      {/* Customer */}
      <div className="flex items-center gap-2 text-sm text-white/50 min-w-0 lg:w-[22%]">
        <Mail className="w-4 h-4 text-primary shrink-0" />
        <span className="truncate">{order.user_email}</span>
      </div>

      {/* Amount */}
      <div className="lg:w-[14%]">
        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-0.5">Amount</p>
        <p className="text-lg font-bold text-white tabular-nums">₹{formatAmount(order.total_amount)}</p>
      </div>

      {/* Date */}
      <div className="lg:w-[14%]">
        <p className="text-[10px] text-white/30 font-black uppercase tracking-widest mb-0.5">Booked</p>
        <p className="text-sm font-medium text-white/60">{formatDate(order.created_at)}</p>
      </div>

      {/* Status badge + select */}
      <div className="flex items-center gap-3 lg:flex-1 lg:justify-end shrink-0">
        <div
          className={`hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[order.status]}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[order.status]} animate-pulse`} />
          {order.status}
        </div>

        <div className="relative">
          {isUpdating ? (
            <div className="w-[140px] h-11 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-primary">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <>
              <select
                value={order.status}
                onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                className={`appearance-none w-[140px] h-11 pl-4 pr-9 rounded-xl border bg-white/5 text-xs font-bold uppercase tracking-widest cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all ${STATUS_STYLES[order.status]}`}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s} className="bg-black text-white normal-case">
                    {s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-60" />
            </>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(order);
          }}
          className="w-11 h-11 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95 shrink-0"
          title="Share this student's profile"
        >
          <Share2 className="w-5 h-5" />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(order.id);
          }}
          className="w-11 h-11 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-rose-400 hover:border-rose-500/50 hover:bg-rose-500/10 transition-all active:scale-95 shrink-0"
          title="Delete Order"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Decorative Glow */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 blur-[50px] pointer-events-none group-hover:bg-primary/10 transition-all" />
    </motion.div>
  );
}
