"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, ImagePlus } from "lucide-react";
import {
  Location,
  LocationImage,
  CreateLocationInput,
} from "@/services/location.service";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingLocation: Location | null;
  formData: CreateLocationInput;
  setFormData: (data: CreateLocationInput) => void;
  newFiles: File[];
  existingImages: LocationImage[];
  addFiles: (files: File[]) => void;
  removeNewFile: (index: number) => void;
  removeExistingImage: (imageId: number) => void;
}

export function LocationModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingLocation,
  formData,
  setFormData,
  newFiles,
  existingImages,
  addFiles,
  removeNewFile,
  removeExistingImage,
}: LocationModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Local object-URL previews for the newly-picked (not-yet-uploaded) files.
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const urls = newFiles.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [newFiles]);

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(e.target.files ?? []));
    e.target.value = ""; // allow re-picking the same file
  };

  const totalImages = existingImages.length + newFiles.length;

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
            className="relative w-full max-w-2xl bg-black border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[min(90vh,840px)]"
          >
            <div className="p-10 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-white uppercase tracking-tighter">
                    {editingLocation ? "Update" : "New"} <span className="text-primary">Center</span>
                  </h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">
                    {editingLocation ? `Modifying center #${editingLocation.id}` : "Register a global location"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={onSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Center Name</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Bangkok HQ"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">City</label>
                    <input
                      required
                      type="text"
                      placeholder="Bangkok"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Full Address</label>
                  <textarea
                    required
                    placeholder="Street, District, ZIP Code..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-32 resize-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Latitude (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 13.7563"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.latitude || ""}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Longitude (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. 100.5018"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.longitude || ""}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </div>
                </div>

                {/* ── GALLERY IMAGES ── */}
                <div className="space-y-3 pb-6">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                      Gallery Images
                    </label>
                    <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
                      {totalImages} {totalImages === 1 ? "image" : "images"}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {/* Existing images (edit mode) */}
                    {existingImages.map((img) => (
                      <div
                        key={`existing-${img.id}`}
                        className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.image}
                          alt={img.caption ?? "Location image"}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(img.id)}
                          title="Remove image"
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/80 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Newly-picked files (previews) */}
                    {previews.map((url, i) => (
                      <div
                        key={`new-${i}`}
                        className="relative aspect-square rounded-2xl overflow-hidden border border-primary/30 group"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={url} alt="New upload preview" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1.5 left-1.5 text-[8px] font-black uppercase tracking-widest bg-primary text-black px-1.5 py-0.5 rounded">
                          New
                        </span>
                        <button
                          type="button"
                          onClick={() => removeNewFile(i)}
                          title="Remove"
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/70 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-red-500/80 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Add tile */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-2xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center gap-1.5 text-white/30 hover:text-primary hover:border-primary/40 hover:bg-white/[0.02] transition-all"
                    >
                      <ImagePlus className="w-6 h-6" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Add</span>
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePick}
                    className="hidden"
                  />
                </div>

                <button
                  disabled={isSubmitting}
                  className="w-full bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-black uppercase tracking-[0.2em] py-5 rounded-[2rem] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin w-6 h-6" />
                      PROCESSING...
                    </>
                  ) : editingLocation ? (
                    "UPDATE CENTER"
                  ) : (
                    "ESTABLISH CENTER"
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
