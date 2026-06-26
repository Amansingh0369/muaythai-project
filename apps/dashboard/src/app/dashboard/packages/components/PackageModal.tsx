"use client";

import { motion, AnimatePresence } from "motion/react";
import {
  X, Loader2, MapPin, Calendar, DollarSign, Activity, Layers,
  Users, User, Plus, Trash2, AlertCircle,
} from "lucide-react";
import {
  Package, CreatePackageInput, PackageType, PackageKind, PackageFieldErrors,
} from "@/services/package.service";
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
  fieldErrors: PackageFieldErrors;
  formError: string | null;
}

const SECTION_FIELDS: { key: keyof CreatePackageInput; label: string; placeholder: string }[] = [
  { key: "ideal_for", label: "Ideal For", placeholder: "e.g. Fitness Enthusiasts" },
  { key: "training", label: "Training", placeholder: "e.g. 20+ Professional Training Sessions" },
  { key: "experience", label: "Experience", placeholder: "e.g. Bangkok Cultural Tour" },
  { key: "accommodation", label: "Accommodation", placeholder: "e.g. Premium 4-Star / 5-Star Hotels" },
  { key: "included", label: "Included", placeholder: "e.g. Professional Certification" },
];

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages || messages.length === 0) return null;
  return (
    <p className="text-[11px] text-red-400 flex items-center gap-1.5 ml-1">
      <AlertCircle className="w-3 h-3 shrink-0" /> {messages.join(", ")}
    </p>
  );
}

