"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TicketPercent,
  Plus,
  Search,
  RefreshCcw,
  Loader2,
  AlertCircle,
  BadgeCheck,
  Flame,
} from "lucide-react";
import { cn } from "@repo/utils";
import { useCoupons } from "./hooks/useCoupons";
import { CouponRow } from "./components/CouponRow";
import { CouponModal } from "./components/CouponModal";
import { RetireCouponModal } from "./components/RetireCouponModal";
import { COUPON_STATUSES, CouponStatus, deriveStatus } from "./coupon.helpers";

type StatusFilter = CouponStatus | "ALL";

const FILTERS: StatusFilter[] = ["ALL", ...COUPON_STATUSES];

export default function CouponsPage() {
  const {
    coupons,
    isRefreshing,
    error,
    isModalOpen,
    isSubmitting,
    editingCoupon,
    formData,
    setFormData,
    fieldErrors,
    formError,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseModal,
    handleSubmit,
    fetchData,
    retireTarget,
    openRetire,
    closeRetire,
    conflictMessage,
    retireError,
    handleDelete,
    handleDeactivate,
  } = useCoupons();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const totalRedemptions = useMemo(
    () => coupons.reduce((sum, c) => sum + (c.times_redeemed || 0), 0),
    [coupons]
  );
  const activeCount = useMemo(
    () => coupons.filter((c) => c.is_active).length,
    [coupons]
  );

  const q = searchQuery.trim().toLowerCase();
  const filteredCoupons = coupons.filter((coupon) => {
    const matchesSearch = !q || coupon.code.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "ALL" || deriveStatus(coupon) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-px bg-primary" />
              <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">Promotions Control</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
              Discount <span className="text-primary">Coupons</span>
            </h1>
            <p className="text-white/40 mt-4 text-sm md:text-base max-w-lg leading-relaxed">
              Issue and retire the codes fighters redeem at checkout. Terms freeze the moment a code lands on an order, so past bookings always report what was actually offered.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all active:rotate-180 duration-500 disabled:opacity-50"
            >
              <RefreshCcw className={`w-6 h-6 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Issue Coupon
            </button>
          </div>
        </div>

        {/* Stats / Feedback Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
          <div className="glass-surface p-6 rounded-3xl border border-white/5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <TicketPercent className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Total Coupons</p>
              <p className="text-2xl font-bold">{coupons.length}</p>
            </div>
          </div>
          <div className="glass-surface p-6 rounded-3xl border border-white/5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BadgeCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Active Codes</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
          </div>
          <div className="glass-surface p-6 rounded-3xl border border-white/5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Redemptions</p>
              <p className="text-2xl font-bold">{totalRedemptions}</p>
            </div>
          </div>
          <div className="glass-surface p-6 rounded-3xl border border-white/10 bg-white/5 flex items-center gap-3 group cursor-pointer overflow-hidden relative">
            <Search className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors" />
            <input
              type="text"
              placeholder="Search by code..."
              className="bg-transparent border-none focus:outline-none text-white text-sm w-full placeholder:text-white/10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute bottom-0 left-0 h-[2px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left w-full" />
          </div>
        </div>

        {/* Status filter pills */}
        <div className="flex flex-wrap items-center gap-2 mt-6">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={cn(
                "px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all active:scale-95",
                statusFilter === filter
                  ? "bg-primary/15 border-primary/50 text-white"
                  : "bg-white/5 border-white/10 text-white/40 hover:text-white/70 hover:border-white/20"
              )}
            >
              {filter === "ALL" ? "All" : filter}
            </button>
          ))}
        </div>
      </div>

      {/* List Section */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="popLayout">
          {isRefreshing && coupons.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-white/10 italic">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="font-grotesk tracking-widest uppercase text-xs">Syncing with Fighter Backend...</p>
            </div>
          ) : error ? (
            <div className="py-24 glass-surface rounded-[3rem] border border-red-500/10 flex flex-col items-center justify-center text-center px-10">
              <AlertCircle className="w-12 h-12 text-red-500/50 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 uppercase">Sync Interrupted</h3>
              <p className="text-white/40 text-sm max-w-xs mb-8">{error}</p>
              <button
                onClick={fetchData}
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Attempt Re-Sync
              </button>
            </div>
          ) : filteredCoupons.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 glass-surface rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-white/20"
            >
              <TicketPercent className="w-16 h-16 mb-4 opacity-5" />
              <p className="font-grotesk tracking-widest uppercase text-xs italic">
                {searchQuery || statusFilter !== "ALL"
                  ? "No matches found for your criteria"
                  : "No coupons issued yet"}
              </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-3">
              {/* Table Header (desktop) — spans mirror CouponRow */}
              <div className="hidden md:grid grid-cols-12 items-center gap-4 px-6 pb-2">
                <span className="col-span-3 text-[10px] font-black uppercase tracking-widest text-white/30">Code</span>
                <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-white/30">Discount</span>
                <span className="col-span-1 text-[10px] font-black uppercase tracking-widest text-white/30">Used</span>
                <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-white/30">Validity</span>
                <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-white/30">Status</span>
                <span className="col-span-2 text-[10px] font-black uppercase tracking-widest text-white/30 text-right">Actions</span>
              </div>

              {filteredCoupons.map((coupon, idx) => (
                <CouponRow
                  key={coupon.id}
                  coupon={coupon}
                  index={idx}
                  onEdit={handleOpenEdit}
                  onDeactivate={openRetire}
                  onDelete={openRetire}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <CouponModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        editingCoupon={editingCoupon}
        formData={formData}
        setFormData={setFormData}
        fieldErrors={fieldErrors}
        formError={formError}
      />

      <RetireCouponModal
        coupon={retireTarget}
        onClose={closeRetire}
        onDeactivate={handleDeactivate}
        onDelete={handleDelete}
        isSubmitting={isSubmitting}
        conflictMessage={conflictMessage}
        error={retireError}
      />
    </div>
  );
}
