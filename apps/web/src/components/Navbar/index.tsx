"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Menu, X, LogOut, User as UserIcon, ArrowUpRight } from "lucide-react";
import logo from "@/assets/logo.png";
import { SITE_CONFIG } from "@repo/utils";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = SITE_CONFIG.navigation;

  const handleBookClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push("/login?redirect=/locations");
    }
  };

  const TOP_BAR_H = 34;
  const NAV_H = 64;

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-[100] flex flex-col">
        {/* ── TOP UTILITY BAR ── */}
        <div
          className="bg-black/95 backdrop-blur-md border-b border-white/[0.04] flex items-center px-8 lg:px-14 overflow-hidden"
          style={{ height: TOP_BAR_H }}
        >
          <div className="max-w-[1440px] w-full mx-auto flex items-center justify-between">
            <div className="flex items-center gap-8 text-[9px] md:text-[9.5px]">
              <div className="flex items-center gap-2">
                <span className="w-1 h-1 bg-primary rounded-full" />
                <span className="font-barlow font-bold tracking-[0.25em] uppercase text-white/40 italic">Bangkok, Thailand</span>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <a href="tel:+6621234567" className="font-barlow font-bold text-[9px] md:text-[9.5px] tracking-[0.25em] uppercase text-white/40 hover:text-primary transition-colors italic">
                +66 2 123 4567
              </a>
            </div>
          </div>
        </div>

        {/* ── MAIN NAVIGATION BAR ── */}
        <div
          className="relative bg-black/85 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl"
          style={{ height: NAV_H }}
        >
          <div className="h-full max-w-[1440px] mx-auto flex items-stretch justify-between">

            {/* ── LEFT: LOGO & HOME BADGES ── */}
            <div className="relative flex items-center z-10 h-full">
              {/* Logo Badge */}
              <motion.a
                href="/"
                className="relative h-full flex items-center justify-center bg-primary px-10 group overflow-hidden shadow-[0_0_40px_hsl(var(--primary)/0.35)] z-20"
                style={{
                  clipPath: "polygon(0% 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)"
                }}
                whileHover={{ backgroundColor: "hsl(16 100% 55%)" }} // Using the new primary hue
                transition={{ duration: 0.2 }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] delay-100" />
                <div className="absolute inset-0 bg-black mix-blend-overlay opacity-20" />

                <div className="relative">
                  <motion.img
                    src={logo.src}
                    alt={SITE_CONFIG.brand}
                    className="h-9 w-9 object-cover rounded-full border-2 border-black/30"
                    whileHover={{ scale: 1.08, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  />
                </div>
              </motion.a>

              {/* Home Badge */}
              <motion.a
                href="/"
                className="relative h-full flex items-center justify-center bg-black/40 hover:bg-black/60 border-l border-white/5 transition-colors px-12 -ml-5 group z-10"
                style={{
                  clipPath: "polygon(20px 0%, 100% 0%, calc(100% - 20px) 100%, 0% 100%)"
                }}
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.5 }}
              >
                <span className="font-barlow font-bold text-[13px] tracking-[0.25em] uppercase text-white/50 group-hover:text-primary transition-all duration-300 italic pl-2">
                  Home
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </motion.a>

              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-20 bg-primary/20 blur-3xl rounded-full -z-10" />
            </div>

            {/* ── RIGHT: NAV LINKS + CTA ── */}
            <div className="hidden md:flex items-stretch">
              {navLinks.filter(item => item.label !== "Home").map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className="h-full flex items-center px-8 lg:px-10 border-l border-white/[0.04] font-barlow font-bold text-[13px] tracking-[0.18em] uppercase text-white/65 hover:text-white transition-colors duration-300 group relative overflow-hidden"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                >
                  <span className="relative z-10">{item.label}</span>
                  <div className="absolute inset-x-0 bottom-0 h-[2px] bg-primary scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-right" />
                  <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.a>
              ))}

              {/* Auth Section */}
              <div className="h-full flex items-center px-10 border-l border-white/[0.1]">
                {user ? (
                  <div className="flex items-center gap-5">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                        <UserIcon size={12} className="text-primary" />
                      </div>
                      <span className="font-barlow font-bold text-[11px] text-white/50 tracking-[0.15em] uppercase truncate max-w-[100px]">
                        {user.full_name.split(" ")[0]}
                      </span>
                    </div>
                    <button onClick={() => logout()} className="text-white/30 hover:text-primary transition-colors hover:scale-110 duration-200">
                      <LogOut size={15} />
                    </button>
                  </div>
                ) : (
                  <motion.a
                    href="/locations"
                    onClick={handleBookClick}
                    className="group relative overflow-hidden flex items-center justify-center gap-2.5 px-8 h-11 font-barlow font-black text-[12.5px] tracking-[0.2em] uppercase text-black bg-primary border-none shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_35px_hsl(var(--primary)/0.45)] transition-all duration-300"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="relative z-10">Login</span>
                    <ArrowUpRight size={14} className="relative z-10 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    <span className="absolute inset-0 bg-white/30 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
                  </motion.a>
                )}
              </div>
            </div>

            {/* Mobile hamburger */}
            <div className="md:hidden flex items-center pr-6">
              <button
                className="w-12 h-12 flex items-center justify-center text-white/60 hover:text-white transition-colors bg-white/[0.03] border border-white/[0.06] rounded-sm"
                onClick={() => setIsOpen(!isOpen)}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isOpen ? "x" : "menu"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isOpen ? <X size={24} /> : <Menu size={24} />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── MOBILE MENU ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden fixed inset-0 top-[98px] bg-black/97 backdrop-blur-2xl z-[110] flex flex-col"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.76, 0, 0.24, 1] }}
          >
            <div className="h-[3px] bg-primary w-full" />
            <div className="flex flex-col px-8 pt-6 pb-10 flex-1 overflow-auto">
              {navLinks.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between py-6 border-b border-white/[0.07] font-barlow font-black text-[2rem] tracking-wide uppercase text-white/55 hover:text-white transition-colors group"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <span>{item.label}</span>
                  <ArrowUpRight size={20} className="text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </motion.a>
              ))}

              <div className="pt-12">
                {user ? (
                  <button onClick={() => { logout(); setIsOpen(false); }} className="flex items-center gap-3 text-white/40 font-barlow font-bold uppercase tracking-widest">
                    <LogOut size={20} /> Logout
                  </button>
                ) : (
                  <a
                    href="/locations"
                    onClick={(e) => { setIsOpen(false); handleBookClick(e); }}
                    className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-5 font-barlow font-black text-[14px] tracking-[0.3em] uppercase text-black bg-primary"
                  >
                    Login
                    <ArrowUpRight size={18} />
                    <span className="absolute inset-0 bg-white/30 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
