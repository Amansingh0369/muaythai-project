"use client";

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MapPin, 
  Plus, 
  Loader2,
  AlertCircle
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
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <MapPin className="text-primary w-6 h-6" />
            </div>
            Training Centers
          </h1>
          <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.3em] mt-3 ml-16">
            Global Infrastructure Management
          </p>
        </div>

        <button 
          onClick={handleOpenAdd}
          className="bg-primary hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-3 transition-all shadow-xl shadow-primary/20 group h-fit self-end md:self-center"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          Register New Center
        </button>
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
        title="Dismantle Center?"
        description="Are you sure you want to remove this training center from the network? This operation is permanent and cannot be reversed."
        confirmLabel="Decommission Center"
      />
    </div>
  );
}
