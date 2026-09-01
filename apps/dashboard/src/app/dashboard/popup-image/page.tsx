"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  Image as ImageIcon,
  Plus,
  RefreshCcw,
  Loader2,
  AlertCircle,
  BadgeCheck,
  EyeOff,
} from "lucide-react";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { usePopupImages } from "./hooks/usePopupImages";
import { PopupImageCard } from "./components/PopupImageCard";
import { PopupImageModal } from "./components/PopupImageModal";

export default function PopupImagePage() {
  const {
    images,
    activeImage,
    isRefreshing,
    error,
    fetchData,

    isModalOpen,
    editingImage,
    file,
    setFile,
    formData,
    setFormData,
    formError,
    isSubmitting,
    handleOpenUpload,
    handleOpenEdit,
    handleCloseModal,
    handleSubmit,

    pending,
    actionError,
    handleActivate,
    handleDeactivate,

    deleteTarget,
    openDelete,
    closeDelete,
    handleDelete,
  } = usePopupImages();

  const isDeletingLive = deleteTarget?.is_active ?? false;

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 pb-32">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto mb-12 md:mb-16">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-px bg-primary" />
              <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px]">
                Homepage Control
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black uppercase tracking-tighter italic">
              Popup <span className="text-primary">Poster</span>
            </h1>
            <p className="text-white/40 mt-4 text-sm md:text-base max-w-lg leading-relaxed">
              The image behind the first-visit popup on the site. Keep a library
              of posters, make one live, and switch between them whenever the
              next departure changes.
            </p>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={fetchData}
              disabled={isRefreshing}
              className="w-14 h-14 shrink-0 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all active:rotate-180 duration-500 disabled:opacity-50"
            >
              <RefreshCcw className={`w-6 h-6 ${isRefreshing ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleOpenUpload}
              className="flex-1 lg:flex-none flex items-center justify-center gap-3 bg-white text-black px-6 sm:px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 group"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              Upload Poster
            </button>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10 md:mt-12">
          <div className="glass-surface p-6 rounded-3xl border border-white/5 flex items-center gap-5">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <ImageIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                Posters In Library
              </p>
              <p className="text-2xl font-bold">{images.length}</p>
            </div>
          </div>
          <div className="glass-surface p-6 rounded-3xl border border-white/5 flex items-center gap-5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                activeImage
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "bg-white/5 text-white/30"
              }`}
            >
              {activeImage ? (
                <BadgeCheck className="w-6 h-6" />
              ) : (
                <EyeOff className="w-6 h-6" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">
                Showing On Site
              </p>
              <p className="text-2xl font-bold truncate">
                {activeImage ? activeImage.title || "Untitled poster" : "No image"}
              </p>
            </div>
          </div>
        </div>

        {/* A library with nothing live is a legitimate state, not a failure:
            the popup still runs, just without a poster. */}
        {!isRefreshing && !error && images.length > 0 && !activeImage && (
          <div className="mt-6 flex items-start gap-4 p-5 rounded-3xl bg-white/[0.03] border border-white/10">
            <EyeOff className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
            <p className="text-white/50 text-sm leading-relaxed">
              No poster is live right now, so the popup is running without an
              image. Pick one below and hit{" "}
              <span className="text-white font-semibold">Set as current</span> to
              put it back on the site.
            </p>
          </div>
        )}

        {/* Failures from activate / turn off / delete */}
        {actionError && (
          <div className="mt-6 flex items-start gap-4 p-5 rounded-3xl bg-red-500/10 border border-red-500/20">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm leading-relaxed">{actionError}</p>
          </div>
        )}
      </div>

      {/* Library */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="popLayout">
          {isRefreshing && images.length === 0 ? (
            <div className="py-32 flex flex-col items-center justify-center text-white/10 italic">
              <Loader2 className="w-12 h-12 animate-spin mb-4" />
              <p className="font-grotesk tracking-widest uppercase text-xs">
                Loading poster library...
              </p>
            </div>
          ) : error ? (
            <div className="py-20 md:py-24 glass-surface rounded-[2rem] md:rounded-[3rem] border border-red-500/10 flex flex-col items-center justify-center text-center px-6 md:px-10">
              <AlertCircle className="w-12 h-12 text-red-500/50 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 uppercase">
                Sync Interrupted
              </h3>
              <p className="text-white/40 text-sm max-w-xs mb-8">{error}</p>
              <button
                onClick={fetchData}
                className="px-8 py-3 bg-white/5 border border-white/10 rounded-full text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
              >
                Attempt Re-Sync
              </button>
            </div>
          ) : images.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-24 md:py-32 glass-surface rounded-[2rem] md:rounded-[3rem] border border-white/5 flex flex-col items-center justify-center text-center px-6"
            >
              <ImageIcon className="w-16 h-16 mb-4 text-white/10" />
              <p className="font-grotesk tracking-widest uppercase text-xs italic text-white/20 mb-8">
                No posters uploaded yet
              </p>
              <button
                onClick={handleOpenUpload}
                className="flex items-center gap-3 bg-white text-black px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-primary hover:text-white transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Upload the first one
              </button>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {images.map((image, idx) => (
                <PopupImageCard
                  key={image.id}
                  image={image}
                  index={idx}
                  pendingAction={pending?.id === image.id ? pending.action : null}
                  isBusy={pending !== null}
                  onActivate={handleActivate}
                  onDeactivate={handleDeactivate}
                  onEdit={handleOpenEdit}
                  onDelete={openDelete}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <PopupImageModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        editingImage={editingImage}
        file={file}
        setFile={setFile}
        formData={formData}
        setFormData={setFormData}
        formError={formError}
      />

      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title="Delete Poster"
        message={
          isDeletingLive
            ? `"${deleteTarget?.title || "This poster"}" is the image the popup is showing right now. Deleting it removes the file for good and leaves the popup with no image until you set another one.`
            : `"${deleteTarget?.title || "This poster"}" will be removed from the library and its file deleted for good. This cannot be undone.`
        }
        confirmText="Delete"
        isDestructive
        isLoading={pending?.action === "delete"}
      />
    </div>
  );
}
