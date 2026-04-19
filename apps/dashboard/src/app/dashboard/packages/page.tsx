"use client";

import { usePackages } from "./hooks/usePackages";
import { PackageCard } from "./components/PackageCard";
import { PackageModal } from "./components/PackageModal";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { 
  Package as PackageIcon, 
  Plus, 
  Search, 
  RefreshCcw,
  LayoutGrid,
  Filter,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";

export default function PackagesPage() {
  const {
    packages,
    locations,
    isRefreshing,
    error,
    isModalOpen,
    isSubmitting,
    editingPackage,
    isDeleteModalOpen,
    formData,
    setFormData,
    handleOpenAdd,
    handleOpenEdit,
    handleCloseModal,
    handleSubmit,
    handleOpenDelete,
    handleDelete,
    setIsDeleteModalOpen,
    fetchData,
  } = usePackages();

  const [searchQuery, setSearchQuery] = useState("");

  const filteredPackages = packages.filter(pkg => 
    pkg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pkg.location_details?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32">
      {/* Header Section */}
      <div className="max-w-6xl mx-auto mb-16">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-px bg-primary" />
                <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">Logistics Control</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
                Training <span className="text-primary">Camps</span>
            </h1>
            <p className="text-white/40 mt-4 text-sm md:text-base max-w-lg leading-relaxed">
                Configure your fight packages, durations, and training center linkages. Changes reflect instantly on the public site experiences.
            </p>
          </div>

          <div className="flex items-center gap-4">
               <button 
                onClick={fetchData}
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
                Register Camp
              </button>
          </div>
        </div>

        {/* Stats / Feedback Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="glass-surface p-6 rounded-3xl border border-white/5 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <LayoutGrid className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Total Camps</p>
                    <p className="text-2xl font-bold">{packages.length}</p>
                </div>
            </div>
            <div className="glass-surface p-6 rounded-3xl border border-white/5 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Filter className="w-6 h-6" />
                </div>
                <div>
                    <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Active Plans</p>
                    <p className="text-2xl font-bold">{packages.filter(p => p.is_active).length}</p>
                </div>
            </div>
            <div className="glass-surface p-6 rounded-3xl border border-white/10 bg-white/5 flex items-center gap-3 group cursor-pointer overflow-hidden relative">
                <Search className="w-5 h-5 text-white/20 group-hover:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search camps or locations..." 
                    className="bg-transparent border-none focus:outline-none text-white text-sm w-full placeholder:text-white/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute bottom-0 left-0 h-[2px] bg-primary scale-x-0 group-focus-within:scale-x-100 transition-transform origin-left w-full" />
            </div>
        </div>
      </div>

      {/* List Section */}
      <div className="max-w-6xl mx-auto">
        <AnimatePresence mode="popLayout">
          {isRefreshing && packages.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-white/10 italic">
               <Loader2 className="w-12 h-12 animate-spin mb-4" />
               <p className="font-grotesk tracking-widest uppercase text-xs">Syncing with Fighter Backend...</p>
            </div>
          ) : error ? (
            <div className="py-24 glass-surface rounded-[3rem] border border-red-500/10 flex flex-col items-center justify-center text-center px-10">
                <AlertCircle className="w-12 h-12 text-red-500/50 mb-4" />
                <h3 className="text-xl font-bold text-white mb-2 uppercase">Sync Interrupted</h3>
                <p className="text-white/40 text-sm max-w-xs mb-8">{error}</p>
                <button 
                  onClick={fetchData}
                  className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Attempt Re-Sync
                </button>
            </div>
          ) : filteredPackages.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 glass-surface rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-white/20"
            >
               <PackageIcon className="w-16 h-16 mb-4 opacity-5" />
               <p className="font-grotesk tracking-widest uppercase text-xs italic">
                    {searchQuery ? "No matches found for your criteria" : "No training camps established yet"}
               </p>
            </motion.div>
          ) : (
            <div className="flex flex-col gap-4">
              {filteredPackages.map((pkg, idx) => (
                <PackageCard 
                  key={pkg.id} 
                  pkg={pkg} 
                  index={idx}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <PackageModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        editingPackage={editingPackage}
        formData={formData}
        setFormData={setFormData}
        locations={locations}
      />

      <ConfirmModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        isLoading={isSubmitting}
        title="Dismantle Camp?"
        message="This will permanently remove this training package from all locations. This action is irreversible once the ledger is updated."
        confirmText="Dismantle"
      />
    </div>
  );
}
