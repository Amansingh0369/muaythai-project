"use client";

import { motion } from "framer-motion";
import { Lock, ShieldAlert, User } from "lucide-react";
import type { FighterCard, FighterCardOptions } from "@/services/fighter-card.service";
import { labelOf, labelsOf, ordinalFraction } from "./fighter-card.helpers";

const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

/** Placeholder used everywhere a answer has not been given yet. */
const BLANK = "—";

function Stat({ label, value }: { label: string; value: string }) {
  const empty = !value;
  return (
    <div className="flex items-baseline justify-between gap-3 py-2 border-b border-white/[0.07] last:border-b-0">
      <span className="font-grotesk text-[10px] tracking-[0.28em] uppercase text-white/40 shrink-0">
        {label}
      </span>
      <span
        className={`font-grotesk text-[12px] text-right leading-tight ${
          empty ? "text-white/20" : "text-white font-medium"
        }`}
      >
        {empty ? BLANK : value}
      </span>
    </div>
  );
}

/**
 * Segmented meter. `fraction` is the answer's position within its own choice
 * list, and the real label always sits beside it — the bar shows where the
 * answer falls on the scale, it is never a score we invented.
 */
function Meter({ label, fraction, caption }: { label: string; fraction: number | null; caption: string }) {
  const segments = 10;
  const lit = fraction == null ? 0 : Math.max(1, Math.round(fraction * segments));
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-grotesk text-[10px] tracking-[0.28em] uppercase text-white/45">{label}</span>
        <span className={`font-grotesk text-[11px] ${caption ? "text-white/75" : "text-white/20"}`}>
          {caption || BLANK}
        </span>
      </div>
      <div className="flex gap-[3px]">
        {Array.from({ length: segments }).map((_, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{
              backgroundColor: i < lit ? "hsl(var(--primary))" : "rgba(255,255,255,0.09)",
              boxShadow: i < lit ? "0 0 8px -2px hsl(var(--primary))" : "0 0 0 rgba(0,0,0,0)",
            }}
            transition={{ duration: 0.35, delay: i * 0.015 }}
            className="h-2 flex-1"
          />
        ))}
      </div>
    </div>
  );
}

interface FighterCardPreviewProps {
  card: FighterCard;
  options: FighterCardOptions | null;
}

/**
 * The fighter card as it will be printed — re-renders on every keystroke and
 * chip toggle, so the fighter watches it fill in as they answer.
 */
