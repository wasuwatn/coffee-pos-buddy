export const today = () => new Date().toISOString().split("T")[0];

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
