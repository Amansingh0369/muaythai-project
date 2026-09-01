"use client";

import { motion } from "motion/react";
import {
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  Loader2,
  Mail,
  UserRound,
  Share2,
} from "lucide-react";
import { AdminUser } from "@/services/user.service";

interface StudentRowProps {
  user: AdminUser;
  index: number;
  isTogglingRole: boolean;
  onEdit: (user: AdminUser) => void;
  onToggleRole: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onShare: (user: AdminUser) => void;
}

function formatJoined(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getInitials(user: AdminUser) {
  const source = user.full_name?.trim() || user.email;
  return source
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function StudentRow({
  user,
  index,
  isTogglingRole,
  onEdit,
  onToggleRole,
  onDelete,
  onShare,
}: StudentRowProps) {
  const isAdmin = user.role === "ADMIN";

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

      {/* Name + avatar — cols 1-4 */}
      <div className="col-span-12 md:col-span-4 flex items-center gap-4 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-all border border-white/5 text-sm font-black text-primary">
          {getInitials(user)}
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-bold text-white group-hover:text-primary transition-colors truncate">
            {user.full_name?.trim() || "Unnamed Athlete"}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-white/40 truncate">
            <Mail className="w-3 h-3 shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>
      </div>

      {/* Role badge + toggle — cols 5-6 */}
      <div className="col-span-6 md:col-span-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleRole(user);
          }}
          disabled={isTogglingRole}
          title={isAdmin ? "Demote to User" : "Promote to Admin"}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${
            isAdmin
              ? "bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
              : "bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/20"
          }`}
        >
          {isTogglingRole ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isAdmin ? (
            <ShieldCheck className="w-3 h-3" />
          ) : (
            <Shield className="w-3 h-3" />
          )}
          {user.role}
        </button>
      </div>

      {/* Status — cols 7-8 */}
      <div className="col-span-6 md:col-span-2">
        <span
          className={`inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${
            user.is_active ? "text-green-500/80" : "text-red-400/80"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              user.is_active ? "bg-green-500 animate-pulse" : "bg-red-400"
            }`}
          />
          {user.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Joined — cols 9-10 */}
      <div className="col-span-6 md:col-span-2 flex items-center gap-2 text-xs text-white/40">
        <UserRound className="w-3.5 h-3.5 text-primary/60 shrink-0" />
        <span className="truncate">{formatJoined(user.created_at)}</span>
      </div>

      {/* Actions — cols 11-12 */}
      <div className="col-span-6 md:col-span-2 flex items-center justify-end gap-2 relative z-20">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onShare(user);
          }}
          className="w-11 h-11 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95"
          title="Share Profile"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit(user);
          }}
          className="w-11 h-11 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95"
          title="Edit Student"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(user);
          }}
          className="w-11 h-11 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all active:scale-95"
          title="Deactivate Student"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Decorative Glow */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 blur-[50px] pointer-events-none group-hover:bg-primary/10 transition-all" />
    </motion.div>
  );
}
