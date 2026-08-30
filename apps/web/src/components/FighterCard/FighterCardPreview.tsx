"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Flame, Lock, ShieldAlert, User } from "lucide-react";
import type { FighterCard, FighterCardOptions } from "@/services/fighter-card.service";
import CardBurn from "./CardBurn";
import EmberField from "./EmberField";
import { labelOf, labelsOf, ordinalFraction } from "./fighter-card.helpers";

const NOISE_URL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")";

const BLANK = "—";
const OPEN_INJURIES = ["YES_MINOR", "YES_MODERATE", "YES_SIGNIFICANT"];

/* ─────────────────────────────────────────────────────────────────────────────
   Palette. Warm cream and aged gold rather than pure white on black — printed
   cards are inked on stock, and #fff on #000 reads as a screen, not an object.
     cream   #EDE2D2  body copy and answers
     gold    #D9B45B  the card's own furniture: rules, frame, masthead
     primary          the site orange, kept for the values that matter
───────────────────────────────────────────────────────────────────────────── */
const CREAM = "#EDE2D2";
const GOLD = "#D9B45B";

/* Type scale — nothing goes below 12px. Colours are spelled out rather than
   interpolated: Tailwind only emits classes it can see literally in the source,
   so `text-[${CREAM}]` would yield a class name with no rule behind it. */
const LABEL = "font-grotesk text-[12px] tracking-[0.18em] uppercase text-[#EDE2D2]/50";
const VALUE = "font-grotesk text-[15px] font-semibold text-[#EDE2D2] leading-snug";
const EMPTY = "font-grotesk text-[15px] text-[#EDE2D2]/25 leading-snug";
/** Ink pressed into stock, rather than glowing off it. */
const LETTERPRESS = "[text-shadow:0_2px_0_rgba(0,0,0,0.55),0_0_28px_rgba(0,0,0,0.5)]";

// ── Surface treatments ───────────────────────────────────────────────────────

function CardTexture() {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-b from-orange-900/20 via-transparent to-red-950/40 pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.07] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: NOISE_URL, backgroundSize: "128px 128px" }}
      />
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_150px_rgba(0,0,0,0.85)]" />
    </>
  );
}

/**
 * Surface sheen. No rainbow — the card is inked in cream and gold, and an
 * iridescent foil fought it. This is a single warm highlight plus a white
 * glare, both tracking the pointer through inherited CSS custom properties.
 */
function CardSheen() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none mix-blend-soft-light transition-opacity duration-300"
        style={{
          opacity: "var(--fc-holo, 0)",
          background:
            "linear-gradient(105deg, transparent 30%, rgba(217,180,91,0.55) 46%, rgba(255,236,196,0.75) 50%, rgba(217,180,91,0.55) 54%, transparent 70%)",
          backgroundSize: "260% 100%",
          backgroundPosition: "calc(var(--fc-mx, 50) * 1%) center",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-300"
        style={{
          opacity: "var(--fc-glare, 0)",
          background:
            "radial-gradient(circle at calc(var(--fc-mx, 50) * 1%) calc(var(--fc-my, 50) * 1%), rgba(255,245,225,0.4), rgba(255,245,225,0.05) 30%, transparent 58%)",
        }}
      />
    </>
  );
}

