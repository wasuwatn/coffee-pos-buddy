import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createOrder } from "@/lib/pos.functions";
import { useCart, formatTHB } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Banknote, Smartphone } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/checkout")({
  component: CheckoutPage,
});

function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.totalAmount());
  const clear = useCart((s) => s.clear);
  const createFn = useServerFn(createOrder);

  const [method, setMethod] = useState<"cash" | "transfer">("cash");
  const [received, setReceived] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const receivedNum = Number(received || 0);
  const change = method === "cash" ? Math.max(0, receivedNum - total) : 0;
  const canPay = method === "transfer" || (method === "cash" && receivedNum >= total);

  const quicks = [total, roundUp(total, 10), roundUp(total, 50), roundUp(total, 100)]
    .filter((v, i, a) => v > 0 && a.indexOf(v) === i)
    .slice(0, 4);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-muted-foreground">ตะกร้าว่างเปล่า</p>
        <Button className="mt-4" onClick={() => navigate({ to: "/" })}>กลับหน้าขาย</Button>
      </div>
    );
  }

  const pay = async () => {
    setLoading(true);
    try {
      const res = await createFn({
        data: {
          items: items.map((i) => ({ productId: i.productId, name: i.name, price: i.price, qty: i.qty })),
          paymentMethod: method,
          cashReceived: method === "cash" ? receivedNum : null,
        },
      });
      clear();
      navigate({ to: "/receipt/$id", params: { id: res.orderId } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <button onClick={() => navigate({ to: "/" })} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">เก็บเงิน</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">ยอดที่ต้องชำระ</p>
          <p className="mt-1 text-4xl font-bold text-primary">{formatTHB(total)}</p>
          <p className="mt-1 text-xs text-muted-foreground">{items.reduce((n, i) => n + i.qty, 0)} รายการ</p>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold">วิธีการชำระเงิน</p>
          <div className="grid grid-cols-2 gap-2">
            <MethodBtn active={method === "cash"} onClick={() => setMethod("cash")} icon={<Banknote className="h-5 w-5" />} label="เงินสด" />
            <MethodBtn active={method === "transfer"} onClick={() => setMethod("transfer")} icon={<Smartphone className="h-5 w-5" />} label="โอน / QR" />
          </div>
        </div>

        {method === "cash" && (
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">รับเงิน</label>
              <input
                type="number"
                inputMode="decimal"
                value={received}
                onChange={(e) => setReceived(e.target.value)}
                placeholder="0"
                className="h-14 w-full rounded-xl border border-input bg-background px-4 text-right text-2xl font-bold outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {quicks.map((v) => (
                <button
                  key={v}
                  onClick={() => setReceived(String(v))}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium hover:border-primary hover:text-primary"
                >
                  {formatTHB(v)}
                </button>
              ))}
            </div>
            <div className="flex items-baseline justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">เงินทอน</span>
              <span className={`text-xl font-bold ${change > 0 ? "text-success" : ""}`}>{formatTHB(change)}</span>
            </div>
          </div>
        )}

        <Button className="h-14 w-full text-base font-semibold" disabled={!canPay || loading} onClick={pay}>
          {loading ? "กำลังบันทึก..." : "ยืนยันการชำระเงิน"}
        </Button>
      </main>
    </div>
  );
}

function MethodBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 font-semibold transition ${
        active ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function roundUp(n: number, m: number) {
  return Math.ceil(n / m) * m;
}
