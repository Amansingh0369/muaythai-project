"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Clock,
  Loader2,
  MapPin,
  Receipt,
  Swords,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import { orderService, type Order, type OrderParticipant } from "@/services/order.service";
import { paymentService, type Payment, type PaymentStatus } from "@/services/payment.service";
import { packageLocationNames } from "@/services/package.service";

const SHELL = "max-w-5xl mx-auto px-5 md:px-10";

type StatusMeta = { label: string; tone: string; dot: string; box: string };

const STATUS_META: Record<string, StatusMeta> = {
  PENDING: { label: "Awaiting Payment", tone: "text-amber-200", dot: "bg-amber-300", box: "border-amber-400/30 bg-amber-500/[0.08]" },
  PAID: { label: "Paid", tone: "text-emerald-200", dot: "bg-emerald-300", box: "border-emerald-400/30 bg-emerald-500/[0.08]" },
  COMPLETED: { label: "Completed", tone: "text-sky-200", dot: "bg-sky-300", box: "border-sky-400/30 bg-sky-500/[0.08]" },
  CANCELLED: { label: "Cancelled", tone: "text-rose-200", dot: "bg-rose-300", box: "border-rose-400/30 bg-rose-500/[0.08]" },
};
const STATUS_FALLBACK: StatusMeta = { label: "—", tone: "text-white/60", dot: "bg-white/50", box: "border-white/15 bg-white/[0.05]" };

/** How each payment attempt reads — a failed one is worth seeing, not hiding. */
const PAYMENT_TONE: Record<PaymentStatus, string> = {
  SUCCESS: "text-emerald-300",
  PENDING: "text-amber-300",
  FAILED: "text-rose-300",
  REFUNDED: "text-sky-300",
};

const fmtPrice = (amount: string | number) => `₹${Number(amount).toLocaleString("en-IN")}`;

const fmtDateTime = (value: string) =>
  new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

const fmtDate = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : "—";

