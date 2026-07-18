import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import {
  useCatalog,
  categoryColor,
  parseModifierCategories,
  modifierCategoriesForMenu,
  type MenuItem,
} from "@/lib/hub/catalog";
import { useHubUser } from "@/lib/hub/session";
import { useCart, formatTHB, type CartItem, type SelectedModifier } from "@/lib/cart-store";
import { ShoppingBag, Sparkles, Plus, Minus, X } from "lucide-react";
import { CartSheet } from "@/components/cart-sheet";

export const Route = createFileRoute("/_authenticated/")({
  component: SellPage,
});

function SellPage() {
  const catalog = useCatalog();
  const user = useHubUser();

  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const [cartOpen, setCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<MenuItem | null>(null);
  const totalQty = useCart((s) => s.totalQty());
  const totalAmount = useCart((s) => s.totalAmount());
  const add = useCart((s) => s.add);

  const filtered = useMemo(() => {
    const list = catalog.data?.products ?? [];
    if (activeCat === "all") return list;
    return list.filter((p) => p.category === activeCat);
  }, [catalog.data, activeCat]);

  return (
    <div className="mx-auto max-w-md">
      <header
        className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 pt-3 pb-2 backdrop-blur"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <div className="flex items-baseline justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              ร้าน
            </p>
            <h1 className="truncate text-lg font-bold">
              {catalog.data?.settings?.shop_name || "ร้านกาแฟ"}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">แคชเชียร์</p>
            <p className="truncate text-xs font-medium">{user?.username ?? "—"}</p>
          </div>
        </div>

        {(catalog.data?.categories.length ?? 0) > 0 && (
          <div className="mt-4">
            <select
              value={activeCat}
              onChange={(e) => setActiveCat(e.target.value)}
              className="h-10 w-full rounded-xl border border-input bg-card px-4 text-sm font-medium shadow-sm outline-none focus:border-primary"
            >
              <option value="all">หมวดหมู่ทั้งหมด</option>
              {catalog.data!.categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
      </header>

      <main className="px-4 py-4">
        {catalog.isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : catalog.isError ? (
          <div className="mt-10 rounded-2xl border border-dashed border-destructive/40 bg-destructive/5 p-8 text-center text-sm text-destructive">
            โหลดเมนูไม่สำเร็จ: {(catalog.error as Error).message}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyMenu />
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {filtered.map((p) => {
              const color = p.color || categoryColor(p.category, catalog.data!.categories);
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedProduct(p)}
                  className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition active:scale-95"
                >
                  <div
                    className="absolute inset-0 opacity-90"
                    style={{
                      background: `linear-gradient(135deg, ${color} 0%, color-mix(in oklab, ${color} 60%, black) 100%)`,
                    }}
                  />
                  <div className="relative flex h-full flex-col justify-center text-white">
                    <p className="line-clamp-3 break-words text-sm font-semibold leading-snug drop-shadow">
                      {p.name}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>

      {totalQty > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed inset-x-0 z-30 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground shadow-xl shadow-primary/30 transition active:scale-[0.98]"
          style={{
            left: "1rem",
            right: "1rem",
            bottom: "calc(72px + env(safe-area-inset-bottom))",
          }}
        >
          <span className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-foreground/20 text-sm font-bold">
              {totalQty}
            </span>
            <span className="text-sm font-semibold">ดูตะกร้า</span>
          </span>
          <span className="flex items-center gap-2 text-base font-bold">
            {formatTHB(totalAmount)}
            <ShoppingBag className="h-5 w-5" />
          </span>
        </button>
      )}

      <CartSheet open={cartOpen} onOpenChange={setCartOpen} />

      {selectedProduct && catalog.data && (
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

function ProductOptionModal({
  product,
  catalog,
  onClose,
  onAdd,
}: {
  product: MenuItem;
  catalog: NonNullable<ReturnType<typeof useCatalog>["data"]>;
  onClose: () => void;
  onAdd: (item: Omit<CartItem, "qty" | "cartItemId" | "freeQty">, qty: number) => void;
}) {
  const variants = catalog.childmenu.filter((c) => c.menu_name === product.name);
  const allCategories = useMemo(() => parseModifierCategories(catalog.addons), [catalog.addons]);
  const categories = useMemo(
    () => modifierCategoriesForMenu(product.id, allCategories, catalog.menuModifiers),
    [product.id, allCategories, catalog.menuModifiers],
  );

  const [childId, setChildId] = useState<string | null>(variants[0]?.id ?? null);
  // categoryId -> selected option names (single-select holds 0-1 entries)
  const [selections, setSelections] = useState<Record<number, string[]>>({});
  const [qty, setQty] = useState(1);

  useEffect(() => {
    setChildId(variants[0]?.id ?? null);
    // Pre-select the first option of each required (single-select) category,
    // same default-friendly behavior the old fixed container/sweetness
    // pickers had — multi-select categories start empty.
    const defaults: Record<number, string[]> = {};
    categories.forEach((cat) => {
      if (cat.mode === "single" && cat.options[0]) defaults[cat.id] = [cat.options[0].name];
    });
    setSelections(defaults);
    setQty(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id, categories]);

  const selectedVariant = variants.find((v) => String(v.id) === String(childId));

  const selectSingle = (categoryId: number, optionName: string) => {
    setSelections((prev) => ({ ...prev, [categoryId]: [optionName] }));
  };
  const toggleMulti = (categoryId: number, optionName: string) => {
    setSelections((prev) => {
      const current = prev[categoryId] ?? [];
      const next = current.includes(optionName)
        ? current.filter((n) => n !== optionName)
        : [...current, optionName];
      return { ...prev, [categoryId]: next };
    });
  };

  const modifiers: SelectedModifier[] = categories.map((cat) => {
    const names = selections[cat.id] ?? [];
    const priceChange = names.reduce(
      (n, name) => n + Number(cat.options.find((o) => o.name === name)?.price_change ?? 0),
      0,
    );
    return {
      categoryId: cat.id,
      categoryName: cat.name,
      mode: cat.mode,
      optionNames: names,
      priceChange,
    };
  });
  const missingRequired = categories.some(
    (cat) => cat.mode === "single" && (selections[cat.id] ?? []).length === 0,
  );

  const unitPrice =
    Number(product.front_price) +
    Number(selectedVariant?.price_change ?? 0) +
    modifiers.reduce((n, m) => n + m.priceChange, 0);

  const displayName = selectedVariant ? `${product.name} (${selectedVariant.name})` : product.name;
  const options = [selectedVariant?.name, ...modifiers.flatMap((m) => m.optionNames)].filter(
    Boolean,
  ) as string[];

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
            {variants.length > 0 && (
              <OptionGroup title="ตัวเลือก">
                {variants.map((v) => (
                  <PillButton
                    key={v.id}
                    active={String(childId) === String(v.id)}
                    onClick={() => setChildId(v.id)}
                  >
                    {v.name}
                    {Number(v.price_change) !== 0 && (
                      <span className="ml-1 text-xs opacity-80">
                        ({Number(v.price_change) > 0 ? "+" : ""}
                        {formatTHB(Number(v.price_change))})
                      </span>
                    )}
                  </PillButton>
                ))}
              </OptionGroup>
            )}

            {categories.map((cat) =>
              cat.mode === "single" ? (
                <OptionGroup key={cat.id} title={cat.name}>
                  {cat.options.map((o) => {
                    const active = (selections[cat.id] ?? []).includes(o.name);
                    return (
                      <PillButton
                        key={o.id}
                        active={active}
                        onClick={() => selectSingle(cat.id, o.name)}
                      >
                        {o.name}
                        {Number(o.price_change) !== 0 && (
                          <span className="ml-1 text-xs opacity-80">
                            ({Number(o.price_change) > 0 ? "+" : ""}
                            {formatTHB(Number(o.price_change))})
                          </span>
                        )}
                      </PillButton>
                    );
                  })}
                </OptionGroup>
              ) : (
                <div key={cat.id}>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{cat.name}</h3>
                  <div className="flex flex-col gap-2">
                    {cat.options.map((o) => {
                      const isSelected = (selections[cat.id] ?? []).includes(o.name);
                      return (
                        <button
                          key={o.id}
                          onClick={() => toggleMulti(cat.id, o.name)}
                          className={`flex w-full items-center justify-between rounded-xl border-2 px-4 py-3 text-sm font-medium transition ${
                            isSelected
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border bg-card text-foreground hover:border-primary/50"
                          }`}
                        >
                          <span>{o.name}</span>
                          {Number(o.price_change) > 0 && (
                            <span className="font-semibold">
                              +{formatTHB(Number(o.price_change))}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ),
            )}
          </div>

          <div className="mt-8">
            <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-card p-2 shadow-sm">
              <span className="pl-3 font-semibold text-foreground">จำนวน</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty(Math.max(1, qty - 1))}
                  className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-foreground hover:bg-muted/80"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-lg font-bold">{qty}</span>
                <button
                  onClick={() => setQty(qty + 1)}
                  className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            <button
              disabled={missingRequired}
              className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-sm transition active:scale-[0.98] disabled:opacity-50"
              onClick={() =>
                onAdd(
                  {
                    menuId: product.id,
                    name: displayName,
                    price: unitPrice,
                    color: product.color || categoryColor(product.category, catalog.categories),
                    options: options.length > 0 ? options : undefined,
                    childId,
                    modifiers,
                  },
                  qty,
                )
              }
            >
              เพิ่มลงตะกร้า • {formatTHB(unitPrice * qty)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function OptionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-sm font-semibold text-muted-foreground">{title}</h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function PillButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-card text-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyMenu() {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-card p-8 text-center">
      <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-6 w-6" />
      </div>
      <p className="font-semibold">ยังไม่มีสินค้าในเมนู</p>
      <p className="mt-1 text-sm text-muted-foreground">
        เพิ่มเมนูได้จากแอป Mother (จัดการสูตร/วัตถุดิบ)
      </p>
    </div>
  );
}
