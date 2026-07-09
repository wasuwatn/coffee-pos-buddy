import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useOrders } from "@/lib/hub/orders";
import { formatTHB } from "@/lib/cart-store";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history/$id")({
  component: HistoryDetail,
});

const PAY_LABEL: Record<string, string> = {
  Cash: "เงินสด",
  PromptPay: "PromptPay",
  Transfer: "โอนเงิน",
};

function HistoryDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const q = useOrders();

  if (q.isLoading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>;
  const order = q.data?.find((o) => o.orderNo === id);
  if (!order) return <div className="p-8 text-center text-muted-foreground">ไม่พบบิล</div>;

  return (
    <div className="mx-auto max-w-md">
      <header
        className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <button
          onClick={() => navigate({ to: "/history" })}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">บิล #{order.orderNo}</h1>
      </header>

      <main className="px-4 py-4">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 space-y-0.5 text-xs text-muted-foreground">
            <p>
              วันที่:{" "}
              {new Date(order.date).toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            {order.cashier && <p>แคชเชียร์: {order.cashier}</p>}
            <p>ชำระเงินโดย: {PAY_LABEL[order.paymentMethod] ?? order.paymentMethod}</p>
          </div>

          <ul className="divide-y divide-border">
            {order.items.map((it) => {
              const addonNames: string[] = (() => {
                try {
                  return JSON.parse(it.addons || "[]");
                } catch {
                  return [];
                }
              })();
              const optionParts = [it.variant, it.container, it.sweetness, ...addonNames].filter(
                Boolean,
              );
              return (
                <li key={it.id} className="flex items-start justify-between py-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {it.menu_name}
                      {it.is_free === "1" && (
                        <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          ฟรี
                        </span>
                      )}
                    </p>
                    {optionParts.length > 0 && (
                      <p className="text-xs text-muted-foreground">{optionParts.join(", ")}</p>
                    )}
                  </div>
                  <span className="ml-3 font-semibold">{formatTHB(Number(it.total_price))}</span>
                </li>
              );
            })}
          </ul>

          <div className="mt-3 flex justify-between border-t border-dashed border-border pt-3 text-lg font-bold">
            <span>ยอดรวม</span>
            <span>{formatTHB(order.total)}</span>
          </div>
        </div>
      </main>
    </div>
  );
}
