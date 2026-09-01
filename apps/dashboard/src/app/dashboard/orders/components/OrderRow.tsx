"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package as PackageIcon,
  Mail,
  Trash2,
  Loader2,
  ChevronDown,
  Share2,
  Users,
  AlertTriangle,
  BadgeCheck,
} from "lucide-react";
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
  const [showParticipants, setShowParticipants] = useState(false);

  // One order can cover several people; a solo booking still has one participant.
  const participants = order.participants ?? [];
  const isGroup = (order.participant_count ?? participants.length) > 1;
  const unfinishedCards = participants.filter((p) => !p.fighter_card_complete).length;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.04 }}
      className="glass-surface rounded-[2rem] p-4 pr-8 border border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden flex flex-col gap-4 w-full"
    >
      {/* Side Accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 group-hover:bg-primary/50 transition-all" />

      <div className="flex flex-col lg:flex-row lg:items-center gap-6 w-full">

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
      <div className="flex flex-col gap-1 min-w-0 lg:w-[22%]">
        <div className="flex items-center gap-2 text-sm text-white/50 min-w-0">
          <Mail className="w-4 h-4 text-primary shrink-0" />
          <span className="truncate">{order.user_email}</span>
        </div>
        {isGroup && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowParticipants((open) => !open);
            }}
            className="self-start inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
          >
            <Users className="w-3 h-3" />
            {order.participant_count} fighters
            <ChevronDown
              className={`w-3 h-3 transition-transform ${showParticipants ? "rotate-180" : ""}`}
            />
          </button>
        )}
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
      </div>

      {/* Who the booking covers — and whose fighter card staff still need to chase */}
      <AnimatePresence initial={false}>
        {showParticipants && participants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden relative z-10"
          >
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 space-y-2">
              <div className="flex items-center justify-between gap-4 mb-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                  On this booking
                </span>
                {unfinishedCards > 0 && (
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    {unfinishedCards} card{unfinishedCards > 1 ? "s" : ""} unfinished
                  </span>
                )}
              </div>

              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 border-b border-white/[0.04] last:border-0"
                >
                  <span className="text-sm text-white font-semibold">
                    {participant.full_name || "Unnamed fighter"}
                  </span>
                  {participant.is_buyer && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">
                      Buyer
                    </span>
                  )}
                  <span className="text-xs text-white/40 truncate">{participant.email}</span>
                  <span
                    className={`ml-auto inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
                      participant.fighter_card_complete ? "text-emerald-400/80" : "text-amber-400"
                    }`}
                  >
                    {participant.fighter_card_complete ? (
                      <>
                        <BadgeCheck className="w-3 h-3" />
                        Card complete
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-3 h-3" />
                        Card unfinished
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Glow */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 blur-[50px] pointer-events-none group-hover:bg-primary/10 transition-all" />
    </motion.div>
  );
}
