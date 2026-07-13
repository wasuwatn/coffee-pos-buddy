import { useQuery } from "@tanstack/react-query";
import { hub } from "./client";

// The hub has no `orders` table — each cup rung at checkout is one row in
// `salefront`, tied together only by a shared `order_no` (see runCheckout()
// in SMA08 server/index.js). There's also no per-sale timestamp, only a
// per-day `date` — so unlike the old Supabase-backed orders table, history
// here can't show a time-of-day, only date + order number.
export type SaleRow = {
  id: number;
  date: string;
  customer_name: string;
  menu_name: string;
  variant: string;
  quantity: number;
  sweetness: string;
  container: string;
  addons: string;
  addon_price: number;
  total_price: number;
  cashier: string;
  order_no: string;
  payment_method: string;
  is_free: string;
  status?: string; // "void" for a soft-voided cup; undefined/"" for a normal sale
};

export type Order = {
  orderNo: string;
  date: string;
  cashier: string;
  customerName: string;
  paymentMethod: string;
  items: SaleRow[];
  total: number;
  voided: boolean; // every cup voided — kept in history but excluded from totals
};

export function groupOrders(rows: SaleRow[]): Order[] {
  const map = new Map<string, SaleRow[]>();
  for (const r of rows) {
    const key = r.order_no || `row-${r.id}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  const orders: Order[] = [];
  for (const [orderNo, items] of map) {
    const first = items[0];
    // A voided bill has all its cups flagged; its total drops to 0 so it never
    // inflates day/shift sums, but the rows stay so history can show it struck
    // through with a "ยกเลิก" badge.
    const voided = items.every((i) => i.status === "void");
    orders.push({
      orderNo,
      date: first.date,
      cashier: first.cashier,
      customerName: first.customer_name,
      paymentMethod: first.payment_method || "Cash",
      items,
      total: items
        .filter((i) => i.status !== "void")
        .reduce((n, i) => n + Number(i.total_price), 0),
      voided,
    });
  }
  orders.sort(
    (a, b) => Math.max(...b.items.map((i) => i.id)) - Math.max(...a.items.map((i) => i.id)),
  );
  return orders;
}

// 30-day lookback is plenty for a "recent history" screen without pulling
// the whole table (matches the windowed-read convention the hub's API
// already documents for /api/salefront).
export function useOrders(days = 30) {
  return useQuery({
    queryKey: ["hub-orders", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000).toISOString().split("T")[0];
      const rows = await hub.list<SaleRow>("salefront", { since, limit: 1000 });
      return groupOrders(rows);
    },
    staleTime: 1000 * 30,
  });
}
