"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { authService } from "@/services/auth.service";

type State = "loading" | "success" | "error";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams?.get("token");
    const uid = searchParams?.get("uid");

    if (!token || !uid) {
      setState("error");
      setMessage("Invalid verification link. Please request a new one.");
      return;
    }

    authService
      .verifyEmail(uid, token)
      .then((res) => {
        setState("success");
        setMessage(res.message || "Email verified successfully.");
      })
      .catch((err) => {
        setState("error");
        setMessage(err.message || "Verification failed. The link may have expired.");
      });
  }, [searchParams]);

  return (
    <div className="z-10 w-full max-w-md mx-4 flex flex-col items-center text-center gap-6">
      {state === "loading" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="text-primary animate-spin" />
          <p className="font-grotesk text-white/50 text-sm tracking-wide">Verifying your email…</p>
        </motion.div>
      )}

      {state === "success" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center">
            <CheckCircle size={36} className="text-primary" />
          </div>
          <div>
            <span className="font-grotesk text-[9px] tracking-[0.5em] uppercase text-primary font-bold block mb-3">
              Email Verified
            </span>
            <h1 className="font-barlow font-black italic text-4xl uppercase text-white tracking-tight mb-2">
              You're In
            </h1>
            <p className="font-grotesk text-white/50 text-sm">{message}</p>
          </div>
          <Link
            href="/login"
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
      )}

      {state === "error" && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <XCircle size={36} className="text-red-400" />
          </div>
          <div>
            <span className="font-grotesk text-[9px] tracking-[0.5em] uppercase text-red-400 font-bold block mb-3">
              Verification Failed
            </span>
            <h1 className="font-barlow font-black italic text-4xl uppercase text-white tracking-tight mb-2">
              Link Expired
            </h1>
            <p className="font-grotesk text-white/50 text-sm max-w-xs">{message}</p>
          </div>
          <Link
            href="/login?tab=signup"
            className="font-grotesk text-sm text-primary hover:underline"
          >
            Back to Sign Up
          </Link>
        </motion.div>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0f0500 0%, #1a0800 30%, #0d0d0d 60%, #100008 100%)" }}
    >
      <div className="fixed inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 50% 40%, hsl(16 100% 50% / 0.15) 0%, transparent 60%)" }} />
      <Suspense fallback={
        <div className="flex items-center gap-3 text-primary text-sm font-barlow font-bold uppercase tracking-widest animate-pulse">
          <Loader2 className="animate-spin" size={18} /> Loading...
        </div>
      }>
        <VerifyEmailContent />
      </Suspense>
    </div>
  );
}
