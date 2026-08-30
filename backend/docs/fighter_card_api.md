# Fighter Card API

The fighter card is the pre-arrival training profile a customer fills in before
their camp. There is **one card per user** — the answers describe the fighter,
not the trip — so a returning customer edits the card they already have.

Base path: `/api/fighter-cards/`. All endpoints except `options/` need the
`Authorization: Bearer <access token>` header.

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/fighter-cards/options/` | anyone | Every dropdown/choice set the form needs |
| `GET` | `/api/fighter-cards/me/` | fighter | Own card (created on first read) |
| `PATCH` / `PUT` | `/api/fighter-cards/me/` | fighter | Save answers |
| `PUT` | `/api/fighter-cards/me/photo/` | fighter | Upload or replace the card photo (multipart) |
| `DELETE` | `/api/fighter-cards/me/photo/` | fighter | Remove the photo |
| `GET` | `/api/fighter-cards/` | admin | Roster of cards (compact) |
| `GET` | `/api/fighter-cards/{id}/` | admin | One full card, private section included |
| `PATCH` | `/api/fighter-cards/{id}/` | admin | Correct a card |
| `DELETE` | `/api/fighter-cards/{id}/` | admin | Delete a card |

## Building the form

`GET /api/fighter-cards/options/` returns every choice set as
`[{ "value": "...", "label": "..." }]`, keyed by the field it belongs to, plus:

```jsonc
{
  "nationality": [{ "value": "GB", "label": "United Kingdom" }, ...],  // 249 ISO 3166-1 countries
  "training_duration": [...], "training_frequency": [...], "thailand_trips": [...],
  "other_combat_sports": [...], "competition_experience": [...], "fight_count": [...],
  "sparring_experience": [...], "exercise_frequency": [...], "cardio_level": [...],
  "five_round_capability": [...], "goals": [...], "primary_focus": [...],
  "fighting_styles": [...], "favourite_techniques": [...], "injury_status": [...],
  "injury_areas": [...], "past_injury_types": [...], "training_restrictions": [...],

  "limits": { "goals": 3, "fighting_styles": 2, "favourite_techniques": 2 },
  "exclusive_choices": {           // picking this value clears every other option
    "other_combat_sports": "NONE",
    "fighting_styles": "NOT_SURE_YET",
    "favourite_techniques": "NOT_SURE_YET",
    "training_restrictions": "NO_RESTRICTIONS"
  },
  "scales": {
    "overall_fitness": { "min": 1, "max": 10,
      "labels": { "1": "Very low fitness", "5": "Average", "10": "Excellent fitness" } },
    "coach_intensity": { "min": 1, "max": 10,
      "labels": { "1": "Keep it light", "5": "Challenging but manageable",
                  "10": "Push me to my limit" } }
  },
  "photo": {                       // what the upload endpoint will accept
    "max_bytes": 5242880,
    "content_types": ["image/jpeg", "image/png", "image/webp"],
    "extensions": ["jpg", "jpeg", "png", "webp"]
  },
  "private_fields": ["injury_status", ...],        // render under "Private / Trainer only"
  "required_for_completion": ["nationality", ...]  // what `is_complete` waits for
}
```

Build the dropdowns from this rather than hard-coding labels — options can be
added backend-side without a frontend release, and the codes the client posts
then cannot drift from the ones the API accepts.

## The card

`GET /api/fighter-cards/me/` creates the card on first read, so the form always
has something to PATCH into. Answers are saved a section (or a field) at a time
with `PATCH`; nothing is required until the fighter answers it.

```jsonc
{
  "id": 12,
  "user": 4, "user_email": "fighter@example.com", "user_full_name": "Alex Kerr",

  "camp": 3,                                        // Thailand camp (location id)
  "camp_detail": { "id": 3, "name": "Sitmonchai", "city": "Kanchanaburi" },
  "photo": "https://.../fighter-cards/alex_k3f9.jpg",  // null until uploaded; required for completion
  "nationality": "GB", "city": "Manchester",

  "training_duration": "ONE_TO_TWO_YEARS", "training_frequency": "THREE_DAYS",
  "trained_in_thailand": true, "thailand_trips": "ONCE",
  "other_combat_sports": ["BOXING", "BJJ"],
  "competition_experience": "MUAY_THAI", "fight_count": "TWO_TO_FIVE",
  "sparring_experience": "REGULARLY",

  "exercise_frequency": "FOUR_DAYS", "cardio_level": "GOOD",
  "five_round_capability": "YES_BUT_TIRED", "overall_fitness": 7,

  "goals": ["IMPROVE_CLINCH", "BUILD_ENDURANCE", "IMPROVE_SPARRING"],
  "primary_focus": "CLINCH", "primary_focus_notes": "Struggle to control the neck.",
  "fighting_styles": ["TECHNICAL", "PRESSURE_FIGHTER"],
  "favourite_techniques": ["KNEES", "TEEP"],

  // Private / Trainer only
  "injury_status": "YES_MINOR", "injury_areas": ["KNEE"],
  "injury_notes": "Left knee aches after heavy kicking.",
  "has_past_major_injury": true, "past_injury_types": ["LIGAMENT"],
  "training_restrictions": ["HARD_SPARRING"], "training_restrictions_notes": "",
  "has_medical_condition": false, "medical_details": "",
  "coach_intensity": 8, "train_around_limitations": true,
  "message_to_kru": "I'd like to work the clinch every session.",

  "is_complete": true,
  "missing_fields": [],                 // required questions still unanswered
  "completed_at": "2026-08-30T10:04:11Z",
  "created_at": "...", "updated_at": "..."
}
```

`camp` is filled in from the customer's booking (paid orders first, then the
most recent pending one), so the form should not ask for it again — show
`camp_detail` read-only and only offer a picker if it comes back `null`.

`is_complete` / `missing_fields` drive the progress indicator: a card is complete
once every field in `required_for_completion` is answered — `photo` among them,
which is the one entry that is not written through this endpoint. `completed_at` is set
the first time that happens and never moves afterwards.

## The photo

The card carries one photo, so a trainer can put a face to it before the
fighter walks in. It has its own endpoint rather than riding on `/me/`:
the form saves a section at a time as JSON, and a file field on that endpoint
would drag every partial save onto multipart.

```
PUT /api/fighter-cards/me/photo/     Content-Type: multipart/form-data
photo=<file>
```

Returns `200` with `{ "photo": "https://..." }`. `PUT` replaces whatever is
already there and the previous file is deleted from storage, so uploading
again is the way to change a photo — there is nothing to clean up first.

```
DELETE /api/fighter-cards/me/photo/  →  204
```

Removing a photo that is not there is also a `204`; the endpoint is idempotent.
Like `GET /me/`, either verb creates the card if the fighter has not opened the
form yet.

What the server accepts — the same numbers are published under `photo` in the
options response, so the file input can be built from one source:

- **At most 5 MB.** Larger uploads come back `400`, not `413`.
- **JPEG, PNG or WebP.** HEIC (what an iPhone shoots by default) is *not*
  decodable server-side and is refused with a readable error; browsers convert
  to JPEG when the photo comes through a normal file picker, so this rarely
  surfaces in practice. A native mobile client uploading the raw camera file
  must convert it first.
- Anything that is not a real image is refused, whatever it is named.

Errors use the standard envelope, keyed on `photo`:

```json
{ "error": true, "message": "...",
  "data": { "photo": ["Keep the photo under 5 MB."] } }
