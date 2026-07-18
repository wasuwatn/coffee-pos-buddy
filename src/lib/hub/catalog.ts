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
  // Optional hex color (e.g. "#2d8ac9") for this menu's sell-screen card.
  // Falls back to the deterministic per-category palette when unset.
  color?: string | null;
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
// kind used to be a closed 3-value enum (container/sweetness/extra —
// undefined meant "extra"). It's now overloaded to also carry user-defined
// modifier categories, since the hub has no dedicated categories table for
// this: a "modcat:<single|multi>" row is a category shell (its `name` is
// the category name, it's never itself sellable), and a "modopt:<catId>"
// row is one option belonging to that category. Legacy container/sweetness/
// extra rows get migrated into modcat/modopt rows the first time someone
// opens Settings → Modifier (see settings.tsx's ModifierManageSection).
// NOTE: this table is shared with the Mother app's Recipes.jsx "Add-on
// Options" screen, which only knows the old 3-value enum — modcat/modopt
// rows will show there as an unrecognized kind string.
export type Addon = { id: number; name: string; price_change: number; kind?: string };
export type ModifierMode = "single" | "multi";
export type ModifierCategory = {
  id: number;
  name: string;
  mode: ModifierMode;
  options: Addon[];
};

const MODCAT_PREFIX = "modcat:";
const MODOPT_PREFIX = "modopt:";

export function isCategoryRow(a: Addon): boolean {
  return (a.kind ?? "").startsWith(MODCAT_PREFIX);
}
export function isOptionRow(a: Addon): boolean {
  return (a.kind ?? "").startsWith(MODOPT_PREFIX);
}
export function isLegacyAddon(a: Addon): boolean {
  return !isCategoryRow(a) && !isOptionRow(a);
}
export function categoryKind(mode: ModifierMode): string {
  return `${MODCAT_PREFIX}${mode}`;
}
export function optionKind(categoryId: number): string {
  return `${MODOPT_PREFIX}${categoryId}`;
}

// Builds the category → options tree from the flat addons list. Options
// whose category row got deleted (orphaned modopt rows) are dropped.
export function parseModifierCategories(addons: Addon[]): ModifierCategory[] {
  return addons.filter(isCategoryRow).map((c) => ({
    id: c.id,
    name: c.name,
    mode: (c.kind === categoryKind("multi") ? "multi" : "single") as ModifierMode,
    options: addons.filter((a) => a.kind === optionKind(c.id)),
  }));
}
// Links a menu to an *optional* modifier category it should offer at the
// sell screen. The three mandatory categories (see MANDATORY_MODIFIER_NAMES
// below) are never stored here — they're implied for every menu. Table may
// not exist on the hub yet, so useCatalog() tolerates it 404ing.
export type MenuModifier = { id: number; menu_id: string; category_id: number };

export const MANDATORY_MODIFIER_NAMES = ["ภาชนะ", "ความหวาน", "ของเพิ่ม"];
export function isMandatoryCategory(c: ModifierCategory): boolean {
  return MANDATORY_MODIFIER_NAMES.includes(c.name);
}

// The categories a given menu should show: the mandatory ones always, plus
// whichever optional ones were linked to it in menu_modifiers.
export function modifierCategoriesForMenu(
  menuId: string,
  categories: ModifierCategory[],
  links: MenuModifier[],
): ModifierCategory[] {
  const linked = new Set(
    links.filter((l) => l.menu_id === menuId).map((l) => l.category_id),
  );
  return categories.filter((c) => isMandatoryCategory(c) || linked.has(c.id));
}

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
  menuModifiers: MenuModifier[];
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
      const [menuname, childmenu, addons, menuModifiers, packagingbom, matprepbom, settingsRows] =
        await Promise.all([
          hub.list<MenuItem>("menuname"),
          hub.list<ChildMenu>("childmenu"),
          hub.list<Addon>("addons"),
          // menu_modifiers may not exist on the hub yet — degrade to no
          // per-menu links (every menu still gets the mandatory categories).
          hub.list<MenuModifier>("menu_modifiers").catch(() => []),
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
        menuModifiers,
        packagingbom,
        matprepbom,
        settings: settingsRows[0] ?? null,
      };
    },
    staleTime: 1000 * 60,
  });
}
