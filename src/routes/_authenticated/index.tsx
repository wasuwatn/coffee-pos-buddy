import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCatalog, seedSampleMenu, getMyContext } from "@/lib/pos.functions";
import { useCart, formatTHB } from "@/lib/cart-store";
import { ShoppingBag, Sparkles, Plus, Minus, X } from "lucide-react";
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
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
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

        {/* Category Dropdown */}
        {(catalog.data?.categories.length ?? 0) > 0 && (
          <div className="mt-4">
            <select
              value={activeCat}
              onChange={(e) => setActiveCat(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-card px-4 text-sm font-medium shadow-sm outline-none focus:border-primary"
            >
              <option value="all">หมวดหมู่ทั้งหมด</option>
              {catalog.data!.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      {/* Grid */}
      <main className="px-4 py-4">
        {catalog.isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyMenu onSeed={handleSeed} showSeed={ctx.data?.isOwner && (catalog.data?.products.length ?? 0) === 0} />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProduct(p);
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

      {selectedProduct && (
        <ProductOptionModal 
          product={selectedProduct} 
          catalog={catalog.data}
          onClose={() => setSelectedProduct(null)} 
          onAdd={(item, qty) => {
            add(item, qty);
            setSelectedProduct(null);
          }} 
        />
      )}
    </div>
  );
}

function ProductOptionModal({ product, catalog, onClose, onAdd }: any) {
  const [qty, setQty] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, any>>({});

  // 1. Find which modifier groups are linked to this product
  const linkedGroupIds = catalog?.productModifiers
    ?.filter((pm: any) => pm.product_id === product.id)
    .map((pm: any) => pm.group_id) ?? [];
    
  const linkedGroups = catalog?.modifierGroups?.filter((g: any) => linkedGroupIds.includes(g.id)) ?? [];

  // 2. Initialize default options on mount
  useEffect(() => {
    const initial: Record<string, any> = {};
    linkedGroups.forEach((g: any) => {
      const opts = catalog?.modifierOptions?.filter((o: any) => o.group_id === g.id) ?? [];
      if (opts.length > 0) {
        // Just auto-select the first option by default
        initial[g.id] = opts[0];
      }
    });
    setSelectedOptions(initial);
  }, [product.id, catalog]);

  // 3. Calculate extra price
  let extraPrice = 0;
  Object.values(selectedOptions).forEach((opt: any) => {
    if (opt?.price) extraPrice += Number(opt.price);
  });
  
  const unitPrice = Number(product.price) + extraPrice;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
      <div className="w-full max-w-md animate-in slide-in-from-bottom-full rounded-t-3xl bg-card pb-8 pt-5 sm:rounded-3xl sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="px-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">{product.name}</h2>
              <p className="text-lg font-semibold text-primary">{formatTHB(unitPrice)}</p>
            </div>
            <button 
              onClick={onClose}
              className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {linkedGroups.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground bg-muted/30 rounded-xl">ไม่มีส่วนขยายให้เลือกสำหรับเมนูนี้</div>
            ) : (
              linkedGroups.map((g: any) => {
                const opts = catalog?.modifierOptions?.filter((o: any) => o.group_id === g.id) ?? [];
                return (
                  <div key={g.id}>
                    <h3 className="mb-3 text-sm font-semibold text-muted-foreground">
                      {g.name} {g.is_required && <span className="text-destructive">*</span>}
                    </h3>
                    <div className="flex flex-col gap-2">
                      {opts.map((opt: any) => {
                        const isSelected = selectedOptions[g.id]?.id === opt.id;
                        return (
                          <button 
                            key={opt.id}
                            onClick={() => setSelectedOptions(prev => ({ ...prev, [g.id]: opt }))}
                            className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition w-full flex justify-between items-center ${isSelected ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-foreground hover:border-primary/50"}`}
                          >
                            <span>{opt.name}</span>
                            {opt.price > 0 && <span className="text-[18px] font-semibold text-blue-600">+฿{opt.price}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-8">
            <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-card p-2 shadow-sm">
              <span className="pl-3 font-semibold text-foreground">จำนวน</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-foreground hover:bg-muted/80">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-lg font-bold">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button 
                className="h-12 flex-1 text-base font-semibold" 
                onClick={() => {
                  const optsText = Object.values(selectedOptions).map((o: any) => o.name);
                  onAdd({ 
                    productId: product.id, 
                    name: product.name, 
                    price: unitPrice, 
                    color: product.color, 
                    imageUrl: product.image_url,
                    options: optsText.length > 0 ? optsText : undefined
                  }, qty);
                }}
              >
                เพิ่มลงตะกร้า • {formatTHB(unitPrice * qty)}
              </Button>
            </div>
          </div>
        </div>
      </div>
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
