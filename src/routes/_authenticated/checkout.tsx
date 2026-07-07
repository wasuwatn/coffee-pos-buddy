import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createOrder } from "@/lib/pos.functions";
import { useCart, formatTHB } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [loading, setLoading] = useState(false);

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
          items: items.map((i) => {
            const finalName = i.options && i.options.length > 0 
              ? `${i.name} (${i.options.join(", ")})` 
              : i.name;
            return { productId: i.productId, name: finalName, price: i.price, qty: i.qty };
          }),
          paymentMethod: "cash",
          cashReceived: total,
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

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">สรุปรายการสั่งซื้อ</p>
          <ul className="space-y-2.5">
            {items.map((i, index) => (
              <li key={index} className="flex items-start justify-between text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold text-muted-foreground">{i.qty}x</span>
                  <div>
                    <p>{i.name}</p>
                    {/* Placeholder for future options data */}
                    {(i as any).options && (
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {((i as any).options as string[]).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-medium">{formatTHB(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex justify-between border-t border-dashed border-border pt-3 font-bold">
            <span>ยอดรวมทั้งสิ้น</span>
            <span className="text-primary">{formatTHB(total)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div>
            <Label className="mb-1.5 block">ชื่อลูกค้า (ไม่บังคับ)</Label>
            <Input 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)} 
              placeholder="กรอกชื่อลูกค้า" 
              className="h-11"
            />
          </div>
          <div>
            <Label className="mb-1.5 block">ที่อยู่จัดส่ง (ไม่บังคับ)</Label>
            <Input 
              value={customerAddress} 
              onChange={(e) => setCustomerAddress(e.target.value)} 
              placeholder="กรอกที่อยู่จัดส่ง" 
              className="h-11"
            />
          </div>
        </div>

        <Button className="h-14 w-full text-base font-semibold" disabled={loading} onClick={pay}>
          {loading ? "กำลังบันทึก..." : "ยืนยันการสั่งซื้อ"}
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
