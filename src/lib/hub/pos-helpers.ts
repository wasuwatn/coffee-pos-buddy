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

// Same three containers/adjustments as SMA08's pos.html (POS.jsx CONTAINERS)
// so a "Bottle" sale looks identical in both apps' reports.
export const CONTAINERS = [
  { value: "Ice", label: "เย็น", adj: 0 },
  { value: "Hot", label: "ร้อน", adj: 0 },
  { value: "Bottle", label: "ขวด", adj: -5 },
] as const;

export function parseSweetnessLevels(raw: string | null | undefined): string[] {
  const list = String(raw || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return list.length ? list : ["100%"];
}
