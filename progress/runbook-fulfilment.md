# Runbook: shipping an order (Japan Post, manual)

**For:** Kimie, the person who packs and posts the jars.
**Covers:** backlog [item 8](backlog-launch.md). Fulfilment path decided in [item 7](backlog-launch.md): **Japan Post, by hand** — PLAN [§12.2](../PLAN-stripe-and-shippo.md).
**State as of:** 2026-09-23. Everything marked **TBC** waits on backlog item 15 (parcel type) or item 6 (packed weights).
**Promise to the buyer:** posted within **3 business days** of payment. Checkout shows a 2–5 business day delivery estimate, which is still a placeholder.

---

## Before the first order

| Prerequisite | Why | State |
|---|---|---|
| Kimie has her own Stripe Dashboard login for the account | Every customer detail lives in Stripe and nowhere else | **Not set up** |
| Kimie can open the hosted Sanity Studio | Stock lives there, and the order log is read through Vision | Waits on item 6 |
| Parcel type, packaging materials and postage are chosen | Fixes how a jar is packed and what postage costs | Waits on item 15 (**TBC**) |
| Kimie has run one rehearsal on a preview test order | So a real customer is not the first attempt | Part of item 8 |

---

## Per order

### 1. Find the order

Stripe Dashboard → **Payments** → the succeeded payment.

It shows the buyer's **name, shipping address, phone number and e-mail**, the **items and quantities**, and, under Metadata, the **order number** in the form `KJ-260915-2664B8`. The **language** the order was placed in is on the Checkout Session's metadata as `lang` (`ja`, `en`, `fr`, `zh` or `zh-TW`).

*Why:* Stripe is the only system holding customer details. The Sanity order log deliberately stores no name, address, phone or e-mail, so it can never serve as the packing sheet.

### 2. Check the order log

In the Studio, open **Vision** and run:

```groq
*[_type == "fulfilment" && orderNumber == "KJ-260915-2664B8"][0]
```

Expected: one document whose `lines` match the payment, with `paidAt` set.

*Why:* A succeeded payment with no log document means the webhook never ran, so **stock was not lowered**. The nightly reconcile job catches this too, but whoever is packing sees it first. If the document is missing, tell the developer before shipping, and correct the stock by hand.

### 3. Check the `oversold` flag

If the document has `oversold: true`, **do not ship**.

Refund the payment in Stripe (Payments → the payment → Refund) and e-mail the buyer an apology in their language.

*Why:* The flag means two people bought the last jar within the same half hour, so one of those orders has no jar behind it. Refunding the same day is far better than silence.

### 4. Pack the jar

**TBC — waits on item 15.** It will name the parcel type (ゆうパック 60 size, or a cheaper protected option), the box or envelope, and the cushioning.

Weigh the packed parcel once and tell the developer, so the packed weight in the Studio stops being a placeholder (item 6).

*Why:* Glass in the post breaks without the right packing. The parcel type also fixes the postage, which decides whether the order makes any money at all: ゆうパック 60 size from Kanagawa costs ¥880–¥1,450, against a ¥1,900 jar.

### 5. Create the label and hand the parcel over

Address it from the Stripe details, **including the phone number**. Either write the ゆうパック label by hand or print one, then take the parcel to the post office or hand it to the collection driver.

*Why:* Japan Post has no API for a shop this size, so this step stays manual by design (item 7). Carriers need the recipient's phone number for failed deliveries, which is why checkout collects it.

### 6. Record the tracking number in Stripe

Stripe Dashboard → the payment → **Metadata** → add:

| Key | Value |
|---|---|
| `tracking_number` | The number on the Japan Post receipt |

*Why:* This is the only link between a payment and a parcel. Without it, nobody can answer "has this shipped?", there is no evidence of dispatch if a buyer says the parcel never arrived, and the weekly check cannot find orders that were paid but never posted.

### 7. E-mail the buyer the tracking number

Send it from Kimie's own e-mail, in the language of the order (`lang`). The buyer's address is on the payment.

Japanese:

> ご注文ありがとうございます。ご注文番号 KJ-… の商品を本日発送いたしました。
> 追跡番号: ………（日本郵便）
> 追跡: https://trackings.post.japanpost.jp/services/srv/search/

English:

> Thank you for your order. Order KJ-… was posted today.
> Japan Post tracking number: ………
> Track it here: https://trackings.post.japanpost.jp/services/srv/search/

*Why:* Decision D10. Stripe's receipt covers the order confirmation, but nothing sends a shipping notice. It is the message buyers most expect, and its absence produces the most enquiries. If this becomes a burden at about 30 orders a month, revisit it (PRD assumption A7).

### 8. Post within 3 business days

*Why:* The 特定商取引法 page states a delivery time, so it is a published commitment, not a preference.

---

## Every week

| Check | How | Why |
|---|---|---|
| Stock matches the shelf | Studio → Stock, compared with the jars on hand | The site sells whatever the number says. Stock drifts whenever a jar is broken, given away or sold in person. |
| No oversold orders | Vision: `*[_type == "fulfilment" && oversold]{orderNumber, paidAt}` | Each one needs a refund or a restock |
| Every payment has tracking | Stripe → Payments, last 7 days | Finds an order that was paid but never posted — the worst failure this shop can have |

---

## When something goes wrong

| Situation | What to do |
|---|---|
| Paid, but no `fulfilment` document | Do not ship yet. Tell the developer (the webhook may have failed) and check stock by hand. |
| `oversold: true` | Refund and e-mail the buyer. Do not ship. |
| A jar breaks in the post | Refund or replace, per the returns policy on `/legal/shipping`. Keep the buyer's photos. |
| The address looks wrong or incomplete | E-mail the buyer before posting. Never guess an address. |
| Stock in the Studio is wrong | Correct it in the **`production`** dataset. The preview writes to `staging`, which is test data. |
| Selling must stop right now | Set stock to 0, or turn "For sale" off in the Studio. Purchases stop within about a minute. |

---

## Rehearsal (closes item 8)

1. Kimie gets Stripe Dashboard access and opens the hosted Studio.
2. Place a test order on the preview with the test card `4242 4242 4242 4242`.
3. Kimie runs steps 1–7 unaided, with a mock label if item 15 is still open.
4. Record how long it took and anything that was unclear, then fix this runbook.

*Why the rehearsal, and not just this document:* every step assumes tools Kimie has never used — the Stripe Dashboard, the Studio, a metadata field. The first real order, with a customer waiting, is the wrong moment to discover that one of them is confusing. It also gives a real figure for the time an order takes, which PRD assumption A2 needs.

---

**Japanese version for Kimie:** <https://claude.ai/artifact/CLJNM4dtEHWzCVzh1ikpZL> — 「瓶の発送手順」, the same steps in plain Japanese with the reason for each. It is private until the owner shares it from the page's Share menu. Update it whenever this file changes, in particular when item 15 settles step 4.
