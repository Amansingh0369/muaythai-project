"use client";

import { motion } from "motion/react";
import { 
  Package as PackageIcon, 
  MapPin, 
  Clock, 
  Edit2, 
  Trash2, 
  ChevronRight,
  TrendingUp
} from "lucide-react";
import { Package } from "@/services/package.service";

interface PackageCardProps {
  pkg: Package;
  index: number;
  onEdit: (pkg: Package) => void;
  onDelete: (id: number) => void;
}

export function PackageCard({ pkg, index, onEdit, onDelete }: PackageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.05 }}
      className="glass-surface rounded-[2rem] p-4 pr-8 border border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden flex items-center gap-6 w-full"
    >
      {/* Side Accent */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${pkg.is_active ? "bg-primary/50 group-hover:bg-primary" : "bg-white/10"} transition-all`} />
      
      {/* Icon Area */}
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-all border border-white/5">
        <PackageIcon className="text-primary w-8 h-8" />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors truncate">
                {pkg.name}
            </h3>
            {pkg.is_active ? (
                <span className="text-[10px] font-black text-green-500/80 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                    Live
                </span>
            ) : (
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                    Draft
                </span>
            )}
        </div>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-sm text-white/50 truncate">
                <MapPin className="w-3 h-3 text-primary shrink-0" />
                <span className="truncate">{pkg.location_details?.name || "No Location Linked"}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-white/50">
                <Clock className="w-3 h-3 text-primary shrink-0" />
                <span>{pkg.duration_days} Days</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-white/50">
                <TrendingUp className="w-3 h-3 text-primary shrink-0" />
                <span>${typeof pkg.price === 'string' ? parseFloat(pkg.price).toLocaleString() : pkg.price.toLocaleString()}</span>
            </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="h-10 w-px bg-white/5 mx-2 hidden md:block" />
        
        <div className="flex items-center gap-2 relative z-20">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(pkg);
                }}
                className="w-12 h-12 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95 pointer-events-auto"
                title="Edit Package"
            >
                <Edit2 className="w-5 h-5" />
            </button>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(pkg.id);
                }}
                className="w-12 h-12 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all active:scale-95 pointer-events-auto"
                title="Delete Package"
            >
                <Trash2 className="w-5 h-5" />
            </button>
        </div>
        
        <ChevronRight className="w-6 h-6 text-white/10 group-hover:text-primary group-hover:translate-x-1 transition-all hidden sm:block" />
      </div>

      {/* Decorative Glow */}
      <div className="absolute -right-20 -top-20 w-40 h-40 bg-primary/5 blur-[50px] pointer-events-none group-hover:bg-primary/10 transition-all" />
    </motion.div>
  );
}
