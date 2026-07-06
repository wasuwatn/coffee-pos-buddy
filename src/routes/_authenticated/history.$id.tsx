import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOrder } from "@/lib/pos.functions";
import { formatTHB } from "@/lib/cart-store";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history/$id")({
  component: HistoryDetail,
});

function HistoryDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const fn = useServerFn(getOrder);
  const q = useQuery({ queryKey: ["order", id], queryFn: () => fn({ data: { id } }) });

  if (q.isLoading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>;
  if (!q.data) return <div className="p-8 text-center text-muted-foreground">ไม่พบบิล</div>;
  const { order, items } = q.data;

  return (
    <div className="mx-auto max-w-md">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <button onClick={() => navigate({ to: "/history" })} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">บิล #{order.order_number}</h1>
      </header>

      <main className="px-4 py-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 space-y-0.5 text-xs text-muted-foreground">
            <p>วันที่: {new Date(order.created_at).toLocaleString("th-TH")}</p>
            {order.cashier_name && <p>แคชเชียร์: {order.cashier_name}</p>}
            <p>ชำระเงินโดย: {order.payment_method === "cash" ? "เงินสด" : "โอน / QR"}</p>
          </div>

          <ul className="divide-y divide-border">
            {items.map((it) => (
              <li key={it.id} className="flex items-start justify-between py-2 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{it.name_snapshot}</p>
                  <p className="text-xs text-muted-foreground">{formatTHB(Number(it.price_snapshot))} × {it.qty}</p>
                </div>
                <span className="ml-3 font-semibold">{formatTHB(Number(it.line_total))}</span>
              </li>
            ))}
          </ul>

          <div className="mt-3 flex justify-between border-t border-dashed border-border pt-3 text-lg font-bold">
            <span>ยอดรวม</span>
            <span>{formatTHB(Number(order.total))}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
