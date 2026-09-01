"use client";

import { motion } from "motion/react";
import {
  BadgeCheck,
  Edit2,
  Loader2,
  PowerOff,
  Trash2,
  Zap,
} from "lucide-react";
import { cn } from "@repo/utils";
import { PopupImage } from "@/services/popup-image.service";
import type { PendingAction } from "../hooks/usePopupImages";

interface PopupImageCardProps {
  image: PopupImage;
  index: number;
  /** Which request is running on *this* card, if any. */
  pendingAction: PendingAction | null;
  /** True while any card is busy — every card's actions lock until it settles. */
  isBusy: boolean;
  onActivate: (image: PopupImage) => void;
  onDeactivate: (image: PopupImage) => void;
  onEdit: (image: PopupImage) => void;
  onDelete: (image: PopupImage) => void;
}

function fmtDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PopupImageCard({
  image,
  index,
  pendingAction,
  isBusy,
  onActivate,
  onDeactivate,
  onEdit,
  onDelete,
}: PopupImageCardProps) {
  const isLive = image.is_active;
  const disabled = isBusy;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        "glass-surface rounded-[2rem] overflow-hidden border transition-all group relative flex flex-col",
        isLive
          ? "border-primary/50 shadow-xl shadow-primary/10"
          : "border-white/5 hover:border-white/20"
      )}
    >
      {/* Poster preview — same 4:3 crop the site's popup uses, so what an
          admin sees here is exactly what a visitor gets. */}
      <div className="relative w-full aspect-[4/3] bg-white/5 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.image}
          alt={image.alt_text || image.title || "Popup poster"}
          className="w-full h-full object-cover"
        />

        {isLive && (
          <span className="absolute top-4 left-4 flex items-center gap-2 bg-primary text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg">
            <BadgeCheck className="w-3.5 h-3.5" />
            Live on site
          </span>
        )}

        {pendingAction && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-6 flex-1 flex flex-col gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-white truncate">
            {image.title || "Untitled poster"}
          </h3>
          <p className="text-white/40 text-xs mt-1 line-clamp-2 leading-relaxed">
            {image.alt_text || "No alt text set"}
          </p>
          <p className="text-[10px] text-white/20 font-black uppercase tracking-widest mt-3">
            Uploaded {fmtDate(image.created_at)}
          </p>
        </div>

        {/* Actions — wrap rather than overflow on a narrow phone */}
        <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
          {isLive ? (
            <button
              onClick={() => onDeactivate(image)}
              disabled={disabled}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PowerOff className="w-4 h-4" />
              Turn off
            </button>
          ) : (
            <button
              onClick={() => onActivate(image)}
              disabled={disabled}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-primary hover:bg-orange-600 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Zap className="w-4 h-4" />
              Set as current
            </button>
          )}

          <button
            onClick={() => onEdit(image)}
            disabled={disabled}
            title="Edit label & alt text"
            className="w-12 h-12 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Edit2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(image)}
            disabled={disabled}
            title="Delete image"
            className="w-12 h-12 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Decorative Glow */}
      <div
        className={cn(
          "absolute -right-20 -top-20 w-40 h-40 blur-[50px] pointer-events-none transition-all",
          isLive ? "bg-primary/20" : "bg-primary/5 group-hover:bg-primary/10"
        )}
      />
    </motion.div>
  );
}
