"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, ImagePlus, AlertCircle, Check } from "lucide-react";
import { PopupImage } from "@/services/popup-image.service";
import type { PopupImageFormData } from "../hooks/usePopupImages";

interface PopupImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  /** Set when editing an existing image's label/alt — the file itself can't be swapped. */
  editingImage: PopupImage | null;
  file: File | null;
  setFile: (file: File | null) => void;
  formData: PopupImageFormData;
  setFormData: (data: PopupImageFormData) => void;
  formError: string | null;
}

export function PopupImageModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingImage,
  file,
  setFile,
  formData,
  setFormData,
  formError,
}: PopupImageModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local object-URL preview for the picked (not-yet-uploaded) file.
  const [preview, setPreview] = useState<string | null>(null);
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
    e.target.value = ""; // allow re-picking the same file
  };

  // Editing shows the stored poster; uploading shows whatever was just picked.
  const shownImage = editingImage ? editingImage.image : preview;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />

          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-black border border-white/10 rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[min(92vh,860px)]"
          >
            <div className="p-6 md:p-10 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-start gap-4 mb-8 md:mb-10">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-tighter">
                    {editingImage ? "Edit" : "New"}{" "}
                    <span className="text-primary">Poster</span>
                  </h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">
                    {editingImage
                      ? `Label & alt text for poster #${editingImage.id}`
                      : "Upload an image for the homepage popup"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-11 h-11 md:w-12 md:h-12 shrink-0 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                {/* ── THE IMAGE ── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                      Poster Image
                    </label>
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                      4:3 · 1280×960
                    </span>
                  </div>

                  {shownImage ? (
                    <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shownImage}
                        alt="Poster preview"
                        className="w-full h-full object-cover"
                      />
                      {!editingImage && (
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          title="Remove"
                          className="absolute top-3 right-3 w-9 h-9 rounded-xl bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/80 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-3 text-white/30 hover:text-primary hover:border-primary/40 hover:bg-white/[0.02] transition-all"
                    >
                      <ImagePlus className="w-8 h-8" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Choose an image
                      </span>
                    </button>
                  )}

                  <p className="text-white/30 text-[11px] leading-relaxed ml-1">
                    {editingImage
                      ? "Swapping the picture itself means uploading a new poster — this form only edits the label and alt text."
                      : "The popup crops the poster to 4:3, so anything close to that frames cleanly. 1280×960 is what the current asset uses."}
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePick}
                    className="hidden"
                  />
                </div>

                {/* ── META ── */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">
                    Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. September batch"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                  <p className="text-white/30 text-[11px] ml-1">
                    Only you see this — it labels the poster in this library.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">
                    Alt Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Phuket camp — 12 September 2026"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                    value={formData.alt_text}
                    onChange={(e) =>
                      setFormData({ ...formData, alt_text: e.target.value })
                    }
                  />
                  <p className="text-white/30 text-[11px] ml-1">
                    Read out by screen readers and shown if the image fails to load.
                  </p>
                </div>

                {/* Go live immediately — upload only; an existing poster is
                    switched from its card instead. */}
                {!editingImage && (
                  <button
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, is_active: !formData.is_active })
                    }
                    className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all text-left"
                  >
                    <span
                      className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                        formData.is_active
                          ? "bg-primary border-primary text-white"
                          : "border-white/20 text-transparent"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-white text-sm font-bold">
                        Make this the live image
                      </span>
                      <span className="block text-white/40 text-[11px] mt-0.5 leading-relaxed">
                        Replaces whichever poster the popup is showing right now.
                      </span>
                    </span>
                  </button>
                )}

                {formError && (
                  <div className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{formError}</p>
                  </div>
                )}

                <button
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-base md:text-lg font-black uppercase tracking-[0.2em] py-4 md:py-5 rounded-[2rem] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin w-6 h-6" />
                      PROCESSING...
                    </>
                  ) : editingImage ? (
                    "SAVE CHANGES"
                  ) : (
                    "UPLOAD POSTER"
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
