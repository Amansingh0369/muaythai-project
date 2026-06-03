"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { motion } from "motion/react";
import { Loader2, ShieldCheck, Lock, Mail } from "lucide-react";

function getRedirectPath(searchParams: ReturnType<typeof useSearchParams>) {
  const redirect = searchParams.get("redirect");
  if (redirect && redirect.startsWith("/")) return redirect;
  return "/dashboard";
}

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = getRedirectPath(searchParams);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError(null);
    try {
      await login(email, password);
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
      <div className="space-y-2">
        <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
          <Mail className="w-3 h-3 text-primary" /> Email
        </label>
        <input
          required
          type="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
          <Lock className="w-3 h-3 text-primary" /> Password
        </label>
        <input
          required
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-white/20"
        />
      </div>

      <button
        type="submit"
        disabled={isLoggingIn}
        className="mt-2 w-full bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black uppercase tracking-[0.2em] py-5 rounded-[2rem] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3 text-sm"
      >
        {isLoggingIn ? (
          <>
            <Loader2 className="animate-spin w-5 h-5" />
            Verifying...
          </>
        ) : (
          "Enter Command Center"
        )}
      </button>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/10 border border-red-500/20 px-6 py-3 rounded-2xl flex items-start gap-3"
        >
          <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="text-white w-3 h-3" />
          </div>
          <p className="text-red-400 text-xs font-bold uppercase tracking-wider leading-relaxed">
            {error}
          </p>
        </motion.div>
      )}

      <p className="text-[10px] text-center text-white/30 mt-4 leading-relaxed uppercase tracking-[0.2em] font-black">
        Access strictly monitored for authorized personnel only
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black font-sans">
      <div
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle at 50% 50%, rgba(239, 68, 68, 0.2) 0%, transparent 60%)",
        }}
      />
      <div
        className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center brightness-[0.25] z-[-1] pointer-events-none"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="z-10 w-full max-w-md p-10 glass-surface border border-white/10 rounded-[3rem] m-4 shadow-2xl flex flex-col items-center bg-black/40 backdrop-blur-2xl"
      >
        <div className="flex flex-col items-center text-center mb-10 w-full">
          <motion.div
            animate={{
              boxShadow: ["0 0 0px var(--primary)", "0 0 20px var(--primary)", "0 0 0px var(--primary)"],
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="rounded-3xl p-4 bg-gradient-to-br from-primary via-orange-600 to-red-600 mb-8 border border-white/20"
          >
            <ShieldCheck className="text-white w-12 h-12" />
          </motion.div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-primary font-black uppercase tracking-[0.5em] mb-2">Secure Gateway</span>
            <h1 className="text-4xl font-bold tracking-tighter text-white uppercase">
              Admin <span className="text-white/40">Portal</span>
            </h1>
          </div>

          <div className="w-12 h-1 bg-primary/30 rounded-full mt-6 mb-2" />
        </div>

        <Suspense
          fallback={
            <div className="flex items-center gap-3 text-primary animate-pulse font-bold tracking-widest text-sm uppercase">
              <Loader2 className="animate-spin" />
              Loading Portal...
            </div>
          }
        >
          <LoginContent />
        </Suspense>
      </motion.div>

      <div className="absolute bottom-10 z-10 hidden md:block">
        <p className="text-white/10 text-[10px] tracking-[0.6em] uppercase font-black">
          Command Center • Systems Active
        </p>
      </div>
    </div>
  );
}
