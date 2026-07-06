import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCatalog, upsertCategory, deleteCategory, upsertProduct, deleteProduct, getMyContext } from "@/lib/pos.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import { formatTHB } from "@/lib/cart-store";

export const Route = createFileRoute("/_authenticated/products")({
  component: ProductsPage,
});

const COLORS = ["#2d8ac9", "#1a4a6e", "#6b3a2a", "#c9a568", "#4a6741", "#c17c74", "#e88aab", "#e8b84a"];

function ProductsPage() {
  const listFn = useServerFn(listCatalog);
  const ctxFn = useServerFn(getMyContext);
  const upProd = useServerFn(upsertProduct);
  const delProd = useServerFn(deleteProduct);
  const upCat = useServerFn(upsertCategory);
  const delCat = useServerFn(deleteCategory);

  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => listFn() });
  const ctx = useQuery({ queryKey: ["me"], queryFn: () => ctxFn() });

  const [prodModal, setProdModal] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [catModal, setCatModal] = useState<{ open: boolean; edit?: any }>({ open: false });

  const refetch = () => catalog.refetch();

  if (ctx.data && !ctx.data.isOwner) {
    return (
      <div className="mx-auto max-w-md p-8 text-center">
        <p className="text-muted-foreground">เฉพาะเจ้าของร้านเท่านั้นที่จัดการสินค้าได้</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">จัดการสินค้า</h1>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setCatModal({ open: true })}>
              <FolderPlus className="mr-1 h-4 w-4" />หมวด
            </Button>
            <Button size="sm" onClick={() => setProdModal({ open: true })}>
              <Plus className="mr-1 h-4 w-4" />สินค้า
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-5">
        {/* Categories */}
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground">หมวดหมู่</p>
          <div className="flex flex-wrap gap-2">
            {(catalog.data?.categories ?? []).map((c) => (
              <div key={c.id} className="flex items-center gap-1 rounded-full border border-border bg-card pl-3 pr-1 py-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.color ?? "#2d8ac9" }} />
                <span className="text-sm font-medium">{c.name}</span>
                <button onClick={() => setCatModal({ open: true, edit: c })} className="grid h-6 w-6 place-items-center rounded-full hover:bg-muted">
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`ลบหมวด "${c.name}"?`)) return;
                    await delCat({ data: { id: c.id } });
                    toast.success("ลบแล้ว");
                    refetch();
                  }}
                  className="grid h-6 w-6 place-items-center rounded-full hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {(catalog.data?.categories.length ?? 0) === 0 && (
              <p className="text-sm text-muted-foreground">ยังไม่มีหมวดหมู่</p>
            )}
          </div>
        </section>

        {/* Products */}
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground">สินค้าทั้งหมด ({catalog.data?.products.length ?? 0})</p>
          <ul className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
            {(catalog.data?.products ?? []).map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white text-xs font-bold" style={{ backgroundColor: p.color ?? "#2d8ac9" }}>
                  {p.name.slice(0, 2)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{formatTHB(Number(p.price))}</p>
                </div>
                <button onClick={() => setProdModal({ open: true, edit: p })} className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted">
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={async () => {
                    if (!confirm(`ลบ "${p.name}"?`)) return;
                    await delProd({ data: { id: p.id } });
                    toast.success("ลบแล้ว");
                    refetch();
                  }}
                  className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
            {(catalog.data?.products.length ?? 0) === 0 && (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">ยังไม่มีสินค้า</li>
            )}
          </ul>
        </section>
      </main>

      {/* Product modal */}
      <ProductModal
        open={prodModal.open}
        edit={prodModal.edit}
        categories={catalog.data?.categories ?? []}
        onClose={() => setProdModal({ open: false })}
        onSave={async (data: any) => {
          try {
            await upProd({ data });
            toast.success("บันทึกแล้ว");
            setProdModal({ open: false });
            refetch();
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />

      <CategoryModal
        open={catModal.open}
        edit={catModal.edit}
        onClose={() => setCatModal({ open: false })}
        onSave={async (data: any) => {
          try {
            await upCat({ data });
            toast.success("บันทึกแล้ว");
            setCatModal({ open: false });
            refetch();
          } catch (e) {
            toast.error((e as Error).message);
          }
        }}
      />
    </div>
  );
}

function ProductModal({ open, edit, categories, onClose, onSave }: any) {
  const [name, setName] = useState(edit?.name ?? "");
  const [price, setPrice] = useState<string>(edit?.price?.toString() ?? "");
  const [categoryId, setCategoryId] = useState<string>(edit?.category_id ?? "");
  const [color, setColor] = useState<string>(edit?.color ?? "#2d8ac9");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
        else {
          setName(edit?.name ?? "");
          setPrice(edit?.price?.toString() ?? "");
          setCategoryId(edit?.category_id ?? "");
          setColor(edit?.color ?? "#2d8ac9");
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{edit ? "แก้ไขสินค้า" : "เพิ่มสินค้า"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>ชื่อสินค้า</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
          </div>
          <div>
            <Label>ราคา (บาท)</Label>
            <Input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <Label>หมวดหมู่</Label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— ไม่ระบุ —</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label>สี</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button
            onClick={() =>
              onSave({
                id: edit?.id,
                name: name.trim(),
                price: Number(price || 0),
                categoryId: categoryId || null,
                color,
              })
            }
            disabled={!name.trim() || !price}
          >
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CategoryModal({ open, edit, onClose, onSave }: any) {
  const [name, setName] = useState(edit?.name ?? "");
  const [color, setColor] = useState<string>(edit?.color ?? "#2d8ac9");

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
        else {
          setName(edit?.name ?? "");
          setColor(edit?.color ?? "#2d8ac9");
        }
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{edit ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>ชื่อหมวด</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} />
          </div>
          <div>
            <Label>สี</Label>
            <div className="mt-1.5 flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition ${color === c ? "border-foreground scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ยกเลิก</Button>
          <Button onClick={() => onSave({ id: edit?.id, name: name.trim(), color })} disabled={!name.trim()}>
            บันทึก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
