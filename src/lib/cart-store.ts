import { create } from "zustand";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  color?: string | null;
  imageUrl?: string | null;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">) => void;
  inc: (productId: string) => void;
  dec: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  totalQty: () => number;
  totalAmount: () => number;
};

export const useCart = create<CartState>((set, get) => ({
  items: [],
  add: (item) =>
    set((s) => {
      const existing = s.items.find((i) => i.productId === item.productId);
      if (existing) {
        return {
          items: s.items.map((i) =>
            i.productId === item.productId ? { ...i, qty: i.qty + 1 } : i,
          ),
        };
      }
      return { items: [...s.items, { ...item, qty: 1 }] };
    }),
  inc: (id) =>
    set((s) => ({
      items: s.items.map((i) => (i.productId === id ? { ...i, qty: i.qty + 1 } : i)),
    })),
  dec: (id) =>
    set((s) => ({
      items: s.items
        .map((i) => (i.productId === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0),
    })),
  remove: (id) => set((s) => ({ items: s.items.filter((i) => i.productId !== id) })),
  clear: () => set({ items: [] }),
  totalQty: () => get().items.reduce((n, i) => n + i.qty, 0),
  totalAmount: () => get().items.reduce((n, i) => n + i.qty * i.price, 0),
}));

export const formatTHB = (n: number) =>
  new Intl.NumberFormat("th-TH", { style: "currency", currency: "THB", minimumFractionDigits: 0 }).format(n);
