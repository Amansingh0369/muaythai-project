# Frontend integration prompt — Profile Sharing

> Paste everything below the line into the frontend agent/dev. The full API
> reference is `backend/docs/profile_sharing_api.md`; the backend is already
> built, tested and merged — **no backend changes are needed or wanted**.

---

Add a **Share** button to each student in the admin dashboard. The backend API
is live and final. Read `backend/docs/profile_sharing_api.md` first — it is the
contract.

## What it does

An admin picks a student, types an email address, and that person's record is
emailed to the address: who they are, and what their fighter card says. The
recipient needs no account — it is a one-way briefing for a camp, a coach, or a
partner agent.

**Bookings and payments are not part of this.** There are exactly two sections,
`customer` and `fighter_card`. Nothing about orders, amounts or transactions
appears anywhere in the API or the email.

## Read this before you build the UI

A share sends **passport numbers, medical conditions, allergies, emergency
contacts and the fighter card's private "Trainer Only" section** to whatever
address is typed in. A typo goes to a stranger and cannot be recalled.

The UI is the last line of defence, so it is not just a form:

- **Preview before send is the core of this feature, not a nice-to-have.** The
  admin must see exactly what will leave before it leaves. Build the flow around
  the preview endpoint.
- **Section checkboxes must be prominent, not hidden in an "advanced" panel.**
  A camp confirming an arrival date does not always need the passport.
- **Never pre-fill the recipient address** from the student, browser autofill, or
  the last share. It must be typed or pasted deliberately every time.

## Stack and conventions to follow (do not introduce new patterns)

- This is `apps/dashboard` only. **Nothing changes in `apps/web`** — the customer
  never sees any of this.
- Next 14 App Router, TypeScript, Tailwind, `motion/react`, `lucide-react`,
  `@repo/ui` (`Button`, `Card`, `Input`).
- All requests go through `fetchWithAuth` from `@/lib/api`.
- Extend the existing `userService` in `apps/dashboard/src/services/user.service.ts`
  rather than adding a new service module — these are user actions and belong
  next to `updateUserRole`. Paths hang off `API_ENDPOINTS.USERS`.
- The students feature lives in `apps/dashboard/src/app/dashboard/students/`:
  `page.tsx` + `hooks/useStudents.ts` + `components/StudentRow.tsx` +
  `components/StudentModal.tsx`. Follow it; `StudentModal.tsx` is the modal
  pattern to copy.
- The dashboard has **no toast library**. Do not add `sonner`.

## Endpoints

All three are admin-only; the dashboard's existing auth already covers that.
`{id}` is the **student's** user id.

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/users/{id}/share/preview/?sections=fighter_card` | What a share would send. Sends nothing. |
| `POST` | `/users/{id}/share/` | Sends the email, returns the audit row. |
| `GET` | `/users/{id}/shares/` | Who this student was already shared with. |

```ts
type ShareSection = "customer" | "fighter_card";

interface DossierRow { label: string; value: string }
interface DossierBlock { subtitle: string; rows: DossierRow[] }
interface DossierSection {
  key: ShareSection;
  title: string;
  note: string;              // set INSTEAD of blocks when there is nothing to show
  blocks: DossierBlock[];
}
interface SharePreview {
  user: number;
  customer_email: string;
  sections: DossierSection[];
}
interface ProfileShare {
  id: number;
  user: number;
  recipient_email: string;
  sections: ShareSection[];
  note: string;
  shared_by: number | null;
  shared_by_email: string | null;
  created_at: string;
}
```

Add to `userService`:

```ts
previewProfileShare(id: number, sections?: ShareSection[]): Promise<SharePreview>
shareProfile(id: number, input: { email: string; sections?: ShareSection[]; note?: string }): Promise<ProfileShare>
getProfileShares(id: number): Promise<ProfileShare[]>
```

`sections` goes to the preview as a **comma-separated query string**
(`?sections=customer,fighter_card`) and to the POST as a **JSON array**. Omit it
entirely for "everything" — do not send an empty array, the API rejects that.

## The section data is already rendered for humans

Do not format, map, or prettify the dossier. The backend has already turned
choice codes into labels ("Improve clinch"), booleans into Yes/No, and
unanswered questions into the literal string **"Not answered"**. Render `label`
and `value` as given.

Two structural cases to handle:

- A section with a **`note` and empty `blocks`** has nothing to show — "This
  customer has not started a fighter card yet." Render the note as plain
  informational text. **This is not an error state** — do not style it as a
  warning or hide the section.
- `block.subtitle` groups rows within a section ("Account", "Personal details",
  "Emergency contact", "Medical notes on file"). Render it as a subheading; it
  is `""` for ungrouped blocks.

## The share modal

Opened from a **Share** button on `StudentRow` (a `Share2` or `Send` icon from
`lucide-react`, sitting alongside the existing edit / role / delete buttons).
Title it with the student — "Share Somchai Fighter's profile".

1. **Recipient email** — required, type `email`. Empty and never pre-filled.
2. **Sections** — two checkboxes, both ticked by default, labelled so the
   consequence is obvious. Suggested labels and helper text:
   - Customer — contact details, **passport**, emergency contact, medical notes
   - Fighter card — training history and the **private injuries/medical section**

   At least one must stay ticked; disable Send when neither is.
3. **Note** — optional textarea, max 2000 characters, shown to the recipient
   above the dossier.
4. **Preview** — fetch `share/preview/` for the currently ticked sections and
   render it inside the modal, in a scrollable area. Re-fetch when the ticks
   change (debounce it; do not fire a request per keystroke elsewhere in the
   form). Show a spinner in the preview area only — never block the whole modal.
5. **Send** — disabled while sending, and disabled until the email field is
   valid. Show a clear pending state; a double-click must not send twice.

## Error handling

Errors come back as `{ error: true, message, data }` or `{ error: "..." }`
depending on the endpoint — read `error`, then `message`, then fall back to a
generic string, the way `updateUserRole` already does.

- **`502` means the email did not go out and nothing was recorded.** Say exactly
  that and keep the modal open with the form intact so they can retry — do not
  close it, and do not report success. This is the one error the admin most
  needs to read, so show it **inline in the modal**, not through `alert()`.
- `400` is a validation error — a malformed address, or no sections. Show it
  against the field it belongs to.
- On success, close the modal and confirm plainly which address it went to.

Note that `useStudents.ts` currently uses `alert()` for failures. Do not extend
that into the share modal; inline messages there, since the text matters.

## Share history

`GET /users/{id}/shares/` returns previous shares, newest first. Show it in the
modal under the form — "Already shared with coach@camp.com on 2 Sep by
admin@example.com". It stops the same dossier going out three times, and it is
the audit trail the backend keeps, so make it visible rather than burying it.

If the student has never been shared, say so in one line rather than rendering
an empty box.

## Out of scope

- Any backend change. The API is final; if something seems missing, ask rather
  than adding an endpoint.
- Anything in `apps/web`.
- Letting a customer share their own profile — the API forbids it (`403`), and
  no customer-facing UI should suggest otherwise.
- Any booking, order or payment detail. It is not in the API, and asking for an
  `order` or `payment` section would just produce a `400`.
- A share button on the orders page. This hangs off the student, not the booking.

## Definition of done

- An admin can open a student, tick sections, preview exactly what will be sent,
  send it, and see the address confirmed.
- Unticking "Customer" visibly removes the passport and medical rows from the
  preview before anything is sent.
- A student with no fighter card previews and sends fine, showing the
  explanatory note rather than an error.
- A failed send leaves the modal open with a readable explanation and no false
  claim of success.
