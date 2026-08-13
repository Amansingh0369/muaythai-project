"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MapPin,
  LogOut,
  Trophy,
  ClipboardList,
  Star,
  CreditCard,
  TicketPercent,
  Menu,
  X,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@repo/utils";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  { icon: LayoutDashboard, label: "Analytics", href: "/dashboard" },
  { icon: Users, label: "Students", href: "/dashboard/students" },
  { icon: ClipboardList, label: "Bookings", href: "/dashboard/orders" },
  { icon: Calendar, label: "Fight Camps", href: "/dashboard/packages" },
  { icon: MapPin, label: "Locations", href: "/dashboard/locations" },
  { icon: Star, label: "Reviews", href: "/dashboard/reviews" },
  { icon: CreditCard, label: "Financials", href: "/dashboard/financials" },
  { icon: TicketPercent, label: "Coupons", href: "/dashboard/coupons" },
];

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  // Portal target is only available on the client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock body scroll while the overlay is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    await logout();
    router.push("/login");
  };

  return (
    <>
      {/* Hamburger — mobile only */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open menu"
        className="md:hidden w-11 h-11 flex items-center justify-center text-white/70 hover:text-white bg-white/[0.03] border border-white/10 rounded-xl transition-colors"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Full-screen overlay menu — portaled to body so it escapes the
          header's backdrop-filter containing block and covers the viewport */}
      {mounted &&
        createPortal(
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="md:hidden fixed inset-0 z-[120] bg-black/60 backdrop-blur-2xl flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.76, 0, 0.24, 1] }}
          >
            {/* Accent strip */}
            <div className="h-[3px] w-full bg-primary shrink-0" />

            {/* Top bar: brand + close */}
            <div className="flex items-center justify-between px-6 h-20 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                  <Trophy className="text-white w-5 h-5" />
                </div>
                <span className="font-bold text-lg tracking-tight text-white">
                  ADMIN <span className="text-primary">PORTAL</span>
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                aria-label="Close menu"
                className="w-11 h-11 flex items-center justify-center text-white/60 hover:text-white bg-white/[0.03] border border-white/10 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto px-6 py-6">
              {menuItems.map((item, i) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center justify-between py-5 border-b border-white/[0.07] font-barlow font-black text-3xl tracking-wide uppercase transition-colors group",
                        isActive ? "text-primary" : "text-white/55 hover:text-white"
                      )}
                    >
                      <span className="flex items-center gap-4">
                        <item.icon
                          className={cn(
                            "w-6 h-6 shrink-0",
                            isActive ? "text-primary" : "text-white/40"
                          )}
                        />
                        {item.label}
                      </span>
                      <ArrowUpRight className="w-6 h-6 text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Footer: logout */}
            <div className="px-6 py-6 border-t border-white/5 shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-4 p-4 text-red-400 hover:bg-red-500/10 rounded-xl transition-all font-semibold uppercase tracking-widest text-sm"
              >
                <LogOut className="w-5 h-5 shrink-0" />
                Logout
              </button>
            </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}
    </>
  );
}
