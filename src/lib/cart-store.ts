import { create } from "zustand";

export type CartItem = {
  cartItemId: string;
  productId: string;
  name: string;
  price: number;
  color?: string | null;
  imageUrl?: string | null;
  qty: number;
  options?: string[];
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

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (item, qty = 1) =>
    set((s) => {
      const optionsKey = item.options ? item.options.join("|") : "";
      const existing = s.items.find(
        (i) => i.productId === item.productId && (i.options ? i.options.join("|") : "") === optionsKey
      );
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
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(n);
