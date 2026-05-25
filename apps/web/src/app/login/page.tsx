"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Loader2 } from "lucide-react";
import { getRedirectPath } from "./auth.helpers";
import GoogleAuthButton from "./_components/GoogleAuthButton";
import AuthDivider from "./_components/AuthDivider";
import LoginForm from "./_components/LoginForm";
import SignupForm from "./_components/SignupForm";

type Tab = "login" | "signup";

function AuthCard() {
  const searchParams = useSearchParams();
  const redirect = getRedirectPath(searchParams);
  const initialTab: Tab = searchParams?.get("tab") === "signup" ? "signup" : "login";
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="z-10 w-full max-w-[560px] mx-4"
    >
      {/* Brand */}
      <div className="flex flex-col items-center mb-7">
        <span className="font-grotesk text-[9px] tracking-[0.5em] uppercase text-primary font-bold mb-3">
          This Is Muay Thai
        </span>
        <AnimatePresence mode="wait">
          <motion.h1
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="font-barlow font-black italic text-4xl md:text-5xl uppercase text-white tracking-tight"
          >
            {tab === "login" ? "Welcome Back" : "Join the Camp"}
          </motion.h1>
        </AnimatePresence>
        <AnimatePresence mode="wait">
          <motion.p
            key={tab + "-sub"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="font-grotesk text-white/50 text-sm mt-2"
          >
            {tab === "login"
              ? "Sign in to access your bookings"
              : "Create your account to book a camp"}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Card */}
      <div className="border border-white/[0.12] shadow-2xl p-8 md:p-10"
        style={{ background: "rgba(10,10,10,0.75)", backdropFilter: "blur(24px)" }}
      >
        {/* Tab switcher */}
        <div className="flex border border-white/[0.12] mb-8 relative overflow-hidden">
          <button
            onClick={() => setTab("login")}
            className={`flex-1 py-3 font-barlow font-bold text-[11px] tracking-[0.25em] uppercase relative z-10 transition-colors duration-300
              ${tab === "login" ? "text-black" : "text-white/50 hover:text-white/80"}`}
          >
            Sign In
          </button>
          <button
            onClick={() => setTab("signup")}
            className={`flex-1 py-3 font-barlow font-bold text-[11px] tracking-[0.25em] uppercase relative z-10 transition-colors duration-300
              ${tab === "signup" ? "text-black" : "text-white/50 hover:text-white/80"}`}
          >
            Create Account
          </button>
          <motion.div
            className="absolute inset-y-0 w-1/2 bg-primary"
            animate={{ x: tab === "login" ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
          />
        </div>

        {/* Forms — fixed height (sized to signup, the taller form) so card never resizes */}
        <div className="relative overflow-hidden" style={{ height: 360 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, x: tab === "login" ? -16 : 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: tab === "login" ? 16 : -16 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="absolute inset-0 overflow-y-auto pr-1"
              style={{ scrollbarWidth: "none" }}
            >
              {tab === "login" ? (
                <LoginForm redirectPath={redirect} />
              ) : (
                <SignupForm redirectPath={redirect} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Google at bottom */}
        <div className="mt-6 flex flex-col gap-4">
          <AuthDivider />
          <GoogleAuthButton redirectPath={redirect} />
        </div>

        {/* Toggle hint */}
        <p className="font-grotesk text-xs text-white/40 text-center mt-6">
          {tab === "login" ? (
            <>
              New here?{" "}
              <button onClick={() => setTab("signup")} className="text-primary hover:underline font-semibold">
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button onClick={() => setTab("login")} className="text-primary hover:underline font-semibold">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      {/* Legal */}
      <p className="font-grotesk text-[10px] text-white/30 text-center mt-5 leading-relaxed">
        By continuing you agree to our{" "}
        <a href="/terms" className="underline hover:text-white/60 transition-colors">Terms</a>
        {" & "}
        <a href="/privacy" className="underline hover:text-white/60 transition-colors">Privacy Policy</a>
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen w-full flex items-center justify-center relative overflow-hidden py-16"
      style={{
        background: "linear-gradient(135deg, #0f0500 0%, #1a0800 30%, #0d0d0d 60%, #100008 100%)",
      }}
    >
      {/* ── BACKGROUND LAYERS — fixed so they never stretch on scroll ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>

        {/* Primary orange glow — top centre, strong */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 900,
            height: 900,
            top: "-20%",
            left: "50%",
            translateX: "-50%",
            background: "radial-gradient(circle, hsl(16 100% 50% / 0.22) 0%, transparent 65%)",
          }}
          animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Deep red — bottom left corner */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            bottom: "-15%",
            left: "-10%",
            background: "radial-gradient(circle, hsl(0 90% 35% / 0.2) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />

        {/* Warm amber — bottom right */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 500,
            height: 500,
            bottom: "0%",
            right: "-5%",
            background: "radial-gradient(circle, hsl(30 100% 40% / 0.14) 0%, transparent 70%)",
          }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        />

        {/* Horizontal light band across middle */}
        <div
          className="absolute left-0 right-0"
          style={{
            top: "45%",
            height: "1px",
            background: "linear-gradient(90deg, transparent 0%, hsl(16 100% 50% / 0.15) 30%, hsl(16 100% 50% / 0.25) 50%, hsl(16 100% 50% / 0.15) 70%, transparent 100%)",
          }}
        />

        {/* Dot grid */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.18,
          }}
        />

        {/* Vignette — edges darken */}
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 50%, rgba(0,0,0,0.6) 100%)",
          }}
        />

        {/* Diagonal lines */}
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" style={{ opacity: 0.06 }}>
          <line x1="0" y1="100%" x2="35%" y2="0" stroke="white" strokeWidth="1" />
          <line x1="100%" y1="0" x2="65%" y2="100%" stroke="white" strokeWidth="1" />
        </svg>
      </div>

      <Suspense fallback={
        <div className="flex items-center gap-3 text-primary text-sm font-barlow font-bold uppercase tracking-widest animate-pulse">
          <Loader2 className="animate-spin" size={18} />
          Loading...
        </div>
      }>
        <AuthCard />
      </Suspense>
    </div>
  );
}
