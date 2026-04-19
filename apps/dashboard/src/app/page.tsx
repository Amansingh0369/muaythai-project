"use client";

import { motion, AnimatePresence } from "motion/react";
import { 
  ArrowRight, 
  Trophy, 
  Terminal
} from "lucide-react";
import Link from "next/link";
import { SITE_CONFIG } from "@repo/utils";
import { useAuth } from "@/context/AuthContext";

export default function SplashPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center relative overflow-hidden font-sans selection:bg-primary/30">
      {/* Cinematic Tactical Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Radical Gradients */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[150px] rounded-full translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2" />
        
        {/* Tactical Grid */}
        <div 
          className="absolute inset-0 opacity-[0.05]" 
          style={{ 
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }}
        />

        {/* Scanlines Effect */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] pointer-events-none opacity-20" />

        {/* Branding Watermark */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.03 }}
            transition={{ duration: 2 }}
            className="absolute inset-0 flex items-center justify-center overflow-hidden whitespace-nowrap select-none"
        >
            <span className="text-[25vw] font-black tracking-[-0.05em] leading-none text-white italic">
                {SITE_CONFIG.taglines.heroMain.join(" ")}
            </span>
        </motion.div>
      </div>

      <main className="relative z-10 w-full max-w-7xl px-6 py-20 flex flex-col items-center">
        {/* Header Branding */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "circOut" }}
          className="mb-16 flex flex-col items-center"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-primary" />
            <span className="text-primary font-black uppercase tracking-[0.6em] text-[10px]">
              {user ? "Encrypted Access Active" : "Administrative Authorization Required"}
            </span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-primary" />
          </div>
          
          <div className="relative">
            <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-none text-center">
                THIS IS <br/>
                <span className="text-primary drop-shadow-[0_0_20px_rgba(239,68,68,0.3)]">MUAY THAI</span>
            </h1>
            <div className="absolute -right-4 -top-4 w-12 h-12 border-t-2 border-r-2 border-primary/40 rounded-tr-2xl" />
            <div className="absolute -left-4 -bottom-4 w-12 h-12 border-b-2 border-l-2 border-primary/40 rounded-bl-2xl" />
          </div>
          
          <p className="mt-8 text-white/40 font-bold uppercase tracking-[0.4em] text-xs max-w-lg text-center leading-relaxed">
            {SITE_CONFIG.taglines.heroSub}
          </p>
        </motion.div>

        {/* Action Interface */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col items-center w-full"
        >
          {/* Actions - Centered and Streamlined */}
          <div className="flex flex-col sm:flex-row gap-6 mb-8">
            <Link 
              href={user ? "/dashboard" : "/login"} 
              className="group relative px-12 py-5 bg-white text-black font-black uppercase tracking-[0.2em] text-sm overflow-hidden transition-all hover:pr-16"
            >
              <div className="absolute inset-0 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500" />
              <span className="relative z-10 group-hover:text-white transition-colors flex items-center gap-3">
                {user ? "Enter Command Center" : "Initialize Portal"}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
              </span>
            </Link>
          </div>
        </motion.div>
      </main>

      {/* System Footer Bar */}
      <footer className="absolute bottom-0 w-full p-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 glass-surface backdrop-blur-xl bg-black/40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[9px] text-white/40 font-bold uppercase tracking-widest">Core Engine: Stable</span>
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="w-3 h-3 text-white/20" />
            <span className="text-[9px] text-white/20 font-mono uppercase">SYNC_NODE_ALPHA_READY</span>
          </div>
        </div>
        
        <p className="text-[9px] text-white/10 font-bold uppercase tracking-[0.3em]">
           {SITE_CONFIG.brand} — Logistics & Operations Intelligence
        </p>

        <div className="flex items-center gap-4 text-[9px] text-white/30 font-bold uppercase tracking-widest">
            <span className="hover:text-primary transition-colors cursor-pointer">Security Protocol</span>
            <span className="w-1 h-1 bg-white/10 rounded-full" />
            <span className="hover:text-primary transition-colors cursor-pointer">Support</span>
        </div>
      </footer>

      {/* Decorative Glow Elements */}
      <div className="fixed top-1/2 left-0 w-1/4 h-[1px] bg-gradient-to-r from-primary/20 via-primary/5 to-transparent -translate-y-1/2 blur-sm" />
      <div className="fixed top-1/2 right-0 w-1/4 h-[1px] bg-gradient-to-l from-primary/20 via-primary/5 to-transparent -translate-y-1/2 blur-sm" />
    </div>
  );
}
