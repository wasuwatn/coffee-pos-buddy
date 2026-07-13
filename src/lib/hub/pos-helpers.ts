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

// Loyalty QR for a bill viewed in history. Unlike claimUrl above (a one-time
// claim code the hub minted at checkout), a past bill has no stored code — the
// receipt's code only ever lived in sessionStorage. So the history QR carries
// the order number plus a locally-derived point total (points = number of
// non-free cups), which recomputes whenever the bill is edited. This is a NEW
// contract: the hub's customer.html must accept `?order=&points=` in addition
// to the existing `?claim=CODE` form.
export function orderClaimUrl(orderNo: string, points: number): string {
  const params = `order=${encodeURIComponent(orderNo)}&points=${points}`;
  const liffId = import.meta.env.VITE_LIFF_ID as string | undefined;
  if (liffId) return `https://liff.line.me/${liffId}?${params}`;
  const base = (
    (import.meta.env.VITE_PORTAL_BASE as string | undefined) ||
    (import.meta.env.VITE_API_BASE as string | undefined) ||
    ""
  ).replace(/\/$/, "");
  return `${base}/customer.html?${params}`;
}
