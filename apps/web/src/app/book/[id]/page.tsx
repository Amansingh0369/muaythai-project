"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, MapPin, Clock, AlertCircle, Loader2,
  User, Phone, Plane, Heart, Check, Lock,
  ShieldAlert, BadgeCheck, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { packageService, Package, packageLocationNames } from "@/services/package.service";
import { userService, FullUser } from "@/services/user.service";
import { orderService, Order } from "@/services/order.service";
import { paymentService, CreateRazorpayOrderResponse } from "@/services/payment.service";
import { loadRazorpayScript } from "@/lib/razorpay";
import { enrichPackages, EnrichedPackage } from "@/components/FightCampsSection/FightCampsSection.helpers";
import Navbar from "@/components/Navbar";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(price: string | number) {
  return `₹${Number(price).toLocaleString("en-IN")}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, complete }: { icon: React.ReactNode; title: string; complete?: boolean }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className={`w-7 h-7 border flex items-center justify-center ${complete ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-primary/10 border-primary/20 text-primary"}`}>
        {complete ? <Check size={13} /> : icon}
      </div>
      <h3 className="font-barlow font-black italic text-lg uppercase tracking-wide text-white">{title}</h3>
      <span className="flex-1 h-px bg-white/[0.06]" />
      {complete && <span className="font-grotesk text-[9px] tracking-[0.3em] uppercase text-green-400">Complete</span>}
    </div>
  );
}

