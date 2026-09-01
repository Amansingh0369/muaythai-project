# Profile Sharing API

Emails a customer's record — who they are and what their fighter card says — to
an address outside the platform, so a camp, a coach or a partner agent can be
briefed without an account.

**Bookings and payments are not part of this.** A coach preparing sessions needs
the fighter, not the transaction, and a field that cannot be sent cannot leak.

Base path: `/api/users/{id}/`, where `{id}` is the **customer** being shared.
**Every endpoint here is admin-only** — `UserAdminViewSet` is `IsAdmin` for all
actions.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/users/{id}/share/preview/` | Exactly what a share would send, as JSON |
| `POST` | `/api/users/{id}/share/` | Email the dossier and record the share |
| `GET` | `/api/users/{id}/shares/` | Who this customer has already been shared with |

## Read this first

A share sends **passport numbers, medical conditions, allergies, emergency
contacts and the fighter card's "Private / Trainer Only" section** to whatever
address is typed in. A typo goes to a stranger and cannot be recalled.

Three things follow from that, and they are the reason the API is shaped this
way:

- It is **admin-only**. Not even the customer can share their own profile.
- Every successful send writes a **`ProfileShare` audit row** — who sent it,
  about whom, to whom, which sections, when. Also in the Django admin, read-only.
- `sections` lets a share carry **only what the recipient needs**. A camp
  confirming an arrival does not always need the passport.

Build the share button so the admin sees the preview before sending. That is
what `share/preview/` is for.

## The sections

| Key | Contains |
| --- | --- |
| `customer` | Account, personal details (**including passport**), emergency contact, medical notes on file |
| `fighter_card` | Card status, basic profile, training background, current fitness, goals & style, and the **private injuries/trainer section** |

Sections are always emitted in that order, whatever order they were requested
in, so every share of the same customer reads identically.

## Preview

```
GET /api/users/42/share/preview/?sections=fighter_card
```

`sections` is an optional comma-separated subset; omit it for everything. An
unknown key is a `400` naming it.

```jsonc
{
  "user": 42,
  "customer_email": "somchai@example.com",
  "sections": [
    {
      "key": "customer",
      "title": "Customer",
      "note": "",                       // set instead of blocks when there is nothing to show
      "blocks": [
        { "subtitle": "Account", "rows": [ { "label": "Name", "value": "Somchai Fighter" }, … ] }
      ]
    }
  ]
}
```

Every section is `blocks` → `rows` of `{label, value}`, already rendered for a
human: choice codes become their labels (`IMPROVE_CLINCH` → "Improve clinch"),
booleans become Yes/No, and anything the customer left blank becomes **"Not
answered"** rather than disappearing — a trainer needs to know a question went
unanswered.

A section with nothing to show carries a `note` and no blocks — "This customer
has not started a fighter card yet." That is not an error.

## Sharing

```bash
curl -X POST "$API_BASE/api/users/42/share/" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
        "email": "coach@camp.com",
        "sections": ["fighter_card"],
        "note": "Arriving Tuesday — please review the shoulder injury."
      }'
```

- `email` — required, validated.
- `sections` — optional, defaults to both. Must be non-empty if given.
- `note` — optional covering message (≤ 2000 chars), shown above the dossier.

`201` returns the audit row that was written:

```json
{
  "id": 3,
  "user": 42,
  "recipient_email": "coach@camp.com",
  "sections": ["fighter_card"],
  "note": "Arriving Tuesday — please review the shoulder injury.",
  "shared_by": 1,
  "shared_by_email": "admin@example.com",
  "created_at": "2026-09-02T09:14:00Z"
}
```

**`502` means the email did not go out.** Unlike the customer-facing booking
emails, which log and move on, a share reports its failure: the admin needs to
know, and nothing was disclosed, so no audit row is written either. Surface the
`error` message and let them retry.

## Share history

`GET /api/users/{id}/shares/` returns that customer's audit rows, newest first,
in the shape above. Worth showing under the share button — "already shared with
coach@camp.com on 2 Sep" prevents the same dossier going out three times.

## What the recipient gets

One email, subject `Fighter profile — Somchai Fighter`, in the usual branded
layout, saying who shared it with them, the covering note if there was one, then
each section as a labelled table. It closes by telling them the record is
confidential and asking them not to forward it.

The recipient gets no account, no link, and no way to reply into the platform —
it is a one-way briefing.

## A note on POST

`UserAdminViewSet` deliberately allowed only `GET`/`PATCH`/`DELETE`, because
accounts are created through `/api/auth/register/`. The share action needs
`POST`, so `POST` is now permitted on the viewset **and `create()` explicitly
raises 405** — otherwise allowing the method would have quietly exposed
ModelViewSet's user-creation endpoint. There is a test for this.
