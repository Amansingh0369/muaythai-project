"use client";

import { motion, AnimatePresence } from "motion/react";
import { X, Loader2, MapPin, Calendar, DollarSign, Activity } from "lucide-react";
import { Package, CreatePackageInput } from "@/services/package.service";
import { Location } from "@/services/location.service";

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingPackage: Package | null;
  formData: CreatePackageInput;
  setFormData: (data: CreatePackageInput) => void;
  locations: Location[];
}

export function PackageModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingPackage,
  formData,
  setFormData,
  locations
}: PackageModalProps) {
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
                    {editingPackage ? "Update" : "New"} <span className="text-primary">Camp</span>
                  </h2>
                  <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mt-1">
                    {editingPackage ? `Refining ${editingPackage.name}` : "Establish a new fighter experience"}
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
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Camp Name</label>
                    <input 
                      required
                      type="text"
                      placeholder="e.g. Beginner Experience"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-primary" /> Training Center
                    </label>
                    <select 
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: parseInt(e.target.value)})}
                    >
                      <option value={0} disabled className="bg-black text-white">Select Location</option>
                      {locations.map(loc => (
                          <option key={loc.id} value={loc.id} className="bg-black text-white">
                              {loc.name} ({loc.city})
                          </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Brief Description</label>
                  <textarea 
                    required
                    placeholder="Describe the intensity and focus of this camp..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-24 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                        <DollarSign className="w-3 h-3 text-primary" /> Price
                    </label>
                    <input 
                      required
                      type="number"
                      placeholder="e.g. 500"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-primary" /> Duration (Days)
                    </label>
                    <input 
                      required
                      type="number"
                      placeholder="e.g. 7"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({...formData, duration_days: parseInt(e.target.value)})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                        <Activity className="w-3 h-3 text-primary" /> Status
                    </label>
                    <button
                        type="button"
                        onClick={() => setFormData({...formData, is_active: !formData.is_active})}
                        className={`w-full h-[58px] rounded-2xl border transition-all flex items-center justify-center font-bold text-xs tracking-widest uppercase ${
                            formData.is_active 
                            ? "bg-green-500/10 border-green-500/50 text-green-500" 
                            : "bg-white/5 border-white/10 text-white/40"
                        }`}
                    >
                        {formData.is_active ? "Live / Active" : "Draft / Hidden"}
                    </button>
                  </div>
                </div>

                <div className="pt-6">
                    <button
                    disabled={isSubmitting}
                    className="w-full bg-primary hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-black uppercase tracking-[0.2em] py-5 rounded-[2rem] transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-3"
                    >
                    {isSubmitting ? (
                        <>
                            <Loader2 className="animate-spin w-6 h-6" />
                            PROCESSING...
                        </>
                    ) : (editingPackage ? "UPDATE CAMP" : "COMMISSION CAMP")}
                    </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
