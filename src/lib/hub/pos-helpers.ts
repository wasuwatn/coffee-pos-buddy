export const today = () => new Date().toISOString().split("T")[0];

// Shared claim-link/QR target for a point_ledger receipt claim code — mirrors
// SMA08's claimUrl (client/src/lib/helpers.js). Always route through
// liff.line.me when a LIFF ID is configured so LINE handles login itself.
// Falls back to VITE_PORTAL_BASE, then VITE_API_BASE (the hub itself also
// serves customer.html as a static asset) — NOT window.location.origin,
// since this app is deployed on its own domain, unlike SMA08's pos.html
// which shares an origin with customer.html.
export function claimUrl(code: string): string {
  const liffId = import.meta.env.VITE_LIFF_ID as string | undefined;
  if (liffId) return `https://liff.line.me/${liffId}?claim=${code}`;
  const base = (
    (import.meta.env.VITE_PORTAL_BASE as string | undefined) ||
    (import.meta.env.VITE_API_BASE as string | undefined) ||
    ""
  ).replace(/\/$/, "");
  return `${base}/customer.html?claim=${code}`;
}

import type { Addon } from "./catalog";

export type PickerOption = { value: string; label: string; adj: number };

// Fallbacks only for the brief window before the hub's first-boot migration
// seeds real 'container'/'sweetness' addons rows (see SMA08's server/db.js)
// — once seeded, catalog.addons always has these, and these go unused.
const DEFAULT_CONTAINERS: PickerOption[] = [
  { value: "Ice", label: "เย็น", adj: 0 },
  { value: "Hot", label: "ร้อน", adj: 0 },
  { value: "Bottle", label: "ขวด", adj: -5 },
];
const DEFAULT_SWEETNESS: PickerOption[] = ["No Sweet", "25%", "50%", "100%"].map((v) => ({
  value: v,
  label: v,
  adj: 0,
}));

// Container ("Ice"/"Hot"/"Bottle") and Sweetness are both required,
// single-select modifiers — same addons table the optional multi-select
// extras use, distinguished by `kind`. Options/prices are staff-editable
// from Settings instead of hardcoded or a settings CSV.
export function deriveContainers(addons: Addon[]): PickerOption[] {
  const rows = addons.filter((a) => a.kind === "container");
  return rows.length
    ? rows.map((a) => ({ value: a.name, label: a.name, adj: Number(a.price_change) || 0 }))
    : DEFAULT_CONTAINERS;
}

export function deriveSweetness(addons: Addon[]): PickerOption[] {
  const rows = addons.filter((a) => a.kind === "sweetness");
  return rows.length
    ? rows.map((a) => ({ value: a.name, label: a.name, adj: Number(a.price_change) || 0 }))
    : DEFAULT_SWEETNESS;
}
