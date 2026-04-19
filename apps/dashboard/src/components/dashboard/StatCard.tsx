"use client";

import { motion } from "motion/react";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@repo/utils";

interface StatCardProps {
  title: string;
  value: string;
  subValue: string;
  icon: LucideIcon;
  trend: "up" | "down";
  trendValue: string;
  chartColor: "primary" | "secondary" | "accent";
}

export default function StatCard({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  trend, 
  trendValue,
  chartColor 
}: StatCardProps) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-surface p-6 rounded-3xl relative overflow-hidden group border border-white/5"
    >
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
            chartColor === "primary" ? "bg-primary/20 text-primary group-hover:bg-primary group-hover:text-white" :
            chartColor === "secondary" ? "bg-blue-500/20 text-blue-400 group-hover:bg-blue-500 group-hover:text-white" :
            "bg-orange-400/20 text-orange-400 group-hover:bg-orange-400 group-hover:text-white"
          )}>
            <Icon className="w-6 h-6" />
          </div>
          
          <div className={cn(
            "flex items-center gap-1 font-bold text-xs uppercase tracking-tighter",
            trend === "up" ? "text-green-500" : "text-red-500"
          )}>
            {trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trendValue}
          </div>
        </div>

        <div className="space-y-1">
          <h3 className="text-white/40 text-[11px] font-black uppercase tracking-[0.2em]">{title}</h3>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-white tracking-tight">{value}</span>
            <span className="text-xs font-bold text-white/20 whitespace-nowrap">{subValue}</span>
          </div>
        </div>

        {/* Decorative sparkline-like shape at bottom */}
        <div className="mt-8 relative h-10 w-full overflow-hidden">
            <svg className="absolute bottom-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path 
                    d={trend === "up" ? "M0 100 Q 25 20, 50 80 T 100 0" : "M0 0 Q 25 80, 50 20 T 100 100"} 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="4"
                    className={cn(
                        "opacity-30",
                        chartColor === "primary" ? "text-primary" :
                        chartColor === "secondary" ? "text-blue-500" :
                        "text-orange-400"
                    )}
                />
            </svg>
        </div>
      </div>

      {/* Glow Effect */}
      <div className={cn(
        "absolute -bottom-10 -right-10 w-32 h-32 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none",
        chartColor === "primary" ? "bg-primary/20" :
        chartColor === "secondary" ? "bg-blue-500/20" :
        "bg-orange-400/20"
      )} />
    </motion.div>
  );
}
