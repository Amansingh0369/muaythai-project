"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, ArrowLeft, BadgeCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { packageService, packageLocationNames } from "@/services/package.service";
import { userService, FullUser } from "@/services/user.service";
import { orderService, OrderApiError, type GuestInput } from "@/services/order.service";
import { paymentService } from "@/services/payment.service";
import { loadRazorpayScript } from "@/lib/razorpay";
import { enrichPackages, EnrichedPackage } from "@/components/FightCampsSection/FightCampsSection.helpers";
import Navbar from "@/components/Navbar";
import BookingFormStep from "./_components/BookingFormStep";
import CampDetailsStep from "./_components/CampDetailsStep";
import {
  AppliedCoupon,
  BookingField,
  BookingValues,
  EMPTY_VALUES,
  FormErrors,
  GuestErrors,
  MAX_GUESTS,
  SHELL,
  contentSections,
  fillBlanks,
  fmtDate,
  hasGuestErrors,
  profileUpdatePayload,
  validateGuests,
  validateValues,
} from "./booking.helpers";
import { openRazorpayCheckout } from "./booking.payment";
import { useBookingDraft } from "./useBookingDraft";
import { useBookingStep } from "./useBookingStep";

export default function BookingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const packageId = Number(params.id);

  const { step, goToStep } = useBookingStep();

  const [pkg, setPkg] = useState<EnrichedPackage | null>(null);
  const [fullUser, setFullUser] = useState<FullUser | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  const [values, setValues] = useState<BookingValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [guestErrors, setGuestErrors] = useState<GuestErrors>({});
  // Guest-list rejections from the API, kept apart from `submitError` so they
  // render against the guest section rather than the page-level error line.
  const [guestServerErrors, setGuestServerErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Priced by /coupons/preview/ while no order exists yet; applied to the real order at submit.
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);

  // Draft key is per-camp so two half-filled bookings never overwrite each other.
  const clearDraft = useBookingDraft(`booking-draft-${packageId}`, values, setValues);

  /** Login lives on its own page, so send the user back to the form step afterwards. */
  const goToLogin = useCallback(() => {
    router.push(`/login?redirect=${encodeURIComponent(`/book/${packageId}?step=form`)}`);
  }, [router, packageId]);

  const setField = (field: BookingField, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // ── Guests ─────────────────────────────────────────────────────────────────

  const buyerEmail = fullUser?.email ?? user?.email ?? "";

  const addGuest = () => {
    setValues((prev) =>
      prev.guests.length >= MAX_GUESTS
        ? prev
        : { ...prev, guests: [...prev.guests, { full_name: "", email: "" }] }
    );
    setGuestServerErrors([]);
  };

  const changeGuest = (index: number, field: keyof GuestInput, value: string) => {
    setValues((prev) => ({
      ...prev,
      guests: prev.guests.map((guest, i) => (i === index ? { ...guest, [field]: value } : guest)),
    }));
    // Clear just this row's message; the rest stand until the next submit.
    setGuestErrors((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });
    setGuestServerErrors([]);
  };

  const removeGuest = (index: number) => {
    setValues((prev) => ({ ...prev, guests: prev.guests.filter((_, i) => i !== index) }));
    // Errors are keyed by position, so they no longer line up with the rows.
    setGuestErrors({});
    setGuestServerErrors([]);
  };

  // ── Data ───────────────────────────────────────────────────────────────────

  // The package is public — anyone can read the full camp before signing in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setPageLoading(true);
        setPageError(null);
        const rawPkg = await packageService.getPackageById(packageId);
        if (cancelled) return;
        setPkg(enrichPackages([rawPkg])[0]);
      } catch (err: any) {
        if (!cancelled) setPageError(err?.message || "Failed to load camp details.");
      } finally {
        if (!cancelled) setPageLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [packageId]);

  // Profile only matters once signed in, and it only fills blanks — never overwrites input.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const profile = await userService.getFullProfile();
        if (cancelled) return;
        setFullUser(profile);
        setValues((prev) => fillBlanks(prev, profile));
      } catch {
        // A failed profile fetch shouldn't block booking — the form is still fillable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // The form step is signed-in only — deep links and expired sessions bounce to login.
  useEffect(() => {
    if (authLoading || pageLoading) return;
    if (step === "form" && !user) goToLogin();
  }, [step, user, authLoading, pageLoading, goToLogin]);

  // ── Booking ────────────────────────────────────────────────────────────────

  /** Profile save → order → Razorpay. Values are passed in so this stays correct even
   *  when called before React has re-rendered with a freshly fetched profile. */
  const runBooking = async (v: BookingValues, email?: string) => {
    if (!pkg) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await userService.updateProfile(profileUpdatePayload(v));

      let order = await orderService.createOrder({
        package: pkg.id,
        // Omitted entirely for a solo booking — the API takes no empty list.
        ...(v.guests.length > 0 && { guests: v.guests }),
      });

      // Applying a coupon re-prices the order and clears its razorpay_order_id, so it has to
      // settle before the Razorpay order is created — otherwise the customer is charged full price.
      if (coupon) {
        try {
          order = await orderService.applyCoupon(order.id, coupon.code);
        } catch (err: any) {
          // The code went stale between preview and submit. Drop it and stop here rather than
          // let the customer pay an amount they didn't agree to.
          setCoupon(null);
          throw new Error(err?.message || "That coupon is no longer valid. Please check your total and try again.");
        }
      }

      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) throw new Error("Could not load payment gateway. Check your connection.");

      // Amount is derived server-side — never trusted from the client.
      const rzp = await paymentService.createRazorpayOrder(order.id);

      await openRazorpayCheckout({ order, rzp, values: v, email, description: pkg.title });

      clearDraft();
      setSuccess(true);
      setTimeout(() => router.push("/profile"), 2500);
    } catch (err: any) {
      // A rejected guest list belongs beside the names, not in the page banner.
      if (err instanceof OrderApiError && err.guestErrors.length > 0) {
        setGuestServerErrors(err.guestErrors);
      } else {
        setSubmitError(err?.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** "I Want to Book" — sign-in is asked for here, once the camp has been read. */
  const handleWantToBook = () => {
    if (!user && !authLoading) {
      goToLogin();
      return;
    }
    goToStep("form");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pkg) return;

    const fieldErrors = validateValues(values);
    const rowErrors = validateGuests(values.guests, buyerEmail);
    setErrors(fieldErrors);
    setGuestErrors(rowErrors);
    setGuestServerErrors([]);
    if (Object.keys(fieldErrors).length > 0 || hasGuestErrors(rowErrors)) return;

    // Normally they signed in before this step; this covers a session expiring mid-form.
    if (!user) {
      goToLogin();
      return;
    }

    await runBooking(values, fullUser?.email ?? user.email);
  };

  // ── Derived ────────────────────────────────────────────────────────────────

  const sections = useMemo(() => (pkg ? contentSections(pkg) : []), [pkg]);

  // ── Loaders / Guards ───────────────────────────────────────────────────────

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary animate-spin" size={32} />
          <p className="font-grotesk text-[13px] tracking-[0.4em] uppercase text-white/55 animate-pulse">
            Preparing Your Camp…
          </p>
        </div>
      </div>
    );
  }

  if (pageError || !pkg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-center px-6">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle size={32} className="text-red-400" />
          <p className="font-grotesk text-white/60 text-sm">{pageError ?? "Package not found."}</p>
          <button
            onClick={() => router.push("/locations")}
            className="px-6 py-2.5 font-barlow font-bold text-[13px] tracking-[0.2em] uppercase bg-primary text-black"
          >
            Back to Locations
          </button>
        </div>
      </div>
    );
  }

  const locationName = packageLocationNames(pkg);
  const isMultiLocation = pkg.kind === "GROUP" && pkg.locations.length > 1;
  const startDateLabel = fmtDate(pkg.start_date);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center text-center px-6"
          >
            <div className="flex flex-col items-center gap-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="w-20 h-20 bg-green-500/20 border border-green-500/40 flex items-center justify-center"
              >
                <BadgeCheck size={36} className="text-green-400" />
              </motion.div>
              <div>
                <h2 className="font-barlow font-black italic text-4xl text-white uppercase mb-2">Booking Confirmed</h2>
                {values.guests.length > 0 && (
                  <p className="font-grotesk text-sm text-white/80 mb-1">
                    We&apos;ve emailed all {values.guests.length + 1} fighters.
                  </p>
                )}
                <p className="font-grotesk text-sm text-white/70">Redirecting you to your profile…</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-[88px] pb-24">
        <div className={`${SHELL} pt-8 pb-6`}>
          <button
            onClick={() => (step === "form" ? goToStep("details") : router.back())}
            className="inline-flex items-center gap-2 font-grotesk text-[13px] text-white/60 hover:text-white/80 transition-colors duration-200 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200" />
            {step === "form" ? "Back to Camp Details" : "Back"}
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === "details" ? (
              <CampDetailsStep
                pkg={pkg}
                sections={sections}
                locationName={locationName}
                startDateLabel={startDateLabel}
                isMultiLocation={isMultiLocation}
                isSignedIn={!!user}
                onBook={handleWantToBook}
              />
            ) : (
              <BookingFormStep
                pkg={pkg}
                sections={sections}
                locationName={locationName}
                startDateLabel={startDateLabel}
                isMultiLocation={isMultiLocation}
                values={values}
                errors={errors}
                submitting={submitting}
                submitError={submitError}
                coupon={coupon}
                couponLocked={submitting || success}
                onCouponApplied={(applied) => {
                  setCoupon(applied);
                  setSubmitError(null);
                }}
                onCouponRemoved={() => setCoupon(null)}
                onFieldChange={setField}
                buyerEmail={buyerEmail}
                guestErrors={guestErrors}
                guestServerErrors={guestServerErrors}
                onGuestAdd={addGuest}
                onGuestChange={changeGuest}
                onGuestRemove={removeGuest}
                onSubmit={handleSubmit}
                onBackToDetails={() => goToStep("details")}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
