"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ShoppingBag,
  Loader2,
  AlertCircle,
  RefreshCcw,
  CheckCircle2,
  Inbox,
  X,
} from "lucide-react";
import { useOrders } from "./hooks/useOrders";
import { OrderRow } from "./components/OrderRow";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { SearchField } from "@/components/shared/SearchField";
import { Pagination } from "@/components/shared/Pagination";
import {
  ShareProfileModal,
  type ShareSubject,
} from "@/components/shared/ShareProfileModal";
import { Button } from "@repo/ui";
import type { Order } from "@/services/order.service";

const PAGE_SIZE = 10;

function sumPaid(amounts: (number | string)[]): string {
  const total = amounts.reduce<number>((acc, a) => {
    const num = typeof a === "string" ? parseFloat(a) : a;
    return acc + (Number.isNaN(num) ? 0 : num);
  }, 0);
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(total);
}

export default function OrdersPage() {
  const {
    orders,
    isRefreshing,
    error,
    updatingId,
    isSubmitting,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    handleStatusChange,
    handleOpenDelete,
    handleDelete,
    fetchOrders,
  } = useOrders();

  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [shareSubject, setShareSubject] = useState<ShareSubject | null>(null);
  const [sharedWith, setSharedWith] = useState<string | null>(null);

  // Totals stay on the whole ledger — a search narrows the list, not the books.
  const paidOrders = orders.filter((o) => o.status === "PAID" || o.status === "COMPLETED");
  const totalPaid = sumPaid(paidOrders.map((o) => o.total_amount));

  // Searches every booking, not just the page on screen.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    // "#1042" and "1042" should both find order 1042.
    const bare = q.replace(/^#/, "");
    return orders.filter((order) =>
      [order.package_name, order.user_email, order.status, String(order.id)]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(bare))
    );
  }, [orders, query]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  // Deleting the last row of the last page would otherwise strand the pager.
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // The booking is the way in; what gets shared is the student on it.
  const handleOpenShare = (order: Order) => {
    setShareSubject({ id: order.user, label: order.user_email });
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-px bg-primary" />
              <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">Revenue Operations</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
              Bookings <span className="text-primary">Ledger</span>
            </h1>
            <p className="text-white/40 mt-4 text-sm md:text-base max-w-lg leading-relaxed">
              Track every camp reservation, oversee the payment lifecycle, and manage booking fulfilment across your network.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={fetchOrders}
              disabled={isRefreshing}
              className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all active:rotate-180 duration-500 disabled:opacity-50"
            >
              <RefreshCcw className={`w-6 h-6 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          <div className="glass-surface p-6 rounded-3xl border border-white/5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Total Bookings</p>
              <p className="text-2xl font-bold">{orders.length} Orders</p>
            </div>
          </div>
          <div className="glass-surface p-6 rounded-3xl border border-white/5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Confirmed Revenue</p>
              <p className="text-2xl font-bold">₹{totalPaid}</p>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <SearchField
            value={query}
            onChange={(value) => {
              setQuery(value);
              setPage(1);
            }}
            placeholder="Search every booking by order #, camp, customer or status..."
            hint={`${filtered.length} of ${orders.length}`}
          />
        </div>

        {/* Confirmation of a send — plain, and says exactly where it went. */}
        {sharedWith && (
          <div className="mt-6 flex items-start gap-4 p-5 rounded-3xl bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-emerald-300/90 text-sm leading-relaxed flex-1">
              Profile shared with <span className="font-bold">{sharedWith}</span>.
            </p>
            <button
              onClick={() => setSharedWith(null)}
              aria-label="Dismiss"
              className="text-emerald-400/60 hover:text-emerald-300 transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="glass-surface p-12 rounded-[3rem] border border-red-500/20 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <AlertCircle className="text-red-500 w-8 h-8" />
          </div>
          <h3 className="text-white font-bold text-xl mb-2">{error}</h3>
          <p className="text-white/40 text-sm max-w-xs mb-6">There was a problem syncing with the bookings ledger.</p>
          <Button onClick={fetchOrders} variant="secondary" className="rounded-2xl px-10">Try Again</Button>
        </div>
      ) : isRefreshing ? (
        <div className="h-96 flex flex-col items-center justify-center gap-6">
          <div className="relative">
            <Loader2 className="animate-spin text-primary w-12 h-12" />
            <div className="absolute inset-0 blur-lg bg-primary/20 animate-pulse" />
          </div>
          <span className="text-white/20 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Syncing Ledger...</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {visible.length > 0 ? (
              visible.map((order, index) => (
                <OrderRow
                  key={order.id}
                  order={order}
                  index={index}
                  isUpdating={updatingId === order.id}
                  onStatusChange={handleStatusChange}
                  onDelete={handleOpenDelete}
                  onShare={handleOpenShare}
                />
              ))
            ) : (
              /* Empty State */
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-surface border-2 border-dashed border-white/5 rounded-[3rem] p-20 flex flex-col items-center justify-center gap-6"
              >
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-white/5 shadow-inner">
                  <Inbox className="text-white/20 w-10 h-10" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span className="text-white/40 font-black uppercase tracking-widest text-sm">
                    {query ? "No Matching Bookings" : "No Bookings Yet"}
                  </span>
                  <span className="text-white/20 text-[10px] font-bold uppercase">
                    {query
                      ? `Nothing matches "${query}"`
                      : "Reservations will appear here as they come in"}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Pagination
            page={page}
            pageCount={pageCount}
            total={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
            noun="bookings"
          />
        </div>
      )}

      {/* Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
        title="Delete Booking?"
        message="Are you sure you want to permanently remove this booking from the ledger? This operation cannot be reversed."
        confirmText="Delete"
      />

      {/* Share Modal — the student on the booking, never the booking itself */}
      <ShareProfileModal
        isOpen={shareSubject !== null}
        subject={shareSubject}
        onClose={() => setShareSubject(null)}
        onShared={(share) => setSharedWith(share.recipient_email)}
      />
    </div>
  );
}
