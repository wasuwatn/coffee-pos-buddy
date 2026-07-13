import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import QRCode from "qrcode";
import { toast } from "sonner";
import { useOrders, type SaleRow } from "@/lib/hub/orders";
import { hub, HubApiError } from "@/lib/hub/client";
import { formatTHB } from "@/lib/cart-store";
import { orderClaimUrl } from "@/lib/hub/pos-helpers";
import { saveNodeAsImage } from "@/lib/save-image";
import { useHubUser, hasAccess } from "@/lib/hub/session";
import { ArrowLeft, Check, ImageDown, Minus, Pencil, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/history/$id")({
  component: HistoryDetail,
});

const PAY_LABEL: Record<string, string> = {
  Cash: "เงินสด",
  PromptPay: "PromptPay",
  Transfer: "โอนเงิน",
};

// One display line groups the individual per-cup salefront rows that share the
// same menu/customisation/price, so the cup count can be stepped up and down.
type OrderLine = { rep: SaleRow; rowIds: number[] };

function HistoryDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useHubUser();
  const canEdit = hasAccess(user, "bom");
  const q = useOrders();
  const order = q.data?.find((o) => o.orderNo === id);

  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const receiptRef = useRef<HTMLDivElement>(null);

  // Loyalty points earned = number of paid (non-free) cups. Derived locally so
  // it — and the QR below — track edits to the bill without a hub round-trip
  // for a claim code (past bills have none stored).
  const points = order ? order.items.filter((it) => it.is_free !== "1").length : 0;

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
      if (line) line.rowIds.push(it.id);
      else map.set(key, { rep: it, rowIds: [it.id] });
    }
    return [...map.values()];
  }, [order]);

  useEffect(() => {
    if (!order) {
      setQrUrl("");
      return;
    }
    QRCode.toDataURL(orderClaimUrl(order.orderNo, points), { width: 240, margin: 1 })
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [order, points]);

  if (q.isLoading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>;
  if (!order) return <div className="p-8 text-center text-muted-foreground">ไม่พบบิล</div>;

  const runMutation = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await qc.invalidateQueries({ queryKey: ["hub-orders"] });
    } catch (e) {
      const message = e instanceof HubApiError ? e.message : "แก้ไขบิลไม่สำเร็จ";
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  // Add a cup: clone every column of a representative row (the hub assigns a
  // fresh id) so it lands under the same order_no. quantity is always 1 — each
  // cup is its own salefront row, matching how checkout rings them up.
  const addCup = (rep: SaleRow) =>
    runMutation(() =>
      hub.insert("salefront", {
        date: rep.date,
        customer_name: rep.customer_name,
        menu_name: rep.menu_name,
        variant: rep.variant,
        quantity: 1,
        sweetness: rep.sweetness,
        container: rep.container,
        addons: rep.addons,
        addon_price: rep.addon_price,
        total_price: rep.total_price,
        cashier: rep.cashier,
        order_no: rep.order_no,
        payment_method: rep.payment_method,
        is_free: rep.is_free,
      }),
    );

  const removeCup = (rowIds: number[]) =>
    runMutation(() => hub.remove("salefront", Math.max(...rowIds)));

  const removeLine = (rowIds: number[]) =>
    runMutation(async () => {
      for (const rid of rowIds) await hub.remove("salefront", rid);
    });

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
        {canEdit && (
          <button
            onClick={() => setEditMode((v) => !v)}
            className={`ml-auto flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium ${
              editMode ? "bg-primary text-primary-foreground" : "hover:bg-muted"
            }`}
          >
            {editMode ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            {editMode ? "เสร็จ" : "แก้ไข"}
          </button>
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
              {order.cashier && <p>แคชเชียร์: {order.cashier}</p>}
              <p>ชำระเงินโดย: {PAY_LABEL[order.paymentMethod] ?? order.paymentMethod}</p>
            </div>

            <ul className="divide-y divide-border">
              {lines.map((line) => {
                const it = line.rep;
                const count = line.rowIds.length;
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
                    key={line.rowIds.join(",")}
                    className="flex items-start justify-between gap-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">
                        {count > 1 && <span className="text-muted-foreground">{count}x </span>}
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
                    {editMode ? (
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => removeCup(line.rowIds)}
                          disabled={busy}
                          className="grid h-8 w-8 place-items-center rounded-full bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">{count}</span>
                        <button
                          onClick={() => addCup(it)}
                          disabled={busy}
                          className="grid h-8 w-8 place-items-center rounded-full bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => removeLine(line.rowIds)}
                          disabled={busy}
                          className="ml-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="ml-3 shrink-0 font-semibold">
                        {formatTHB(Number(it.total_price) * count)}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            <div className="mt-3 flex justify-between border-t border-dashed border-border pt-3 text-lg font-bold">
              <span>ยอดรวม</span>
              <span>{formatTHB(order.total)}</span>
            </div>
          </div>

          {qrUrl && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-center">
              <p className="text-sm font-semibold whitespace-nowrap">สะสม {points} แต้ม</p>
              <img
                src={qrUrl}
                alt="QR รับแต้มสะสม"
                className="mx-auto mt-3 h-40 w-40 rounded-xl border border-border"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                แสกน QR ที่หน้าสะสมแต้มของลูกค้าเพื่อรับ {points} แต้ม
              </p>
            </div>
          )}
        </div>

        {editMode && (
          <p className="mt-3 px-1 text-center text-xs text-muted-foreground">
            การแก้ไขบิลย้อนหลังจะไม่ปรับยอดสรุปกะที่ปิดไปแล้ว
          </p>
        )}

        <button
          onClick={saveImage}
          disabled={saving}
          className="mt-4 flex h-11 w-full items-center justify-center gap-1.5 rounded-md border border-input text-sm font-medium hover:bg-accent disabled:opacity-50"
        >
          <ImageDown className="h-4 w-4" />
          {saving ? "กำลังบันทึก..." : "บันทึกรูปบิล"}
        </button>
      </main>
    </div>
  );
}
