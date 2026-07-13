import { create } from "zustand";

// One selected modifier category for a cart line — mode "single" has at
// most one entry in optionNames, "multi" can have several.
export type SelectedModifier = {
  categoryId: number;
  categoryName: string;
  mode: "single" | "multi";
  optionNames: string[];
  priceChange: number; // sum of the selected options' price_change
};

// One CartItem == one line the customer wants N of, all sharing the same
// customization. At checkout each is expanded into N salefront rows (one
// row per cup — see checkout.tsx), matching how SMA08's own pos.html builds
// the /api/checkout/pos payload.
export type CartItem = {
  cartItemId: string;
  menuId: string; // menuname.id
  name: string; // display name shown in cart/receipt (includes variant if any)
  price: number; // unit price: menu front_price + variant price_change + modifier price changes
  color?: string | null;
  imageUrl?: string | null;
  qty: number;
  freeQty: number; // how many of the qty cups are free (0..qty) — free cups cost 0
  options?: string[]; // display strings for cart/receipt (variant + every selected modifier)
  childId?: string | null; // childmenu.id (variant)
  modifiers: SelectedModifier[];
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty" | "cartItemId" | "freeQty">, qty?: number) => void;
  inc: (cartItemId: string) => void;
  dec: (cartItemId: string) => void;
  setFree: (cartItemId: string, n: number) => void;
  remove: (cartItemId: string) => void;
  clear: () => void;
  totalQty: () => number;
  totalAmount: () => number;
};

const dedupeKey = (i: Omit<CartItem, "qty" | "cartItemId" | "freeQty">) =>
  [
    i.menuId,
    i.childId ?? "",
    ...i.modifiers.map((m) => `${m.categoryId}:${[...m.optionNames].sort().join(",")}`).sort(),
  ].join("::");

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (item, qty = 1) =>
    set((s) => {
      const key = dedupeKey(item);
      const existing = s.items.find((i) => dedupeKey(i) === key);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.cartItemId === existing.cartItemId ? { ...i, qty: i.qty + qty } : i,
          ),
        };
      }
      return { items: [...s.items, { ...item, cartItemId: crypto.randomUUID(), qty, freeQty: 0 }] };
    }),
  inc: (id) =>
    set((s) => ({
      items: s.items.map((i) => (i.cartItemId === id ? { ...i, qty: i.qty + 1 } : i)),
    })),
  dec: (id) =>
    set((s) => ({
      items: s.items
        .map((i) =>
          i.cartItemId === id
            ? { ...i, qty: i.qty - 1, freeQty: Math.min(i.freeQty, i.qty - 1) }
            : i,
        )
        .filter((i) => i.qty > 0),
    })),
  setFree: (id, n) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.cartItemId === id ? { ...i, freeQty: Math.max(0, Math.min(n, i.qty)) } : i,
      ),
    })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.cartItemId !== id) })),
  clear: () => set({ items: [] }),
  totalQty: () => get().items.reduce((n, i) => n + i.qty, 0),
  totalAmount: () => get().items.reduce((n, i) => n + (i.qty - i.freeQty) * i.price, 0),
}));

export const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n);
