import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart, formatTHB } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { Gift, Minus, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

export function CartSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const items = useCart((s) => s.items);
  const inc = useCart((s) => s.inc);
  const dec = useCart((s) => s.dec);
  const setFree = useCart((s) => s.setFree);
  const remove = useCart((s) => s.remove);
  const clear = useCart((s) => s.clear);
  const total = useCart((s) => s.totalAmount());
  const navigate = useNavigate();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-w-md rounded-t-3xl p-0">
        <SheetHeader className="border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle>ตะกร้า</SheetTitle>
            {items.length > 0 && (
              <button onClick={clear} className="text-xs text-muted-foreground hover:text-destructive">
                ล้างตะกร้า
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-3">
          {items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีรายการในตะกร้า</p>
          ) : (
            <ul className="space-y-3">
              {items.map((i) => (
                <li key={i.cartItemId} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg text-white text-xs font-bold" style={{ backgroundColor: i.color || "#2d8ac9" }}>
                      {i.imageUrl && <img src={i.imageUrl} alt={i.name} className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-60" />}
                      <span className="relative z-10 drop-shadow">{i.name.slice(0, 2)}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">
                        {i.name}
                        {i.freeQty > 0 && (
                          <span className="ml-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            ฟรี {i.freeQty} แก้ว
                          </span>
                        )}
                      </p>
                      {i.options && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{i.options.join(", ")}</p>}
                      <p className="mt-0.5 text-xs font-medium text-primary">
                        {formatTHB((i.qty - i.freeQty) * i.price)}
                        {i.freeQty > 0 && (
                          <span className="ml-1.5 text-[11px] font-normal text-muted-foreground line-through">
                            {formatTHB(i.qty * i.price)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button onClick={() => dec(i.cartItemId)} className="grid h-8 w-8 place-items-center rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors">
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                      <button onClick={() => inc(i.cartItemId)} className="grid h-8 w-8 place-items-center rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors">
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <button onClick={() => remove(i.cartItemId)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2.5 flex items-center justify-between border-t border-dashed border-border pt-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Gift className="h-3.5 w-3.5" />
                      แก้วฟรี
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setFree(i.cartItemId, i.freeQty - 1)}
                        disabled={i.freeQty === 0}
                        className="grid h-7 w-7 place-items-center rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-40"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{i.freeQty}</span>
                      <button
                        onClick={() => setFree(i.cartItemId, i.freeQty + 1)}
                        disabled={i.freeQty >= i.qty}
                        className="grid h-7 w-7 place-items-center rounded-full bg-muted text-foreground hover:bg-muted/80 transition-colors disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-border bg-card px-5 py-4" style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}>
          <div className="mb-3 flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">ยอดรวม</span>
            <span className="text-2xl font-bold">{formatTHB(total)}</span>
          </div>
          <Button
            className="h-12 w-full text-base font-semibold"
            disabled={items.length === 0}
            onClick={() => {
              onOpenChange(false);
              navigate({ to: "/checkout" });
            }}
          >
            เก็บเงิน
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
