import { create } from "zustand";

// One CartItem == one line the customer wants N of, all sharing the same
// customization. At checkout each is expanded into N salefront rows (one
// row per cup — see checkout.tsx), matching how SMA08's own pos.html builds
// the /api/checkout/pos payload.
export type CartItem = {
  cartItemId: string;
  menuId: string; // menuname.id
  name: string; // display name shown in cart/receipt (includes variant if any)
  price: number; // unit price: menu front_price + variant price_change + container adj + addons
  color?: string | null;
  imageUrl?: string | null;
  qty: number;
  options?: string[]; // display strings for cart/receipt (variant, container, sweetness, add-ons)
  childId?: string | null; // childmenu.id (variant) — drives stock requirements
  container: string; // Ice | Hot | Bottle
  sweetness: string;
  addonNames: string[];
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty" | "cartItemId">, qty?: number) => void;
  inc: (cartItemId: string) => void;
  dec: (cartItemId: string) => void;
  remove: (cartItemId: string) => void;
  clear: () => void;
  totalQty: () => number;
  totalAmount: () => number;
};

const dedupeKey = (i: Omit<CartItem, "qty" | "cartItemId">) =>
  [i.menuId, i.childId ?? "", i.container, i.sweetness, [...i.addonNames].sort().join("|")].join(
    "::",
  );

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
      return { items: [...s.items, { ...item, cartItemId: crypto.randomUUID(), qty }] };
    }),
  inc: (id) =>
    set((s) => ({
      items: s.items.map((i) => (i.cartItemId === id ? { ...i, qty: i.qty + 1 } : i)),
    })),
  dec: (id) =>
    set((s) => ({
      items: s.items
        .map((i) => (i.cartItemId === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0),
    })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.cartItemId !== id) })),
  clear: () => set({ items: [] }),
  totalQty: () => get().items.reduce((n, i) => n + i.qty, 0),
  totalAmount: () => get().items.reduce((n, i) => n + i.qty * i.price, 0),
}));

export const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
  }).format(n);
