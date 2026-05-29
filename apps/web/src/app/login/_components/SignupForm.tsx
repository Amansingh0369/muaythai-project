"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowRight, Mail, CheckCircle, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";
import { motion, AnimatePresence } from "motion/react";
import FormField from "./FormField";
import { signupSchema, SignupFormValues } from "../auth.helpers";

interface SignupFormProps {
  redirectPath: string;
}

export default function SignupForm({ redirectPath }: SignupFormProps) {
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [resendMessage, setResendMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupFormValues) => {
    setServerError(null);
    try {
      await registerUser(values.fullName, values.email, values.password);
      setRegisteredEmail(values.email);
    } catch (err: any) {
      setServerError(err.message || "Could not create account. Please try again.");
    }
  };

  const handleResend = async () => {
    if (!registeredEmail || resendState === "sending" || resendState === "sent") return;
    setResendState("sending");
    setResendMessage("");
    try {
      const res = await authService.resendVerification(registeredEmail);
      setResendState("sent");
      setResendMessage(res.message || "Verification email sent.");
    } catch (err: any) {
      setResendState("error");
      setResendMessage(err.message || "Failed to resend. Try again.");
    }
  };

  // ── Success state ──────────────────────────────────────────────────────────
  if (registeredEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 py-4 text-center"
      >
        <div className="w-14 h-14 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
          <Mail size={24} className="text-primary" />
        </div>
        <div>
          <h3 className="font-barlow font-black italic text-xl uppercase text-white mb-1">
            Check your inbox
          </h3>
          <p className="font-grotesk text-sm text-white/55 leading-relaxed max-w-xs">
            We sent a verification link to{" "}
            <span className="text-white font-semibold">{registeredEmail}</span>.
            Click it to activate your account.
          </p>
        </div>

        {/* Resend button */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleResend}
            disabled={resendState === "sending" || resendState === "sent"}
            className="flex items-center gap-2 font-grotesk text-xs text-white/40
                       hover:text-primary disabled:cursor-not-allowed
                       transition-colors duration-200"
          >
            {resendState === "sending" && <Loader2 size={12} className="animate-spin" />}
            {resendState === "sent" && <CheckCircle size={12} className="text-primary" />}
            {resendState === "sent" ? "Email sent!" : resendState === "sending" ? "Sending…" : "Didn't get it? Resend email"}
          </button>

          <AnimatePresence>
            {resendMessage && resendState === "error" && (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="font-grotesk text-[10px] text-red-400"
              >
                {resendMessage}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Full Name"
          type="text"
          placeholder="Aman Singh"
          error={errors.fullName?.message}
          {...register("fullName")}
        />
        <FormField
          label="Email"
          type="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField
          label="Password"
          isPassword
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />
        <FormField
          label="Confirm Password"
          isPassword
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register("confirmPassword")}
        />
      </div>

      <p className="font-grotesk text-[10px] text-white/25 -mt-1">
        Min 8 chars · one uppercase · one number
      </p>

      <AnimatePresence>
        {serverError && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="font-grotesk text-xs text-red-400 text-center"
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
          <><Loader2 size={14} className="animate-spin" /> Creating Account...</>
        ) : (
          <>Create Account <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-200" /></>
        )}
        <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
      </button>
    </form>
  );
}
