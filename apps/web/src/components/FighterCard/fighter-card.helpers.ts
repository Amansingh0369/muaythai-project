import type {
  ChoiceOption,
  FighterCard,
  FighterCardOptions,
} from "@/services/fighter-card.service";

/** Every answer field, grouped by the section that owns it. */
export type FieldName = keyof FighterCard;

export interface SectionDef {
  id: string;
  /** "01" … "05", shown in the step chip. */
  step: string;
  title: string;
  blurb: string;
  /** Fields saved together when this section is submitted. */
  fields: FieldName[];
  /** Trainer-only section — rendered with the private treatment. */
  isPrivate?: boolean;
}

export const SECTIONS: SectionDef[] = [
  {
    id: "identity",
    step: "01",
    title: "Identify Your Fighter",
    blurb: "Who is stepping into the ring.",
    fields: ["camp", "nationality", "city"],
  },
  {
    id: "background",
    step: "02",
    title: "Know Your Style",
    blurb: "What you have done so far.",
    fields: [
      "training_duration",
      "training_frequency",
      "trained_in_thailand",
      "thailand_trips",
      "other_combat_sports",
      "competition_experience",
      "fight_count",
      "sparring_experience",
    ],
  },
  {
    id: "fitness",
    step: "03",
    title: "Find Your Level",
    blurb: "Where your conditioning is right now.",
    fields: ["exercise_frequency", "cardio_level", "five_round_capability", "overall_fitness"],
  },
  {
    id: "mission",
    step: "04",
    title: "Choose Your Mission",
    blurb: "What you want out of this camp.",
    fields: [
      "goals",
      "primary_focus",
      "primary_focus_notes",
      "fighting_styles",
      "favourite_techniques",
    ],
  },
  {
    id: "kru",
    step: "05",
    title: "Tell Your Kru",
    blurb: "Only you and the trainers ever see this.",
    isPrivate: true,
    fields: [
      "injury_status",
      "injury_areas",
      "injury_notes",
      "has_past_major_injury",
      "past_injury_types",
      "training_restrictions",
      "training_restrictions_notes",
      "has_medical_condition",
      "medical_details",
      "coach_intensity",
      "train_around_limitations",
      "message_to_kru",
    ],
  },
];

/** Injury severities that open the follow-up questions. */
const OPEN_INJURY_STATUSES = ["YES_MINOR", "YES_MODERATE", "YES_SIGNIFICANT"];

/**
 * A follow-up is only answerable while its trigger is on. Sending a closed
 * follow-up's value is a 400, so these gate both rendering and the patch body.
 */
const FOLLOW_UPS: Record<string, (card: FighterCard) => boolean> = {
  // `PREFER_TO_DISCUSS` counts as no current injury — it opens nothing.
  thailand_trips: (c) => c.trained_in_thailand === true,
  fight_count: (c) => c.competition_experience !== "" && c.competition_experience !== "NEVER",
  injury_areas: (c) => OPEN_INJURY_STATUSES.includes(c.injury_status),
  injury_notes: (c) => OPEN_INJURY_STATUSES.includes(c.injury_status),
  past_injury_types: (c) => c.has_past_major_injury === true,
  medical_details: (c) => c.has_medical_condition === true,
};

/** True when the field is always answerable, or its trigger is currently on. */
export function isFieldOpen(card: FighterCard, field: string): boolean {
  const gate = FOLLOW_UPS[field];
  return gate ? gate(card) : true;
}

/** The follow-ups that a change to `field` may have closed. */
export function dependentsOf(field: string): string[] {
  switch (field) {
    case "trained_in_thailand":
      return ["thailand_trips"];
    case "competition_experience":
      return ["fight_count"];
    case "injury_status":
      return ["injury_areas", "injury_notes"];
    case "has_past_major_injury":
      return ["past_injury_types"];
    case "has_medical_condition":
      return ["medical_details"];
    default:
      return [];
  }
}

/** Empty answers come back as `""` / `[]` / `null` — never `undefined`. */
export function emptyValueFor(field: string, card: FighterCard): unknown {
  const current = card[field as FieldName];
  if (Array.isArray(current)) return [];
  if (typeof current === "number") return null;
  if (typeof current === "boolean") return null;
  return "";
}

