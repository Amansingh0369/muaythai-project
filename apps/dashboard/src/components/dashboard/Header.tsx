"use client";

import { motion } from "motion/react";
import { Search, Bell, User, Calendar } from "lucide-react";
import { formatDate } from "@repo/utils";

import { useEffect, useState } from "react";

export default function Header() {
  const [dateStr, setDateStr] = useState<string>("");

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
                <span>Admin</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span className="text-primary">Dashboard</span>
            </div>
        </div>

        {/* Global Search */}
        <div className="max-w-md w-full relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search students, camps, or transactions..." 
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all font-sans"
          />
        </div>
      </div>

      <div className="flex items-center gap-6 pl-8 border-l border-white/5">
        <div className="hidden lg:flex flex-col items-end mr-2">
            <span className="text-[10px] text-white/40 uppercase tracking-widest font-black flex items-center gap-2">
                <Calendar className="w-3 h-3 text-primary" />
                {dateStr}
            </span>
            <span className="text-[9px] text-green-500/80 font-bold uppercase tracking-tighter">System Status: Optimal</span>
        </div>

        <div className="flex items-center gap-3">
          <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-black" />
          </button>
          
          <div className="flex items-center gap-4 pl-4 border-l border-white/10 ml-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center shadow-lg shadow-primary/10">
              <User className="text-white w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
