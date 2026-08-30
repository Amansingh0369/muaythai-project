"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { AlertCircle, Check, ChevronDown, Search, X } from "lucide-react";
import type { ChoiceOption, ScaleSpec } from "@/services/fighter-card.service";

// ── Shell ────────────────────────────────────────────────────────────────────

interface FieldShellProps {
  label: string;
  hint?: string;
  /** Server-side message for this field — always rendered on the control itself. */
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FieldShell({ label, hint, error, required, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-baseline gap-2 flex-wrap">
        <label className="font-barlow font-black text-[15px] tracking-[0.12em] uppercase text-white">
          {label}
        </label>
        {required && <span className="text-primary text-[13px] leading-none">*</span>}
        {hint && <span className="font-grotesk text-[12px] text-white/50 normal-case">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="flex items-center gap-1.5 font-grotesk text-[12px] text-red-400">
          <AlertCircle size={12} className="shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

// ── Single select as chips ───────────────────────────────────────────────────

interface ChoiceChipsProps {
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
}

/** Short single-selects read better as chips than a dropdown. */
export function ChoiceChips({ options, value, onChange }: ChoiceChipsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? "" : option.value)}
            className={`font-grotesk text-[13px] font-semibold px-3.5 py-2 border transition-all duration-200 text-left ${
              active
                ? "bg-primary text-black border-primary font-bold shadow-[0_0_20px_-6px_hsl(var(--primary)/0.7)]"
                : "bg-white/[0.05] border-white/20 text-white/90 hover:text-white hover:border-white/40"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Multi select with cap + exclusive choice ─────────────────────────────────

interface MultiChipsProps {
  options: ChoiceOption[];
  value: string[];
  onToggle: (value: string) => void;
  /** Returns why an option cannot be picked, or undefined when it can. */
  disabledReason?: (value: string) => string | undefined;
  limit?: number;
}

export function MultiChips({ options, value, onToggle, disabledReason, limit }: MultiChipsProps) {
  const atCap = limit != null && value.length >= limit;
  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value.includes(option.value);
          const reason = disabledReason?.(option.value);
          const blocked = Boolean(reason) && !active;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={active}
              disabled={blocked}
              title={reason}
              onClick={() => onToggle(option.value)}
              className={`inline-flex items-center gap-1.5 font-grotesk text-[13px] font-semibold px-3.5 py-2 border transition-all duration-200 ${
                active
                  ? "bg-primary text-black border-primary font-bold shadow-[0_0_20px_-6px_hsl(var(--primary)/0.7)]"
                  : blocked
                    ? "bg-white/[0.02] border-white/[0.07] text-white/25 cursor-not-allowed"
                    : "bg-white/[0.05] border-white/20 text-white/90 hover:text-white hover:border-white/40"
              }`}
            >
              {active && <Check size={12} className="shrink-0" />}
              {option.label}
            </button>
          );
        })}
      </div>
      {limit != null && (
        <p className={`font-grotesk text-[12px] ${atCap ? "text-primary" : "text-white/40"}`}>
          {value.length} of {limit} selected
          {atCap && " — deselect one to change your answer."}
        </p>
      )}
    </div>
  );
}

// ── Searchable single select ─────────────────────────────────────────────────

interface SearchSelectProps {
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** For long lists (249 nationalities) where chips would bury the page. */
export function SearchSelect({ options, value, onChange, placeholder = "Search…" }: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  // Close on outside click so the dropdown never traps the page.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        className="w-full flex items-center justify-between gap-2 bg-white/[0.05] border border-white/15 px-4 py-3 font-grotesk text-sm text-left transition-colors hover:border-white/30 focus:outline-none focus:border-primary/60"
      >
        <span className={`font-semibold ${selected ? "text-white/90" : "text-white/45"}`}>
          {selected?.label ?? placeholder}
        </span>
        <ChevronDown size={15} className={`text-white/40 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-[#0b0b0b] border border-white/20 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.9)]">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
            <Search size={13} className="text-white/40 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type to filter…"
              className="w-full bg-transparent font-grotesk text-sm text-white placeholder:text-white/35 outline-none"
            />
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-white/40 hover:text-white shrink-0"
                aria-label="Clear selection"
              >
                <X size={13} />
              </button>
            )}
          </div>
          <div className="max-h-56 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 font-grotesk text-[13px] text-white/40">No match.</p>
            ) : (
              filtered.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 font-grotesk text-[13px] transition-colors ${
                    option.value === value
                      ? "bg-primary/15 text-primary"
                      : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Yes / No ─────────────────────────────────────────────────────────────────

export function YesNo({
  value,
  onChange,
}: {
  value: boolean | null;
  onChange: (value: boolean | null) => void;
}) {
  const choices: { label: string; val: boolean }[] = [
    { label: "Yes", val: true },
    { label: "No", val: false },
  ];
  return (
    <div className="flex gap-2">
      {choices.map(({ label, val }) => {
        const active = value === val;
        return (
          <button
            key={label}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(active ? null : val)}
            className={`px-7 py-2 font-barlow font-bold text-[13px] tracking-[0.2em] uppercase border transition-all duration-200 ${
              active
                ? "bg-primary text-black border-primary shadow-[0_0_20px_-6px_hsl(var(--primary)/0.7)]"
                : "bg-white/[0.05] border-white/20 text-white/85 hover:text-white hover:border-white/40"
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Scale slider ─────────────────────────────────────────────────────────────

interface ScaleSliderProps {
  scale: ScaleSpec;
  value: number | null;
  onChange: (value: number) => void;
}

/** 1–10 scale with the server's own anchor captions under the track. */
export function ScaleSlider({ scale, value, onChange }: ScaleSliderProps) {
  const current = value ?? scale.min;
  const anchors = Object.entries(scale.labels).sort(([a], [b]) => Number(a) - Number(b));
  const activeCaption = scale.labels[String(current)];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-4">
        <SliderPrimitive.Root
          className="relative flex items-center select-none touch-none flex-1 h-5"
          min={scale.min}
          max={scale.max}
          step={1}
          value={[current]}
          onValueChange={([v]) => onChange(v)}
        >
          <SliderPrimitive.Track className="relative h-[3px] grow bg-white/15">
            <SliderPrimitive.Range className="absolute h-full bg-gradient-to-r from-primary to-orange-deep" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            aria-label="Rating"
            className="block w-4 h-4 bg-primary border-2 border-black shadow-[0_0_16px_hsl(var(--primary)/0.8)] focus:outline-none focus:ring-2 focus:ring-primary/50 transition-shadow"
          />
        </SliderPrimitive.Root>
        <span
          className={`font-barlow font-black italic text-2xl tabular-nums w-14 text-right ${
            value == null ? "text-white/25" : "text-primary"
          }`}
        >
          {value == null ? "—" : `${value}`}
        </span>
      </div>

      {activeCaption && value != null && (
        <p className="font-grotesk text-[13px] text-primary/90">{activeCaption}</p>
      )}

      <div className="flex justify-between font-grotesk text-[11px] text-white/35">
        {anchors.map(([point, caption]) => (
          <span key={point} className="max-w-[33%] leading-tight">
            {caption}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Switch ───────────────────────────────────────────────────────────────────

export function SwitchField({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <SwitchPrimitive.Root
        checked={checked}
        onCheckedChange={onChange}
        className="w-11 h-6 bg-white/15 data-[state=checked]:bg-primary transition-colors relative shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/40"
      >
        <SwitchPrimitive.Thumb className="block w-4 h-4 bg-white shadow translate-x-1 data-[state=checked]:translate-x-6 data-[state=checked]:bg-black transition-transform" />
      </SwitchPrimitive.Root>
      <span className="font-grotesk text-[13px] text-white/70 group-hover:text-white transition-colors">
        {label}
      </span>
    </label>
  );
}

// ── Text ─────────────────────────────────────────────────────────────────────

const textBase =
  "w-full bg-white/[0.05] border border-white/20 px-4 py-3 font-grotesk text-sm font-medium text-white/90 placeholder:text-white/35 placeholder:font-normal outline-none focus:border-primary/60 transition-colors";

export function TextField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={textBase} />
  );
}

export function TextAreaField({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${textBase} resize-none`}
    />
  );
}
