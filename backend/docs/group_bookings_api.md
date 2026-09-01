# Group Bookings API

One order can cover several people: the buyer books their own place and adds
friends alongside it, pays once for all of them, and everybody the booking
covers is emailed their own confirmation.

Base path: `/api/orders/`. Every endpoint here needs an authenticated user.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/api/orders/` | Place a booking, optionally with guests |
| `PUT` | `/api/orders/{id}/participants/` | Replace the guest list on a pending booking |
| `GET` | `/api/orders/my/` | Bookings the user placed **or is a participant on** |
| `POST` | `/api/orders/{id}/apply-coupon/` | Unchanged, but now priced against the whole booking |

## The model

An order has one **buyer** (`order.user` — who placed it and pays) and one or
more **participants** (who it is for). The buyer is always the first
participant and cannot be left off: adding a friend extends the buyer's own
place, it never replaces it.

Every participant is a real user account, because the fighter card the trainers
read before a camp is per-user. A friend who has never used the site therefore
gets an account created for them at checkout — unverified, with no usable
password. Their confirmation email carries the link that lets them set one.
Naming someone at checkout never gives the buyer access to their account.

A booking covers at most **10 people including the buyer**
(`orders.models.MAX_ORDER_PARTICIPANTS`).

## Placing a booking

```http
POST /api/orders/
{
  "package": 12,
  "start_date": "2026-11-02",
  "guests": [
    {"full_name": "Ben Friend", "email": "ben@example.com"},
    {"full_name": "Cara Chen", "email": "cara@example.com"}
  ]
}
```

`guests` is **write-only and optional** — omit it for a solo booking. Do not put
the buyer in it; they are added automatically.

The response is the order, with the participants read back:

```json
{
  "id": 41,
  "package": 12,
  "participant_count": 3,
  "subtotal_amount": "60000.00",
  "discount_amount": "0.00",
  "total_amount": "60000.00",
  "status": "PENDING",
  "participants": [
    {"id": 90, "user_id": 7,  "full_name": "Anya Buyer", "email": "anya@example.com",
     "is_buyer": true,  "fighter_card_complete": true},
    {"id": 91, "user_id": 31, "full_name": "Ben Friend", "email": "ben@example.com",
     "is_buyer": false, "fighter_card_complete": false},
    {"id": 92, "user_id": 32, "full_name": "Cara Chen", "email": "cara@example.com",
     "is_buyer": false, "fighter_card_complete": false}
  ]
}
```

`fighter_card_complete` is there so a checkout or bookings page can show the
buyer who on their booking still has a card to finish — the same thing the
emails nudge each participant about.

### Pricing

`subtotal_amount` is the package price **once per participant**, always computed
server-side. A coupon applies once to that whole subtotal, so a
minimum-order code is measured against what the booking actually costs, not
against one place on it. Posted amounts are ignored.

### Validation errors

All returned as `400` with the message under `data.guests`:

| Cause | Message |
| --- | --- |
| Buyer's own address in `guests` | `You are already on this booking — you do not need to add yourself as a guest.` |
| Same address twice (case-insensitive) | `<email> appears on this booking more than once.` |
| More than 10 people | `A booking can cover at most 10 people, including you. …` |

## Changing who a booking covers

```http
PUT /api/orders/41/participants/
{"guests": [{"full_name": "Ben Friend", "email": "ben@example.com"}]}
```

Replaces the whole guest list — send the list you want, not a diff. `{"guests":
[]}` shrinks the booking back to the buyer alone. **Pending orders only**;
a paid booking returns `400`.

Two things happen automatically:

- **`razorpay_order_id` is cleared.** That gateway order is locked to the old
  amount, so it cannot survive a change to how many people are being paid for.
  The frontend must call `/api/payments/create-order/` again.
- **A coupon that no longer qualifies is dropped**, e.g. a minimum-order code on
  a booking that just shrank. The response carries `coupon_removed` — the code
  that was dropped, or `null` — so the customer can be told why their total
  moved by more than one place's worth.

## Who can do what

A booking is **visible** to everyone it covers: a friend sees it in
`/api/orders/my/` and can read it at `/api/orders/{id}/`, because they need to
know which camp they are joining.

Everything that **changes** a booking — `participants`, `apply-coupon`,
`remove-coupon`, `cancel`, and all of `/api/payments/` — is the buyer's alone. A
guest attempting one gets `403`.

## Where a participant sees their booking

Two endpoints, both already updated — a guest needs neither a special call nor a
different page.

`GET /api/orders/my/` returns full orders, guests included, with the
`participants` array on each.

`GET /api/users/me/` — what the profile page already reads — now lists bookings
the user placed **and** ones a friend booked them onto:

```json
"orders": [
  {"id": 41, "package_name": "Two Week Camp", "status": "PAID",
   "created_at": "2026-09-02T10:04:00Z",
   "is_buyer": false, "participant_count": 3, "total_amount": null}
]
```

Two fields are new and both matter to the UI:

- **`is_buyer`** — `false` means a friend booked this person in. Label it, and do
  not offer them cancel or payment actions; the API returns `403`.
- **`total_amount` is `null` for a guest.** Deliberate, not a bug: a group total
  covers their friend's place as well as their own, so showing it would tell
  them what someone else spent. It is a `string` for the buyer, as before.

## Claiming an invited account

An account created for a friend at checkout starts with **no usable password and
an unverified address**, so it cannot be signed into. The confirmation email's
button is a password-reset link, and the existing
`POST /api/auth/password-reset-confirm/` finishes the job — it now also marks the
address verified, since following a link sent to it proves control of it.

So the invite needs **no new endpoint and no new page**: the link lands on the
existing `/reset-password` route, and the friend can sign in immediately
afterwards. The link is single-use — the token stops working once a password is
set.

## Emails

On successful payment, every participant gets their own confirmation:

- The **buyer's** copy is the receipt: per-person price, discount, total and
  payment ID.
- A **guest's** copy names who booked them and carries no money at all. The
  payment is not theirs.

Both copies carry a **fighter-card notice** when that participant's card is
missing or unfinished, with a link to complete it. A participant whose card is
already complete gets no notice. Someone who cannot sign in yet — an account
created for them at a friend's checkout — is pointed at a set-password link
instead, since the card lives behind that sign-in anyway. Pre-arrival reminders
(`send_package_reminders`) go to every participant on the same terms, and are
recorded per participant so a failed send is retried for that person alone.

A failed payment emails the buyer only: nobody else has anything to retry.

## Notes for existing data

Migration `orders.0006` gives every pre-existing order a single buyer
participant and attaches any reminders already sent to it, so historical
bookings price and behave exactly as they did and nobody is reminded twice.

Analytics is unchanged: it counts orders and sums real payments, both of which
stay correct when one order covers several people. A "fighters booked" metric,
if wanted, would be a new stat over `OrderParticipant`.