/** Gold corner brackets and a double rule, the way a printed card is framed. */
function CardFrame() {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <div className="absolute inset-[7px] border" style={{ borderColor: `${GOLD}33` }} />
      {[
        "top-2 left-2 border-t-2 border-l-2",
        "top-2 right-2 border-t-2 border-r-2",
        "bottom-2 left-2 border-b-2 border-l-2",
        "bottom-2 right-2 border-b-2 border-r-2",
      ].map((pos) => (
        <span key={pos} className={`absolute w-5 h-5 ${pos}`} style={{ borderColor: GOLD, opacity: 0.7 }} />
      ))}
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <p className="font-barlow font-black text-[13px] tracking-[0.2em] uppercase text-primary">
        {children}
      </p>
      <span className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${GOLD}55, transparent)` }} />
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className={`${LABEL} mb-1`}>{label}</p>
      <p className={value ? VALUE : EMPTY}>{value || BLANK}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-baseline justify-between gap-4 py-2.5 border-b last:border-b-0"
      style={{ borderColor: `${CREAM}14` }}
    >
      <span className={`${LABEL} shrink-0`}>{label}</span>
      <span className={`text-right ${value ? VALUE : EMPTY}`}>{value || BLANK}</span>
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
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5">
        <span className={LABEL}>{label}</span>
        <span
          className={`font-grotesk text-[13px] font-semibold text-right ${
            caption ? "text-[#EDE2D2]/85" : "text-[#EDE2D2]/25"
          }`}
        >
          {caption || BLANK}
        </span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: segments }).map((_, i) => (
          <motion.span
            key={i}
            initial={false}
            animate={{
              backgroundColor: i < lit ? "hsl(var(--primary))" : "rgba(237,226,210,0.09)",
              boxShadow: i < lit ? "0 0 14px -2px hsl(var(--primary))" : "0 0 0 rgba(0,0,0,0)",
            }}
            transition={{ duration: 0.35, delay: i * 0.02 }}
            className="h-2.5 flex-1"
          />
        ))}
      </div>
    </div>
  );
}

function Face({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`relative h-full min-h-[700px] overflow-hidden ${className}`}
      style={{ background: "#0B0705", border: `1px solid ${GOLD}40` }}
    >
      <CardTexture />
      {children}
      <CardFrame />
      <CardSheen />
    </div>
  );
}

// ── Front — identity ─────────────────────────────────────────────────────────

function CardFront({ card, options }: { card: FighterCard; options: FighterCardOptions | null }) {
  const level = labelOf(options, "training_duration", card.training_duration);
  const styles = labelsOf(options, "fighting_styles", card.fighting_styles).join(" / ");
  const weapons = labelsOf(options, "favourite_techniques", card.favourite_techniques).join(" / ");
  const mission = labelOf(options, "primary_focus", card.primary_focus);
  const nationality = labelOf(options, "nationality", card.nationality);

  const cardNo = String(card.id ?? 0).padStart(3, "0");
  const campCity = card.camp_detail?.city ?? "Thailand";

  return (
    <Face className="flex">
      {/* Spine */}
      <div className="relative w-[70px] shrink-0 bg-gradient-to-b from-red-700 via-red-800 to-[#2c0404] flex flex-col items-center py-8 gap-6">
        <span
          className={`font-barlow font-black italic text-[15px] tracking-[0.16em] text-white uppercase leading-none ${LETTERPRESS}`}
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          This Is Muay Thai
        </span>
        <span className="w-8 h-px" style={{ background: `${GOLD}80` }} />
        <div className="text-center">
          <p className="font-grotesk text-[12px] tracking-[0.2em] uppercase" style={{ color: `${GOLD}` }}>
            Camp
          </p>
          <p className={`font-barlow font-black italic text-[28px] text-white leading-none ${LETTERPRESS}`}>
            {cardNo}
          </p>
        </div>
        <span className="w-8 h-px" style={{ background: `${GOLD}80` }} />
        <p
          className="font-grotesk text-[12px] tracking-[0.24em] uppercase leading-none"
          style={{ writingMode: "vertical-rl", color: `${CREAM}A0` }}
        >
          {campCity}
        </p>
      </div>

      {/* Body */}
      <div className="relative flex-1 min-w-0 p-7 flex flex-col">
        <p
          className="font-grotesk text-[12px] tracking-[0.4em] uppercase text-center mb-1.5"
          style={{ color: GOLD }}
        >
          Fighter Card
        </p>
        <div className="text-center mb-6">
          <h3
            className={`font-barlow font-black italic text-[66px] uppercase leading-[0.78] tracking-tight ${LETTERPRESS}`}
            style={{ color: CREAM }}
          >
            Fighter
          </h3>
          <p className={`font-barlow font-black italic text-[36px] text-primary leading-none ${LETTERPRESS}`}>
            {cardNo}
          </p>
        </div>

        {/* The photo is a signed URL off the card we just read — never cached. */}
        <div
          className="relative aspect-[4/3] overflow-hidden mb-6"
          style={{
            border: card.photo ? `1px solid ${GOLD}55` : `1px dashed ${GOLD}55`,
            background: "linear-gradient(180deg, rgba(237,226,210,0.05), transparent)",
          }}
        >
          {card.photo ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- signed S3 URL, expires */}
              <img src={card.photo} alt="" className="w-full h-full object-cover" />
              {/* Sinks the photo into the card stock rather than pasting it on */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0705] via-transparent to-transparent" />
              <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.65)]" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2.5">
              <User className="w-12 h-12" style={{ color: `${GOLD}40` }} />
              <p
                className="font-grotesk text-[12px] tracking-[0.24em] uppercase"
                style={{ color: `${CREAM}55` }}
              >
                Fighter Photo
              </p>
            </div>
          )}
        </div>

        <div className="mb-5">
          <p className={`${LABEL} mb-1`}>Name</p>
          <p
            className={`font-barlow font-black text-[30px] uppercase leading-[1.05] ${LETTERPRESS}`}
            style={{ color: card.user_full_name ? CREAM : `${CREAM}40` }}
          >
            {card.user_full_name || "Unnamed Fighter"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-5 mb-6">
          <Field label="Nationality" value={nationality} />
          <Field label="City" value={card.city} />
        </div>

        {/* Level / Style / Weapon */}
        <div
          className="grid grid-cols-3 mb-3"
          style={{ border: `1px solid ${GOLD}33`, background: "rgba(0,0,0,0.45)" }}
        >
          {[
            { label: "Level", value: level },
            { label: "Style", value: styles },
            { label: "Weapon", value: weapons },
          ].map((cell, i) => (
            <div
              key={cell.label}
              className="px-3.5 py-3.5 min-w-0"
              style={i > 0 ? { borderLeft: `1px solid ${GOLD}22` } : undefined}
            >
              <p className={`${LABEL} mb-1.5`}>{cell.label}</p>
              <p
                className="font-barlow font-black italic text-[15px] uppercase leading-[1.15]"
                style={{ color: cell.value ? GOLD : `${CREAM}30` }}
              >
                {cell.value || BLANK}
              </p>
            </div>
          ))}
        </div>

        {/* Objective */}
        <div
          className="px-4 py-4 mt-auto"
          style={{
            border: "1px solid hsl(var(--primary) / 0.35)",
            background: "linear-gradient(90deg, hsl(var(--primary) / 0.16), transparent)",
          }}
        >
          <p className="font-grotesk text-[12px] tracking-[0.24em] uppercase text-primary mb-1.5">
            Camp Objective
          </p>
          <p
            className={`font-barlow font-black italic text-[21px] uppercase leading-tight ${LETTERPRESS}`}
            style={{ color: mission ? CREAM : `${CREAM}30` }}
          >
            {mission || BLANK}
          </p>
        </div>

        <p
          className="mt-5 pt-4 font-grotesk text-[12px] tracking-[0.24em] uppercase text-center"
          style={{ borderTop: `1px solid ${GOLD}25`, color: `${CREAM}45` }}
        >
          This Is Muay Thai · {campCity}
        </p>
      </div>
    </Face>
  );
}

// ── Back — profile ───────────────────────────────────────────────────────────

function CardBack({ card, options }: { card: FighterCard; options: FighterCardOptions | null }) {
  const goals = labelsOf(options, "goals", card.goals);
  const restrictions = labelsOf(options, "training_restrictions", card.training_restrictions);
  const injuryAreas = labelsOf(options, "injury_areas", card.injury_areas);
  const hasInjury = OPEN_INJURIES.includes(card.injury_status);

  const panel = { border: `1px solid ${GOLD}2E`, background: "rgba(0,0,0,0.42)" };

  return (
    <Face className="p-7 flex flex-col">
      <div className="relative flex flex-col h-full">
        <p
          className="font-grotesk text-[12px] tracking-[0.4em] uppercase text-center"
          style={{ color: `${CREAM}55` }}
        >
          This Is Muay Thai
        </p>
        <h3
          className={`font-barlow font-black text-[40px] uppercase leading-none text-center mb-6 ${LETTERPRESS}`}
          style={{ color: GOLD }}
        >
          Fighter Profile
        </h3>

        <div className="px-4 py-4 mb-3" style={panel}>
          <PanelTitle>Training Background</PanelTitle>
          <Row label="Experience" value={labelOf(options, "training_duration", card.training_duration)} />
          <Row label="Frequency" value={labelOf(options, "training_frequency", card.training_frequency)} />
          <Row
            label="Thailand"
            value={
              card.trained_in_thailand == null
                ? ""
                : card.trained_in_thailand
                  ? labelOf(options, "thailand_trips", card.thailand_trips) || "Yes"
                  : "No"
            }
          />
          <Row label="Competition" value={labelOf(options, "competition_experience", card.competition_experience)} />
          <Row label="Sparring" value={labelOf(options, "sparring_experience", card.sparring_experience)} />
        </div>

        <div className="px-4 py-4 mb-3" style={panel}>
          <PanelTitle>Goals</PanelTitle>
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  className="w-6 h-6 shrink-0 flex items-center justify-center font-barlow font-black text-[13px]"
                  style={
                    goals[i]
                      ? { background: "hsl(var(--primary))", color: "#000" }
                      : { background: "rgba(237,226,210,0.07)", color: `${CREAM}40` }
                  }
                >
                  {i + 1}
                </span>
                <span className={goals[i] ? VALUE : EMPTY}>{goals[i] || BLANK}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="px-4 py-4 mb-3" style={panel}>
          <PanelTitle>Attributes</PanelTitle>
          <div className="flex flex-col gap-3.5">
            <Meter
              label="Fitness"
              fraction={card.overall_fitness == null ? null : card.overall_fitness / 10}
              caption={card.overall_fitness == null ? "" : `${card.overall_fitness} / 10`}
            />
            <Meter
              label="Cardio"
              fraction={ordinalFraction(options, "cardio_level", card.cardio_level)}
              caption={labelOf(options, "cardio_level", card.cardio_level).split(" — ")[0]}
            />
            <Meter
              label="Five Rounds"
              fraction={ordinalFraction(options, "five_round_capability", card.five_round_capability)}
              caption={labelOf(options, "five_round_capability", card.five_round_capability).split(",")[0]}
            />
            <Meter
              label="Intensity"
              fraction={card.coach_intensity == null ? null : card.coach_intensity / 10}
              caption={card.coach_intensity == null ? "" : `${card.coach_intensity} / 10`}
            />
          </div>
        </div>

        {/* Private — trainer only */}
        <div
          className="px-4 py-4 mt-auto"
          style={{ border: "1px solid rgba(245,158,11,0.35)", background: "rgba(245,158,11,0.07)" }}
        >
          <p className="flex items-center gap-2 font-barlow font-black text-[13px] tracking-[0.2em] uppercase text-amber-300 mb-3">
            {hasInjury ? <ShieldAlert size={13} /> : <Lock size={13} />} Trainer Only
          </p>
          <div className="flex flex-col gap-3">
            <div>
              <p className={`${LABEL} mb-1`}>Injuries</p>
              <p
                className="font-grotesk text-[15px] font-semibold leading-snug"
                style={{ color: card.injury_status ? (hasInjury ? "#FCA5A5" : CREAM) : `${CREAM}40` }}
              >
                {labelOf(options, "injury_status", card.injury_status) || BLANK}
                {injuryAreas.length > 0 && (
                  <span
                    className="block font-normal text-[13px] mt-0.5"
                    style={{ color: `${CREAM}A0` }}
                  >
                    {injuryAreas.join(", ")}
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className={`${LABEL} mb-1`}>What To Avoid</p>
              <p className={restrictions.length ? VALUE : EMPTY}>
                {restrictions.length ? restrictions.join(", ") : BLANK}
              </p>
            </div>
          </div>
        </div>

        <p
          className="mt-5 pt-4 font-barlow italic text-[13px] tracking-wide text-center"
          style={{ borderTop: `1px solid ${GOLD}25`, color: `${CREAM}50` }}
        >
          “Discipline today, champion tomorrow.”
        </p>
      </div>
    </Face>
  );
}

// ── The levitating, flippable card ───────────────────────────────────────────

function renderFace(
  which: "front" | "back",
  card: FighterCard,
  options: FighterCardOptions | null
) {
  return which === "front" ? (
    <CardFront card={card} options={options} />
  ) : (
    <CardBack card={card} options={options} />
  );
}

interface FighterCardPreviewProps {
  card: FighterCard;
  options: FighterCardOptions | null;
}

/** Half-turn duration. The face swaps at the midpoint, where the card is edge-on. */
const FLIP_MS = 620;

export default function FighterCardPreview({ card, options }: FighterCardPreviewProps) {
  const [face, setFace] = useState<"front" | "back">("front");
  const [burning, setBurning] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  /*
   * One rAF loop owns the card's transform.
   *
   * The tilt used to be a CSS `transition` retargeted on every mousemove, which
   * meant the browser was restarting a 300ms ease dozens of times a second
   * while the float animation rewrote the parent's transform underneath it —
   * that fight is what showed up as jitter. Now the pointer only records a
   * target; a single frame-synced loop eases toward it and writes `transform`
   * exactly once per frame.
   */
  const target = useRef({ rx: 0, ry: 0 });
  const current = useRef({ rx: 0, ry: 0 });
  /** 0 = front, 180 = back. Animated by the flip, added to the pointer tilt. */
  const flipAngle = useRef(0);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    if (reduceMotion) return;
    const tick = () => {
      const c = current.current;
      const t = target.current;
      c.rx += (t.rx - c.rx) * 0.12;
      c.ry += (t.ry - c.ry) * 0.12;
      const el = tiltRef.current;
      if (el) {
        el.style.transform = `rotateX(${c.rx.toFixed(3)}deg) rotateY(${(c.ry + flipAngle.current).toFixed(3)}deg)`;
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [reduceMotion]);

  /** Char is held for the back half of a flip; on the opening sweep there is none. */
  const [burnHold, setBurnHold] = useState(0);

  // Forged in: the opening sweep burns the char off as the card arrives.
  useEffect(() => {
    if (reduceMotion) return;
    setBurnHold(0);
    setBurning(true);
  }, [reduceMotion]);

  const isTurning = useRef(false);

  /**
   * A single half-turn — the card flips over the way a card does. The face is
   * swapped at the ninety-degree mark, where the card is edge-on and the swap
   * cannot be seen.
   */
  const flip = useCallback(
    (next: "front" | "back", onSwap: () => void) =>
      new Promise<void>((resolve) => {
        const from = flipAngle.current;
        const to = next === "front" ? 0 : 180;
        const start = performance.now();
        const ms = FLIP_MS;
        let swapped = false;
        const step = () => {
          const t = Math.min(1, (performance.now() - start) / ms);
          const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          flipAngle.current = from + (to - from) * eased;
          if (!swapped && eased >= 0.5) {
            swapped = true;
            // Edge-on — the swap cannot be seen from here. The burn is armed
            // in the same tick so the incoming face is already black by the
            // time it has turned far enough to read.
            setFace(next);
            onSwap();
          }
          if (t < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    []
  );

  const reveal = useCallback(async () => {
    if (burning || isTurning.current) return;
    const next = face === "front" ? "back" : "front";
    if (reduceMotion) {
      setFace(next);
      return;
    }
    isTurning.current = true;
    /*
     * The burn is armed at the halfway point, not after the flip. CardBurn
     * paints the fully charred state for `startDelay` before the flame moves,
     * so the incoming face is black from the instant it becomes visible —
     * previously it sat there fully revealed for the back half of the turn.
     */
    setBurnHold(FLIP_MS / 2);
    await flip(next, () => setBurning(true));
    isTurning.current = false;
  }, [face, burning, reduceMotion, flip]);

  /** Pointer only records a target — the rAF loop above does the moving. */
  const setPointer = useCallback(
    (mx: number, my: number, engaged: boolean) => {
      const shell = shellRef.current;
      if (!shell) return;
      shell.style.setProperty("--fc-mx", `${mx}`);
      shell.style.setProperty("--fc-my", `${my}`);
      shell.style.setProperty("--fc-holo", engaged && !reduceMotion ? "0.75" : "0");
      shell.style.setProperty("--fc-glare", engaged && !reduceMotion ? "0.55" : "0");
      if (reduceMotion) return;
      target.current = engaged
        ? { rx: -(my / 100 - 0.5) * 9, ry: (mx / 100 - 0.5) * 12 }
        : { rx: 0, ry: 0 };
    },
    [reduceMotion]
  );

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = shellRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPointer(((e.clientX - rect.left) / rect.width) * 100, ((e.clientY - rect.top) / rect.height) * 100, true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div ref={shellRef} className="relative [perspective:1600px]">
        <div className="absolute -inset-16 -z-20 bg-[radial-gradient(ellipse_at_center,hsl(16_100%_50%/0.22),transparent_65%)] blur-2xl pointer-events-none" />
        {/* Drifts well past the card on every side, so it sits inside the cloud. */}
        <EmberField count={44} className="absolute -inset-16 -z-10 w-[calc(100%+8rem)] h-[calc(100%+8rem)]" />

        <div onMouseMove={handleMove} onMouseLeave={() => setPointer(50, 50, false)} className="relative">
          {/* Framer owns this element's transform for the float — anything we
              write here is overwritten on the next frame, so the tilt and flip
              live on their own element underneath. */}
          <motion.div
            animate={reduceMotion ? undefined : { y: [0, -9, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          >
            <div ref={tiltRef} className="relative will-change-transform">
              {/* Both faces share one grid cell, so the card is as tall as the
                  taller side and cannot change size when the shorter one shows. */}
              <div
                className="grid w-full cursor-pointer shadow-[0_45px_100px_-35px_rgba(0,0,0,0.95)]"
                onClick={reveal}
              >
                {(["front", "back"] as const).map((which) => (
                  <div
                    key={which}
                    style={{
                      gridArea: "1 / 1",
                      position: "relative",
                      // Hidden, not unmounted: a hidden grid item still sizes
                      // its cell, so the card keeps one height throughout.
                      visibility: face === which ? "visible" : "hidden",
                      // The back is mounted upside down, so it reads correctly
                      // once the card has turned through 180°.
                      transform: which === "back" ? "rotateY(180deg)" : undefined,
                    }}
                  >
                    {renderFace(which, card, options)}
                  </div>
                ))}
              </div>

              {/* The flame sits INSIDE the tilt wrapper so it turns with the
                  card and stays welded to the char edge. That is safe because
                  this wrapper is `transform-style: flat` (the default): the
                  faces and the flame composite into one plane and only then
                  rotate, so no two planes can intersect — which is what sliced
                  the fire in half back when this lived in a preserve-3d context. */}
              <CardBurn
                active={burning}
                duration={760}
                startDelay={burnHold}
                onDone={() => setBurning(false)}
              />
              <EmberField count={12} className="absolute inset-0 w-full h-full z-20 opacity-70" />
            </div>
          </motion.div>
        </div>
      </div>

      <button
        type="button"
        onClick={reveal}
        className="group self-center inline-flex items-center gap-2.5 px-6 py-3 font-barlow font-bold text-[13px] tracking-[0.22em] uppercase transition-colors duration-300"
        style={{ border: `1px solid ${GOLD}55`, color: `${CREAM}C0` }}
      >
        <Flame size={14} className="group-hover:scale-125 transition-transform duration-300" />
        {face === "front" ? "Turn To Profile" : "Turn To Front"}
      </button>
    </div>
  );
}
