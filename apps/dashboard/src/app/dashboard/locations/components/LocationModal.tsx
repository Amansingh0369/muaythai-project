"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Loader2 } from "lucide-react";
import { Location, CreateLocationInput } from "@/services/location.service";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingLocation: Location | null;
  formData: CreateLocationInput;
  setFormData: (data: CreateLocationInput) => void;
}

export function LocationModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingLocation,
  formData,
  setFormData
}: LocationModalProps) {
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
            className="relative w-full max-w-2xl bg-black border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <div className="p-10">
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
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                      onChange={(e) => setFormData({...formData, city: e.target.value})}
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
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Latitude (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. 13.7563"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.latitude || ""}
                      onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Longitude (Optional)</label>
                    <input 
                      type="text"
                      placeholder="e.g. 100.5018"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.longitude || ""}
                      onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                    />
                  </div>
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
                  ) : (editingLocation ? "UPDATE CENTER" : "ESTABLISH CENTER")}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
