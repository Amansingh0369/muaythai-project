"use client";

import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  MapPin, 
  Settings, 
  LogOut, 
  Trophy,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CreditCard
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@repo/utils";

const menuItems = [
  { icon: LayoutDashboard, label: "Analytics", href: "/dashboard" },
  { icon: Users, label: "Students", href: "/dashboard/students" },
  { icon: Calendar, label: "Fight Camps", href: "/dashboard/packages" },
  { icon: MapPin, label: "Locations", href: "/dashboard/locations" },
  { icon: TrendingUp, label: "Performance", href: "/dashboard/performance" },
  { icon: CreditCard, label: "Financials", href: "/dashboard/financials" },
];

export default function Sidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  
  const collapsed = !isHovered;

  return (
    <motion.aside 
      initial={false}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      animate={{ width: collapsed ? 80 : 280 }}
      transition={{ 
        type: "tween",
        duration: 0.3,
        ease: [0.23, 1, 0.32, 1] // Custom ease-out-quart for smooth feel
      }}
      className="h-screen sticky top-0 bg-black border-r border-white/5 flex flex-col z-50 overflow-hidden group/sidebar will-change-[width]"
    >
      {/* Brand Header */}
      <div className="p-6 flex items-center gap-4 border-b border-white/5 h-20 overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
          <Trophy className="text-white w-6 h-6" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold text-lg tracking-tight text-white whitespace-nowrap"
            >
              ADMIN <span className="text-primary">PORTAL</span>
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-8 space-y-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.label} 
              href={item.href}
              className={cn(
                "flex items-center gap-4 p-3 rounded-xl transition-all group relative overflow-hidden",
                isActive 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-white/40 hover:text-white hover:bg-white/5 border border-transparent"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0 ml-1.5", isActive && "text-primary")} />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-semibold text-sm whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {isActive && !collapsed && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-primary rounded-l-full"
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="px-4 py-6 border-t border-white/5 space-y-2">
        <Link 
          href="/login"
          className={cn(
            "w-full flex items-center gap-4 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0 ml-1.5" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-semibold text-sm whitespace-nowrap"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </Link>
      </div>

      {/* Decorative Glow */}
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/5 blur-[60px] rounded-full pointer-events-none" />
    </motion.aside>
  );
}