function FormField({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-grotesk text-[9px] uppercase tracking-[0.3em] text-white/60 font-bold">
        {label} {required && <span className="text-primary">*</span>}
      </label>
      {children}
      {error && (
        <p className="font-grotesk text-[10px] text-red-400 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement> & { hasError?: boolean }) {
  const { hasError, className, ...rest } = props;
  return (
    <input
      className={`w-full bg-white/[0.06] border px-3 py-2.5 text-sm font-grotesk text-white placeholder:text-white/25 outline-none focus:bg-white/[0.10] transition-colors duration-200 ${hasError ? "border-red-500/50 focus:border-red-500/70" : "border-white/12 focus:border-primary/50"} ${className ?? ""}`}
      {...rest}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement> & { hasError?: boolean }) {
  const { hasError, className, children, ...rest } = props;
  return (
    <select
      className={`w-full bg-white/[0.06] border px-3 py-2.5 text-sm font-grotesk text-white outline-none focus:bg-white/[0.10] transition-colors duration-200 appearance-none ${hasError ? "border-red-500/50" : "border-white/12 focus:border-primary/50"} ${className ?? ""}`}
      {...rest}
    >
      {children}
    </select>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type FormErrors = Partial<Record<string, string>>;

export default function BookingPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const packageId = Number(params.id);

  const [pkg, setPkg] = useState<EnrichedPackage | null>(null);
  const [fullUser, setFullUser] = useState<FullUser | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Form state — pre-filled from /me
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [passport, setPassport] = useState("");
  const [medical, setMedical] = useState("");
  const [allergies, setAllergies] = useState("");

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=/book/${packageId}`);
    }
  }, [authLoading, user, router, packageId]);

  // Fetch package + user profile in parallel
  const loadData = useCallback(async () => {
    if (!user) return;
    try {
      setPageLoading(true);
      setPageError(null);
      const [rawPkg, profile] = await Promise.all([
        packageService.getPackageById(packageId),
        userService.getFullProfile(),
      ]);
      const enriched = enrichPackages([rawPkg]);
      setPkg(enriched[0]);
      setFullUser(profile);

      // Pre-fill form from profile
      setFullName(profile.full_name ?? "");
      setPhone(profile.profile?.phone_no ?? "");
      setAge(profile.profile?.age != null ? String(profile.profile.age) : "");
      setGender(profile.profile?.gender ?? "");
      setEmergencyName(profile.profile?.emergency_contact_name ?? "");
      setEmergencyPhone(profile.profile?.emergency_contact_phone ?? "");
      setPassport(profile.profile?.passport_number ?? "");
      setMedical(profile.profile?.medical_conditions ?? "");
      setAllergies(profile.profile?.allergies ?? "");
    } catch (err: any) {
      setPageError(err?.message || "Failed to load booking details.");
    } finally {
      setPageLoading(false);
    }
  }, [user, packageId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (!fullName.trim()) e.fullName = "Full name is required";
    if (!phone.trim()) e.phone = "Phone number is required";
    if (!emergencyName.trim()) e.emergencyName = "Emergency contact name is required";
    if (!emergencyPhone.trim()) e.emergencyPhone = "Emergency contact phone is required";
    if (!passport.trim()) e.passport = "Passport number is required for international travel";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Open Razorpay Checkout and resolve only after the backend verifies the signature
  const startRazorpayPayment = (
    order: Order,
    rzp: CreateRazorpayOrderResponse,
  ): Promise<void> => {
    return new Promise<void>((resolve, reject) => {
      const options: RazorpayOptions = {
        key: rzp.razorpay_key_id || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        amount: rzp.amount, // paise, from the backend
        currency: rzp.currency, // "INR"
        name: "This Is Muay Thai",
        description: pkg?.title ?? "Fight Camp Booking",
        order_id: rzp.razorpay_order_id,
        prefill: {
          name: fullName,
          email: user?.email,
          contact: phone,
        },
        notes: { django_order_id: String(order.id) },
        theme: { color: "#ff5a1f" },
        handler: async (resp) => {
          try {
            await paymentService.verifyPayment({
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_signature: resp.razorpay_signature,
            });
            resolve(); // verified on the backend → safe to show success
          } catch (err) {
            reject(err);
          }
        },
        modal: {
          ondismiss: () => reject(new Error("Payment cancelled. Your spot is not booked yet — you can retry anytime.")),
        },
      };

      const instance = new window.Razorpay(options);
      instance.on("payment.failed", (resp: any) => {
        reject(new Error(resp?.error?.description || "Payment failed. Please try again."));
      });
      instance.open();
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !pkg) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      // 1. Save any profile changes first
      await userService.updateProfile({
        full_name: fullName || undefined,
        profile: {
          phone_no: phone || null,
          age: age ? Number(age) : null,
          gender: (gender as any) || null,
          emergency_contact_name: emergencyName || null,
          emergency_contact_phone: emergencyPhone || null,
          passport_number: passport || null,
          medical_conditions: medical || null,
          allergies: allergies || null,
        },
      });

      // 2. Create the Django order (PENDING)
      const order = await orderService.createOrder({ package: pkg.id });

      // 3. Make sure the Razorpay SDK is present
      const ok = await loadRazorpayScript();
      if (!ok) throw new Error("Could not load payment gateway. Check your connection.");

      // 4. Create the Razorpay order on the backend (amount derived server-side)
      const rzp = await paymentService.createRazorpayOrder(order.id);

      // 5. Open checkout and wait for backend-verified success
      await startRazorpayPayment(order, rzp);

      // 6. Verified → show success
      setSuccess(true);
      setTimeout(() => router.push("/profile"), 2500);
    } catch (err: any) {
      setSubmitError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Count missing required fields for the banner
  const missingFields = [
    !fullName.trim() && "Full Name",
    !phone.trim() && "Phone",
    !emergencyName.trim() && "Emergency Contact",
    !passport.trim() && "Passport",
  ].filter(Boolean) as string[];

  const sectionComplete = {
    personal: !!(fullName.trim() && phone.trim() && age && gender),
    emergency: !!(emergencyName.trim() && emergencyPhone.trim()),
    travel: !!passport.trim(),
  };

  // ── Loaders / Guards ───────────────────────────────────────────────────────

  if (authLoading || pageLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="text-primary animate-spin" size={32} />
          <p className="font-grotesk text-[10px] tracking-[0.4em] uppercase text-white/30 animate-pulse">Preparing Your Camp…</p>
        </div>
      </div>
    );
  }

  if (pageError || !pkg) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-center px-6">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle size={32} className="text-red-400" />
          <p className="font-grotesk text-white/60 text-sm">{pageError ?? "Package not found."}</p>
          <button onClick={() => router.push("/locations")} className="px-6 py-2.5 font-barlow font-bold text-[11px] tracking-[0.2em] uppercase bg-primary text-black">
            Back to Locations
          </button>
        </div>
      </div>
    );
  }

  const Icon = pkg.icon;
  const locationName = packageLocationNames(pkg);
  const isMultiLocation = pkg.kind === "GROUP" && pkg.locations.length > 1;
  const startDateLabel = pkg.start_date
    ? new Date(pkg.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  // Real backend content sections — skip any empty array.
  const sections = [
    { label: "Ideal For", items: pkg.ideal_for },
    { label: "Training", items: pkg.training },
    { label: "Experience", items: pkg.experience },
    { label: "Accommodation", items: pkg.accommodation },
    { label: "What's Included", items: pkg.included },
  ].filter((s) => Array.isArray(s.items) && s.items.length > 0);

  return (
    <div className="min-h-screen bg-[#050505]">
      <Navbar />

      {/* Success overlay */}
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
                <p className="font-grotesk text-sm text-white/50">Redirecting you to your profile…</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-[88px] pb-24">
        {/* ── Back link ── */}
        <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 pt-8 pb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 font-grotesk text-xs text-white/40 hover:text-white/80 transition-colors duration-200 group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform duration-200" />
            Back to Locations
          </button>
        </div>

        {/* ── Page Header ── */}
        <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="inline-block w-6 h-[2px] bg-primary" />
            <span className="font-grotesk text-[10px] tracking-[0.45em] uppercase text-primary font-medium">Fight Camp Booking</span>
          </div>
          <h1 className="font-barlow font-black italic text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white uppercase leading-[0.88] tracking-tight">
            SECURE YOUR <span className="text-gradient-fire">SPOT</span>
          </h1>
        </div>

        {/* ── Missing fields banner ── */}
        <AnimatePresence>
          {missingFields.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16 mb-8"
            >
              <div className="flex items-start gap-3 px-4 py-3.5 bg-amber-400/[0.06] border border-amber-400/20">
                <ShieldAlert size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-grotesk text-xs text-amber-300 font-bold mb-0.5">Profile incomplete</p>
                  <p className="font-grotesk text-[11px] text-white/50">
                    Please fill in: <span className="text-amber-300">{missingFields.join(", ")}</span> before booking.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Two-column layout ── */}
        <div className="max-w-7xl mx-auto px-5 md:px-10 lg:px-16">
          <div className="flex flex-col lg:flex-row gap-8 xl:gap-12 items-start">

            {/* ═══ LEFT: Package Summary Card (sticky) ═══ */}
            <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 lg:sticky lg:top-28">
              <div className="border border-white/[0.08] bg-white/[0.02] overflow-hidden">

                {/* Card header */}
                <div className={`p-6 bg-gradient-to-br ${pkg.accent} relative overflow-hidden`}>
                  <div className="absolute inset-0 opacity-30 mix-blend-overlay" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")", backgroundSize: "128px" }} />
                  <div className="w-12 h-12 bg-black/30 flex items-center justify-center mb-4">
                    <Icon size={22} className="text-white" />
                  </div>
                  <p className="font-grotesk text-[9px] tracking-[0.4em] uppercase text-white/70 mb-1">{pkg.subtitle}</p>
                  <h2 className="font-barlow font-black italic text-4xl text-white uppercase leading-[0.88] mb-3">{pkg.title}</h2>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 font-grotesk text-[10px] tracking-wide text-white/70 bg-black/20 px-2.5 py-1">
                      <MapPin size={10} /> {locationName}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-grotesk text-[10px] tracking-wide text-white/70 bg-black/20 px-2.5 py-1">
                      <Clock size={10} /> {pkg.duration}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-6 flex flex-col gap-6">
                  {/* Description */}
                  {pkg.description && pkg.description !== "Test" && (
                    <p className="font-grotesk text-sm text-white/55 leading-relaxed">{pkg.description}</p>
                  )}

                  {/* Real backend content sections — each a labeled bullet list, empties skipped */}
                  {sections.map((section) => (
                    <div key={section.label}>
                      <p className="font-grotesk text-[9px] tracking-[0.35em] uppercase text-white/30 mb-3">{section.label}</p>
                      <ul className="space-y-2.5">
                        {section.items.map((item) => (
                          <li key={item} className="flex items-start gap-3">
                            <span className="w-1.5 h-1.5 bg-primary/60 shrink-0 mt-[6px]" />
                            <span className="font-grotesk text-[13px] text-white/60 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* Price box */}
                  <div className="border border-white/[0.08] bg-white/[0.03] p-5">
                    <div className="flex items-end justify-between mb-3">
                      <span className="font-grotesk text-[9px] tracking-[0.35em] uppercase text-white/40">Total Amount</span>
                      <span className="font-barlow font-black italic text-3xl text-white">{fmt(pkg.price)}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between">
                        <span className="font-grotesk text-[11px] text-white/40">Camp fee</span>
                        <span className="font-grotesk text-[11px] text-white/60">{fmt(pkg.price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-grotesk text-[11px] text-white/40">Duration</span>
                        <span className="font-grotesk text-[11px] text-white/60">{pkg.duration_days} days</span>
                      </div>
                      {startDateLabel && (
                        <div className="flex justify-between">
                          <span className="font-grotesk text-[11px] text-white/40">Start date</span>
                          <span className="font-grotesk text-[11px] text-white/60">{startDateLabel}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══ RIGHT: Booking Form ═══ */}
            <form onSubmit={handleSubmit} className="flex-1 min-w-0 flex flex-col gap-6">

              {/* ── Personal Details ── */}
              <div className="border border-white/[0.08] bg-white/[0.015] p-5 sm:p-6 md:p-8">
                <SectionHeader icon={<User size={14} />} title="Personal Details" complete={sectionComplete.personal} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Full Name" required error={errors.fullName}>
                    <TextInput
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => { setFullName(e.target.value); setErrors((p) => ({ ...p, fullName: undefined })); }}
                      hasError={!!errors.fullName}
                    />
                  </FormField>
                  <FormField label="Phone Number" required error={errors.phone}>
                    <TextInput
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: undefined })); }}
                      hasError={!!errors.phone}
                    />
                  </FormField>
                  <FormField label="Age">
                    <TextInput
                      type="number"
                      placeholder="25"
                      value={age}
                      min="16"
                      max="80"
                      onChange={(e) => setAge(e.target.value)}
                    />
                  </FormField>
                  <FormField label="Gender">
                    <SelectInput value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </SelectInput>
                  </FormField>
                </div>
              </div>

              {/* ── Emergency Contact ── */}
              <div className="border border-white/[0.08] bg-white/[0.015] p-5 sm:p-6 md:p-8">
                <SectionHeader icon={<Phone size={14} />} title="Emergency Contact" complete={sectionComplete.emergency} />
                <p className="font-grotesk text-[11px] text-white/35 mb-5">Required for all camp participants — someone we can reach if needed.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Contact Name" required error={errors.emergencyName}>
                    <TextInput
                      placeholder="Parent / Spouse name"
                      value={emergencyName}
                      onChange={(e) => { setEmergencyName(e.target.value); setErrors((p) => ({ ...p, emergencyName: undefined })); }}
                      hasError={!!errors.emergencyName}
                    />
                  </FormField>
                  <FormField label="Contact Phone" required error={errors.emergencyPhone}>
                    <TextInput
                      placeholder="+91 98765 43210"
                      value={emergencyPhone}
                      onChange={(e) => { setEmergencyPhone(e.target.value); setErrors((p) => ({ ...p, emergencyPhone: undefined })); }}
                      hasError={!!errors.emergencyPhone}
                    />
                  </FormField>
                </div>
              </div>

              {/* ── Travel & Health ── */}
              <div className="border border-white/[0.08] bg-white/[0.015] p-5 sm:p-6 md:p-8">
                <SectionHeader icon={<Plane size={14} />} title="Travel & Health" complete={sectionComplete.travel} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Passport Number" required error={errors.passport}>
                    <TextInput
                      placeholder="A1234567"
                      value={passport}
                      onChange={(e) => { setPassport(e.target.value); setErrors((p) => ({ ...p, passport: undefined })); }}
                      hasError={!!errors.passport}
                    />
                  </FormField>
                  <div className="sm:col-span-1" />
                  <FormField label="Medical Conditions">
                    <TextInput
                      placeholder="e.g. Asthma, Diabetes (or leave blank)"
                      value={medical}
                      onChange={(e) => setMedical(e.target.value)}
                    />
                  </FormField>
                  <FormField label="Allergies">
                    <TextInput
                      placeholder="e.g. Peanuts, Shellfish (or leave blank)"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                    />
                  </FormField>
                </div>
                <p className="font-grotesk text-[11px] text-white/30 mt-3">Medical info helps our coaches keep you safe during training. All data is confidential.</p>
              </div>

              {/* ── Order Summary + CTA ── */}
              <div className="border border-white/[0.08] bg-white/[0.015] p-5 sm:p-6 md:p-8">
                <SectionHeader icon={<ChevronRight size={14} />} title="Order Summary" />

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2.5 border-b border-white/[0.05]">
                    <span className="font-grotesk text-sm text-white/50">Camp</span>
                    <span className="font-grotesk text-sm text-white font-bold">{pkg.title}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-white/[0.05]">
                    <span className="font-grotesk text-sm text-white/50">{isMultiLocation ? "Locations" : "Location"}</span>
                    <span className="font-grotesk text-sm text-white">{locationName}</span>
                  </div>
                  <div className="flex justify-between items-center py-2.5 border-b border-white/[0.05]">
                    <span className="font-grotesk text-sm text-white/50">Duration</span>
                    <span className="font-grotesk text-sm text-white">{pkg.duration_days} Days</span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="font-grotesk text-base text-white font-bold">Total</span>
                    <span className="font-barlow font-black italic text-3xl text-white">{fmt(pkg.price)}</span>
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {submitError && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2.5 px-4 py-3 bg-red-500/[0.07] border border-red-500/20 mb-5"
                    >
                      <AlertCircle size={14} className="text-red-400 shrink-0" />
                      <p className="font-grotesk text-xs text-red-300">{submitError}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={submitting}
                  className="group relative w-full overflow-hidden py-4 px-6 sm:px-8 font-barlow font-black text-[13px] sm:text-sm tracking-[0.2em] sm:tracking-[0.3em] uppercase bg-primary text-black hover:shadow-[0_0_40px_hsl(var(--primary)/0.4)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-500 flex items-center justify-center gap-3"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Opening Payment…
                    </>
                  ) : (
                    <>
                      Secure Your Spot · {fmt(pkg.price)}
                      <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-center gap-1.5 mt-4">
                  <Lock size={11} className="text-white/30" />
                  <p className="font-grotesk text-[10px] text-white/30 text-center leading-relaxed">
                    Secured by Razorpay · Your spot is confirmed only after payment succeeds.
                  </p>
                </div>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
