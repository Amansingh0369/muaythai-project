# Popup Image API

The image shown in the site's first-visit popup, configurable from the admin
dashboard. The backend keeps a **library** of uploaded posters and marks at most
one of them active; the public site renders whichever one that is.

Keeping a library rather than overwriting one file means switching back to a
previous poster is a single click, and an admin can stage next month's image
before making it live.

Base path: `/api/popup-images/`. Everything except `active/` is admin-only and
needs the `Authorization: Bearer <access token>` header.

| Method | Path | Who | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/popup-images/active/` | anyone | The image the popup should show |
| `GET` | `/api/popup-images/` | admin | The whole library, newest first |
| `POST` | `/api/popup-images/` | admin | Upload a new image |
| `GET` | `/api/popup-images/{id}/` | admin | One image |
| `PATCH` | `/api/popup-images/{id}/` | admin | Edit title / alt text / active flag |
| `DELETE` | `/api/popup-images/{id}/` | admin | Delete an image |
| `POST` | `/api/popup-images/{id}/activate/` | admin | Make it the current image |
| `POST` | `/api/popup-images/{id}/deactivate/` | admin | Switch the popup off |

## The image object

```jsonc
{
  "id": 7,
  "image": "https://…/media/popup/september-batch.png",  // pre-signed S3 URL
  "title": "September batch",     // admin-facing label, for the library listing
  "alt_text": "Phuket camp — 12 September 2026",  // rendered as the <img> alt
  "is_active": true,              // exactly one image in the library has this
  "created_at": "2026-09-01T10:12:00Z",
  "updated_at": "2026-09-01T10:12:00Z"
}
```

`image` is a pre-signed URL that expires (see `AWS_QUERYSTRING_EXPIRE`, 7 days by
default), so read it fresh from the API rather than storing it anywhere.

## What the public site calls

```js
const res = await fetch(`${API_BASE}/api/popup-images/active/`);
const image = await res.json();   // null when the popup is switched off
if (image) show(image.image, image.alt_text);
```

The response is `200` with `null` — not a 404 — when no image is active, so the
caller can `await res.json()` unconditionally and treat "no popup" as a value.
That is also how an admin turns the popup off entirely: `deactivate/` the
current image, and the site stops showing one.

## Uploading

`multipart/form-data`, with `image` as the file. Add `is_active=true` to upload
and go live in one call; leave it off to stage the image in the library.

```bash
curl -X POST "$API_BASE/api/popup-images/" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "image=@september-batch.png" \
  -F "title=September batch" \
  -F "alt_text=Phuket camp — 12 September 2026" \
  -F "is_active=true"
```

Non-image files are rejected with `400`. The popup renders the poster at a 4:3
aspect ratio (`object-cover`), so upload something close to that — 1280×960 is
what the current asset uses.

Metadata edits do not need a re-upload: `PATCH` with JSON and omit `image`.

## Setting the current image

`POST /api/popup-images/{id}/activate/` (no body) makes that image the live one
and stands down whichever was active. `PATCH {"is_active": true}` does the same
thing, so the dashboard can use whichever fits its form.

"Only one active image" is a partial unique index in the database, not just
serializer logic, so two admins activating different images at the same moment
cannot both win.

## Deleting

`DELETE /api/popup-images/{id}/` removes the row and its file from S3. Deleting
the active image is allowed and simply leaves the popup with nothing to show —
`active/` starts returning `null` — so pick a replacement first if the popup
should stay up.
