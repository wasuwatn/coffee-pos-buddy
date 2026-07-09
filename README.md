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
2. Open the deployed URL on an iPhone, "Add to Home Screen" for an app-like feel.

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
- [ ] Confirm stock deducts correctly for a menu item that has a variant,
      an add-on, and a packaging/mat-prep BOM set
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
