import { useQuery } from "@tanstack/react-query";
import { hub } from "./client";

// Catalog master data (menu, variants, add-ons, BOM, shop settings) now lives
// in the SMA08 hub, managed from the Mother app (Materials/Recipes pages) —
// same convention as the existing pos.html satellite, which is also
// read-only against these tables. This app only reads them to build the
// sell screen and compute stock requirements at checkout.

export type MenuItem = {
  id: string;
  name: string;
  category: string;
  front_price: number;
  delivery_price: number;
  status: string;
};
export type ChildMenu = {
  id: string;
  menu_name: string;
  menu_id?: string;
  name: string;
  material_id: string;
  qty_used: number;
  price_change: number;
};
// kind groups a modifier by role: 'container'/'sweetness' are each a
// required, single-select choice per cup (sourced from server/db.js's
// addons table); 'extra'/undefined is the original optional, multi-select
// add-on list (e.g. "Extra pearls") — unchanged behavior.
export type Addon = { id: number; name: string; price_change: number; kind?: string };
export type Category = { id: number; name: string };
export type Material = { id: string; category: string; item: string; unit: string; status: string };
export type BomRow = {
  id: number;
  menu_name: string;
  menu_id?: string;
  material_id: string;
  qty_used: number;
};
export type SetBom = { id: string; name: string; items: string };
export type ShopSettings = {
  id: number;
  sweetness_levels: string;
  buyers: string;
  shop_name: string;
  shop_address: string;
  shop_phone: string;
  promptpay_id: string;
  receipt_footer: string;
  logo?: string | null;
};

export type Catalog = {
  products: MenuItem[];
  categories: string[];
  childmenu: ChildMenu[];
  addons: Addon[];
  bom: BomRow[];
  packagingbom: SetBom[];
  matprepbom: SetBom[];
  settings: ShopSettings | null;
};

// A small fixed palette (same one seedSampleMenu.ts used to ship) — the hub's
// menuname table has no color column, so category cards get one deterministically.
const PALETTE = [
  "#2d8ac9",
  "#1a4a6e",
  "#6b3a2a",
  "#c9a568",
  "#4a6741",
  "#c17c74",
  "#e88aab",
  "#e8b84a",
];
export function categoryColor(category: string, categories: string[]) {
  const i = Math.max(0, categories.indexOf(category));
  return PALETTE[i % PALETTE.length];
}

export function useCatalog() {
  return useQuery({
    queryKey: ["hub-catalog"],
    queryFn: async (): Promise<Catalog> => {
      const [menuname, childmenu, addons, bom, packagingbom, matprepbom, settingsRows] =
        await Promise.all([
          hub.list<MenuItem>("menuname"),
          hub.list<ChildMenu>("childmenu"),
          hub.list<Addon>("addons"),
          hub.list<BomRow>("bom"),
          hub.list<SetBom>("packagingbom"),
          hub.list<SetBom>("matprepbom"),
          hub.list<ShopSettings>("settings"),
        ]);
      const products = menuname.filter((m) => m.status === "Active");
      const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
      return {
        products,
        categories,
        childmenu,
        addons,
        bom,
        packagingbom,
        matprepbom,
        settings: settingsRows[0] ?? null,
      };
    },
    staleTime: 1000 * 60,
  });
}

// ---- Stock requirements (ported from SMA08 client/src/lib/helpers.js so both
// apps deduct materials identically) ----------------------------------------

function expandSetItems(materialId: string, packagingbom: SetBom[], matprepbom: SetBom[]) {
  const id = String(materialId);
  const pool = id.startsWith("PBOM") ? packagingbom : id.startsWith("MPREP") ? matprepbom : null;
  if (!pool) return null;
  const set = pool.find((p) => p.id === materialId);
  if (!set) return [];
  try {
    return JSON.parse(set.items) as { material_id: string; qty_used: number }[];
  } catch {
    return [];
  }
}

export type RequirementLine = { name: string; qty: number; childId?: string | null };

export function computeRequirements(
  lines: RequirementLine[],
  bom: BomRow[],
  packagingbom: SetBom[],
  childmenu: ChildMenu[],
  matprepbom: SetBom[],
): Record<string, number> {
  const req: Record<string, number> = {};
  const add = (matId: string | undefined, amount: number) => {
    if (matId) req[matId] = (req[matId] || 0) + amount;
  };
  lines.forEach(({ name, qty, childId }) => {
    bom
      .filter((b) => b.menu_name === name)
      .forEach((r) => {
        const amount = Number(r.qty_used) * qty;
        const setItems = expandSetItems(r.material_id, packagingbom, matprepbom);
        if (setItems !== null) {
          setItems.forEach((it) => add(it.material_id, Number(it.qty_used) * amount));
        } else {
          add(r.material_id, amount);
        }
      });
    if (childId) {
      const child = childmenu.find((c) => String(c.id) === String(childId));
      if (child) add(child.material_id, Number(child.qty_used || 1) * qty);
    }
  });
  return req;
}
