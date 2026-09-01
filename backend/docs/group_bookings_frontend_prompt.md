# Frontend integration prompt — Group Bookings

> Paste everything below the line into the frontend agent/dev. The full API
> reference is `backend/docs/group_bookings_api.md`; the backend is already
> built, tested and merged — **no backend changes are needed or wanted**.

---

Let a customer book a camp **for themselves and their friends in one payment**.
The backend API is live and final. Read `backend/docs/group_bookings_api.md`
first — it is the contract.

## What it does

On the booking page, the customer can add friends by name and email. The price
multiplies by the number of people, they pay once, and everybody on the booking
is emailed their own confirmation. A friend who has never used the site gets an
account created for them and a link to set a password.

The buyer is **always** on the booking and cannot remove themselves. Adding a
friend extends their own place; it never replaces it. Max **10 people including
the buyer**.

## Stack and conventions to follow (do not introduce new patterns)

- `apps/web` — Next 14 App Router, TypeScript, Tailwind, `framer-motion`,
  `lucide-react`. This is where nearly all the work is.
- All requests go through `fetchWithAuth` from `@/lib/api`. **Never call `fetch`
  directly.**
- Extend `apps/web/src/services/order.service.ts` — do not add a new service
  module. Paths hang off `API_ENDPOINTS.ORDERS` in `@/lib/api-constants`.
- The booking flow is `apps/web/src/app/book/[id]/`: `page.tsx` +
  `booking.helpers.ts` + `booking.payment.ts` + `useBookingDraft.ts` +
  `useBookingStep.ts` + `_components/`. Follow it exactly.
- Form inputs come from `_components/FormControls.tsx` (`SectionHeader`,
  `FormField`, `TextInput`, `SelectInput`). Use them; do not hand-roll inputs.
- Money is formatted with `fmtPrice` from `booking.helpers.ts`.
- `apps/web` has **no toast library** on this page — errors render inline, the
  way `submitError` already does.

## Endpoints

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/orders/` | Now accepts an optional `guests` array |
| `PUT` | `/orders/{id}/participants/` | Replace the guest list on a pending order |
| `GET` | `/orders/my/` | Now also returns bookings the user is a guest on |
| `GET` | `/users/me/` | `orders[]` gained `is_buyer` and `participant_count` |

```ts
export interface GuestInput {
  full_name: string;
  email: string;
}

export interface OrderParticipant {
  id: number;
  user_id: number;
  full_name: string;
  email: string;
  is_buyer: boolean;
  fighter_card_complete: boolean;
}

export interface CreateOrderPayload {
  package: number;
  start_date?: string;
  guests?: GuestInput[];   // omit entirely for a solo booking
}
```

Add to the existing `Order` interface in `order.service.ts`:

```ts
  participants: OrderParticipant[];
  participant_count: number;
  subtotal_amount: string;
  discount_amount: string;
```

Add to `orderService`:

```ts
setParticipants(
  orderId: number,
  guests: GuestInput[],
): Promise<Order & { coupon_removed: string | null }>
```

## Part 1 — Adding friends at checkout (`apps/web/src/app/book/[id]/`)

The guest list belongs in `BookingFormStep`, as a **new section below the
existing personal/emergency/travel sections** and above the submit button. Use
`SectionHeader` with a `Users` or `UserPlus` icon from `lucide-react` so it reads
as one more step in the same form.

### The section

- Heading along the lines of **"Bring a friend"**, with one line of helper text:
  *"Book their place on the same payment. We'll email them their own confirmation
  and set up their account."*
- The buyer appears as a **fixed first row** — their own name and email, visibly
  not removable. This is the whole point of the feature and must be obvious, not
  implied by an empty list.
- **Add another fighter** button appends an empty `{ full_name, email }` row.
  Each row is a `full_name` `TextInput` + an `email` `TextInput` + a remove
  button. Start with **zero** guest rows: a solo booking must not require
  dismissing anything.
- Disable **Add another fighter** at 9 guests (10 including the buyer) and say
  why in one line rather than failing silently on submit.

### Guest state

Hold guests in `BookingValues` in `booking.helpers.ts` as `guests: GuestInput[]`,
so they ride along with the existing draft, validation and
`fillBlanks` machinery:

- Add `guests: []` to `EMPTY_VALUES`.
- `useBookingDraft` persists it automatically — **check the draft round-trips an
  array**, since the existing values are all strings.
- Extend `validateValues` for guests: both fields required per row, a real email
  shape, no duplicates (case-insensitive), and not the buyer's own address. Key
  the errors per row index so they render against the right input.

Validate all of that client-side. The backend enforces the same rules and returns
them under `data.guests`, but a customer should not have to submit to find out
they typed their own address.

### Pricing must update live

This is the part most likely to be got wrong: **`BookingSummaryCard` currently
renders `pkg.price` as the total.** With guests, the total is
`pkg.price × (guests.length + 1)`.

Update the card to show, in this order:

```
Camp fee            ₹20,000 × 3
Total Amount        ₹60,000
```

Keep `Duration` and `Start date` rows as they are. When there are no guests, keep
the current single-line display — do not show "× 1".

Compute it client-side for display only. **The backend is the authority on
price**; the amount actually charged comes from `POST /payments/create-order/`,
which is already how this flow works. Never send an amount.

### Submitting

`runBooking` in `page.tsx` changes in exactly one place:

```ts
const order = await orderService.createOrder({
  package: pkg.id,
  ...(v.guests.length > 0 && { guests: v.guests }),
});
```

Everything after it — `loadRazorpayScript`, `createRazorpayOrder`,
`openRazorpayCheckout`, `clearDraft` — is unchanged. The Razorpay amount already
comes from the server, so it picks up the group total for free.

The success overlay should acknowledge the group: *"Booking confirmed — we've
emailed all 3 fighters"* when there are guests.

### Server-side validation errors

`400` responses look like `{ error: true, message, data: { guests: ["..."] } }`.
Read `data.guests` and render it against the guest section, not as a generic
page-level error. The three messages the API sends are already customer-ready —
show them as given:

| Cause | Message |
| --- | --- |
| Buyer's own address in `guests` | `You are already on this booking — you do not need to add yourself as a guest.` |
| Same address twice | `<email> appears on this booking more than once.` |
| More than 10 people | `A booking can cover at most 10 people, including you. …` |

## Part 2 — Bookings on the profile page (`apps/web/src/app/profile/page.tsx`)

The page reads `fullUser.orders` from `/users/me/`. That list now includes
bookings a **friend** made for this user. Two new fields on `UserOrder` in
`user.service.ts`:

```ts
  is_buyer: boolean;
  participant_count: number;
  total_amount: string | null;   // was string — null for a guest
