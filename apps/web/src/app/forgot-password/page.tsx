"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "motion/react";
import { Loader2, ArrowRight, ArrowLeft, MailCheck } from "lucide-react";
import Link from "next/link";
import { authService } from "@/services/auth.service";
import FormField from "@/app/login/_components/FormField";
import { forgotPasswordSchema, ForgotPasswordFormValues } from "@/app/login/auth.helpers";

function ForgotPasswordCard() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    setServerError(null);
    try {
      await authService.requestPasswordReset(values.email);
      // The API answers the same way whether or not the email is registered — so do we.
      setSentTo(values.email);
    } catch (err: any) {
      setServerError(err.message || "Could not send the reset link. Please try again.");
    }
  };

  // ── Sent state — identical regardless of whether the account exists ──────────
  if (sentTo) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-6 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
          <MailCheck size={36} className="text-primary" />
        </div>
        <div>
          <span className="font-grotesk text-[13px] tracking-[0.5em] uppercase text-primary font-bold block mb-3">
            Check Your Inbox
          </span>
          <h1 className="font-barlow font-black italic text-4xl uppercase text-white tracking-tight mb-2">
            Link Sent
          </h1>
          <p className="font-grotesk text-white/70 text-sm max-w-sm">
            If an account exists for <span className="text-white/90">{sentTo}</span>, we&apos;ve sent a
            reset link. Check your inbox (and spam) — the link expires in 10 minutes.
          </p>
        </div>
        <Link
          href="/login"
          className="group relative overflow-hidden flex items-center justify-center gap-2 px-10 py-3.5
                     font-barlow font-black text-[13px] tracking-[0.25em] uppercase
                     bg-primary text-black
                     hover:shadow-[0_0_30px_hsl(var(--primary)/0.4)]
                     transition-all duration-300"
        >
          Back to Sign In
          <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
        </Link>
        <button
          onClick={() => setSentTo(null)}
          className="font-grotesk text-[13px] text-white/60 hover:text-primary transition-colors"
        >
          Use a different email
        </button>
      </motion.div>
    );
  }

  // ── Form state ──────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="w-full"
    >
      <div className="flex flex-col items-center text-center mb-7">
        <span className="font-grotesk text-[13px] tracking-[0.5em] uppercase text-primary font-bold mb-3">
          Password Reset
        </span>
        <h1 className="font-barlow font-black italic text-4xl uppercase text-white tracking-tight">
          Forgot Password
        </h1>
        <p className="font-grotesk text-white/70 text-sm mt-2 max-w-sm">
          Enter your email and we&apos;ll send you a link to set a new one.
        </p>
      </div>

      <div
        className="border border-white/[0.12] shadow-2xl p-8 md:p-10"
        style={{ background: "rgba(10,10,10,0.75)", backdropFilter: "blur(24px)" }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
          <FormField
            label="Email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            error={errors.email?.message}
            {...register("email")}
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
                Sending Link...
              </>
            ) : (
              <>
                Send Reset Link
                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" />
              </>
            )}
            <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
          </button>
        </form>

        <p className="font-grotesk text-[13px] text-white/60 text-center mt-6">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-primary hover:underline font-semibold">
            <ArrowLeft size={13} />
            Back to sign in
          </Link>
        </p>
      </div>
    </motion.div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden py-16"
      style={{ background: "linear-gradient(135deg, #0f0500 0%, #1a0800 30%, #0d0d0d 60%, #100008 100%)" }}
    >
      <div
        className="fixed inset-0 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 40%, hsl(16 100% 50% / 0.15) 0%, transparent 60%)" }}
      />
      <div className="z-10 w-full max-w-md mx-4 flex flex-col items-center">
        <ForgotPasswordCard />
      </div>
    </div>
  );
}
