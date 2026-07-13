import { createFileRoute, Link } from "@tanstack/react-router";
import { useOrders } from "@/lib/hub/orders";
import { formatTHB } from "@/lib/cart-store";
import { today } from "@/lib/hub/pos-helpers";
import { ChevronRight, Banknote, QrCode, Smartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history/")({
  component: HistoryPage,
});

const METHOD_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Cash: Banknote,
  PromptPay: QrCode,
  Transfer: Smartphone,
};

function HistoryPage() {
  const q = useOrders();
  const orders = q.data ?? [];

  const todayStr = today();
  const todayOrders = orders.filter((o) => o.date === todayStr);
  // Voided bills already carry total 0 (see groupOrders), so summing o.total is
  // enough — but exclude them from the bill count too.
  const todayTotal = todayOrders.reduce((n, o) => n + o.total, 0);
  const todayBillCount = todayOrders.filter((o) => !o.voided).length;

  const groups = orders.reduce<Record<string, typeof orders>>((acc, o) => {
    const key = new Date(o.date).toLocaleDateString("th-TH", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    (acc[key] ||= []).push(o);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-md">
      <header
        className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <h1 className="text-lg font-bold">ประวัติการขาย</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
          <p className="text-xs opacity-90">ยอดขายวันนี้</p>
          <p className="mt-1 text-3xl font-bold">{formatTHB(todayTotal)}</p>
          <p className="mt-1 text-xs opacity-90">{todayBillCount} บิล</p>
        </div>

        {q.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : q.isError ? (
          <p className="py-8 text-center text-sm text-destructive">
            โหลดประวัติไม่สำเร็จ: {(q.error as Error).message}
          </p>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">ยังไม่มีประวัติการขาย</p>
        ) : (
          Object.entries(groups).map(([date, list]) => (
            <div key={date}>
              <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">{date}</p>
              <ul className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
                {list.map((o) => {
                  const Icon = METHOD_ICON[o.paymentMethod] ?? Banknote;
                  return (
                    <li key={o.orderNo}>
                      <Link
                        to="/history/$id"
                        params={{ id: o.orderNo }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                      >
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">
                            บิล #{o.orderNo}
                            {o.voided && (
                              <span className="ml-1.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                                ยกเลิก
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {o.items.length} รายการ · {o.cashier}
                          </p>
                        </div>
                        <div className="text-right">
                          <p
                            className={`font-bold ${o.voided ? "text-muted-foreground line-through" : ""}`}
                          >
                            {formatTHB(
                              o.voided
                                ? o.items.reduce((n, i) => n + Number(i.total_price), 0)
                                : o.total,
                            )}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
