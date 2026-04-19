"use client";

import { motion } from "motion/react";
import { User, Calendar } from "lucide-react";
import { formatDate } from "@repo/utils";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function Header() {
  const [dateStr, setDateStr] = useState<string>("");
  const { user } = useAuth();

  useEffect(() => {
    setDateStr(formatDate(new Date()));
  }, []);

  return (
    <header className="h-20 border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0 z-40 px-8 flex items-center justify-between">
      <div className="flex items-center gap-8 flex-1">
        {/* Breadcrumb / Title area */}
        <div className="hidden md:flex flex-col">
            <h2 className="text-white font-bold text-lg tracking-tight">System Overview</h2>
            <div className="flex items-center gap-2 text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">
                <span>{user?.role || "Global"}</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className="text-primary">Dashboard</span>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-6 pl-8 border-l border-white/5">
        <div className="hidden lg:flex flex-col items-end mr-4">
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-black flex items-center gap-2">
                <Calendar className="w-3 h-3 text-primary" />
                {dateStr}
            </span>
            <span className="text-[9px] text-green-500/80 font-bold uppercase tracking-tighter">System Status: Optimal</span>
        </div>

        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="flex flex-col items-end mr-2">
            <span className="text-xs font-bold text-white truncate max-w-[150px]">
              {user?.full_name || user?.email?.split('@')[0] || "Administrator"}
            </span>
            <span className="text-[9px] text-primary font-black uppercase tracking-widest">
              {user?.role || "Admin"}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/10 border border-white/10">
            <User className="text-white w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