```

- **`total_amount` is `null` when `is_buyer` is false.** Handle it. This is
  deliberate: a group total covers their friend's place as well as their own, so
  the API does not tell a guest what someone else spent. Render something like
  *"Booked by a friend"* where the price would go — **not** `₹NaN`, not `₹0`.
- Badge a guest booking so the two are distinguishable at a glance.
- Show `participant_count` when it is above 1 — *"3 fighters"*.
- Offer no cancel or pay action on a booking where `is_buyer` is false. The API
  returns `403`.

## Part 3 — The fighter card nudge

Every confirmation email tells a participant whose fighter card is unfinished to
complete it before the camp, linking to `/profile/fighter-card`. Make the app
agree with the email:

- `participants[].fighter_card_complete` comes back on every order. On the
  profile page, if the signed-in user has a booking and an incomplete card, show
  a prompt linking to `/profile/fighter-card`.
- If the fighter card frontend (`backend/docs/fighter_card_frontend_prompt.md`)
  is not built yet, **link to `/profile` and leave a TODO** rather than inventing
  a route. Do not build the card form as part of this task.

## Part 4 — Invited friends land on `/reset-password`

An account created for a friend has no password, so their email's button is a
password-reset link pointing at the **existing** `/reset-password` route. It
already works and needs no change.

Two things to verify rather than build:

- The page handles a user who is setting a password for the **first** time. If
  the copy says "Reset your password", that is acceptable; if it says anything
  that assumes they had one, soften it.
- After a successful set, they can sign in immediately — the backend marks the
  address verified at that point. Route them to `/profile` on success.

## Part 5 — Admin (`apps/dashboard`) — small

`apps/dashboard/src/app/dashboard/orders/`. The order list is unchanged, but an
order now covers several people:

- Add `participants: OrderParticipant[]` and `participant_count: number` to
  `Order` in `apps/dashboard/src/services/order.service.ts`.
- Show the count in `OrderRow.tsx` — *"3 fighters"* — and list the participants'
  names and emails wherever the row expands to detail.
- Flag participants whose `fighter_card_complete` is `false`, since that is what
  staff chase before a camp starts.

Nothing else in the dashboard changes. Do not add participant editing there — the
API only allows it on pending orders, and only for the buyer.

## Out of scope

- Any backend change. The API is final; if something seems missing, ask rather
  than adding an endpoint.
- Editing guests after payment. The API refuses it (`400`) — a paid booking is
  fixed, and the UI should not offer it.
- Letting a guest cancel, pay for, or re-price a booking. All `403`.
- Building the fighter card form. Separate prompt, separate task.
- Anything that shows a guest what the booking cost.

## Definition of done

- A customer can book for themselves alone, exactly as today, with no extra
  clicks.
- Adding two friends triples the total in the summary card **before** payment,
  and Razorpay charges that same amount.
- Typing your own email as a guest is caught in the form, not by the server.
- After payment, all three people receive an email; the friends can set a
  password from the link and sign in.
- A friend signing in sees the booking on their profile, badged as booked by
  someone else, with no price and no cancel button.
