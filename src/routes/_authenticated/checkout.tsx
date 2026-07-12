import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCart, formatTHB } from "@/lib/cart-store";
import { useCatalog } from "@/lib/hub/catalog";
import { useHubUser } from "@/lib/hub/session";
import { hub, HubApiError } from "@/lib/hub/client";
import { today } from "@/lib/hub/pos-helpers";
import { promptpayPayload } from "@/lib/hub/promptpay";
import QRCode from "qrcode";
import { useEffect } from "react";
import { ArrowLeft, Banknote, Smartphone, QrCode } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/checkout")({
  component: CheckoutPage,
});

type PayMethod = "Cash" | "PromptPay" | "Transfer";

function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const items = useCart((s) => s.items);
  const total = useCart((s) => s.totalAmount());
  const clear = useCart((s) => s.clear);
  const user = useHubUser();
  const catalog = useCatalog();
  const shift = useQuery({ queryKey: ["hub-shift-current"], queryFn: () => hub.shiftCurrent() });

  const [customerName, setCustomerName] = useState("");
  const [payMethod, setPayMethod] = useState<PayMethod>("Cash");
  const [cashReceived, setCashReceived] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  const shopSettings = catalog.data?.settings;
  const changeDue =
    payMethod === "Cash" && cashReceived !== "" ? Number(cashReceived) - total : null;

  useEffect(() => {
    if (payMethod !== "PromptPay" || !shopSettings?.promptpay_id) {
      setQrUrl("");
      return;
    }
    QRCode.toDataURL(promptpayPayload(shopSettings.promptpay_id, total), { width: 320, margin: 1 })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [payMethod, shopSettings?.promptpay_id, total]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="text-muted-foreground">ตะกร้าว่างเปล่า</p>
        <button
          className="mt-4 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
          onClick={() => navigate({ to: "/" })}
        >
          กลับหน้าขาย
        </button>
      </div>
    );
  }

  if (shift.isLoading) {
    return <div className="p-8 text-center text-muted-foreground">กำลังตรวจสอบกะ...</div>;
  }

  if (!shift.data) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="font-semibold">ยังไม่ได้เปิดกะ</p>
        <p className="mt-1 text-sm text-muted-foreground">กรุณาเปิดกะที่หน้าตั้งค่าก่อนเริ่มขาย</p>
        <button
          className="mt-4 h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground"
          onClick={() => navigate({ to: "/settings" })}
        >
          ไปหน้าตั้งค่า
        </button>
      </div>
    );
  }

  const pay = async () => {
    if (payMethod === "Cash" && cashReceived !== "" && (changeDue ?? 0) < 0) {
      toast.error("รับเงินน้อยกว่ายอดที่ต้องชำระ");
      return;
    }
    if (!catalog.data) return;
    setLoading(true);
    try {
      const sales: Record<string, unknown>[] = [];
      for (const item of items) {
        const product = catalog.data.products.find((p) => p.id === item.menuId);
        const variant = catalog.data.childmenu.find((c) => String(c.id) === String(item.childId));
        // Every selected modifier (across every category, not just the old
        // fixed container/sweetness/extra slots) folds into the addons
        // column — the salefront table has no per-category columns beyond
        // these fixed ones, so container/sweetness stay blank going forward.
        const addonNames = item.modifiers.flatMap((m) => m.optionNames);
        const addonPrice = item.modifiers.reduce((n, m) => n + m.priceChange, 0);
        for (let i = 0; i < item.qty; i++) {
          sales.push({
            date: today(),
            customer_name: customerName.trim() || "Walk-in",
            payment_method: payMethod,
            shift_id: String(shift.data!.id),
            order_type: "Dine-in",
            menu_name: product?.name ?? item.name,
            variant: variant?.name ?? "",
            quantity: 1,
            sweetness: "",
            container: "",
            addons: JSON.stringify(addonNames),
            addon_price: addonPrice,
            total_price: item.price,
            cashier: user?.username ?? "",
            is_free: "0",
            promotion_id: "",
          });
        }
      }

      const res = await hub.checkoutPos({
        client_txn_id: crypto.randomUUID(),
        date: today(),
        sales,
      });
      clear();
      qc.invalidateQueries({ queryKey: ["hub-shift-current"] });
      qc.invalidateQueries({ queryKey: ["hub-orders"] });
      if ("duplicate" in res) {
        toast.info("บิลนี้ถูกบันทึกไปแล้ว");
        navigate({ to: "/history" });
        return;
      }
      if (payMethod === "Cash" && cashReceived !== "" && (changeDue ?? 0) > 0) {
        toast.success(`เงินทอน ${formatTHB(changeDue!)}`, { duration: 6000 });
      }
      const first = res[0] as { order_no?: string; claim_code?: string; claim_points?: number };
      const orderNo = String(first?.order_no ?? "");
      // Additive loyalty QR: the checkout response carries a one-time claim
      // code (see runCheckout in SMA08's server/index.js) whenever the order
      // earned points. Stash it for the receipt page — it's only ever read
      // right after this checkout, never for a later reprint (those go
      // through /history/$id instead, which has no claim data).
      if (orderNo && first?.claim_code) {
        sessionStorage.setItem(
          `kafe-receipt-claim-${orderNo}`,
          JSON.stringify({ code: first.claim_code, points: first.claim_points ?? 0 }),
        );
      }
      navigate(orderNo ? { to: "/receipt/$id", params: { id: orderNo } } : { to: "/history" });
    } catch (e) {
      const message = e instanceof HubApiError ? e.message : "บันทึกการขายไม่สำเร็จ";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <header
        className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <button
          onClick={() => navigate({ to: "/" })}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">เก็บเงิน</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">ยอดที่ต้องชำระ</p>
          <p className="mt-1 text-4xl font-bold text-primary">{formatTHB(total)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {items.reduce((n, i) => n + i.qty, 0)} รายการ
          </p>
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
                    {i.options && (
                      <p className="mt-0.5 text-xs text-muted-foreground">{i.options.join(", ")}</p>
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

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">วิธีชำระเงิน</p>
          <div className="grid grid-cols-3 gap-2">
            <MethodBtn
              active={payMethod === "Cash"}
              onClick={() => setPayMethod("Cash")}
              icon={<Banknote className="h-5 w-5" />}
              label="เงินสด"
            />
            <MethodBtn
              active={payMethod === "PromptPay"}
              onClick={() => setPayMethod("PromptPay")}
              icon={<QrCode className="h-5 w-5" />}
              label="PromptPay"
            />
            <MethodBtn
              active={payMethod === "Transfer"}
              onClick={() => setPayMethod("Transfer")}
              icon={<Smartphone className="h-5 w-5" />}
              label="โอนเงิน"
            />
          </div>

          {payMethod === "Cash" && (
            <div className="mt-4 space-y-2">
              <label className="block text-sm font-medium">รับเงินมา (บาท)</label>
              <input
                type="number"
                inputMode="decimal"
                value={cashReceived}
                onChange={(e) => setCashReceived(e.target.value)}
                placeholder={String(total)}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
              {changeDue != null && changeDue >= 0 && (
                <p className="text-sm text-muted-foreground">เงินทอน: {formatTHB(changeDue)}</p>
              )}
            </div>
          )}

          {payMethod === "PromptPay" && (
            <div className="mt-4 flex flex-col items-center gap-2">
              {shopSettings?.promptpay_id ? (
                qrUrl ? (
                  <img
                    src={qrUrl}
                    alt="PromptPay QR"
                    className="h-56 w-56 rounded-xl border border-border"
                  />
                ) : (
                  <div className="h-56 w-56 animate-pulse rounded-xl bg-muted" />
                )
              ) : (
                <p className="text-sm text-muted-foreground">
                  ยังไม่ได้ตั้งค่าเลข PromptPay (ตั้งค่าได้ที่แอป Mother)
                </p>
              )}
              <p className="text-xs text-muted-foreground">ให้ลูกค้าสแกนจ่าย {formatTHB(total)}</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium">ชื่อลูกค้า (ไม่บังคับ)</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="กรอกชื่อลูกค้า"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          className="h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition active:scale-[0.98] disabled:opacity-50"
          disabled={loading}
          onClick={pay}
        >
          {loading ? "กำลังบันทึก..." : "ยืนยันการสั่งซื้อ"}
        </button>
      </main>
    </div>
  );
}

function MethodBtn({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 py-4 font-semibold transition ${
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-card text-muted-foreground"
      }`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}
