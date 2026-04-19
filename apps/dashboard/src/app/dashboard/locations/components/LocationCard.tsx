"use client";

import { motion } from "motion/react";
import { 
  MapPin, 
  Globe, 
  Edit2, 
  Trash2, 
  Map as MapIcon,
  ChevronRight
} from "lucide-react";
import { Location } from "@/services/location.service";
import { cn } from "@repo/utils";

interface LocationCardProps {
  location: Location;
  index: number;
  onEdit: (location: Location) => void;
  onDelete: (id: number) => void;
}

export function LocationCard({ location, index, onEdit, onDelete }: LocationCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ delay: index * 0.05 }}
      className="glass-surface rounded-[2rem] p-4 pr-8 border border-white/5 hover:border-primary/20 transition-all group relative overflow-hidden flex items-center gap-6 w-full"
    >
      {/* Side Accent */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/5 group-hover:bg-primary/50 transition-all" />
      
      {/* Icon Area */}
      <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-all border border-white/5">
        <Globe className="text-primary w-8 h-8" />
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1">
            <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors truncate">
                {location.name}
            </h3>
            <span className="text-[10px] font-black text-green-500/80 uppercase tracking-widest flex items-center gap-1.5 shrink-0">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Active
            </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <div className="flex items-center gap-2 text-sm text-white/50 truncate max-w-md">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate">{location.address}, {location.city}</span>
            </div>
            
            {(location.latitude && location.longitude) && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-white/20 uppercase tracking-tighter shrink-0">
                    <MapIcon className="w-3 h-3" />
                    {location.latitude} / {location.longitude}
                </div>
            )}
        </div>
      </div>

      {/* Action Area */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="h-10 w-px bg-white/5 mx-2 hidden md:block" />
        
        <div className="flex items-center gap-2 relative z-20">
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onEdit(location);
                }}
                className="w-12 h-12 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-all active:scale-95 pointer-events-auto"
                title="Edit Location"
            >
                <Edit2 className="w-5 h-5" />
            </button>
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(location.id);
                }}
                className="w-12 h-12 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 hover:border-red-500/50 hover:bg-red-500/10 transition-all active:scale-95 pointer-events-auto"
                title="Delete Location"
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
