import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listOrders } from "@/lib/pos.functions";
import { formatTHB } from "@/lib/cart-store";
import { ChevronRight, Banknote, Smartphone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history/")({
  component: HistoryPage,
});

function HistoryPage() {
  const fn = useServerFn(listOrders);
  const q = useQuery({ queryKey: ["orders"], queryFn: () => fn() });

  const orders = q.data ?? [];
  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_at).toDateString() === today);
  const todayTotal = todayOrders.reduce((n, o) => n + Number(o.total), 0);

  const groups = orders.reduce<Record<string, typeof orders>>((acc, o) => {
    const key = new Date(o.created_at).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long" });
    (acc[key] ||= []).push(o);
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-md">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <h1 className="text-lg font-bold">ประวัติการขาย</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        <div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-lg shadow-primary/20">
          <p className="text-xs opacity-90">ยอดขายวันนี้</p>
          <p className="mt-1 text-3xl font-bold">{formatTHB(todayTotal)}</p>
          <p className="mt-1 text-xs opacity-90">{todayOrders.length} บิล</p>
        </div>

        {q.isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : orders.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">ยังไม่มีประวัติการขาย</p>
        ) : (
          Object.entries(groups).map(([date, list]) => (
            <div key={date}>
              <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">{date}</p>
              <ul className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
                {list.map((o) => (
                  <li key={o.id}>
                    <Link
                      to="/history/$id"
                      params={{ id: o.id }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                        {o.payment_method === "cash" ? <Banknote className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">บิล #{o.order_number}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(o.created_at).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatTHB(Number(o.total))}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </main>
    </div>
  );
}
