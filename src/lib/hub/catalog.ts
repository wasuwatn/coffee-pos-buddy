import { useQuery } from "@tanstack/react-query";
import { hub } from "./client";

// Catalog master data (menu, variants, add-ons, shop settings) now lives in
// the SMA08 hub, managed from the Mother app (Materials/Recipes pages) — same
// convention as the existing pos.html satellite, which is also read-only
// against these tables. This app only reads them to build the sell screen —
// it does not track material stock, so it never touches the bom table.

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
      const [menuname, childmenu, addons, packagingbom, matprepbom, settingsRows] =
        await Promise.all([
          hub.list<MenuItem>("menuname"),
          hub.list<ChildMenu>("childmenu"),
          hub.list<Addon>("addons"),
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
        packagingbom,
        matprepbom,
        settings: settingsRows[0] ?? null,
      };
    },
    staleTime: 1000 * 60,
  });
}
