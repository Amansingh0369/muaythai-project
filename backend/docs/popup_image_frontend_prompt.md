# Frontend integration prompt — Popup Image

> Paste everything below the line into the frontend agent/dev. The full API
> reference is `backend/docs/popup_image_api.md`; the backend is already built,
> tested and merged — **no backend changes are needed or wanted**.

---

Make the homepage popup's image configurable from the admin dashboard. The
backend API is live and final. Read `backend/docs/popup_image_api.md` first — it
is the contract.

## What exists today

`apps/web/src/components/GroupBatchPopup.tsx` shows a one-per-session popup on
the homepage with the nearest upcoming group departure. Its poster is currently
a hard-coded `<img src="/image.png">` (4:3, 1280×960). Everything else about the
popup — the package lookup, the session key, the animations — stays exactly as
it is. **The only thing changing on the web side is where that image comes from.**

The backend now keeps a **library** of uploaded posters with at most one marked
active, so an admin can stage next month's poster, switch back to a previous
one, or turn the popup image off entirely.

## Stack and conventions to follow (do not introduce new patterns)

- `apps/web` — Next 14 App Router, TypeScript, Tailwind, `framer-motion`.
- `apps/dashboard` — Next 14, Tailwind, `motion/react`, `@repo/ui`
  (`Button`, `Card`, `Input`), `lucide-react` icons.
- Authenticated requests go through `fetchWithAuth` from `@/lib/api` in each app
  (it attaches the bearer token and handles refresh).
- **Public** endpoints are called with plain `fetch` against
  `process.env.NEXT_PUBLIC_API_URL` — copy `packageService.getPackages` in
  `apps/web/src/services/package.service.ts`. `/popup-images/active/` is public,
  so it must work for logged-out visitors: do not send it through `fetchWithAuth`.
- Add paths to `@/lib/api-constants` under `API_ENDPOINTS`. They are relative to
  `API_CONFIG.BASE_URL`, which already includes `/api` (so `"/popup-images"`).
- One service module per resource exporting a `xxxService` object — copy the
  shape of `apps/dashboard/src/services/location.service.ts`.
- The dashboard has **no toast library**. Report errors inline the way
  `apps/dashboard/src/app/dashboard/locations/page.tsx` does (an `error` state
  with a retry button). Do not add `sonner` to the dashboard.
- Errors come back as `{ error: true, message: string, data: { field: string[] } }`.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `GET` | `/popup-images/active/` | **Public.** The live image, or `null`. |
| `GET` | `/popup-images/` | Admin. The whole library, newest first. |
| `POST` | `/popup-images/` | Admin. `multipart/form-data`, file field `image`. |
| `PATCH` | `/popup-images/{id}/` | Admin. JSON. Edit `title` / `alt_text`. |
| `DELETE` | `/popup-images/{id}/` | Admin. Also deletes the file from S3. |
| `POST` | `/popup-images/{id}/activate/` | Admin. No body. Sets the live image. |
| `POST` | `/popup-images/{id}/deactivate/` | Admin. No body. Turns the image off. |

The object:

```ts
interface PopupImage {
  id: number;
  image: string;        // pre-signed S3 URL — expires, so always read it fresh
  title: string;        // admin-facing label for the library listing
  alt_text: string;     // rendered as the <img> alt on the public popup
  is_active: boolean;   // at most one image in the library has this
  created_at: string;
  updated_at: string;
}
```

## Part 1 — `apps/web` (the public popup)

Add `POPUP_IMAGES: "/popup-images"` to `API_ENDPOINTS`, and a new
`apps/web/src/services/popup-image.service.ts` with a single public method:

```ts
async getActivePopupImage(): Promise<PopupImage | null>
```

`GET /popup-images/active/` returns **`200` with a body of `null`** when no image
is active — it is not a 404 and not a 204 — so `await res.json()` unconditionally
and return the result as-is. On a network error or a non-ok response, return
`null` rather than throwing: the popup already fails silently and must keep doing
so.

Then in `GroupBatchPopup.tsx`:

- Fetch the active image alongside the existing package fetch, and hold it in
  state next to `pkg`.
