# Frontend integration prompt — Fighter Card

> Paste everything below the line into the frontend agent/dev. The full API
> reference is `backend/docs/fighter_card_api.md`; the backend is already built,
> tested and merged — no backend changes are needed or wanted.

---

Implement the **Fighter Card** feature in this monorepo. The backend API is live
and final. Read `backend/docs/fighter_card_api.md` first — it is the contract.

## What the fighter card is

A pre-arrival training profile the customer fills in before their Muay Thai
camp: training background, current fitness, goals & style, and a **private
injuries/medical section that only the customer and the trainers ever see**.
There is one card per user, it is filled in over several sittings, and trainers
read it to plan sessions.

## Stack and conventions to follow (do not introduce new patterns)

- `apps/web` — Next 14 App Router, TypeScript, Tailwind, Radix/shadcn components,
  `react-hook-form` + `zod`, `sonner` for toasts. Customer-facing form goes here.
- `apps/dashboard` — Next 14, same auth. Admin roster goes here.
- All requests go through `fetchWithAuth` from `@/lib/api` (it attaches the
  bearer token and handles refresh). **Never call `fetch` directly.**
- Add endpoints to `@/lib/api-constants` in `API_ENDPOINTS` — paths are relative
  to `API_CONFIG.BASE_URL`, which already includes `/api` (e.g. `"/fighter-cards/me/"`).
- One service module per resource, typed, exporting a `xxxService` object —
  copy the shape of `apps/web/src/services/user.service.ts`.