export default function BookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const orderId = Number(params?.id);

  const [order, setOrder] = useState<Order | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Signed-in only — a booking is nobody else's business.
  useEffect(() => {
    if (authLoading || user) return;
    router.push(`/login?redirect=${encodeURIComponent(`/profile/bookings/${orderId}`)}`);
  }, [authLoading, user, router, orderId]);

  const load = useCallback(async () => {
    if (!user || !Number.isFinite(orderId)) return;
    setLoading(true);
    setError(null);
    try {
      // History is scoped to orders this user bought, so it comes back empty
      // for a guest — and its failure must not cost them the booking itself.
      const [booking, history] = await Promise.all([
        orderService.getOrder(orderId),
        paymentService.getHistory().catch(() => [] as Payment[]),
      ]);
      setOrder(booking);
      setPayments(history.filter((payment) => payment.order === booking.id));
    } catch (err: any) {
      // The API only returns bookings you are on, so a 404 here means it is
      // not yours — say that rather than pretending it does not exist.
      setError(err?.message || "We couldn't load this booking.");
    } finally {
      setLoading(false);
    }
  }, [user, orderId]);

  useEffect(() => {
    load();
  }, [load]);

  if (authLoading || (loading && !order)) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-4 py-32">
          <Loader2 className="text-primary animate-spin" size={30} />
          <p className="font-grotesk text-[13px] tracking-[0.4em] uppercase text-white/55 animate-pulse">
            Loading your booking…
          </p>
        </div>
      </Shell>
    );
  }

  if (error || !order) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-4 py-32 text-center">
          <AlertCircle size={30} className="text-red-400" />
          <p className="font-grotesk text-sm text-white/70 max-w-sm">
            {error ?? "That booking could not be found."}
          </p>
          <Link
            href="/profile?tab=bookings"
            className="mt-2 px-7 py-2.5 font-barlow font-bold text-[13px] tracking-[0.2em] uppercase bg-primary text-black"
          >
            Back to My Bookings
          </Link>
        </div>
      </Shell>
    );
  }

  const meta = STATUS_META[order.status] ?? STATUS_FALLBACK;
  const pkg = order.package_details;
  // The endpoint returns the amounts to everyone the booking covers, but a
  // group total pays for someone else's place too, so only the buyer sees it.
  const isBuyer = !!user && order.user_email?.toLowerCase() === user.email.toLowerCase();
  const participants: OrderParticipant[] = order.participants ?? [];
  const me = participants.find((p) => p.email.toLowerCase() === user?.email.toLowerCase());
  const discounted = Number(order.discount_amount) > 0;

  return (
    <Shell>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 border ${meta.box} mb-5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
          <span className={`font-grotesk text-[12px] font-bold uppercase tracking-[0.28em] ${meta.tone}`}>
            {meta.label}
          </span>
        </div>

        <h1 className="font-barlow font-black italic text-4xl sm:text-5xl md:text-6xl text-white uppercase leading-[0.9] tracking-tight mb-3">
          {order.package_name}
        </h1>

        <p className="font-grotesk text-[13px] text-white/50 mb-10">
          Booking #{order.id} · placed {fmtDate(order.created_at)}
          {!isBuyer && order.user_email ? ` by ${order.user_email}` : ""}
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
          <div className="flex flex-col gap-6">
            {/* ── The camp ─────────────────────────────────────────────── */}
            <Card>
              <CardTitle icon={<MapPin size={13} />}>Camp Details</CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <Detail icon={<MapPin size={13} />} label="Location">
                  {pkg ? packageLocationNames(pkg) : "—"}
                </Detail>
                <Detail icon={<Clock size={13} />} label="Duration">
                  {pkg?.duration_days ? `${pkg.duration_days} days` : "—"}
                </Detail>
                <Detail icon={<CalendarDays size={13} />} label="Starts">
                  {fmtDate(order.start_date ?? pkg?.start_date ?? null)}
                </Detail>
                <Detail icon={<Users size={13} />} label="On this booking">
                  {order.participant_count} {order.participant_count === 1 ? "fighter" : "fighters"}
                </Detail>
              </div>
              {pkg?.description && (
                <p className="font-grotesk text-[13px] text-white/55 leading-relaxed mt-5 pt-5 border-t border-white/[0.06]">
                  {pkg.description}
                </p>
              )}
            </Card>

            {/* ── Who is going ─────────────────────────────────────────── */}
            <Card>
              <CardTitle icon={<Users size={13} />}>Who&apos;s Going</CardTitle>
              <div className="flex flex-col">
                {participants.map((p) => {
                  const isMe = p.email.toLowerCase() === user?.email.toLowerCase();
                  return (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1.5 py-3 border-b border-white/[0.05] last:border-0"
                    >
                      <span className="font-grotesk text-sm text-white font-bold">
                        {p.full_name?.trim() || "Unnamed fighter"}
                      </span>
                      {isMe && (
                        <span className="font-grotesk text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                          You
                        </span>
                      )}
                      {p.is_buyer && (
                        <span className="font-grotesk text-[11px] uppercase tracking-[0.25em] text-white/40">
                          Booked it
                        </span>
                      )}
                      <span className="font-grotesk text-[13px] text-white/45 truncate">{p.email}</span>
                      <span
                        className={`ml-auto inline-flex items-center gap-1.5 font-grotesk text-[12px] tracking-wide ${
                          p.fighter_card_complete ? "text-emerald-300/80" : "text-amber-300/90"
                        }`}
                      >
                        {p.fighter_card_complete ? <BadgeCheck size={12} /> : <Swords size={12} />}
                        {p.fighter_card_complete ? "Card complete" : "Card unfinished"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Their own card is the one thing they can act on here. */}
              {me && !me.fighter_card_complete && (
                <Link
                  href="/profile?tab=fighter-card"
                  className="group mt-5 flex items-center gap-3 border border-primary/25 bg-primary/[0.06] px-4 py-3.5 hover:bg-primary/[0.1] transition-colors duration-200"
                >
                  <Swords size={15} className="text-primary shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-grotesk text-[13px] text-white font-bold">
                      Finish your fighter card
                    </span>
                    <span className="block font-grotesk text-[13px] text-white/60">
                      Your coaches read it before you arrive.
                    </span>
                  </span>
                  <ArrowRight
                    size={14}
                    className="text-primary shrink-0 group-hover:translate-x-0.5 transition-transform duration-200"
                  />
                </Link>
              )}
            </Card>
          </div>

          {/* ── Payment ─────────────────────────────────────────────────── */}
          <div className="lg:sticky lg:top-28">
            <Card>
              <CardTitle icon={<Receipt size={13} />}>Payment</CardTitle>

              {isBuyer ? (
                <div className="space-y-2.5">
                  <Row
                    label={
                      order.participant_count > 1
                        ? `Camp fee × ${order.participant_count}`
                        : "Camp fee"
                    }
                    value={fmtPrice(order.subtotal_amount)}
                  />
                  {discounted && (
                    <Row
                      label={`Discount${order.coupon_code ? ` (${order.coupon_code})` : ""}`}
                      value={`−${fmtPrice(order.discount_amount)}`}
                      accent
                    />
                  )}
                  <div className="flex justify-between items-center gap-3 pt-3 border-t border-white/[0.08]">
                    <span className="font-grotesk text-sm text-white font-bold">Total paid</span>
                    <span className="font-barlow font-black italic text-2xl text-white">
                      {fmtPrice(order.total_amount)}
                    </span>
                  </div>
                  {order.status === "PENDING" && payments.length === 0 && (
                    <p className="font-grotesk text-[13px] text-amber-300/90 pt-2">
                      This booking isn&apos;t paid yet — your place is confirmed once payment
                      succeeds.
                    </p>
                  )}

                  {/* Every attempt against this booking, newest first. A failed
                      or refunded one is exactly what someone comes here to check. */}
                  {payments.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-white/[0.08] space-y-4">
                      <span className="block font-grotesk text-[12px] uppercase tracking-[0.28em] text-white/45 font-bold">
                        {payments.length === 1 ? "Transaction" : "Transactions"}
                      </span>

                      {payments.map((payment) => (
                        <div key={payment.id} className="space-y-1.5">
                          <div className="flex justify-between items-center gap-3">
                            <span
                              className={`font-grotesk text-[13px] font-bold uppercase tracking-[0.2em] ${
                                PAYMENT_TONE[payment.status] ?? "text-white/60"
                              }`}
                            >
                              {payment.status}
                            </span>
                            <span className="font-grotesk text-[13px] text-white/80 tabular-nums">
                              {fmtPrice(payment.amount)}
                            </span>
                          </div>

                          {payment.method && (
                            <Row label="Method" value={payment.method.toUpperCase()} />
                          )}
                          <Row label="Date" value={fmtDateTime(payment.created_at)} />
                          {payment.razorpay_payment_id && (
                            <div className="flex justify-between items-start gap-3">
                              <span className="font-grotesk text-[13px] text-white/60 shrink-0">
                                Payment ID
                              </span>
                              {/* The reference support will ask for. */}
                              <span className="font-mono text-[11px] text-white/70 break-all text-right">
                                {payment.razorpay_payment_id}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* A guest is never shown what the booking cost. */
                <div className="space-y-3">
                  <p className="font-grotesk text-sm text-white/80 leading-relaxed">
                    {order.user_email} booked this camp and paid for your place.
                  </p>
                  <p className="font-grotesk text-[13px] text-white/50 leading-relaxed">
                    There&apos;s nothing for you to pay. Get your fighter card finished and turn up
                    ready.
                  </p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </motion.div>
    </Shell>
  );
}

/** Page frame — navbar, gutter, and the way back to the bookings list. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-[88px] pb-24">
        <div className={`${SHELL} pt-8 pb-6`}>
          <Link
            href="/profile?tab=bookings"
            className="inline-flex items-center gap-2 font-grotesk text-[13px] text-white/60 hover:text-white/80 transition-colors duration-200 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200" />
            Back to My Bookings
          </Link>
        </div>
        <div className={SHELL}>{children}</div>
      </div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="border border-white/[0.08] bg-white/[0.015] p-5 sm:p-6">{children}</div>;
}

function CardTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="w-7 h-7 border border-primary/20 bg-primary/10 text-primary flex items-center justify-center">
        {icon}
      </span>
      <h2 className="font-barlow font-black italic text-lg uppercase tracking-wide text-white">
        {children}
      </h2>
      <span className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-grotesk text-[12px] uppercase tracking-[0.28em] text-white/45 font-bold">
        {label}
      </span>
      <span className="flex items-center gap-2 font-grotesk text-sm text-white">
        <span className="text-primary shrink-0">{icon}</span>
        {children}
      </span>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between items-center gap-3">
      <span className={`font-grotesk text-[13px] truncate ${accent ? "text-primary" : "text-white/60"}`}>
        {label}
      </span>
      <span className={`font-grotesk text-[13px] shrink-0 ${accent ? "text-primary" : "text-white/80"}`}>
        {value}
      </span>
    </div>
  );
}
