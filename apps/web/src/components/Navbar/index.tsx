"use client";

import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Menu, X, LogOut, User as UserIcon, ArrowUpRight } from "lucide-react";
import logo from "@/assets/logo.png";
import { SITE_CONFIG } from "@repo/utils";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useNavbarScroll } from "./Navbar.helpers";

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const { hidden } = useNavbarScroll();

  const navLinks = SITE_CONFIG.navigation;
  const leftLinks = navLinks.slice(0, Math.ceil(navLinks.length / 2));
  const rightLinks = navLinks.slice(Math.ceil(navLinks.length / 2));

  const handleBookClick = (e: React.MouseEvent) => {
    if (!user) {
      e.preventDefault();
      router.push("/login?redirect=/#camps");
    }
  };

  const NAV_H = 64; // px — keep in sync with h-16

  return (
    <>
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50"
        variants={{ visible: { y: 0 }, hidden: { y: "-100%" } }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
      >
        {/* ── Thin orange line — same as HeroSection eyebrow bar ── */}
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-primary to-transparent" />

        {/* ── Main bar ── */}
        <div
          className="relative bg-black/85 backdrop-blur-xl border-b border-white/[0.06] overflow-visible"
          style={{ height: NAV_H }}
        >
          {/* Grid layout: [left] [center-logo] [right] */}
          <div className="h-full max-w-[1440px] mx-auto grid grid-cols-[1fr_auto_1fr] items-stretch">

            {/* ── LEFT LINKS ── */}
            <div className="hidden md:flex items-center gap-6 lg:gap-10 pl-8 lg:pl-14">
              {leftLinks.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className="relative font-grotesk text-[10.5px] tracking-[0.22em] uppercase text-white/45 hover:text-white transition-colors duration-300 group"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 + 0.1 }}
                >
                  {item.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}
            </div>

            {/* ── CENTER LOGO BADGE (Parallelogram) ── */}
            <div className="relative flex items-center justify-center -mx-4 h-full pointer-events-none z-10">
              <motion.a
                href="/"
                className="relative h-full flex flex-col items-center justify-center bg-primary px-10 group overflow-hidden pointer-events-auto border-x border-white/20 shadow-[0_0_30px_hsl(var(--primary)/0.25)]"
                style={{ transform: "skewX(-18deg)" }}
                whileHover={{ backgroundColor: "hsl(24 100% 50%)" }}
                transition={{ duration: 0.2 }}
              >
                {/* Inner shine */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] delay-100" />
                <div className="absolute inset-0 bg-black mix-blend-overlay opacity-10" />

                {/* Un-skew the content so the logo isn't warped */}
                <div className="relative flex flex-col items-center" style={{ transform: "skewX(18deg)" }}>
                  <motion.img
                    src={logo.src}
                    alt={SITE_CONFIG.brand}
                    className="h-10 w-10 object-cover rounded-full brightness-[0.95] group-hover:brightness-110 shadow-lg border-2 border-black/30"
                    whileHover={{ scale: 1.05, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 400, damping: 15 }}
                  />
                  {/* Small brand text integrated directly beneath if desired, or leave icon only.
                      User requested removal of name from logo box previously, but for high-end feel 
                      it can stay as just the clean mark, which aligns with 'remove name from logo in nav bar'.
                  */}
                </div>
              </motion.a>
              
              {/* Floating glow behind */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-12 bg-primary/40 blur-2xl rounded-full" />
            </div>

            {/* ── RIGHT LINKS + CTA ── */}
            <div className="hidden md:flex items-center gap-6 lg:gap-10 justify-end pr-8 lg:pr-14">
              {rightLinks.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  className="relative font-grotesk text-[10.5px] tracking-[0.22em] uppercase text-white/45 hover:text-white transition-colors duration-300 group"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 + 0.15 }}
                >
                  {item.label}
                  <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-300" />
                </motion.a>
              ))}

              {/* Auth */}
              {user ? (
                <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                      <UserIcon size={11} className="text-primary" />
                    </div>
                    <span className="font-grotesk text-[10px] text-white/50 tracking-widest uppercase truncate max-w-[70px]">
                      {user.full_name.split(" ")[0]}
                    </span>
                  </div>
                  <button onClick={() => logout()} className="text-white/30 hover:text-primary transition-colors" title="Logout">
                    <LogOut size={14} />
                  </button>
                </div>
              ) : (
                <motion.a
                  href="#camps"
                  onClick={handleBookClick}
                  className="group relative overflow-hidden flex items-center gap-2 px-5 py-2 font-barlow font-bold text-[11px] tracking-[0.25em] uppercase text-black bg-primary hover:bg-primary/90 transition-colors duration-200"
                  whileTap={{ scale: 0.97 }}
                >
                  Book Camp
                  <ArrowUpRight size={12} className="translate-x-0 translate-y-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                  {/* shimmer */}
                  <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
                </motion.a>
              )}
            </div>

            {/* Mobile hamburger — only visible on small */}
            <div className="md:hidden flex items-center justify-end pr-5 col-start-3">
              <button
                id="mobile-menu-toggle"
                className="text-white/60 hover:text-white transition-colors"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle menu"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={isOpen ? "x" : "menu"}
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {isOpen ? <X size={22} /> : <Menu size={22} />}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </motion.nav>

      {/* ── MOBILE FULL-SCREEN OVERLAY ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="md:hidden fixed inset-0 top-[66px] bg-black/97 backdrop-blur-2xl z-40 flex flex-col"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: [0.76, 0, 0.24, 1] }}
          >
            {/* Top orange stripe — echoing the badge */}
            <div className="h-[3px] bg-primary w-full shrink-0" />

            <div className="flex flex-col px-8 pt-8 pb-10 gap-0 flex-1 overflow-auto">
              {navLinks.map((item, i) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between py-5 border-b border-white/[0.07] font-barlow font-black text-[2.4rem] tracking-wide uppercase text-white/55 hover:text-white transition-colors group"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.055 }}
                >
                  <span>{item.label}</span>
                  <ArrowUpRight
                    size={20}
                    className="opacity-0 group-hover:opacity-100 text-primary -translate-y-1 group-hover:translate-y-0 transition-all duration-200"
                  />
                </motion.a>
              ))}

              <div className="mt-auto pt-8 flex flex-col gap-4">
                {user ? (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
                        <UserIcon size={14} className="text-primary" />
                      </div>
                      <div>
                        <p className="font-grotesk text-sm text-white">{user.full_name}</p>
                        <p className="font-grotesk text-[10px] text-white/35 uppercase tracking-widest">Signed in</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { logout(); setIsOpen(false); }}
                      className="flex items-center gap-2 text-white/35 hover:text-primary transition-colors font-grotesk text-[10px] uppercase tracking-widest"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </div>
                ) : (
                  <a
                    href="#camps"
                    onClick={(e) => { setIsOpen(false); handleBookClick(e); }}
                    className="group relative overflow-hidden flex items-center justify-center gap-3 w-full py-4 font-barlow font-black text-[13px] tracking-[0.3em] uppercase text-black bg-primary"
                  >
                    Book Camp
                    <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200" />
                    <span className="absolute inset-0 bg-white/20 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-500 skew-x-12 pointer-events-none" />
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
