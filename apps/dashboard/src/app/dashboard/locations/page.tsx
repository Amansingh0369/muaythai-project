"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Plus, 
  Loader2,
  AlertCircle,
  RefreshCcw,
  Map
} from "lucide-react";
import { useLocations } from "./hooks/useLocations";
import { LocationCard } from "./components/LocationCard";
import { LocationModal } from "./components/LocationModal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { Button } from "@repo/ui";

export default function LocationsPage() {
  const {
    locations,
    isRefreshing,
    error,
    isAddModalOpen,
    isSubmitting,
    editingLocation,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    formData,
    setFormData,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseModal,
    handleSubmit,
    handleOpenDelete,
    handleDelete,
    fetchLocations,
  } = useLocations();

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-16">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-px bg-primary" />
                <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">Global Operations</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
                Training <span className="text-primary">Centers</span>
            </h1>
            <p className="text-white/40 mt-4 text-sm md:text-base max-w-lg leading-relaxed">
                Manage your physical infrastructure and regional hubs. Registered centers can be linked to specific training packages immediately.
            </p>
          </div>

          <div className="flex items-center gap-4">
              <button 
                onClick={fetchLocations}
                disabled={isRefreshing}
                className="w-14 h-14 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all active:rotate-180 duration-500 disabled:opacity-50"
              >
                <RefreshCcw className={`w-6 h-6 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
              <button 
                onClick={handleOpenAdd}
                className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 group"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                Register Center
              </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="glass-surface p-6 rounded-3xl border border-white/5 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <MapPin className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Active Network</p>
                    <p className="text-2xl font-bold">{locations.length} Hubs</p>
                </div>
            </div>
            <div className="glass-surface p-6 rounded-3xl border border-white/5 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                    <Map className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Global Coverage</p>
                    <p className="text-2xl font-bold">{Array.from(new Set(locations.map(l => l.city))).length} Cities</p>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="glass-surface p-12 rounded-[3rem] border border-red-500/20 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
                <AlertCircle className="text-red-500 w-8 h-8" />
            </div>
            <h3 className="text-white font-bold text-xl mb-2">{error}</h3>
            <p className="text-white/40 text-sm max-w-xs mb-6">There was a problem syncing with the training network.</p>
            <Button onClick={fetchLocations} variant="secondary" className="rounded-2xl px-10">Try Again</Button>
        </div>
      ) : isRefreshing ? (
         <div className="h-96 flex flex-col items-center justify-center gap-6">
            <div className="relative">
                <Loader2 className="animate-spin text-primary w-12 h-12" />
                <div className="absolute inset-0 blur-lg bg-primary/20 animate-pulse" />
            </div>
            <span className="text-white/20 font-black uppercase tracking-[0.4em] text-[10px] animate-pulse">Syncing Network...</span>
         </div>
      ) : (
        <div className="flex flex-col gap-4">
          <AnimatePresence mode="popLayout">
            {locations.length > 0 ? locations.map((loc, index) => (
              <LocationCard 
                key={loc.id}
                location={loc}
                index={index}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
              />
            )) : (
              /* Empty State */
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={handleOpenAdd}
                className="glass-surface border-2 border-dashed border-white/5 rounded-[3rem] p-20 flex flex-col items-center justify-center gap-6 hover:border-primary/20 hover:bg-white/[0.02] transition-all group"
              >
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary/10 transition-all border border-white/5 shadow-inner">
                        <Plus className="text-white/20 group-hover:text-primary transition-all w-10 h-10" />
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-white/40 group-hover:text-white font-black uppercase tracking-widest text-sm transition-all">No Training Centers Found</span>
                    <span className="text-white/20 text-[10px] font-bold uppercase">Click to establish your first location</span>
                  </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Main Form Modal */}
      <LocationModal 
        isOpen={isAddModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        editingLocation={editingLocation}
        formData={formData}
        setFormData={setFormData}
      />

      {/* Global Deletion Security Modal */}
      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
        title="Shutdown Center?"
        message="Are you sure you want to remove this training center from the network? This operation is permanent and cannot be reversed."
        confirmText="Shutdown"
      />
    </div>
  );
}
