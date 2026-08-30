import { fetchWithAuth } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ChoiceOption {
  value: string;
  label: string;
}

export interface ScaleSpec {
  min: number;
  max: number;
  /** Anchor captions keyed by point, e.g. `{ "1": "Keep it light" }`. */
  labels: Record<string, string>;
}

/**
 * Every choice set the form renders, plus the rules the server enforces.
 * Nothing here is hard-coded frontend-side — options can be added backend-side.
 */
export interface FighterCardOptions {
  nationality: ChoiceOption[];
  training_duration: ChoiceOption[];
  training_frequency: ChoiceOption[];
  thailand_trips: ChoiceOption[];
  other_combat_sports: ChoiceOption[];
  competition_experience: ChoiceOption[];
  fight_count: ChoiceOption[];
  sparring_experience: ChoiceOption[];
  exercise_frequency: ChoiceOption[];
  cardio_level: ChoiceOption[];
  five_round_capability: ChoiceOption[];
  goals: ChoiceOption[];
  primary_focus: ChoiceOption[];
  fighting_styles: ChoiceOption[];
  favourite_techniques: ChoiceOption[];
  injury_status: ChoiceOption[];
  injury_areas: ChoiceOption[];
  past_injury_types: ChoiceOption[];
  training_restrictions: ChoiceOption[];
  /** Max selections per multi-select field. */
  limits: Record<string, number>;
  /** Value that clears every other selection in that field when picked. */
  exclusive_choices: Record<string, string>;
  scales: Record<string, ScaleSpec>;
  private_fields: string[];
  required_for_completion: string[];
  photo: PhotoConstraints;
}

/** Server-declared upload limits — never hard-code these. */
export interface PhotoConstraints {
  max_bytes: number;
  content_types: string[];
  extensions: string[];
}

export interface CampDetail {
  id: number;
  name: string;
  city: string;
}

export interface FighterCard {
  id: number;
  user: number;
  user_email: string;
  user_full_name: string | null;
  camp: number | null;
  camp_detail: CampDetail | null;

  /**
   * Signed S3 URL with a lifetime (7 days by default). Render it from the card
   * you just fetched — never persist or cache it as though it were stable.
   */
  photo: string | null;
  nationality: string;
  city: string;

  training_duration: string;
  training_frequency: string;
  trained_in_thailand: boolean | null;
  thailand_trips: string;
  other_combat_sports: string[];
  competition_experience: string;
  fight_count: string;
  sparring_experience: string;

  exercise_frequency: string;
  cardio_level: string;
  five_round_capability: string;
  overall_fitness: number | null;

  goals: string[];
  primary_focus: string;
  primary_focus_notes: string;
  fighting_styles: string[];
  favourite_techniques: string[];

  // ── private — trainer only ──
  injury_status: string;
  injury_areas: string[];
  injury_notes: string;
  has_past_major_injury: boolean | null;
  past_injury_types: string[];
  training_restrictions: string[];
  training_restrictions_notes: string;
  has_medical_condition: boolean | null;
  medical_details: string;
  coach_intensity: number | null;
  train_around_limitations: boolean;
  message_to_kru: string;

  is_complete: boolean;
  /** Unanswered required fields — the server owns this, never compute it. */
  missing_fields: string[];
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Only the answer fields are ever sent back; the rest are server-owned. */
export type FighterCardPatch = Partial<
  Omit<
    FighterCard,
    | "id" | "user" | "user_email" | "user_full_name" | "camp_detail"
    | "photo"
    | "is_complete" | "missing_fields" | "completed_at" | "created_at" | "updated_at"
  >
>;

// ── Errors ───────────────────────────────────────────────────────────────────

/**
 * A 400 from the API. `fieldErrors` maps a field name onto its messages so the
 * caller can surface it on the control that caused it rather than in a toast.
 */
export class FighterCardApiError extends Error {
  readonly fieldErrors: Record<string, string[]>;
  readonly status: number;

  constructor(message: string, fieldErrors: Record<string, string[]>, status: number) {
    super(message);
    this.name = "FighterCardApiError";
    this.fieldErrors = fieldErrors;
    this.status = status;
  }

  /** First message for a field, if the server flagged it. */
  forField(field: string): string | undefined {
    return this.fieldErrors[field]?.[0];
  }
}

/** Errors come back as `{ error: true, message, data: { field: string[] } }`. */
async function toApiError(res: Response): Promise<FighterCardApiError> {
  let body: any = {};
  try {
    body = await res.json();
  } catch {
    /* non-JSON error body — fall through to the status-only message */
  }

  const fieldErrors: Record<string, string[]> = {};
  const data = body?.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    Object.entries(data).forEach(([field, messages]) => {
      if (Array.isArray(messages)) fieldErrors[field] = messages.map(String);
      else if (messages != null) fieldErrors[field] = [String(messages)];
    });
  }

  const message =
    body?.message ||
    body?.detail ||
    (res.status === 401 ? "Your session expired. Please log in again." : "Something went wrong. Please try again.");

  return new FighterCardApiError(message, fieldErrors, res.status);
}

// ── Service ──────────────────────────────────────────────────────────────────

export const fighterCardService = {
  /** Public and static — cache the result rather than refetching per section. */
  async getOptions(): Promise<FighterCardOptions> {
    const res = await fetchWithAuth(API_ENDPOINTS.FIGHTER_CARDS.OPTIONS);
    if (!res.ok) throw await toApiError(res);
    return res.json();
  },

  /** Creates the card on first read — safe to call on page load. */
  async getMyCard(): Promise<FighterCard> {
    const res = await fetchWithAuth(API_ENDPOINTS.FIGHTER_CARDS.ME);
    if (!res.ok) throw await toApiError(res);
    return res.json();
  },

  /**
   * Upload or replace the photo. PUT replaces, so an existing one need not be
   * deleted first. The body is FormData and `fetchWithAuth` sets no
   * Content-Type, which lets the browser write the multipart boundary itself.
   */
  async uploadPhoto(file: File): Promise<{ photo: string }> {
    const body = new FormData();
    body.append("photo", file);
    const res = await fetchWithAuth(API_ENDPOINTS.FIGHTER_CARDS.PHOTO, { method: "PUT", body });
    if (!res.ok) throw await toApiError(res);
    return res.json();
  },

  /** Remove the photo. 204, and idempotent. */
  async deletePhoto(): Promise<void> {
    const res = await fetchWithAuth(API_ENDPOINTS.FIGHTER_CARDS.PHOTO, { method: "DELETE" });
    if (!res.ok) throw await toApiError(res);
  },

  /** Partial save — send only the fields that changed. */
  async updateMyCard(patch: FighterCardPatch): Promise<FighterCard> {
    const res = await fetchWithAuth(API_ENDPOINTS.FIGHTER_CARDS.ME, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) throw await toApiError(res);
    return res.json();
  },
};
