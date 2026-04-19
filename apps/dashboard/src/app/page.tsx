"use client";

import { motion } from "motion/react";
import { ArrowRight, Trophy, ShieldCheck, Activity } from "lucide-react";
import Link from "next/link";

export default function SplashPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans">
      {/* Dynamic Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        <div 
          className="absolute inset-0 opacity-[0.03]" 
          style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "40px 40px" }}
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center text-center max-w-3xl px-6"
      >
        {/* Logo Replacement */}
        <motion.div 
          whileHover={{ scale: 1.05 }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary via-orange-600 to-red-600 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(239,68,68,0.3)] border border-white/20"
        >
          <Trophy className="text-white w-12 h-12" />
        </motion.div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white mb-6">
          <span className="text-gradient-fire">ADMIN</span> PORTAL
        </h1>
        
        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mb-12 leading-relaxed">
          Manage your world-class Muay Thai fight camps with precision. Travel. Train. Transform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link href="/login" className="px-10 py-4 bg-primary text-white font-bold rounded-full flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-[0_0_30px_rgba(239,68,68,0.2)] group">
            ENTER PORTAL
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <button className="px-10 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-full hover:bg-white/10 transition-all backdrop-blur-sm">
            DOCUMENTATION
          </button>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 text-left w-full">
          <div className="glass-surface p-6 rounded-2xl">
            <Activity className="text-primary mb-4 w-6 h-6" />
            <h3 className="text-white font-semibold mb-2">Live Analytics</h3>
            <p className="text-muted-foreground text-sm">Real-time tracking of camp occupancy and student progress.</p>
          </div>
          <div className="glass-surface p-6 rounded-2xl">
            <ShieldCheck className="text-blue-500 mb-4 w-6 h-6" />
            <h3 className="text-white font-semibold mb-2">Secure Access</h3>
            <p className="text-muted-foreground text-sm">Enterprise-grade security for your administrative data.</p>
          </div>
          <div className="glass-surface p-6 rounded-2xl">
            <Trophy className="text-orange-400 mb-4 w-6 h-6" />
            <h3 className="text-white font-semibold mb-2">Growth Focus</h3>
            <p className="text-muted-foreground text-sm">Insights to scale your Muay Thai business globally.</p>
          </div>
        </div>
      </motion.div>

      {/* Footer Branding */}
      <div className="absolute bottom-10 z-10">
        <p className="text-white/20 text-xs tracking-[0.4em] uppercase font-bold">
          Forge Your Legacy
        </p>
      </div>
    </div>
  );
}
