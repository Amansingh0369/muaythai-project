"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { authService, PasswordResetError } from "@/services/auth.service";
import FormField from "@/app/login/_components/FormField";
import { resetPasswordSchema, ResetPasswordFormValues } from "@/app/login/auth.helpers";

type State = "loading" | "form" | "success" | "error";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");
  const [credentials, setCredentials] = useState<{ uid: string; token: string } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  // Pre-check the link so an expired token fails before the user types a password.
  useEffect(() => {
    const token = searchParams?.get("token");
    const uid = searchParams?.get("uid");

    if (!token || !uid) {
      setState("error");
      setMessage("This reset link is missing information. Please request a new one.");
      return;
    }

    let active = true;
    authService
      .validateResetToken(uid, token)
      .then(() => {
        if (!active) return;
        setCredentials({ uid, token });
        setState("form");
      })
      .catch((err) => {
        if (!active) return;
        setState("error");
        setMessage(err.message || "This reset link is invalid or has expired.");
      });

    return () => {
      active = false;
    };
  }, [searchParams]);

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!credentials) return;
    setServerError(null);
    try {
      const res = await authService.confirmPasswordReset(
        credentials.uid,
        credentials.token,
        values.password
      );
      setMessage(res.message || "Password has been reset successfully.");
      setState("success");
    } catch (err: any) {
      if (err instanceof PasswordResetError) {
        // A rejected password (too common, too short, …) belongs under the field.
        if (err.field) {
          setError(err.field === "new_password" ? "password" : "confirmPassword", {
            message: err.message,
          });
          return;
        }
        // The token died between validation and submit — send them back for a new link.
        if (err.isTokenInvalid) {
          setState("error");
          setMessage(err.message);
          return;
        }
      }
      setServerError(err.message || "Could not reset your password. Please try again.");
    }
  };

  // ── Validating the link ─────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
        <Loader2 size={40} className="text-primary animate-spin" />
        <p className="font-grotesk text-white/70 text-sm tracking-wide">Checking your reset link…</p>
      </motion.div>
    );
  }

  // ── Password changed ────────────────────────────────────────────────────────
  if (state === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
          <CheckCircle size={36} className="text-primary" />
        </div>
        <div>
          <span className="font-grotesk text-[13px] tracking-[0.5em] uppercase text-primary font-bold block mb-3">
            Password Updated
          </span>
          <h1 className="font-barlow font-black italic text-4xl uppercase text-white tracking-tight mb-2">
            All Set
          </h1>
          <p className="font-grotesk text-white/70 text-sm">{message}</p>
        </div>
        <Link
          href="/login?redirect=%2Fprofile"
          className="group relative overflow-hidden flex items-center justify-center gap-2 px-10 py-3.5
                     font-barlow font-black text-[13px] tracking-[0.25em] uppercase
                     bg-primary text-black
                     hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]
                     transition-all duration-300"
        >
          Sign In Now
          <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
        </Link>
      </motion.div>
    );
  }

  // ── Invalid / expired link ──────────────────────────────────────────────────
  if (state === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <XCircle size={36} className="text-red-400" />
        </div>
        <div>
          <span className="font-grotesk text-[13px] tracking-[0.5em] uppercase text-red-400 font-bold block mb-3">
            Reset Failed
          </span>
          <h1 className="font-barlow font-black italic text-4xl uppercase text-white tracking-tight mb-2">
            Link Expired
          </h1>
          <p className="font-grotesk text-white/70 text-sm max-w-xs">{message}</p>
        </div>
        <Link
          href="/forgot-password"
          className="group relative overflow-hidden flex items-center justify-center gap-2 px-10 py-3.5
                     font-barlow font-black text-[13px] tracking-[0.25em] uppercase
                     bg-primary text-black
                     hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]
                     transition-all duration-300"
        >
          Request a New Link
          <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
        </Link>
        <Link href="/login" className="font-grotesk text-sm text-white/60 hover:text-primary transition-colors">
          Back to sign in
        </Link>
      </motion.div>
    );
  }

  // ── Valid link — collect the new password ───────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <div className="flex flex-col items-center text-center mb-7">
        <span className="font-grotesk text-[13px] tracking-[0.5em] uppercase text-primary font-bold mb-3">
          Set Your Password
        </span>
        <h1 className="font-barlow font-black italic text-4xl uppercase text-white tracking-tight">
          Your Password
        </h1>
        {/* Worded for both cases: a reset, and a friend who was booked onto a
            camp setting a password for the very first time. */}
        <p className="font-grotesk text-white/70 text-sm mt-2 max-w-sm">
          Choose the password you&apos;ll sign in with.
        </p>
      </div>

      <div
        className="border border-white/[0.12] shadow-2xl p-8 md:p-10"
        style={{ background: "rgba(10,10,10,0.75)", backdropFilter: "blur(24px)" }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
          <FormField
            label="New Password"
            isPassword
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register("password")}
          />
          <FormField
            label="Confirm Password"
            isPassword
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <AnimatePresence>
            {serverError && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-grotesk text-[13px] text-red-400 text-center"
              >
                {serverError}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isSubmitting}
            className="group relative overflow-hidden w-full flex items-center justify-center gap-2 py-3.5
                       font-barlow font-black text-[13px] tracking-[0.25em] uppercase
                       bg-primary text-black
                       hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]
                       disabled:opacity-60 disabled:cursor-not-allowed
                       transition-all duration-300 mt-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Updating...
              </>
            ) : (
              <>
                Reset Password
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
            <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden py-16"
      style={{ background: "linear-gradient(135deg, #0f0500 0%, #1a0800 30%, #0d0d0d 60%, #100008 100%)" }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 40%, hsl(16 100% 50% / 0.15) 0%, transparent 60%)" }}
      />
      <Suspense
        fallback={
          <div className="flex items-center gap-3 text-primary text-sm font-barlow font-bold uppercase tracking-widest animate-pulse">
            <Loader2 className="animate-spin" size={18} /> Loading...
          </div>
        }
      >
        <div className="z-10 w-full max-w-md mx-4 flex flex-col items-center text-center gap-6">
          <ResetPasswordContent />
        </div>
      </Suspense>
    </div>
  );
}