export default function FighterCardPreview({ card, options }: FighterCardPreviewProps) {
  const level = labelOf(options, "training_duration", card.training_duration);
  const styles = labelsOf(options, "fighting_styles", card.fighting_styles).join(" / ");
  const weapons = labelsOf(options, "favourite_techniques", card.favourite_techniques).join(" / ");
  const mission = labelOf(options, "primary_focus", card.primary_focus);
  const goals = labelsOf(options, "goals", card.goals);
  const nationality = labelOf(options, "nationality", card.nationality);

  const cardNo = String(card.id ?? 0).padStart(3, "0");
  const campName = card.camp_detail?.name ?? "Camp not assigned";
  const campCity = card.camp_detail?.city ?? "Thailand";

  const hasInjury = ["YES_MINOR", "YES_MODERATE", "YES_SIGNIFICANT"].includes(card.injury_status);

  return (
    <div className="relative bg-[#0a0706] border border-white/12 overflow-hidden shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)]">
      {/* Ember wash + grain, borrowed from the burn sections */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-900/25 via-transparent to-red-950/30 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: NOISE_URL, backgroundSize: "128px 128px" }}
      />

      <div className="relative flex">
        {/* ── Spine ── */}
        <div className="w-[52px] sm:w-[64px] shrink-0 bg-gradient-to-b from-red-700 via-red-800 to-[#2c0404] flex flex-col items-center py-5 gap-4">
          <span
            className="font-barlow font-black italic text-[11px] sm:text-[13px] tracking-[0.2em] text-white uppercase leading-none"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
          >
            This Is Muay Thai
          </span>
          <span className="w-6 h-px bg-white/30" />
          <div className="text-center">
            <p className="font-grotesk text-[9px] tracking-[0.25em] uppercase text-white/60">Card</p>
            <p className="font-barlow font-black italic text-xl text-white leading-none">{cardNo}</p>
          </div>
          <span className="w-6 h-px bg-white/30" />
          <p
            className="font-grotesk text-[9px] tracking-[0.3em] uppercase text-white/55 leading-none"
            style={{ writingMode: "vertical-rl" }}
          >
            {campCity}
          </p>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 min-w-0 p-5 sm:p-6">
          {/* Masthead */}
          <p className="font-grotesk text-[10px] tracking-[0.45em] uppercase text-primary mb-1">
            Fighter Card
          </p>
          <h3 className="font-barlow font-black italic text-4xl sm:text-5xl text-white uppercase leading-[0.82] tracking-tight">
            Fighter
          </h3>
          <p className="font-barlow font-black italic text-2xl sm:text-3xl text-primary leading-none mt-0.5">
            {cardNo}
          </p>

          {/* Photo slot — no image field exists on the card yet. */}
          <div className="mt-4 relative aspect-[4/3] border border-dashed border-white/15 bg-gradient-to-b from-white/[0.04] to-transparent flex flex-col items-center justify-center gap-2">
            <User className="w-9 h-9 text-white/12" />
            <p className="font-grotesk text-[10px] tracking-[0.3em] uppercase text-white/25">
              Fighter Photo
            </p>
            <p className="font-grotesk text-[10px] text-white/15">Coming soon</p>
          </div>

          {/* Identity */}
          <div className="mt-5 space-y-0.5">
            <p className="font-grotesk text-[10px] tracking-[0.3em] uppercase text-white/40">Name</p>
            <p
              className={`font-barlow font-black italic text-xl sm:text-2xl uppercase leading-tight truncate ${
                card.user_full_name ? "text-white" : "text-white/20"
              }`}
            >
              {card.user_full_name || "Unnamed Fighter"}
            </p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-4">
            <Stat label="Nationality" value={nationality} />
            <Stat label="City" value={card.city} />
          </div>

          {/* Level / Style / Weapon */}
          <div className="mt-5 border border-white/12 bg-black/40 divide-y divide-white/[0.07]">
            {[
              { label: "Fighter Level", value: level },
              { label: "Style", value: styles },
              { label: "Favourite Weapon", value: weapons },
            ].map((row) => (
              <div key={row.label} className="px-3.5 py-2.5">
                <p className="font-grotesk text-[9px] tracking-[0.3em] uppercase text-white/40 mb-0.5">
                  {row.label}
                </p>
                <p
                  className={`font-barlow font-black italic text-sm uppercase leading-tight ${
                    row.value ? "text-primary" : "text-white/20"
                  }`}
                >
                  {row.value || BLANK}
                </p>
              </div>
            ))}
          </div>

          {/* Mission */}
          <div className="mt-3 border border-primary/25 bg-gradient-to-r from-primary/12 to-transparent px-3.5 py-3">
            <p className="font-grotesk text-[9px] tracking-[0.3em] uppercase text-primary/80 mb-1">
              Camp Objective
            </p>
            <p
              className={`font-barlow font-black italic text-base uppercase leading-tight ${
                mission ? "text-white" : "text-white/20"
              }`}
            >
              {mission || BLANK}
            </p>
            {card.primary_focus_notes && (
              <p className="font-grotesk text-[11px] text-white/55 mt-1.5 leading-snug">
                {card.primary_focus_notes}
              </p>
            )}
          </div>

          {/* Goals */}
          <div className="mt-5">
            <p className="font-grotesk text-[10px] tracking-[0.3em] uppercase text-primary mb-2">
              Goals (Top 3)
            </p>
            <div className="flex flex-col gap-1.5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 shrink-0 flex items-center justify-center font-barlow font-black text-[10px] ${
                      goals[i] ? "bg-primary text-black" : "bg-white/[0.06] text-white/25"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`font-grotesk text-[12px] truncate ${
                      goals[i] ? "text-white" : "text-white/20"
                    }`}
                  >
                    {goals[i] || BLANK}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Training background */}
          <div className="mt-5">
            <p className="font-grotesk text-[10px] tracking-[0.3em] uppercase text-primary mb-1.5">
              Training Background
            </p>
            <Stat label="Frequency" value={labelOf(options, "training_frequency", card.training_frequency)} />
            <Stat
              label="Trained in Thailand"
              value={
                card.trained_in_thailand == null
                  ? ""
                  : card.trained_in_thailand
                    ? labelOf(options, "thailand_trips", card.thailand_trips) || "Yes"
                    : "No"
              }
            />
            <Stat
              label="Competition"
              value={labelOf(options, "competition_experience", card.competition_experience)}
            />
            <Stat label="Sparring" value={labelOf(options, "sparring_experience", card.sparring_experience)} />
            <Stat
              label="Other Sports"
              value={labelsOf(options, "other_combat_sports", card.other_combat_sports).join(", ")}
            />
          </div>

          {/* Attributes */}
          <div className="mt-5 flex flex-col gap-3">
            <p className="font-grotesk text-[10px] tracking-[0.3em] uppercase text-primary">Attributes</p>
            <Meter
              label="Fitness"
              fraction={card.overall_fitness == null ? null : card.overall_fitness / 10}
              caption={card.overall_fitness == null ? "" : `${card.overall_fitness}/10`}
            />
            <Meter
              label="Cardio"
              fraction={ordinalFraction(options, "cardio_level", card.cardio_level)}
              caption={labelOf(options, "cardio_level", card.cardio_level)}
            />
            <Meter
              label="5 Rounds"
              fraction={ordinalFraction(options, "five_round_capability", card.five_round_capability)}
              caption={labelOf(options, "five_round_capability", card.five_round_capability)}
            />
            <Meter
              label="Intensity"
              fraction={card.coach_intensity == null ? null : card.coach_intensity / 10}
              caption={card.coach_intensity == null ? "" : `${card.coach_intensity}/10`}
            />
          </div>

          {/* Private strip — the fighter's own copy, flagged so they know who reads it */}
          <div className="mt-5 border border-amber-500/25 bg-amber-500/[0.06] px-3.5 py-3">
            <p className="flex items-center gap-1.5 font-grotesk text-[9px] tracking-[0.3em] uppercase text-amber-300/90 mb-2">
              <Lock size={10} /> Trainer Only
            </p>
            <div className="flex flex-wrap gap-1.5">
              <span
                className={`inline-flex items-center gap-1 font-grotesk text-[11px] px-2 py-1 border ${
                  hasInjury
                    ? "border-red-400/40 bg-red-500/15 text-red-200"
                    : "border-white/12 bg-white/[0.04] text-white/45"
                }`}
              >
                {hasInjury && <ShieldAlert size={10} />}
                {labelOf(options, "injury_status", card.injury_status) || "Injuries not answered"}
              </span>
              {card.train_around_limitations && (
                <span className="font-grotesk text-[11px] px-2 py-1 border border-amber-400/30 bg-amber-500/10 text-amber-200">
                  Train around limitations
                </span>
              )}
            </div>
            {card.message_to_kru && (
              <p className="font-grotesk text-[11px] text-white/60 mt-2 leading-snug italic">
                “{card.message_to_kru}”
              </p>
            )}
          </div>

          {/* Footer */}
          <p className="mt-5 pt-3 border-t border-white/[0.07] font-grotesk text-[9px] tracking-[0.3em] uppercase text-white/30 text-center">
            {campName} · {campCity}
          </p>
        </div>
      </div>
    </div>
  );
}