```

Two things to know about reading it back:

- `photo` is **read-only on every card endpoint** — `/me/` and the admin
  `/{id}/` alike. Sending it in a section `PATCH` is ignored rather than
  honoured, so a stale `photo: null` in a form payload can never blank the real
  one. The fighter changes it through the endpoint above; staff who need to
  remove one do it from the Django admin, where the field is editable and the
  card page shows a preview.
- The URL is a **time-limited signed S3 link** (it expires, by default after
  7 days). Render it, but do not store it as if it were permanent — re-read the
  card to get a fresh one.

The photo **is required for completion**. `photo` is in
`required_for_completion`, appears in `missing_fields` until one is uploaded,
and a card cannot go `is_complete` without it — so finishing a card always
takes both calls: the answers by `PATCH`, the photo by `PUT`. Removing a photo
from a complete card makes it incomplete again, though `completed_at` keeps its
original value the way it does for every other answer.

## Validation

Errors come back in the project's standard envelope, with per-field messages
under `data`:

```json
{ "error": true, "message": "...",
  "data": { "goals": ["Select at most 3 options."] } }
```

Rules the server enforces (mirror them in the UI, but the server is the
authority):

- **Caps** — 3 goals, 2 fighting styles, 2 favourite techniques.
- **No duplicates** in any multi-select.
- **Exclusive options** — `NONE`, `NO_RESTRICTIONS` and `NOT_SURE_YET` cannot be
  combined with another option in the same list.
- **Scales** — `overall_fitness` and `coach_intensity` must be 1–10.
- **Conditional questions** — a follow-up may only be answered while its trigger
  is on, and is required once it is:

  | Follow-up | Open when | Required? |
  | --- | --- | --- |
  | `thailand_trips` | `trained_in_thailand` is `true` | yes |
  | `fight_count` | `competition_experience` is not `NEVER` | optional |
  | `injury_areas` | `injury_status` is `YES_MINOR`/`YES_MODERATE`/`YES_SIGNIFICANT` | yes |
  | `injury_notes` | same as above | optional |
  | `past_injury_types` | `has_past_major_injury` is `true` | yes |
  | `medical_details` | `has_medical_condition` is `true` | yes |

  `PREFER_TO_DISCUSS` counts as *no* current injury for this purpose — it never
  demands details.

  Switching a trigger off (`trained_in_thailand: false`) clears the stale
  follow-up instead of erroring, so the UI can send just the changed field.

## Admin card detail

`GET /api/fighter-cards/{id}/` returns everything above plus the medical notes
the customer gave on their **account profile**, read-only:

```jsonc
"profile_medical": {
  "medical_conditions": "Type 1 diabetes.",
  "allergies": "Penicillin."
}
```

Medical information reaches the platform by two routes — this section of the
card, and the older profile fields filled in at signup — so the card carries
both and a trainer never has to know to look in two places. It is `null` if the
customer has no profile row, and editing it here does nothing: the profile is
written through `/api/users/`. The Django admin card page shows the same block
inside the private section.

## Admin roster

`GET /api/fighter-cards/` returns the compact card — identity, camp, `photo`,
headline levels, `has_injury`, `train_around_limitations`, `is_complete` —
without the private free text, which travels only on the detail response. The
photo is on the roster so the list can show a thumbnail without a second call.

Query parameters: `camp` (location id), `is_complete` (`true`/`false`),
`has_injury` (`true`/`false`), `nationality` (ISO code), `search` (email, name
or city).

Cards cannot be created through the admin endpoint (`POST` → 405); a card exists
because its fighter opened `/me/`.
