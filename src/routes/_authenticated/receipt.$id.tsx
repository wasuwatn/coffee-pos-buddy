import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useOrders } from "@/lib/hub/orders";
import { formatTHB } from "@/lib/cart-store";
import { claimUrl } from "@/lib/hub/pos-helpers";
import { CheckCircle2, Home, Receipt as ReceiptIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated/receipt/$id")({
  component: ReceiptPage,
});

const PAY_LABEL: Record<string, string> = {
  Cash: "เงินสด",
  PromptPay: "PromptPay",
  Transfer: "โอนเงิน",
};

function ReceiptPage() {
  const { id } = Route.useParams();
  const q = useOrders();
  const [claim, setClaim] = useState<{ code: string; points: number; qrUrl: string } | null>(null);

  // Additive loyalty QR: checkout.tsx stashes the claim code here right after
  // a successful sale earns one — only present for the order that was just
  // completed, never when reached any other way.
  useEffect(() => {
    const raw = sessionStorage.getItem(`kafe-receipt-claim-${id}`);
    if (!raw) return;
    try {
      const { code, points } = JSON.parse(raw) as { code: string; points: number };
      QRCode.toDataURL(claimUrl(code), { width: 240, margin: 1 })
        .then((qrUrl) => setClaim({ code, points, qrUrl }))
        .catch(() => {});
    } catch {
      // malformed — nothing to show
    }
  }, [id]);

  if (q.isLoading) return <div className="p-8 text-center text-muted-foreground">กำลังโหลด...</div>;
  const order = q.data?.find((o) => o.orderNo === id);
  if (!order) return <div className="p-8 text-center text-muted-foreground">ไม่พบบิล</div>;

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
          <span>บิล #{order.orderNo}</span>
          <span>
            {new Date(order.date).toLocaleDateString("th-TH", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <ul className="mb-3 divide-y divide-border">
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
                  <p className="truncate font-medium">{it.menu_name}</p>
                  {optionParts.length > 0 && (
                    <p className="text-xs text-muted-foreground">{optionParts.join(", ")}</p>
                  )}
                </div>
                <span className="ml-3 font-semibold">{formatTHB(Number(it.total_price))}</span>
              </li>
            );
          })}
        </ul>

        <div className="space-y-1 border-t border-dashed border-border pt-3 text-sm">
          <Row label="ยอดรวม" value={formatTHB(order.total)} bold />
          <Row label="ชำระโดย" value={PAY_LABEL[order.paymentMethod] ?? order.paymentMethod} />
        </div>
      </div>

      {claim && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-sm font-semibold">สะสม {claim.points} แต้ม</p>
          <img
            src={claim.qrUrl}
            alt="QR รับแต้มสะสม"
            className="mx-auto mt-3 h-40 w-40 rounded-xl border border-border"
          />
          <p className="mt-3 text-lg font-bold tracking-[0.3em]">{claim.code}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            แสกน QR หรือกรอกรหัสที่หน้าสะสมแต้มของลูกค้าเพื่อรับแต้ม
          </p>
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Link
          to="/history"
          className="flex h-11 items-center justify-center gap-1.5 rounded-md border border-input text-sm font-medium hover:bg-accent"
        >
          <ReceiptIcon className="h-4 w-4" />
          ประวัติ
        </Link>
        <Link
          to="/"
          className="flex h-11 items-center justify-center gap-1.5 rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Home className="h-4 w-4" />
          ขายต่อ
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div
      className={`flex justify-between ${bold ? "text-base font-bold" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span className={bold ? "text-foreground" : ""}>{value}</span>
    </div>
  );
}
