import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { toast } from "sonner";
import { useOrders, type SaleRow } from "@/lib/hub/orders";
import { hub, HubApiError } from "@/lib/hub/client";
import { formatTHB } from "@/lib/cart-store";
import { claimUrl } from "@/lib/hub/pos-helpers";
import { saveNodeAsImage } from "@/lib/save-image";
import { useHubUser } from "@/lib/hub/session";
import { ArrowLeft, Ban, ImageDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history/$id")({
  component: HistoryDetail,
});

const PAY_LABEL: Record<string, string> = {
  Cash: "เงินสด",
  PromptPay: "PromptPay",
  Transfer: "โอนเงิน",
};

// Group the per-cup salefront rows of an order into display lines sharing the
// same menu/customisation/price, so identical cups collapse to a "3x" count.
type OrderLine = { rep: SaleRow; count: number };

function HistoryDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useHubUser();
  const isAdmin = user?.role === "Admin";
  const q = useOrders();
  const order = q.data?.find((o) => o.orderNo === id);

  const receiptRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [qrUrl, setQrUrl] = useState("");

  // Loyalty QR + points come from the receipt claim code the hub minted at
  // checkout, looked up by order. A voided bill has no claim row, so skip the
  // fetch entirely.
  const claim = useQuery({
    queryKey: ["hub-receipt-claim", id],
    queryFn: () => hub.receiptClaim(id),
    enabled: !!order && !order.voided,
    staleTime: 1000 * 30,
  });

  const claimCode = claim.data?.claim_code ?? null;
  const claimStatus = claim.data?.status ?? null;
  const claimPoints = claim.data?.points ?? 0;
  const showQr = !order?.voided && !!claimCode && claimStatus === "pending";

  // Regenerate the QR image whenever the claim code changes.
  useEffect(() => {
    if (!showQr || !claimCode) {
      setQrUrl("");
      return;
    }
    QRCode.toDataURL(claimUrl(claimCode), { width: 240, margin: 1 })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [showQr, claimCode]);

  const lines = useMemo<OrderLine[]>(() => {
    if (!order) return [];
    const map = new Map<string, OrderLine>();
    for (const it of order.items) {
      const key = [
        it.menu_name,
        it.variant,
        it.sweetness,
        it.container,
        it.addons,
        it.is_free,
        it.total_price,
      ].join("|");
      const line = map.get(key);
      if (line) line.count += 1;
      else map.set(key, { rep: it, count: 1 });
    }
    return [...map.values()];
  }, [order]);

  if (q.isLoading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>;
  if (!order) return <div className="p-8 text-center text-muted-foreground">ไม่พบบิล</div>;

  // Voided bills carry total 0; show the original amount struck through so the
  // cashier still sees what the cancelled bill was worth.
  const grossTotal = order.items.reduce((n, i) => n + Number(i.total_price), 0);

  const saveImage = async () => {
    if (!receiptRef.current || saving) return;
    setSaving(true);
    try {
      const result = await saveNodeAsImage(receiptRef.current, `บิล-${order.orderNo}.png`);
      if (result === "downloaded") toast.success("บันทึกรูปบิลแล้ว");
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      toast.error("บันทึกรูปบิลไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const voidBill = async () => {
    if (voiding) return;
    if (!window.confirm(`ยกเลิกบิล #${order.orderNo}? การยกเลิกจะไม่นับยอดบิลนี้`)) return;
    setVoiding(true);
    try {
      await hub.voidOrder(order.orderNo);
      await qc.invalidateQueries({ queryKey: ["hub-orders"] });
      toast.success("ยกเลิกบิลแล้ว");
    } catch (e) {
      const message = e instanceof HubApiError ? e.message : "ยกเลิกบิลไม่สำเร็จ";
      toast.error(message);
    } finally {
      setVoiding(false);
    }
  };

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
        {order.voided && (
          <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
            ยกเลิกแล้ว
          </span>
        )}
      </header>

      <main className="px-4 py-4">
        {/* Capture root: forced light background so a dark-mode screen still
            exports a clean, legible white bill image (mirrors receipt page). */}
        <div ref={receiptRef} className="rounded-2xl bg-white p-4 text-neutral-900">
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
              {order.customerName && order.customerName !== "Walk-in" && (
                <p>ลูกค้า: {order.customerName}</p>
              )}
              {order.cashier && <p>แคชเชียร์: {order.cashier}</p>}
              <p>ชำระเงินโดย: {PAY_LABEL[order.paymentMethod] ?? order.paymentMethod}</p>
            </div>

            <ul className="divide-y divide-border">
              {lines.map((line) => {
                const it = line.rep;
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
                  <li
                    key={[it.menu_name, it.addons, it.is_free, it.total_price].join("|")}
                    className="flex items-start justify-between gap-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {line.count > 1 && (
                          <span className="text-muted-foreground">{line.count}x </span>
                        )}
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
                    <span className="ml-3 shrink-0 font-semibold">
                      {formatTHB(Number(it.total_price) * line.count)}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 flex justify-between border-t border-dashed border-border pt-3 text-lg font-bold">
              <span>ยอดรวม</span>
              <span className={order.voided ? "text-muted-foreground line-through" : ""}>
                {formatTHB(order.voided ? grossTotal : order.total)}
              </span>
            </div>
            {order.voided && (
              <p className="mt-1 text-right text-xs font-semibold text-destructive">
                บิลนี้ถูกยกเลิก
              </p>
            )}
          </div>

          {showQr && qrUrl && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-center">
              <p className="text-sm font-semibold whitespace-nowrap">สะสม {claimPoints} แต้ม</p>
              <img
                src={qrUrl}
                alt="QR รับแต้มสะสม"
                className="mx-auto mt-3 h-40 w-40 rounded-xl border border-border"
              />
              <p className="mt-3 text-lg font-bold tracking-[0.3em] whitespace-nowrap">
                {claimCode}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                แสกน QR หรือกรอกรหัสที่หน้าสะสมแต้มของลูกค้าเพื่อรับ {claimPoints} แต้ม
              </p>
            </div>
          )}

          {!order.voided && claimStatus === "claimed" && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-4 text-center text-sm text-muted-foreground">
              ลูกค้ารับแต้มบิลนี้แล้ว
            </div>
          )}
        </div>

        <button
          onClick={saveImage}
          disabled={saving}
          className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-md border border-input text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <ImageDown className="h-4 w-4" />
          {saving ? "กำลังบันทึก..." : "บันทึกรูปบิล"}
        </button>

        {isAdmin && !order.voided && (
          <button
            onClick={voidBill}
            disabled={voiding}
            className="mt-2 flex h-11 w-full items-center justify-center gap-1.5 rounded-md border border-destructive/40 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
          >
            <Ban className="h-4 w-4" />
            {voiding ? "กำลังยกเลิก..." : "ยกเลิกบิล (Void)"}
          </button>
        )}
      </main>
    </div>
  );
}
