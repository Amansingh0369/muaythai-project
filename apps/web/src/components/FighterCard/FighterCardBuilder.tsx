"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Check,
  Loader2,
  Lock,
} from "lucide-react";
import {
  FighterCardApiError,
  fighterCardService,
  type FighterCard,
  type FighterCardOptions,
  type FighterCardPatch,
} from "@/services/fighter-card.service";
import { locationService, type Location } from "@/services/location.service";
import FighterCardPreview from "./FighterCardPreview";
import SectionFields from "./SectionFields";
import {
  SECTIONS,
  applyAnswer,
  completionPercent,
  dependentsOf,
  isFieldOpen,
  sectionGaps,
} from "./fighter-card.helpers";

interface FighterCardBuilderProps {
  /** Lets the page above mirror card state — the avatar uses the photo. */
  onCardChange?: (card: FighterCard) => void;
}

export default function FighterCardBuilder({ onCardChange }: FighterCardBuilderProps) {
  const [options, setOptions] = useState<FighterCardOptions | null>(null);
  const [card, setCard] = useState<FighterCard | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [activeStep, setActiveStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  /** Fields edited since the last successful save of their section. */
  const dirtyRef = useRef<Set<string>>(new Set());
  const [dirtyCount, setDirtyCount] = useState(0);

  const section = SECTIONS[activeStep];

  // ── Load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        // GET /me/ creates the card on first read, so this is safe on page load.
        const [opts, myCard] = await Promise.all([
          fighterCardService.getOptions(),
          fighterCardService.getMyCard(),
        ]);
        if (cancelled) return;
        setOptions(opts);
        setCard(myCard);
        onCardChange?.(myCard);

        // The camp picker is only offered when the booking did not set one.
        if (myCard.camp == null) {
          locationService
            .getLocations()
            .then((locs) => !cancelled && setLocations(locs))
            .catch(() => {
              /* the picker just stays empty — the rest of the card still works */
            });
        }
      } catch (e) {
        if (!cancelled) {
          setLoadError(
            e instanceof FighterCardApiError
              ? e.message
              : "Could not load your fighter card. Please try again."
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once on mount
  }, []);

  /**
   * Re-reads the card. Used after a photo upload or delete: `photo` is a
   * required field, so both change `is_complete` and `missing_fields`.
   */
  const refreshCard = useCallback(async () => {
    try {
      const fresh = await fighterCardService.getMyCard();
      setCard(fresh);
      setDirtyCount((n) => n + 1);
      onCardChange?.(fresh);
    } catch {
      toast.error("Saved, but could not refresh the card. Reload to see the latest.");
    }
  }, [onCardChange]);

  const setPhotoError = useCallback((message: string | null) => {
    setFieldErrors((errs) => {
      const { photo: _dropped, ...rest } = errs;
      return message ? { ...rest, photo: [message] } : rest;
    });
  }, []);

  // ── Edit ───────────────────────────────────────────────────────────────
  // Local state updates immediately so the card preview tracks every keystroke;
  // the server is only told when the section is saved.
  const handleChange = useCallback((field: string, value: unknown) => {
    setCard((current) => {
      if (!current) return current;
      const next = applyAnswer(current, field, value);
      dirtyRef.current.add(field);
      // A closed follow-up is cleared by the server, so stop tracking it.
      dependentsOf(field).forEach((dep) => {
        if (!isFieldOpen(next, dep)) dirtyRef.current.delete(dep);
      });
      return next;
    });
    setDirtyCount((n) => n + 1);
    setFieldErrors((errs) => {
      if (!errs[field]) return errs;
      const { [field]: _removed, ...rest } = errs;
      return rest;
    });
  }, []);

  /** Only this section's edited, currently-open fields go up. */
  const buildPatch = useCallback((current: FighterCard, fields: string[]): FighterCardPatch => {
    const patch: Record<string, unknown> = {};
    fields.forEach((field) => {
      // The photo has its own sub-resource; this endpoint is JSON only.
      if (field === "photo") return;
      if (!dirtyRef.current.has(field)) return;
      // Sending a closed follow-up's value is a 400 — the server clears it for us.
      if (!isFieldOpen(current, field)) return;
      patch[field] = (current as any)[field];
    });
    return patch as FighterCardPatch;
  }, []);

  const saveSection = useCallback(
    async (fields: string[]): Promise<boolean> => {
      if (!card) return false;
      const patch = buildPatch(card, fields);
      if (Object.keys(patch).length === 0) return true;

      setIsSaving(true);
      setFieldErrors({});
      try {
        const updated = await fighterCardService.updateMyCard(patch);
        setCard(updated);
        onCardChange?.(updated);
        fields.forEach((f) => dirtyRef.current.delete(f));
        setDirtyCount((n) => n + 1);
        return true;
      } catch (e) {
        if (e instanceof FighterCardApiError) {
          setFieldErrors(e.fieldErrors);
          const flagged = Object.keys(e.fieldErrors);
          // A 400 must land on the control that caused it, not just in a toast.
          toast.error(
            flagged.length > 0
              ? `Check ${flagged.length} answer${flagged.length > 1 ? "s" : ""} below.`
              : e.message
          );
        } else {
          toast.error("Could not save. Please try again.");
        }
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [card, buildPatch, onCardChange]
  );

  const goToStep = useCallback(
    async (index: number) => {
      const saved = await saveSection(section.fields as string[]);
      if (!saved) return;
      setActiveStep(index);
      setFieldErrors({});
    },
    [saveSection, section]
  );

  // ── Derived ────────────────────────────────────────────────────────────
  const gaps = useMemo(() => sectionGaps(card), [card, dirtyCount]);
  const percent = useMemo(() => completionPercent(card, options), [card, options, dirtyCount]);
  const hasUnsaved = section.fields.some((f) => dirtyRef.current.has(f as string));

  // ── States ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-5">
        <Loader2 className="animate-spin text-primary w-9 h-9" />
        <p className="font-grotesk text-[13px] tracking-[0.4em] uppercase text-white/50 animate-pulse">
          Loading Your Fighter Card…
        </p>
      </div>
    );
  }

  if (loadError || !card || !options) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
        <AlertCircle className="w-9 h-9 text-red-400/60" />
        <p className="font-grotesk text-sm text-white/60 max-w-sm">
          {loadError ?? "Could not load your fighter card."}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-1 px-7 py-2.5 border border-white/15 text-white font-barlow font-bold text-[13px] tracking-[0.2em] uppercase hover:bg-white/5 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const isLast = activeStep === SECTIONS.length - 1;

  return (
    <div className="flex flex-col gap-8">
      {/* ── Progress ── */}
      <div className="border border-white/[0.08] bg-white/[0.02] p-5 md:p-6">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="font-grotesk text-[12px] tracking-[0.35em] uppercase text-primary mb-1">
              Card Completion
            </p>
            <p className="font-grotesk text-[13px] text-white/50">
              {card.is_complete ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400">
                  <BadgeCheck size={14} /> Your card is complete.
                </span>
              ) : (
                `${card.missing_fields.length} answer${card.missing_fields.length === 1 ? "" : "s"} still needed`
              )}
            </p>
          </div>
          <span className="font-barlow font-black italic text-4xl text-white tabular-nums leading-none">
            {percent}
            <span className="text-primary text-2xl">%</span>
          </span>
        </div>
        <div className="h-1.5 bg-white/[0.07] overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-orange-deep"
            initial={false}
            animate={{ width: `${percent}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>

      {/* ── Step rail ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {SECTIONS.map((s, i) => {
          const active = i === activeStep;
          const gapCount = gaps[s.id] ?? 0;
          return (
            <button
              key={s.id}
              type="button"
              disabled={isSaving}
              onClick={() => goToStep(i)}
              className={`group relative text-left px-3.5 py-3 border transition-all duration-300 disabled:opacity-60 ${
                active
                  ? "border-primary bg-primary/10"
                  : "border-white/[0.09] bg-white/[0.02] hover:border-white/25"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`font-barlow font-black text-[11px] ${active ? "text-primary" : "text-white/35"}`}
                >
                  {s.step}
                </span>
                {s.isPrivate && <Lock size={10} className="text-amber-300/80" />}
                {gapCount === 0 ? (
                  <Check size={11} className="text-emerald-400 ml-auto" />
                ) : (
                  <span className="ml-auto font-grotesk text-[10px] text-white/30 tabular-nums">
                    {gapCount}
                  </span>
                )}
              </div>
              <p
                className={`font-barlow font-black italic text-[13px] uppercase leading-tight ${
                  active ? "text-white" : "text-white/55 group-hover:text-white/80"
                }`}
              >
                {s.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* ── Form + live card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 xl:gap-12 items-start">
        {/* Form */}
        <div>
          <div
            className={`border p-6 md:p-8 ${
              section.isPrivate
                ? "border-amber-500/25 bg-gradient-to-b from-amber-500/[0.05] to-transparent"
                : "border-white/[0.08] bg-white/[0.02]"
            }`}
          >
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-barlow font-black italic text-3xl text-primary leading-none">
                  {section.step}
                </span>
                <span className="w-6 h-[2px] bg-primary/40" />
                <h3 className="font-barlow font-black italic text-xl md:text-2xl text-white uppercase leading-none">
                  {section.title}
                </h3>
              </div>
              <p className="font-grotesk text-[13px] text-white/60">{section.blurb}</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <SectionFields
                  sectionId={section.id}
                  card={card}
                  options={options}
                  errors={fieldErrors}
                  onChange={handleChange}
                  locations={locations}
                  onCardRefresh={refreshCard}
                  onPhotoError={setPhotoError}
                />
              </motion.div>
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-9 pt-6 border-t border-white/[0.07]">
              {activeStep > 0 && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => goToStep(activeStep - 1)}
                  className="inline-flex items-center gap-2 px-5 py-3 font-barlow font-bold text-[13px] tracking-[0.2em] uppercase border border-white/15 text-white/70 hover:text-white hover:border-white/30 transition-colors disabled:opacity-50"
                >
                  <ArrowLeft size={13} /> Back
                </button>
              )}

              <button
                type="button"
                disabled={isSaving}
                onClick={() => goToStep(isLast ? activeStep : activeStep + 1)}
                className="group inline-flex items-center gap-2 px-8 py-3 font-barlow font-black text-[13px] tracking-[0.25em] uppercase bg-primary text-black hover:shadow-[0_0_28px_-6px_hsl(var(--primary)/0.8)] transition-all duration-300 disabled:opacity-60"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Saving…
                  </>
                ) : isLast ? (
                  <>
                    <Check size={13} /> Save Card
                  </>
                ) : (
                  <>
                    Save &amp; Continue
                    <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>

              {hasUnsaved && !isSaving && (
                <span className="font-grotesk text-[12px] text-white/35">Unsaved changes</span>
              )}
            </div>
          </div>
        </div>

        {/* Live card */}
        <div className="lg:sticky lg:top-24">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-1.5 h-1.5 bg-primary animate-pulse" />
            <p className="font-grotesk text-[11px] tracking-[0.35em] uppercase text-white/45">
              Live preview
            </p>
          </div>
          <FighterCardPreview card={card} options={options} />
          <p className="font-grotesk text-[11px] text-white/30 mt-3 leading-relaxed">
            Your card updates as you answer. Each step is saved to your account when you continue,
            so you can leave and come back any time.
          </p>
        </div>
      </div>
    </div>
  );
}
