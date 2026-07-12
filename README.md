# Kafe POS

An iPhone-first POS UI (TanStack Start + React) with **no database or backend
of its own** — every read and write goes straight from the browser to the
[SMA08 hub API](https://github.com/wasuwatn/SMA08), authenticated with the
hub's own JWT. It's a satellite app, the same role `pos.html` plays in that
repo, just with a UI built specifically for iPhone. See that repo's
`INTEGRATION_PLAN.md` (Phase 2) for the full design and rationale.

## Setup

```bash
bun install   # or: npm install
```

Create `.env` (or edit the existing one) with the hub's URL:

```
VITE_API_BASE="https://<your-hub-url>"
```

Leave it empty only if this app is served from the exact same origin as the
hub (uncommon — the two are normally deployed separately).

Optional — for the receipt loyalty QR (customer scans/types a 6-char code
printed after checkout to earn points, see SMA08's `INTEGRATION_PLAN.md`):

```
VITE_LIFF_ID="<LINE LIFF app id, if using the LINE rewards portal>"
VITE_PORTAL_BASE="https://<hub-public-url>"
```

Both are optional. If `VITE_LIFF_ID` is set the QR opens through
`liff.line.me` (LINE handles login); otherwise it falls back to
`VITE_PORTAL_BASE` (or `VITE_API_BASE` if that's unset) + `/customer.html`.

## Dev

```bash
bun dev   # vite dev, defaults to http://localhost:3000
```

Log in with a staff account that exists on the hub (default seed:
`admin` / `admin`, forces a password change on first login — see the SMA08
README). A shift must be open on the hub before checkout will accept a sale;
open one from **Settings → กะเงินสด**.

## Build

```bash
bun run build
```

Produces a [Vercel Build Output API v3](https://vercel.com/docs/build-output-api/v3)
bundle in `.vercel/output/` — a Node.js serverless function for SSR plus a
static `assets/` folder. The toolchain's nitro build defaults to Cloudflare
(see the comment at the top of `vite.config.ts`); `nitro: { preset: "vercel" }`
in that same file overrides it to target Vercel instead — this only takes
effect building outside Lovable's own hosted "Publish" (which forces
Cloudflare regardless), i.e. from the CLI or on Vercel's own build servers,
which is the normal case for an independent deploy. `VITE_API_BASE` is baked
in at build time, so set it before building, not after deploying.

## Deploy (Vercel)

**One-off / manual:**

```bash
npx vercel login    # once, interactively
bun run build
npx vercel deploy --prebuilt --prod
```

**Ongoing (recommended):** connect this GitHub repo to a Vercel project so
pushes to this branch redeploy automatically.

1. In the Vercel dashboard, import the repo. Framework Preset: **Other**.
2. Build Command: `bun run build` (or `npm run build`). Install Command:
   `bun install` (or `npm install`). Leave Output Directory unset — Vercel
   auto-detects `.vercel/output` from the Build Output API contract.
3. Add env var `VITE_API_BASE=https://<hub-public-url>` (build-time, so it
   must be set before the first deploy — redeploy after changing it).

After deploying:

1. Add the resulting `*.vercel.app` (or custom) domain to the hub's
   `CORS_ORIGIN` env var and restart the hub.
2. Install it on the phone as a PWA — see below.

## Install as a PWA (home screen app)

The app ships a web manifest + icons (`public/manifest.webmanifest`,
`public/icons/`) so "Add to Home Screen" opens full-screen without Safari's
address bar, with its own icon — no App Store needed. There's **no service
worker / offline caching** on purpose (see "Known gaps" below); this only
covers the icon + standalone window, not offline use.

**iPhone (Safari — this app is built for this):**

1. Open the deployed URL in **Safari** (must be Safari, not Chrome — iOS
   only allows installing from Safari).
2. Tap the **Share** button (square with an arrow pointing up).
3. Scroll down and tap **Add to Home Screen**.
4. Confirm the name (defaults to "Kafe POS") and tap **Add**.
5. The icon appears on the home screen and opens full-screen, no browser chrome.

**Android (Chrome):** open the URL → tap the **⋮** menu → **Add to Home
screen** / **Install app**.

The icons in `public/icons/` are a **placeholder** (a plain coffee-cup glyph
on the app's brand color) — swap those three PNG files with the shop's real
logo whenever you have one; no other code changes needed since the manifest
and `__root.tsx` already reference those exact filenames.

## Cutover from `pos.html`

Both apps write through the exact same hub endpoints
(`/api/checkout/pos`, `/api/shift/*`, generic `/api/:table`), so they can run
side by side with zero data conflicts — sales, stock, and shift state are
always the same table on the hub, not two separate copies. The only rule:
only **one shift can be open at a time** across both apps, so pick one
register per open shift.

Suggested trial period before retiring `pos.html`:

- [ ] Run a real shift end-to-end on this app (open shift → sell a few
      items with each payment method → close shift, compare the Z-report
      against what `pos.html` would have shown for the same sales)
- [ ] Confirm sales show up correctly in the Mother app's dashboards/SalesLog
- [ ] Use it for a few full days of real service
- [ ] Once confident, stop opening shifts from `pos.html` and use this app
      exclusively (no code change needed to "retire" `pos.html` — just stop
      using it; it can be removed from the SMA08 client later if desired)

## Known gaps vs. `pos.html`

These are deferred, not silently broken — see `INTEGRATION_PLAN.md` in the
SMA08 repo (Phase 2.5 / 2.6):

- **No offline mode.** `pos.html` queues sales in `localStorage` and syncs
  when the network returns; this app requires a live connection to the hub
  for every sale.
- **No loyalty/points redemption.** Free-cup redemption codes and the points
  ledger aren't wired up here yet.
- **No time-of-day on past orders.** The hub's `salefront` table only stores
  a date per sale, not a timestamp, so History/Receipt show date only.
- **No material stock tracking.** This is a deliberate difference from
  `pos.html`, not a gap: checkout no longer computes or sends a stock
  deduction (`requirements`) payload, so selling from this app never checks
  or decrements material stock on the hub. If a menu item's ingredients run
  out, this app will still let staff sell it. Don't rely on this app's sales
  to keep the hub's material stock accurate if that still matters to you.

## Modifier categories (Settings → Modifier)

Modifiers (e.g. sweetness, container, extra toppings) are organized into
staff-created **categories** — each with a name and a "กดได้แค่ 1" (single-
select, required) or "กดได้มากกว่า 1" (multi-select, optional) mode, plus a
list of options with their own price adjustments. Create a category, then
use its "เพิ่ม" button to add options into it. The sell screen renders every
category that exists, in whatever order they were created — there's no
fixed limit or fixed set of categories anymore.

**Implementation note:** the hub has no dedicated table for this, so it's
built on top of the existing `addons` table by overloading the `kind`
column (see the comment on the `Addon` type in `src/lib/hub/catalog.ts`):
a `modcat:<single|multi>` row is a category shell, a `modopt:<categoryId>`
row is one option belonging to it. This table is shared with the Mother
app's Recipes.jsx "Add-on Options" screen, which only understands the old
fixed container/sweetness/extra values — modcat/modopt rows will show
there as an unrecognized `kind` string. If a shop still has add-ons using
the old values, Settings → Modifier shows a one-time "ย้ายข้อมูล" button
that migrates them into three equivalent categories (names/prices
preserved) — safe to run once, and it no-ops if there's nothing left to
migrate.