- Replace `src="/image.png"` with the fetched `image`, and the hard-coded
  `alt="Phuket Camp — 12 September 2026"` with the fetched `alt_text`.
- **Keep the existing poster block's layout untouched** — the wrapper stays
  `aspect-[4/3]` with `object-cover`, so any uploaded image is framed the same
  way and the popup cannot be broken by an odd upload size.
- **Do not let the image gate the popup.** The popup's trigger is still "a
  nearest upcoming package exists". If no image is active or the request fails,
  render the popup without the poster block (or fall back to `/image.png` — pick
  one and comment which and why). A missing poster must never suppress a
  departure announcement.
- Do not block the popup on the image request finishing — the two fetches are
  independent.

## Part 2 — `apps/dashboard` (managing the library)

New route `/dashboard/popup-image`, built the same way as the locations feature:
`page.tsx` + `hooks/usePopupImages.ts` + `components/`. Add it to `menuItems` in
both `components/dashboard/Sidebar.tsx` and `components/dashboard/MobileNav.tsx`
(`Image` from `lucide-react` is a reasonable icon).

Add `POPUP_IMAGES: "/popup-images"` to the dashboard's `api-constants`, and
`apps/dashboard/src/services/popup-image.service.ts` with:

```ts
getPopupImages(): Promise<PopupImage[]>
uploadPopupImage(file: File, data: { title?: string; alt_text?: string; is_active?: boolean }): Promise<PopupImage>
updatePopupImage(id: number, data: { title?: string; alt_text?: string }): Promise<PopupImage>
activatePopupImage(id: number): Promise<PopupImage>
deactivatePopupImage(id: number): Promise<PopupImage>
deletePopupImage(id: number): Promise<void>
```

Upload is `multipart/form-data`: append the file as `image`, plus `title`,
`alt_text` and (optionally) `is_active`. **Do not set a `Content-Type` header** —
the browser has to add the multipart boundary. `buildLocationFormData` in
`location.service.ts` is the pattern to copy.

### The page

A gallery of every image in the library, newest first, with:

1. **Upload** — a file picker with a local preview before submitting, plus
   `title` and `alt_text` inputs and a "make this the live image" checkbox.
   Accept `image/*` only. The backend rejects non-images with a `400`, so surface
   `message` from the error body.
2. **Which one is live** — the active card gets an unmistakable badge/border.
   Exactly one card can ever show it. Every other card gets a **"Set as current"**
   button calling `activate/`; the active card gets **"Turn off"** calling
   `deactivate/`.
3. **Delete** — via the existing `ConfirmModal` from `@/components/shared`
   (`isOpen`, `onClose`, `onConfirm`, `title`, `message`, `confirmText`,
   `isDestructive`, `isLoading`). Warn explicitly when the image being deleted is
   the active one: **the popup will have no image until another is set.**
4. **Empty state** — no images uploaded yet, with a prompt to upload one.
5. **"No image is live" notice** — the library is non-empty but nothing is active,
   so the popup is currently running without a poster. This is a legitimate
   state, not an error; say so plainly rather than styling it as a failure.

### State handling

- Activating is a **switch, not a toggle**: after `activate/` succeeds, the
  previously active card must stop showing as active. Refetch the list, or
  update local state by clearing `is_active` on every other entry — do not
  optimistically set two cards active at once.
- Show a per-card pending state while activate/delete is in flight and disable
  that card's buttons, so a double-click cannot fire two requests.
- Mention in the upload copy that the popup renders at 4:3 and 1280×960 is what
  the current asset uses.

## Out of scope

- Any backend change. The API is final; if something seems missing, ask rather
  than adding an endpoint.
- Redesigning the popup itself — its layout, copy, animation and once-per-session
  behaviour all stay as they are.
- Non-admin access to the dashboard route (the existing dashboard auth already
  handles this; every endpoint except `active/` is admin-only server-side).

## Definition of done

- A logged-out visitor on the homepage sees the popup poster that an admin set
  in the dashboard.
- Uploading, setting current, turning off, and deleting all work from the
  dashboard, and the public popup reflects each change on the next page load.
- With no active image, the homepage popup still appears for an upcoming
  departure and simply has no poster — nothing 404s, throws, or renders a broken
  image icon.