/**
 * Applies one answer, clearing any follow-up the change closes so the preview
 * and the patch body never carry a stale value.
 */
export function applyAnswer(card: FighterCard, field: string, value: unknown): FighterCard {
  const next = { ...card, [field]: value } as FighterCard;
  dependentsOf(field).forEach((dep) => {
    if (!isFieldOpen(next, dep)) {
      (next as any)[dep] = emptyValueFor(dep, card);
    }
  });
  return next;
}

/**
 * Toggles one value in a capped multi-select, honouring the server's rules:
 * an exclusive choice clears everything else, and picking anything else clears
 * the exclusive choice. Returns the list unchanged when the cap is reached.
 */
export function toggleMultiValue(
  current: string[],
  value: string,
  { limit, exclusive }: { limit?: number; exclusive?: string }
): string[] {
  if (current.includes(value)) return current.filter((v) => v !== value);

  if (exclusive && value === exclusive) return [value];

  const withoutExclusive = exclusive ? current.filter((v) => v !== exclusive) : current;
  if (limit != null && withoutExclusive.length >= limit) return withoutExclusive;
  return [...withoutExclusive, value];
}

/** Why a multi-select option is disabled, or undefined when it is selectable. */
export function capReason(
  current: string[],
  value: string,
  { limit, exclusive }: { limit?: number; exclusive?: string }
): string | undefined {
  if (current.includes(value)) return undefined;
  if (exclusive && value === exclusive) return undefined;
  const withoutExclusive = exclusive ? current.filter((v) => v !== exclusive) : current;
  if (limit != null && withoutExclusive.length >= limit) {
    return `Pick up to ${limit} — deselect one to change your answer.`;
  }
  return undefined;
}

// ── Label resolution ─────────────────────────────────────────────────────────

/** Human label for a stored code. Falls back to the code so nothing renders blank. */
export function labelOf(
  options: FighterCardOptions | null,
  field: string,
  value: string
): string {
  if (!value) return "";
  const list = options?.[field as keyof FighterCardOptions];
  if (!Array.isArray(list)) return value;
  return (list as ChoiceOption[]).find((o) => o.value === value)?.label ?? value;
}

/** Labels for a multi-select, in the order the fighter picked them. */
export function labelsOf(
  options: FighterCardOptions | null,
  field: string,
  values: string[]
): string[] {
  return (values ?? []).map((v) => labelOf(options, field, v));
}

/**
 * Position of an ordinal answer within its own choice list, as a 0–1 fraction.
 * Used to draw the card's segmented meters — the real label is always shown
 * alongside, so the bar reads as position-in-scale, not an invented rating.
 */
export function ordinalFraction(
  options: FighterCardOptions | null,
  field: string,
  value: string
): number | null {
  if (!value) return null;
  const list = options?.[field as keyof FighterCardOptions];
  if (!Array.isArray(list) || list.length < 2) return null;
  const index = (list as ChoiceOption[]).findIndex((o) => o.value === value);
  if (index < 0) return null;
  return (index + 1) / list.length;
}

// ── Progress ─────────────────────────────────────────────────────────────────

/**
 * Gaps per section, derived from the server's `missing_fields`. Completeness is
 * never computed client-side.
 */
export function sectionGaps(card: FighterCard | null): Record<string, number> {
  const gaps: Record<string, number> = {};
  const missing = new Set(card?.missing_fields ?? []);
  SECTIONS.forEach((section) => {
    gaps[section.id] = section.fields.filter((f) => missing.has(f as string)).length;
  });
  return gaps;
}

/** Percent of required fields answered, from the server's own list. */
export function completionPercent(
  card: FighterCard | null,
  options: FighterCardOptions | null
): number {
  const required = options?.required_for_completion ?? [];
  if (!card || required.length === 0) return 0;
  const missing = card.missing_fields?.length ?? 0;
  const answered = Math.max(0, required.length - missing);
  return Math.round((answered / required.length) * 100);
}
