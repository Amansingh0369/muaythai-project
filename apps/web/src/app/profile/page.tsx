"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { motion, AnimatePresence } from "motion/react";
import {
  User, Mail, Phone, Calendar, Shield, LogOut,
  Edit2, Check, X, Loader2, Package,
  Activity, AlertCircle, Contact,
  Plane, BadgeCheck,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { userService, FullUser, UserOrder } from "@/services/user.service";

// ── Types ───────────────────────────────────────────────────────────────────

type ProfileForm = {
  full_name: string;
  phone_no: string;
  age: string;
  gender: string;
  bio: string;
  experience_level: string;
  weight_kg: string;
  height_cm: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  passport_number: string;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string | null, email: string) {
  if (name) return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  return email[0].toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
  CONFIRMED: "text-primary bg-primary/10 border-primary/20",
  COMPLETED: "text-green-400 bg-green-400/10 border-green-400/20",
  CANCELLED: "text-red-400 bg-red-400/10 border-red-400/20",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-7 h-7 bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
        {icon}
      </div>
      <h2 className="font-barlow font-black italic text-lg uppercase tracking-wide text-white">{title}</h2>
      <span className="flex-1 h-px bg-white/[0.06]" />
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-grotesk text-[9px] uppercase tracking-[0.3em] text-white/55 font-bold">{label}</span>
      <span className="font-grotesk text-sm text-white">{value || <span className="text-white/50 italic">Not set</span>}</span>
    </div>
  );
}

