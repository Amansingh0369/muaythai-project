"use client";

import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, X, Loader2 } from "lucide-react";
import { Button } from "@repo/ui";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  isLoading = false
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center mb-6 border border-red-500/20">
                  <AlertTriangle className="text-red-500 w-8 h-8" />
                </div>
                
                <h3 className="text-2xl font-bold text-white uppercase tracking-tight mb-2">
                  {title}
                </h3>
                <p className="text-white/40 text-sm leading-relaxed mb-8 px-4">
                  {description}
                </p>

                <div className="grid grid-cols-2 gap-4 w-full">
                  <button
                    onClick={onClose}
                    className="py-4 rounded-2xl border border-white/5 bg-white/5 text-white/60 font-bold uppercase tracking-wider text-xs hover:bg-white/10 transition-all"
                  >
                    {cancelLabel}
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={onConfirm}
                    className="py-4 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold uppercase tracking-wider text-xs transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                  >
                    {isLoading ? <Loader2 className="animate-spin w-4 h-4" /> : confirmLabel}
                  </button>
                </div>
              </div>
            </div>

            <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-white/20 hover:text-white transition-colors"
            >
                <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
