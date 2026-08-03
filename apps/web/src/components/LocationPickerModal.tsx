"use client";

import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, ArrowRight } from "lucide-react";
import { type LocationDetails } from "@/services/package.service";

interface LocationPickerModalProps {
  /** Camp name shown in the header — null closes the modal. */
  campName: string | null;
  locations: LocationDetails[];
  onPick: (location: LocationDetails) => void;
  onClose: () => void;
}

/**
 * A camp that spans several locations can't redirect to one page on its own —
 * the user picks which location to visit first.
 */
const LocationPickerModal = ({ campName, locations, onPick, onClose }: LocationPickerModalProps) => {
  return (
    <AnimatePresence>
      {campName && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-5"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-lg bg-background border border-white/15 p-7 md:p-9 max-h-[85vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <span className="inline-block w-6 h-[2px] bg-primary" />
              <span className="font-grotesk text-[13px] tracking-[0.45em] uppercase text-primary font-medium">
                Choose a Location
              </span>
            </div>

            <h3 className="font-barlow font-black italic text-3xl md:text-4xl text-white uppercase leading-[0.95] tracking-tight">
              {campName}
            </h3>
            <p className="font-grotesk text-[13px] text-white/60 mt-3 leading-relaxed">
              This camp runs across {locations.length} locations. Pick one to see its details and book
              from there.
            </p>

            <div className="flex flex-col gap-3 mt-7">
              {locations.map((loc, i) => (
                <motion.button
                  key={loc.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onPick(loc)}
                  className="group text-left border border-white/20 bg-black/40 hover:border-primary/50 hover:bg-white/[0.03] transition-all duration-300 p-5 flex items-center gap-4"
                >
                  <MapPin size={16} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-barlow font-black italic text-lg text-white uppercase leading-tight truncate">
                      {loc.name}
                    </p>
                    <p className="font-grotesk text-[13px] text-white/55 truncate mt-0.5">
                      {loc.city || loc.address || "Thailand"}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-white/30 group-hover:text-primary group-hover:translate-x-1 transition-all duration-300 shrink-0"
                  />
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LocationPickerModal;