function EditInput({ label, error, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-grotesk text-[9px] uppercase tracking-[0.3em] text-white/60 font-bold">{label}</label>
      <input
        className={`w-full bg-white/[0.08] border px-3 py-2.5 text-sm font-grotesk text-white placeholder:text-white/30 outline-none focus:bg-white/[0.12] transition-colors duration-200 ${error ? "border-red-500/50" : "border-white/15 focus:border-primary/60"}`}
        {...props}
      />
      {error && <p className="font-grotesk text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

function EditSelect({ label, children, error, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="font-grotesk text-[9px] uppercase tracking-[0.3em] text-white/60 font-bold">{label}</label>
      <select
        className="w-full bg-white/[0.08] border border-white/15 px-3 py-2.5 text-sm font-grotesk text-white outline-none focus:border-primary/60 transition-colors duration-200 appearance-none"
        {...props}
      >
        {children}
      </select>
      {error && <p className="font-grotesk text-[10px] text-red-400">{error}</p>}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const [fullUser, setFullUser] = useState<FullUser | null>(null);
  const [fetching, setFetching] = useState(true);
  const [editing, setEditing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<ProfileForm>();

  useEffect(() => {
    if (!isLoading && !user) router.push("/login");
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!user) return;
    setFetching(true);
    setFetchError(null);
    userService.getFullProfile()
      .then((data) => {
        setFullUser(data);
        reset({
          full_name: data.full_name ?? "",
          phone_no: data.profile?.phone_no ?? "",
          age: data.profile?.age != null ? String(data.profile.age) : "",
          gender: data.profile?.gender ?? "",
          bio: data.profile?.bio ?? "",
          experience_level: data.profile?.experience_level ?? "BEGINNER",
          weight_kg: data.profile?.weight_kg ?? "",
          height_cm: data.profile?.height_cm ?? "",
          emergency_contact_name: data.profile?.emergency_contact_name ?? "",
          emergency_contact_phone: data.profile?.emergency_contact_phone ?? "",
          passport_number: data.profile?.passport_number ?? "",
        });
      })
      .catch((err) => {
        console.error("getFullProfile failed:", err);
        setFetchError(err?.message || "Failed to load profile. Please refresh.");
      })
      .finally(() => setFetching(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const onSave = async (values: ProfileForm) => {
    setSaveError(null);
    try {
      await userService.updateProfile({
        full_name: values.full_name || undefined,
        profile: {
          phone_no: values.phone_no || null,
          age: values.age ? Number(values.age) : null,
          gender: (values.gender as any) || null,
          bio: values.bio || null,
          experience_level: values.experience_level as any,
          weight_kg: values.weight_kg || null,
          height_cm: values.height_cm || null,
          emergency_contact_name: values.emergency_contact_name || null,
          emergency_contact_phone: values.emergency_contact_phone || null,
          passport_number: values.passport_number || null,
        },
      });
      const fresh = await userService.getFullProfile();
      setFullUser(fresh);
      reset({
        full_name: fresh.full_name ?? "",
        phone_no: fresh.profile?.phone_no ?? "",
        age: fresh.profile?.age != null ? String(fresh.profile.age) : "",
        gender: fresh.profile?.gender ?? "",
        bio: fresh.profile?.bio ?? "",
        experience_level: fresh.profile?.experience_level ?? "BEGINNER",
        weight_kg: fresh.profile?.weight_kg ?? "",
        height_cm: fresh.profile?.height_cm ?? "",
        emergency_contact_name: fresh.profile?.emergency_contact_name ?? "",
        emergency_contact_phone: fresh.profile?.emergency_contact_phone ?? "",
        passport_number: fresh.profile?.passport_number ?? "",
      });
      setEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || "Failed to save changes.");
    }
  };

  if (isLoading || fetching) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={32} />
      </div>
    );
  }

  if (fetchError || !fullUser) {
    return (
      <div className="min-h-screen bg-black pt-[98px] flex items-center justify-center">
        <div className="text-center flex flex-col items-center gap-4">
          <AlertCircle size={32} className="text-red-400" />
          <p className="font-grotesk text-white/60 text-sm">{fetchError ?? "Could not load profile."}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2.5 font-barlow font-bold text-[11px] tracking-[0.2em] uppercase bg-primary text-black"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const p = fullUser.profile;

  return (
    <div className="min-h-screen bg-black pt-[98px]">

      {/* ── HERO BANNER ──────────────────────────────────────────────────── */}
      <div className="relative border-b border-white/[0.06] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 100% at 30% 50%, hsl(16 100% 50% / 0.1) 0%, transparent 70%)" }} />
        <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14 relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-20 h-20 md:w-24 md:h-24 bg-primary/20 border-2 border-primary/40 flex items-center justify-center">
                <span className="font-barlow font-black italic text-3xl md:text-4xl text-primary">
                  {initials(fullUser.full_name, fullUser.email)}
                </span>
              </div>
              {fullUser.role === "ADMIN" && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary flex items-center justify-center">
                  <Shield size={12} className="text-black" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1 flex-wrap">
                <span className="font-grotesk text-[9px] tracking-[0.5em] uppercase text-primary font-bold">This Is Muay Thai</span>
                {fullUser.role === "ADMIN" && (
                  <span className="font-grotesk text-[9px] tracking-[0.2em] uppercase bg-primary/20 border border-primary/30 text-primary px-2 py-0.5">Admin</span>
                )}
              </div>
              <h1 className="font-barlow font-black italic text-3xl md:text-4xl uppercase text-white leading-tight truncate">
                {fullUser.full_name ?? "Warrior"}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2">
                <span className="flex items-center gap-1.5 font-grotesk text-xs text-white/65">
                  <Mail size={12} /> {fullUser.email}
                </span>
                {p?.phone_no && (
                  <span className="flex items-center gap-1.5 font-grotesk text-xs text-white/65">
                    <Phone size={12} /> {p.phone_no}
                  </span>
                )}
                <span className="flex items-center gap-1.5 font-grotesk text-xs text-white/65">
                  <Calendar size={12} /> Joined {formatDate(fullUser.created_at)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 shrink-0">
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-5 py-2.5 font-barlow font-bold text-[11px] tracking-[0.2em] uppercase border border-white/15 text-white/60 hover:border-primary/50 hover:text-primary transition-all duration-200"
                >
                  <Edit2 size={13} /> Edit Profile
                </button>
              )}
              <button
                onClick={() => { logout(); router.push("/"); }}
                className="flex items-center gap-2 px-5 py-2.5 font-barlow font-bold text-[11px] tracking-[0.2em] uppercase border border-white/10 text-white/50 hover:border-red-500/40 hover:text-red-400 transition-all duration-200"
              >
                <LogOut size={13} /> Logout
              </button>
            </div>
          </div>

          {/* Experience badge */}
          {p?.experience_level && (
            <div className="mt-5 flex items-center gap-2">
              <Activity size={13} className="text-primary" />
              <span className="font-grotesk text-[10px] uppercase tracking-[0.3em] text-white/40">
                {p.experience_level} Fighter
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10 md:py-14">

        {/* Success toast */}
        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-3 mb-6 px-4 py-3 bg-green-400/10 border border-green-400/20 text-green-400 font-grotesk text-sm"
            >
              <BadgeCheck size={16} /> Profile updated successfully.
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit(onSave)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">

            {/* ── LEFT COL: editable info ────────────────────────────── */}
            <div className="lg:col-span-2 flex flex-col gap-10">

              {/* Personal Info */}
              <div className="border border-white/[0.07] p-6 md:p-8">
                <SectionHeader icon={<User size={14} />} title="Personal Info" />
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EditInput label="Full Name" placeholder="Aman Singh" {...register("full_name")} />
                    <EditInput label="Phone Number" placeholder="9876543210" {...register("phone_no")} />
                    <EditInput label="Age" type="number" placeholder="25" {...register("age")} />
                    <EditSelect label="Gender" {...register("gender")}>
                      <option value="">Select</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </EditSelect>
                    <div className="sm:col-span-2">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-grotesk text-[9px] uppercase tracking-[0.3em] text-white/40 font-bold">Bio</label>
                        <textarea
                          rows={3}
                          placeholder="Tell us a bit about yourself..."
                          className="w-full bg-white/[0.08] border border-white/15 px-3 py-2.5 text-sm font-grotesk text-white placeholder:text-white/30 outline-none focus:border-primary/60 resize-none transition-colors duration-200"
                          {...register("bio")}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    <FieldRow label="Full Name" value={fullUser.full_name} />
                    <FieldRow label="Phone" value={p?.phone_no} />
                    <FieldRow label="Age" value={p?.age ? String(p.age) : null} />
                    <FieldRow label="Gender" value={p?.gender} />
                    {p?.bio && <div className="col-span-2 sm:col-span-3"><FieldRow label="Bio" value={p.bio} /></div>}
                  </div>
                )}
              </div>

              {/* Training Profile */}
              <div className="border border-white/[0.07] p-6 md:p-8">
                <SectionHeader icon={<Activity size={14} />} title="Training Profile" />
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <EditSelect label="Experience Level" {...register("experience_level")}>
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="PRO">Professional</option>
                    </EditSelect>
                    <EditInput label="Weight (kg)" type="number" placeholder="70" {...register("weight_kg")} />
                    <EditInput label="Height (cm)" type="number" placeholder="175" {...register("height_cm")} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    <FieldRow label="Experience" value={p?.experience_level} />
                    <FieldRow label="Weight" value={p?.weight_kg ? `${p.weight_kg} kg` : null} />
                    <FieldRow label="Height" value={p?.height_cm ? `${p.height_cm} cm` : null} />
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div className="border border-white/[0.07] p-6 md:p-8">
                <SectionHeader icon={<Contact size={14} />} title="Emergency Contact" />
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EditInput label="Contact Name" placeholder="Parent / Spouse name" {...register("emergency_contact_name")} />
                    <EditInput label="Contact Phone" placeholder="9876543210" {...register("emergency_contact_phone")} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-5">
                    <FieldRow label="Name" value={p?.emergency_contact_name} />
                    <FieldRow label="Phone" value={p?.emergency_contact_phone} />
                  </div>
                )}
              </div>

              {/* Travel */}
              <div className="border border-white/[0.07] p-6 md:p-8">
                <SectionHeader icon={<Plane size={14} />} title="Travel Details" />
                {editing ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EditInput label="Passport Number" placeholder="A1234567" {...register("passport_number")} />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-5">
                    <FieldRow label="Passport" value={p?.passport_number} />
                  </div>
                )}
              </div>

              {/* Edit action bar */}
              <AnimatePresence>
                {editing && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3"
                  >
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group relative overflow-hidden flex items-center gap-2 px-8 py-3 font-barlow font-black text-[12px] tracking-[0.25em] uppercase bg-primary text-black hover:shadow-[0_0_25px_hsl(var(--primary)/0.4)] disabled:opacity-60 transition-all duration-300"
                    >
                      {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                      {isSubmitting ? "Saving…" : "Save Changes"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditing(false); setSaveError(null); }}
                      className="flex items-center gap-2 px-6 py-3 font-barlow font-bold text-[12px] tracking-[0.2em] uppercase border border-white/15 text-white/50 hover:text-white transition-colors duration-200"
                    >
                      <X size={13} /> Cancel
                    </button>
                    {saveError && (
                      <p className="font-grotesk text-xs text-red-400 flex items-center gap-1.5">
                        <AlertCircle size={12} /> {saveError}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── RIGHT COL: orders + liked ──────────────────────────── */}
            <div className="flex flex-col gap-8">

              {/* Orders */}
              <div className="border border-white/[0.07] p-6">
                <SectionHeader icon={<Package size={14} />} title="My Bookings" />
                {fullUser.orders.length === 0 ? (
                  <div className="py-8 flex flex-col items-center gap-3 text-center">
                    <Package size={28} className="text-white/15" />
                    <p className="font-grotesk text-xs text-white/30">No bookings yet.</p>
                    <a href="/locations" className="font-grotesk text-xs text-primary hover:underline">Browse camps →</a>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {fullUser.orders.map((order: UserOrder) => (
                      <div key={order.id} className="flex items-start justify-between gap-3 p-3 border border-white/[0.06] hover:border-white/[0.1] transition-colors">
                        <div className="min-w-0">
                          <p className="font-barlow font-bold text-sm text-white truncate">{order.package_name}</p>
                          <p className="font-grotesk text-[10px] text-white/50 mt-0.5">{formatDate(order.created_at)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`font-grotesk text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 border ${STATUS_COLORS[order.status] ?? "text-white/40 bg-white/5 border-white/10"}`}>
                            {order.status}
                          </span>
                          <span className="font-barlow font-bold text-xs text-white/60">₹{Number(order.total_amount).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
