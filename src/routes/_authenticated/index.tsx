import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCatalog, seedSampleMenu, getMyContext } from "@/lib/pos.functions";
import { useCart, formatTHB } from "@/lib/cart-store";
import { ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CartSheet } from "@/components/cart-sheet";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/")({
  component: SellPage,
});

function SellPage() {
  const listFn = useServerFn(listCatalog);
  const ctxFn = useServerFn(getMyContext);
  const seedFn = useServerFn(seedSampleMenu);

  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => listFn() });
  const ctx = useQuery({ queryKey: ["me"], queryFn: () => ctxFn() });

  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [cartOpen, setCartOpen] = useState(false);
  const totalQty = useCart((s) => s.totalQty());
  const totalAmount = useCart((s) => s.totalAmount());
  const add = useCart((s) => s.add);

  const filtered = useMemo(() => {
    const list = catalog.data?.products ?? [];
    if (activeCat === "all") return list;
    return list.filter((p) => p.category_id === activeCat);
  }, [catalog.data, activeCat]);

  const handleSeed = async () => {
    try {
      await seedFn();
      toast.success("เพิ่มเมนูตัวอย่างแล้ว");
      catalog.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 pt-3 pb-2 backdrop-blur" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <div className="flex items-baseline justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">ร้าน</p>
            <h1 className="truncate text-lg font-bold">{ctx.data?.profile?.shop_name ?? "ร้านกาแฟ"}</h1>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">แคชเชียร์</p>
            <p className="truncate text-xs font-medium">{ctx.data?.profile?.full_name ?? "—"}</p>
          </div>
        </div>

        {/* Category chips */}
        {(catalog.data?.categories.length ?? 0) > 0 && (
          <div className="-mx-4 mt-3 overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 px-4 pb-1">
              <Chip active={activeCat === "all"} onClick={() => setActiveCat("all")} color="#2d8ac9">
                ทั้งหมด
              </Chip>
              {catalog.data!.categories.map((c) => (
                <Chip key={c.id} active={activeCat === c.id} onClick={() => setActiveCat(c.id)} color={c.color ?? "#2d8ac9"}>
                  {c.name}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Grid */}
      <main className="px-4 py-4">
        {catalog.isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyMenu onSeed={handleSeed} showSeed={ctx.data?.isOwner && (catalog.data?.products.length ?? 0) === 0} />
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  add({ productId: p.id, name: p.name, price: Number(p.price), color: p.color, imageUrl: p.image_url });
                }}
                className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition active:scale-95"
              >
                <div
                  className="absolute inset-0 opacity-90"
                  style={{ background: `linear-gradient(135deg, ${p.color ?? "#2d8ac9"} 0%, color-mix(in oklab, ${p.color ?? "#2d8ac9"} 60%, black) 100%)` }}
                />
                {p.image_url && (
                  <img src={p.image_url} alt={p.name} className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-60" />
                )}
                <div className="relative flex h-full flex-col justify-between text-white">
                  <p className="line-clamp-2 text-sm font-semibold leading-snug drop-shadow">{p.name}</p>
                  <p className="text-lg font-bold drop-shadow">{formatTHB(Number(p.price))}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Floating cart bar */}
      {totalQty > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-0 z-30 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground shadow-xl shadow-primary/30 transition active:scale-[0.98]"
          style={{ left: "1rem", right: "1rem", bottom: "calc(72px + env(safe-area-inset-bottom))" }}
        >
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-foreground/20 text-sm font-bold">{totalQty}</span>
            <span className="text-sm font-semibold">ดูตะกร้า</span>
          </span>
          <span className="flex items-center gap-2 text-base font-bold">
            {formatTHB(totalAmount)}
            <ShoppingBag className="h-5 w-5" />
          </span>
        </button>
      )}

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />
    </div>
  );
}

function Chip({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active ? "border-transparent text-white shadow-sm" : "border-border bg-card text-foreground"
      }`}
      style={active ? { backgroundColor: color } : undefined}
    >
      {children}
    </button>
  );
}

function EmptyMenu({ onSeed, showSeed }: { onSeed: () => void; showSeed?: boolean }) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="font-semibold">ยังไม่มีสินค้าในเมนู</p>
      <p className="mt-1 text-sm text-muted-foreground">
        เพิ่มเมนูจากหน้า "สินค้า" หรือกดปุ่มด้านล่างเพื่อโหลดเมนูตัวอย่าง
      </p>
      {showSeed && (
        <Button onClick={onSeed} className="mt-4">
          โหลดเมนูตัวอย่าง
        </Button>
      )}
    </div>
  );
}