/** Repeatable text inputs for a string-array section. */
function StringListEditor({
  label,
  items,
  placeholder,
  onChange,
  error,
}: {
  label: string;
  items: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
  error?: string[];
}) {
  const update = (i: number, val: string) => {
    const next = [...items];
    next[i] = val;
    onChange(next);
  };
  const add = () => onChange([...items, ""]);
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between ml-1">
        <label className="text-[10px] text-white/40 font-black uppercase tracking-widest">{label}</label>
        <button
          type="button"
          onClick={add}
          className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary hover:text-orange-400 transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {items.length === 0 ? (
        <button
          type="button"
          onClick={add}
          className="w-full border border-dashed border-white/10 rounded-2xl p-3 text-white/30 text-xs hover:border-primary/40 hover:text-white/50 transition-all"
        >
          + Add a {label.toLowerCase()} item
        </button>
      ) : (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={placeholder}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                value={item}
                onChange={(e) => update(i, e.target.value)}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="w-10 h-10 shrink-0 rounded-xl border border-white/5 bg-white/5 flex items-center justify-center text-white/30 hover:text-red-400 hover:border-red-500/40 transition-all"
                title="Remove"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      <FieldError messages={error} />
    </div>
  );
}

export function PackageModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  editingPackage,
  formData,
  setFormData,
  locations,
  fieldErrors,
  formError,
}: PackageModalProps) {
  const setKind = (kind: PackageKind) => {
    // Switching to INDIVIDUAL can hold at most one location.
    let location_ids = formData.location_ids;
    if (kind === "INDIVIDUAL" && location_ids.length > 1) {
      location_ids = location_ids.slice(0, 1);
    }
    setFormData({ ...formData, kind, location_ids });
  };

  const toggleLocation = (id: number) => {
    const selected = formData.location_ids.includes(id);
    if (formData.kind === "INDIVIDUAL") {
      // Single-select behaviour.
      setFormData({ ...formData, location_ids: selected ? [] : [id] });
    } else {
      setFormData({
        ...formData,
        location_ids: selected
          ? formData.location_ids.filter((x) => x !== id)
          : [...formData.location_ids, id],
      });
    }
  };

  const locationHint =
    formData.kind === "INDIVIDUAL"
      ? "Select exactly 1 location"
      : "Select 2 or more locations";

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
            className="relative w-full max-w-2xl bg-black border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[min(92vh,900px)]"
          >
            <div className="p-10 overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-8">
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

              {/* Top-level error banner */}
              {formError && (
                <div className="mb-6 flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/30">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-300">{formError}</p>
                </div>
              )}

              <form onSubmit={onSubmit} className="space-y-6">
                {/* Kind selector */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Package Kind</label>
                  <div className="grid grid-cols-2 gap-3">
                    {([
                      { value: "INDIVIDUAL", label: "Individual", icon: User, hint: "Single location" },
                      { value: "GROUP", label: "Group", icon: Users, hint: "Multiple locations" },
                    ] as const).map(({ value, label, icon: Icon, hint }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setKind(value)}
                        className={`flex items-center gap-3 rounded-2xl border p-4 transition-all text-left ${
                          formData.kind === value
                            ? "bg-primary/10 border-primary/50 text-white"
                            : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                        }`}
                      >
                        <Icon className={`w-5 h-5 shrink-0 ${formData.kind === value ? "text-primary" : ""}`} />
                        <div>
                          <p className="text-sm font-bold uppercase tracking-wide">{label}</p>
                          <p className="text-[10px] uppercase tracking-widest opacity-60">{hint}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

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
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <FieldError messages={fieldErrors.name} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Layers className="w-3 h-3 text-primary" /> Package Type
                    </label>
                    <select
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all appearance-none"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value as PackageType })}
                    >
                      <option value="BEGINNER" className="bg-black text-white">BEGINNER</option>
                      <option value="INTERMEDIATE" className="bg-black text-white">INTERMEDIATE</option>
                      <option value="ADVANCED" className="bg-black text-white">ADVANCED</option>
                    </select>
                    <FieldError messages={fieldErrors.type} />
                  </div>
                </div>

                {/* Locations multi-select */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest flex items-center gap-2">
                      <MapPin className="w-3 h-3 text-primary" /> Training Centers
                    </label>
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                      {locationHint} · {formData.location_ids.length} selected
                    </span>
                  </div>
                  {locations.length === 0 ? (
                    <p className="text-xs text-white/30 border border-dashed border-white/10 rounded-2xl p-4">
                      No locations yet — create one under the Locations page first.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {locations.map((loc) => {
                        const selected = formData.location_ids.includes(loc.id);
                        return (
                          <button
                            key={loc.id}
                            type="button"
                            onClick={() => toggleLocation(loc.id)}
                            className={`px-4 py-2.5 rounded-2xl border text-sm transition-all ${
                              selected
                                ? "bg-primary/15 border-primary/50 text-white"
                                : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
                            }`}
                          >
                            {loc.name} <span className="opacity-50">({loc.city})</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <FieldError messages={fieldErrors.location_ids} />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1">Brief Description</label>
                  <textarea
                    required
                    placeholder="Describe the intensity and focus of this camp..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all h-24 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                  <FieldError messages={fieldErrors.description} />
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
                      placeholder="e.g. 349000"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    />
                    <FieldError messages={fieldErrors.price} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-primary" /> Duration (Days)
                    </label>
                    <input
                      required
                      type="number"
                      placeholder="e.g. 21"
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      value={formData.duration_days}
                      onChange={(e) => setFormData({ ...formData, duration_days: parseInt(e.target.value) || 0 })}
                    />
                    <FieldError messages={fieldErrors.duration_days} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                      <Activity className="w-3 h-3 text-primary" /> Status
                    </label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
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

                {/* Start Date */}
                <div className="space-y-2">
                  <label className="text-[10px] text-white/40 font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                    <Calendar className="w-3 h-3 text-primary" /> Start Date <span className="opacity-50">(optional)</span>
                  </label>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all [color-scheme:dark]"
                    value={formData.start_date ? formData.start_date.slice(0, 10) : ""}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                  <FieldError messages={fieldErrors.start_date} />
                </div>

                {/* Content sections */}
                <div className="pt-2 border-t border-white/5 space-y-6">
                  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest">
                    Content Sections <span className="opacity-60">— shown on the package detail page</span>
                  </p>
                  {SECTION_FIELDS.map(({ key, label, placeholder }) => (
                    <StringListEditor
                      key={key}
                      label={label}
                      placeholder={placeholder}
                      items={(formData[key] as string[]) ?? []}
                      onChange={(next) => setFormData({ ...formData, [key]: next })}
                      error={fieldErrors[key]}
                    />
                  ))}
                </div>

                <div className="pt-4">
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
