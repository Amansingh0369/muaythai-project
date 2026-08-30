"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Lock } from "lucide-react";
import type { FighterCard, FighterCardOptions } from "@/services/fighter-card.service";
import type { Location } from "@/services/location.service";
import {
  ChoiceChips,
  FieldShell,
  MultiChips,
  ScaleSlider,
  SearchSelect,
  SwitchField,
  TextAreaField,
  TextField,
  YesNo,
} from "./fields";
import { capReason, isFieldOpen, toggleMultiValue } from "./fighter-card.helpers";

interface SectionFieldsProps {
  sectionId: string;
  card: FighterCard;
  options: FighterCardOptions;
  /** Server-side field errors from the last failed save. */
  errors: Record<string, string[]>;
  onChange: (field: string, value: unknown) => void;
  /** Only needed when the card has no camp assigned yet. */
  locations: Location[];
}

/** Follow-ups slide in and out rather than appearing abruptly. */
function Conditional({ open, children }: { open: boolean; children: React.ReactNode }) {
  return (
    <AnimatePresence initial={false}>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="overflow-hidden"
        >
          <div className="pt-5 pl-4 border-l-2 border-primary/30">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function SectionFields({
  sectionId,
  card,
  options,
  errors,
  onChange,
  locations,
}: SectionFieldsProps) {
  const err = (field: string) => errors[field]?.[0];

  /** Wires a multi-select to the server's cap and exclusive-choice rules. */
  const multi = (field: keyof FighterCardOptions & string) => {
    const rules = {
      limit: options.limits[field],
      exclusive: options.exclusive_choices[field],
    };
    const value = (card[field as keyof FighterCard] as string[]) ?? [];
    return {
      options: options[field] as { value: string; label: string }[],
      value,
      limit: rules.limit,
      onToggle: (v: string) => onChange(field, toggleMultiValue(value, v, rules)),
      disabledReason: (v: string) => capReason(value, v, rules),
    };
  };

  switch (sectionId) {
    // ── 01 ────────────────────────────────────────────────────────────────
    case "identity":
      return (
        <div className="flex flex-col gap-7">
          <FieldShell label="Your Camp" hint="from your booking">
            {card.camp_detail ? (
              <div className="flex items-center gap-3 border border-primary/25 bg-primary/[0.07] px-4 py-3">
                <span className="w-1.5 h-8 bg-primary shrink-0" />
                <div>
                  <p className="font-barlow font-black italic text-lg text-white uppercase leading-none">
                    {card.camp_detail.name}
                  </p>
                  <p className="font-grotesk text-[12px] text-white/50 mt-1">{card.camp_detail.city}</p>
                </div>
              </div>
            ) : (
              <SearchSelect
                options={locations.map((l) => ({ value: String(l.id), label: `${l.name} — ${l.city}` }))}
                value={card.camp == null ? "" : String(card.camp)}
                onChange={(v) => onChange("camp", v === "" ? null : Number(v))}
                placeholder="Choose the camp you are joining…"
              />
            )}
          </FieldShell>

          <FieldShell label="Nationality" required error={err("nationality")}>
            <SearchSelect
              options={options.nationality}
              value={card.nationality}
              onChange={(v) => onChange("nationality", v)}
              placeholder="Select your nationality…"
            />
          </FieldShell>

          <FieldShell label="City" required error={err("city")}>
            <TextField
              value={card.city}
              onChange={(v) => onChange("city", v)}
              placeholder="e.g. Delhi, India"
            />
          </FieldShell>
        </div>
      );

    // ── 02 ────────────────────────────────────────────────────────────────
    case "background":
      return (
        <div className="flex flex-col gap-7">
          <FieldShell label="Training Experience" required error={err("training_duration")}>
            <ChoiceChips
              options={options.training_duration}
              value={card.training_duration}
              onChange={(v) => onChange("training_duration", v)}
            />
          </FieldShell>

          <FieldShell label="Training Frequency" hint="sessions per week" required error={err("training_frequency")}>
            <ChoiceChips
              options={options.training_frequency}
              value={card.training_frequency}
              onChange={(v) => onChange("training_frequency", v)}
            />
          </FieldShell>

          <div>
            <FieldShell label="Trained in Thailand before?" required error={err("trained_in_thailand")}>
              <YesNo value={card.trained_in_thailand} onChange={(v) => onChange("trained_in_thailand", v)} />
            </FieldShell>
            <Conditional open={isFieldOpen(card, "thailand_trips")}>
              <FieldShell label="How many trips?" required error={err("thailand_trips")}>
                <ChoiceChips
                  options={options.thailand_trips}
                  value={card.thailand_trips}
                  onChange={(v) => onChange("thailand_trips", v)}
                />
              </FieldShell>
            </Conditional>
          </div>

          <FieldShell
            label="Other Combat Sports"
            hint="select any that apply"
            required
            error={err("other_combat_sports")}
          >
            <MultiChips {...multi("other_combat_sports")} />
          </FieldShell>

          <div>
            <FieldShell label="Competition Experience" required error={err("competition_experience")}>
              <ChoiceChips
                options={options.competition_experience}
                value={card.competition_experience}
                onChange={(v) => onChange("competition_experience", v)}
              />
            </FieldShell>
            <Conditional open={isFieldOpen(card, "fight_count")}>
              <FieldShell label="How many fights?" hint="optional" error={err("fight_count")}>
                <ChoiceChips
                  options={options.fight_count}
                  value={card.fight_count}
                  onChange={(v) => onChange("fight_count", v)}
                />
              </FieldShell>
            </Conditional>
          </div>

          <FieldShell label="Sparring Experience" required error={err("sparring_experience")}>
            <ChoiceChips
              options={options.sparring_experience}
              value={card.sparring_experience}
              onChange={(v) => onChange("sparring_experience", v)}
            />
          </FieldShell>
        </div>
      );

    // ── 03 ────────────────────────────────────────────────────────────────
    case "fitness":
      return (
        <div className="flex flex-col gap-7">
          <FieldShell label="Exercise Frequency" required error={err("exercise_frequency")}>
            <ChoiceChips
              options={options.exercise_frequency}
              value={card.exercise_frequency}
              onChange={(v) => onChange("exercise_frequency", v)}
            />
          </FieldShell>

          <FieldShell label="Cardio Level" required error={err("cardio_level")}>
            <ChoiceChips
              options={options.cardio_level}
              value={card.cardio_level}
              onChange={(v) => onChange("cardio_level", v)}
            />
          </FieldShell>

          <FieldShell
            label="Could you train 5 rounds today?"
            required
            error={err("five_round_capability")}
          >
            <ChoiceChips
              options={options.five_round_capability}
              value={card.five_round_capability}
              onChange={(v) => onChange("five_round_capability", v)}
            />
          </FieldShell>

          <FieldShell label="Overall Fitness" hint="rate yourself" required error={err("overall_fitness")}>
            <ScaleSlider
              scale={options.scales.overall_fitness}
              value={card.overall_fitness}
              onChange={(v) => onChange("overall_fitness", v)}
            />
          </FieldShell>
        </div>
      );

    // ── 04 ────────────────────────────────────────────────────────────────
    case "mission":
      return (
        <div className="flex flex-col gap-7">
          <FieldShell
            label="Your Goals"
            hint={`pick up to ${options.limits.goals}`}
            required
            error={err("goals")}
          >
            <MultiChips {...multi("goals")} />
          </FieldShell>

          <div>
            <FieldShell label="Primary Focus" required error={err("primary_focus")}>
              <ChoiceChips
                options={options.primary_focus}
                value={card.primary_focus}
                onChange={(v) => onChange("primary_focus", v)}
              />
            </FieldShell>
            <div className="pt-5">
              <FieldShell label="Anything to add?" hint="optional" error={err("primary_focus_notes")}>
                <TextAreaField
                  value={card.primary_focus_notes}
                  onChange={(v) => onChange("primary_focus_notes", v)}
                  placeholder="Tell your kru what you mean by that…"
                />
              </FieldShell>
            </div>
          </div>

          <FieldShell
            label="Fighting Style"
            hint={`pick up to ${options.limits.fighting_styles}`}
            required
            error={err("fighting_styles")}
          >
            <MultiChips {...multi("fighting_styles")} />
          </FieldShell>

          <FieldShell
            label="Favourite Techniques"
            hint={`pick up to ${options.limits.favourite_techniques}`}
            required
            error={err("favourite_techniques")}
          >
            <MultiChips {...multi("favourite_techniques")} />
          </FieldShell>
        </div>
      );

    // ── 05 — private ──────────────────────────────────────────────────────
    case "kru":
      return (
        <div className="flex flex-col gap-7">
          <div className="flex items-start gap-3 border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3.5">
            <Lock size={15} className="text-amber-300 shrink-0 mt-0.5" />
            <div>
              <p className="font-barlow font-bold text-[13px] tracking-[0.2em] uppercase text-amber-200">
                Private — trainer only
              </p>
              <p className="font-grotesk text-[12px] text-white/60 mt-1 leading-relaxed">
                Only you and the trainers at your camp ever see this section. It is used to plan
                your sessions safely — nothing here appears on your public profile.
              </p>
            </div>
          </div>

          <div>
            <FieldShell label="Any current injuries?" required error={err("injury_status")}>
              <ChoiceChips
                options={options.injury_status}
                value={card.injury_status}
                onChange={(v) => onChange("injury_status", v)}
              />
            </FieldShell>
            <Conditional open={isFieldOpen(card, "injury_areas")}>
              <div className="flex flex-col gap-5">
                <FieldShell label="Which areas?" required error={err("injury_areas")}>
                  <MultiChips {...multi("injury_areas")} />
                </FieldShell>
                <FieldShell label="Injury notes" hint="optional" error={err("injury_notes")}>
                  <TextAreaField
                    value={card.injury_notes}
                    onChange={(v) => onChange("injury_notes", v)}
                    placeholder="What happened, and how it affects your training…"
                  />
                </FieldShell>
              </div>
            </Conditional>
          </div>

          <div>
            <FieldShell label="Any past major injuries?" required error={err("has_past_major_injury")}>
              <YesNo
                value={card.has_past_major_injury}
                onChange={(v) => onChange("has_past_major_injury", v)}
              />
            </FieldShell>
            <Conditional open={isFieldOpen(card, "past_injury_types")}>
              <FieldShell label="What kind?" required error={err("past_injury_types")}>
                <MultiChips {...multi("past_injury_types")} />
              </FieldShell>
            </Conditional>
          </div>

          <FieldShell
            label="Training Restrictions"
            hint="anything you must avoid"
            required
            error={err("training_restrictions")}
          >
            <MultiChips {...multi("training_restrictions")} />
          </FieldShell>

          <FieldShell label="Restriction notes" hint="optional" error={err("training_restrictions_notes")}>
            <TextAreaField
              value={card.training_restrictions_notes}
              onChange={(v) => onChange("training_restrictions_notes", v)}
              placeholder="e.g. no heavy sparring on the injured rib"
            />
          </FieldShell>

          <div>
            <FieldShell label="Any medical conditions?" required error={err("has_medical_condition")}>
              <YesNo
                value={card.has_medical_condition}
                onChange={(v) => onChange("has_medical_condition", v)}
              />
            </FieldShell>
            <Conditional open={isFieldOpen(card, "medical_details")}>
              <FieldShell label="Medical details" required error={err("medical_details")}>
                <TextAreaField
                  value={card.medical_details}
                  onChange={(v) => onChange("medical_details", v)}
                  placeholder="Conditions, medication, anything the trainers should know…"
                />
              </FieldShell>
            </Conditional>
          </div>

          <FieldShell label="How hard should we push you?" required error={err("coach_intensity")}>
            <ScaleSlider
              scale={options.scales.coach_intensity}
              value={card.coach_intensity}
              onChange={(v) => onChange("coach_intensity", v)}
            />
          </FieldShell>

          <FieldShell label="Limitations" error={err("train_around_limitations")}>
            <SwitchField
              checked={card.train_around_limitations}
              onChange={(v) => onChange("train_around_limitations", v)}
              label="Train around my limitations rather than skipping sessions"
            />
          </FieldShell>

          <FieldShell label="Message to your Kru" hint="optional" error={err("message_to_kru")}>
            <TextAreaField
              rows={4}
              value={card.message_to_kru}
              onChange={(v) => onChange("message_to_kru", v)}
              placeholder="Anything else you want the trainers to know before you arrive…"
            />
          </FieldShell>
        </div>
      );

    default:
      return null;
  }
}
