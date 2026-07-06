import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getOrder } from "@/lib/pos.functions";
import { formatTHB } from "@/lib/cart-store";
import { CheckCircle2, Home, Receipt as ReceiptIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/receipt/$id")({
  component: ReceiptPage,
});

function ReceiptPage() {
  const { id } = Route.useParams();
  const getFn = useServerFn(getOrder);
  const q = useQuery({ queryKey: ["order", id], queryFn: () => getFn({ data: { id } }) });

  if (q.isLoading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>;
  if (!q.data) return <div className="p-8 text-center text-muted-foreground">ไม่พบบิล</div>;

  const { order, items } = q.data;

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="mb-4 flex flex-col items-center gap-2 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-success/10 text-success">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-xl font-bold">ชำระเงินสำเร็จ</h1>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>บิล #{order.order_number}</span>
          <span>{new Date(order.created_at).toLocaleString("th-TH")}</span>
        </div>

        <ul className="mb-3 divide-y divide-border">
          {items.map((it) => (
            <li key={it.id} className="flex items-start justify-between py-2 text-sm">
              <div className="min-w-0">
                <p className="truncate font-medium">{it.name_snapshot}</p>
                <p className="text-xs text-muted-foreground">{formatTHB(Number(it.price_snapshot))} × {it.qty}</p>
              </div>
              <span className="ml-3 font-semibold">{formatTHB(Number(it.line_total))}</span>
            </li>
          ))}
        </ul>

        <div className="space-y-1 border-t border-dashed border-border pt-3 text-sm">
          <Row label="ยอดรวม" value={formatTHB(Number(order.total))} bold />
          <Row label={order.payment_method === "cash" ? "เงินสด" : "โอน / QR"} value={
            order.payment_method === "cash" && order.cash_received != null
              ? formatTHB(Number(order.cash_received))
              : formatTHB(Number(order.total))
          } />
          {order.payment_method === "cash" && order.change_amount != null && Number(order.change_amount) > 0 && (
            <Row label="เงินทอน" value={formatTHB(Number(order.change_amount))} />
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Button variant="outline" asChild>
          <Link to="/history"><ReceiptIcon className="mr-1.5 h-4 w-4" />ประวัติ</Link>
        </Button>
        <Button asChild>
          <Link to="/"><Home className="mr-1.5 h-4 w-4" />ขายต่อ</Link>
        </Button>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "text-base font-bold" : "text-muted-foreground"}`}>
      <span>{label}</span>
      <span className={bold ? "text-foreground" : ""}>{value}</span>
    </div>
  );
}