- Errors come back as `{ error: true, message: string, data: { field: string[] } }`.
  Map `data` keys onto form fields; fall back to `message` for a toast.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/fighter-cards/options/` | Public. Every choice set, caps, scale labels. Cache it. |
| `GET` | `/fighter-cards/me/` | Creates the card on first read — safe to call on page load. |
| `PATCH` | `/fighter-cards/me/` | Partial save. Send only changed fields. |
| `GET` | `/fighter-cards/` | Admin only. Compact roster. |
| `GET` / `PATCH` / `DELETE` | `/fighter-cards/{id}/` | Admin only. Full card + `profile_medical`. |

## Part 1 — Customer form (`apps/web`)

Route: `/profile/fighter-card` (linked from the existing `/profile` page).

**Build every dropdown and option list from `GET /fighter-cards/options/`.** Do
not hard-code labels or codes anywhere in the frontend — options can be added
backend-side, and the response also carries `limits`, `exclusive_choices`,
`scales` (with slider anchor labels), `private_fields` and
`required_for_completion`. Each choice set is `[{ value, label }]` keyed by the
field it belongs to.

### Sections and controls

1. **Basic profile** — `camp` is prefilled from the customer's booking: render
   `camp_detail.name` read-only and **do not ask which camp they are joining**.
   Only show a camp picker if `camp` comes back `null` (options from
   `/locations/`). `nationality` = searchable single Select (249 countries,
   ISO alpha-2 codes). `city` = text input.
2. **Training background** — `training_duration`, `training_frequency`,
   `sparring_experience`, `competition_experience` are single-select;
   `trained_in_thailand` is Yes/No; `other_combat_sports` is multi-select.
3. **Current fitness** — `exercise_frequency`, `cardio_level`,
   `five_round_capability` single-select; `overall_fitness` is a 1–10 slider
   labelled from `scales.overall_fitness.labels`.
4. **Goals & style** — `goals` multi-select **capped at 3**, `primary_focus`
   single-select with an optional `primary_focus_notes` textarea,
   `fighting_styles` capped at 2, `favourite_techniques` capped at 2.
5. **Injuries & trainer information** — visually separated and clearly labelled
   **Private — trainer only** (distinct card/background, lock icon, short note
   explaining who sees it). Fields listed in `private_fields`. Includes the
   `coach_intensity` 1–10 slider, a `train_around_limitations` switch, and the
   `message_to_kru` textarea.

Prefer radio groups over dropdowns for short single-selects, chips/toggles for
multi-selects, and Radix `Slider` for the two scales. The form must not feel
like an interrogation — one section per step or accordion panel, not one long
wall of checkboxes.

### Behaviour

- **Save per section** with `PATCH` (partial) — the fighter must be able to
  leave and come back. Nothing is required until they answer it.
- **Progress** comes from the response: `missing_fields` (array of unanswered
  required field names) and `is_complete`. Show a progress bar and mark which
  sections still have gaps. Do not compute completeness yourself.
- **Conditional questions** — show a follow-up only while its trigger is on:
  | Follow-up | Shown when | Required |
  | --- | --- | --- |
  | `thailand_trips` | `trained_in_thailand === true` | yes |
  | `fight_count` | `competition_experience !== "NEVER"` | optional |
  | `injury_areas`, `injury_notes` | `injury_status` is `YES_MINOR`/`YES_MODERATE`/`YES_SIGNIFICANT` | areas required, notes optional |
  | `past_injury_types` | `has_past_major_injury === true` | yes |
  | `medical_details` | `has_medical_condition === true` | yes |

  `PREFER_TO_DISCUSS` counts as *no* current injury — it opens nothing.
  When a trigger is switched off, send only the trigger; the server clears the
  stale follow-up. Sending a closed follow-up's value is a 400.
- **Multi-select rules** — enforce `limits` in the UI (disable further options
  at the cap and say why), block duplicates, and make the `exclusive_choices`
  values (`NONE`, `NO_RESTRICTIONS`, `NOT_SURE_YET`) clear every other selection
  when picked. The server enforces all of this too; the UI must not be the only
  guard, and a 400 must render on the right field.
- Empty answers come back as `""` / `[]` / `null`, not `undefined`. Clearing a
  field means sending `""`, `[]` or `null`.

## Part 2 — Admin roster (`apps/dashboard`)

- A **Fighter Cards** page listing `GET /fighter-cards/` (plain array, no
  pagination). Columns: fighter name/email, camp, nationality/city, training
  duration, cardio level, `coach_intensity`, and badges for `has_injury`,
  `train_around_limitations` and `is_complete`.
- Filters wired to the query params: `camp` (location id), `is_complete`,
  `has_injury`, `nationality`, `search` (email, name or city).
- Clicking a row opens the full card (`GET /fighter-cards/{id}/`), rendered in
  the same five sections, labels resolved through the options endpoint. The
  private section shows the card's own answers **and** `profile_medical`
  (`medical_conditions`, `allergies` from the account profile, read-only, may be
  `null`) side by side — a trainer must not have to look in two places.
- Admins may `PATCH` corrections and `DELETE` a card. `POST` is not supported.

## Types (mirror these exactly)

```ts
export type FighterCard = {
  id: number;
  user: number; user_email: string; user_full_name: string | null;
  camp: number | null;
  camp_detail: { id: number; name: string; city: string } | null;

  nationality: string; city: string;

  training_duration: string; training_frequency: string;
  trained_in_thailand: boolean | null; thailand_trips: string;
  other_combat_sports: string[];
  competition_experience: string; fight_count: string; sparring_experience: string;

  exercise_frequency: string; cardio_level: string;
  five_round_capability: string; overall_fitness: number | null;

  goals: string[]; primary_focus: string; primary_focus_notes: string;
  fighting_styles: string[]; favourite_techniques: string[];

  // private — trainer only
  injury_status: string; injury_areas: string[]; injury_notes: string;
  has_past_major_injury: boolean | null; past_injury_types: string[];
  training_restrictions: string[]; training_restrictions_notes: string;
  has_medical_condition: boolean | null; medical_details: string;
  coach_intensity: number | null; train_around_limitations: boolean;
  message_to_kru: string;

  is_complete: boolean; missing_fields: string[];
  completed_at: string | null; created_at: string; updated_at: string;
};

// admin detail only
export type AdminFighterCard = FighterCard & {
  profile_medical: { medical_conditions: string | null; allergies: string | null } | null;
};

export type ChoiceOption = { value: string; label: string };
```

## Do not

- Hard-code choice labels, country lists or codes — read `/options/`.
- Re-ask which camp they are joining when `camp` is already set.
- Persist any part of the private/medical section in `localStorage` or logs.
- Treat client-side validation as sufficient, or swallow a 400 into a generic toast.
- Change anything under `backend/`, or invent endpoints that are not listed above.

## Done when

- A logged-in customer can complete the whole card across sittings, see accurate
  progress, and reload without losing answers.
- Every cap, exclusive option and conditional question behaves as described, and
  a server 400 surfaces on the field that caused it.
- The private section is visually unmistakable on both the form and the dashboard.
- An admin can filter the roster and open a full card including `profile_medical`.
- `pnpm type-check` and `pnpm lint` pass.
