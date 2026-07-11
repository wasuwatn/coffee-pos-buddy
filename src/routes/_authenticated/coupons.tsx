import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { hub, HubApiError, type RedemptionLookup } from "@/lib/hub/client";
import { formatTHB } from "@/lib/cart-store";
import { toast } from "sonner";
import { Ticket } from "lucide-react";

export const Route = createFileRoute("/_authenticated/coupons")({
  component: CouponsPage,
});

function CouponsPage() {
  const [codeInput, setCodeInput] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [using, setUsing] = useState(false);
  const [found, setFound] = useState<RedemptionLookup | null>(null);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setLookingUp(true);
    setFound(null);
    try {
      const r = await hub.redemptionLookup(code);
      setFound(r);
    } catch (e2) {
      const message =
        e2 instanceof HubApiError
          ? e2.status === 404
            ? "ไม่พบรหัสนี้ หรือถูกใช้ไปแล้ว"
            : e2.message
          : "ค้นหารหัสไม่สำเร็จ";
      toast.error(message);
    } finally {
      setLookingUp(false);
    }
  };

  const useCoupon = async () => {
    if (!found) return;
    setUsing(true);
    try {
      const r = await hub.redemptionUse(found.code);
      toast.success(`ใช้คูปองของ ${r.customer_name} เรียบร้อย`);
      setFound(null);
      setCodeInput("");
    } catch (e) {
      const message =
        e instanceof HubApiError ? e.message : "ใช้คูปองไม่สำเร็จ กรุณาลองใหม่";
      toast.error(message);
    } finally {
      setUsing(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <header
        className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <h1 className="text-lg font-bold">ใช้คูปอง</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        <form onSubmit={lookup} className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <label className="block text-sm font-medium">รหัสคูปองลูกค้า</label>
          <div className="flex gap-2">
            <input
              value={codeInput}
              maxLength={6}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              placeholder="เช่น A1B2C3"
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm uppercase tracking-widest outline-none focus:border-primary"
            />
            <button
              type="submit"
              disabled={lookingUp || !codeInput.trim()}
              className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {lookingUp ? "…" : "ค้นหา"}
            </button>
          </div>
        </form>

        {found && (
          <div className="rounded-2xl border border-border bg-card p-5 text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Ticket className="h-6 w-6" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">รหัสคูปอง</p>
            <p className="text-2xl font-bold tracking-widest">{found.code}</p>
            <p className="mt-2 text-sm">
              ลูกค้า: <span className="font-semibold">{found.customer_name}</span>
            </p>
            {found.max_free_value != null && found.max_free_value > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                ใช้กับเมนูราคาไม่เกิน {formatTHB(found.max_free_value)}
              </p>
            )}
            <button
              onClick={useCoupon}
              disabled={using}
              className="mt-4 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {using ? "กำลังบันทึก…" : "ใช้คูปอง"}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
