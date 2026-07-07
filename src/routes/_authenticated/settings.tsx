import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyContext, updateShopName } from "@/lib/pos.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Store, User, ChevronRight, Package, Settings2, Percent, FolderPlus, ArrowLeft, Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { listCatalog, upsertModifierGroup, deleteModifierGroup, upsertCategory, deleteCategory, upsertProduct, deleteProduct } from "@/lib/pos.functions";
import { formatTHB } from "@/lib/cart-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import imageCompression from "browser-image-compression";

const COLORS = ["#2d8ac9", "#1a4a6e", "#6b3a2a", "#c9a568", "#4a6741", "#c17c74", "#e88aab", "#e8b84a"];

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const ctxFn = useServerFn(getMyContext);
  const updFn = useServerFn(updateShopName);
  const ctx = useQuery({ queryKey: ["me"], queryFn: () => ctxFn() });

  const [shopName, setShopName] = useState("");
  const [fullName, setFullName] = useState("");
  const [saving, setSaving] = useState(false);
  const [activePage, setActivePage] = useState<"main" | "item" | "category" | "modifier" | "discount" | "shop">("main");

  useEffect(() => {
    if (ctx.data?.profile) {
      setShopName(ctx.data.profile.shop_name ?? "");
      setFullName(ctx.data.profile.full_name ?? "");
    }
  }, [ctx.data]);

  const save = async () => {
    setSaving(true);
    try {
      await updFn({ data: { shopName: shopName.trim(), fullName: fullName.trim() } });
      toast.success("บันทึกแล้ว");
      ctx.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (activePage !== "main") {
    if (activePage === "shop") {
      return (
        <div className="mx-auto max-w-md">
          <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
            <button onClick={() => setActivePage("main")} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold">ข้อมูลร้านค้า</h1>
          </header>
          <main className="px-4 py-4 space-y-4">
            <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Store className="h-4 w-4 text-primary" />ตั้งค่าข้อมูลร้าน
              </div>
              <div>
                <Label>ชื่อร้าน</Label>
                <Input value={shopName} onChange={(e) => setShopName(e.target.value)} maxLength={80} />
              </div>
              <div>
                <Label>ชื่อผู้ใช้</Label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={80} />
              </div>
              <Button onClick={save} disabled={saving || !shopName.trim()} className="w-full">
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </section>
            <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <User className="h-4 w-4 text-primary" />บัญชีของคุณ
              </div>
              <p className="text-sm text-muted-foreground">
                บทบาท:{" "}
                <span className="font-medium text-foreground">{ctx.data?.isOwner ? "เจ้าของร้าน" : "พนักงาน"}</span>
              </p>
            </section>
            <Button variant="outline" className="w-full text-destructive hover:text-destructive" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />ออกจากระบบ
            </Button>
          </main>
        </div>
      );
    }
    if (activePage === "modifier") {
      return (
        <div className="mx-auto max-w-md bg-background min-h-screen">
          <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
            <button onClick={() => setActivePage("main")} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold">ปรับแต่งเมนู (Modifier)</h1>
          </header>
          <ModifierSettings />
        </div>
      );
    }

    if (activePage === "item") {
      return (
        <div className="mx-auto max-w-md bg-background min-h-screen">
          <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
            <button onClick={() => setActivePage("main")} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold">จัดการสินค้า (Item)</h1>
          </header>
          <ItemSettings />
        </div>
      );
    }
    
    if (activePage === "category") {
      return (
        <div className="mx-auto max-w-md bg-background min-h-screen">
          <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
            <button onClick={() => setActivePage("main")} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold">จัดการหมวดหมู่ (Category)</h1>
          </header>
          <CategorySettings />
        </div>
      );
    }

    let title = "";
    let desc = "";
    if (activePage === "discount") { title = "ส่วนลด (Discount)"; desc = "เพิ่มส่วนลดรูปแบบต่างๆ เช่น %"; }

    return (
      <div className="mx-auto max-w-md bg-background min-h-[400px]">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
          <button onClick={() => setActivePage("main")} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">{title}</h1>
        </header>
        <main className="p-4 space-y-4">
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground">{desc}</p>
            <Button className="mt-6" size="sm" onClick={() => toast.info("ระบบจัดการ Discount จะเปิดให้ใช้งานเร็วๆ นี้")}><Plus className="mr-2 h-4 w-4" /> เพิ่มข้อมูล</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <h1 className="text-lg font-bold">ตั้งค่า</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border shadow-sm">
          <MenuRow icon={<Package className="h-5 w-5 text-blue-500" />} label="สินค้า (Item)" onClick={() => setActivePage("item")} />
          <MenuRow icon={<FolderPlus className="h-5 w-5 text-orange-500" />} label="หมวดหมู่ (Category)" onClick={() => setActivePage("category")} />
          <MenuRow icon={<Settings2 className="h-5 w-5 text-purple-500" />} label="ส่วนขยาย (Modifier)" onClick={() => setActivePage("modifier")} />
          <MenuRow icon={<Percent className="h-5 w-5 text-green-500" />} label="ส่วนลด (Discount)" onClick={() => setActivePage("discount")} />
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <MenuRow icon={<Store className="h-5 w-5 text-zinc-500" />} label="ข้อมูลร้านค้า / บัญชี" onClick={() => setActivePage("shop")} />
        </section>

        <p className="pt-4 text-center text-xs text-muted-foreground">Kafe POS · v1</p>
      </main>
    </div>
  );
}

function MenuRow({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex w-full items-center justify-between bg-card px-4 py-4 transition active:bg-muted">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted/50">
          {icon}
        </div>
        <span className="font-semibold">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
    </button>
  );
}

function ModifierSettings() {
  const listFn = useServerFn(listCatalog);
  const upMod = useServerFn(upsertModifierGroup);
  const delMod = useServerFn(deleteModifierGroup);
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => listFn() });
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<any>(null);

  const modifiers = catalog.data?.modifierGroups ?? [];

  const handleEdit = (group: any) => {
    setEditGroup(group);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setEditGroup(null);
    setModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`ลบกลุ่ม "${name}" และตัวเลือกทั้งหมด?`)) return;
    try {
      await delMod({ data: { id } });
      toast.success("ลบสำเร็จ");
      catalog.refetch();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <main className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-semibold text-muted-foreground">กลุ่มส่วนขยายทั้งหมด ({modifiers.length})</p>
        <Button size="sm" onClick={handleAddNew}><Plus className="h-4 w-4 mr-1" />เพิ่มกลุ่ม</Button>
      </div>

      <div className="space-y-3">
        {modifiers.map((m: any) => {
          const opts = catalog.data?.modifierOptions?.filter((o: any) => o.group_id === m.id) ?? [];
          return (
            <div key={m.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-base">{m.name} {m.is_required && <span className="text-xs text-destructive font-medium ml-1">(จำเป็น)</span>}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {opts.map((o: any) => o.name + (o.price > 0 ? ` (+฿${o.price})` : "")).join(", ")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(m)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted text-muted-foreground">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(m.id, m.name)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {modifiers.length === 0 && (
          <div className="py-10 text-center text-sm text-muted-foreground">
            ยังไม่มีกลุ่มส่วนขยาย
          </div>
        )}
      </div>

      {modalOpen && (
        <ModifierModal 
          editGroup={editGroup} 
          options={editGroup ? catalog.data?.modifierOptions?.filter((o: any) => o.group_id === editGroup.id) : []}
          onClose={() => setModalOpen(false)}
          onSave={async (data) => {
            try {
              await upMod({ data });
              toast.success("บันทึกสำเร็จ");
              setModalOpen(false);
              catalog.refetch();
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}
    </main>
  );
}

function ModifierModal({ editGroup, options, onClose, onSave }: any) {
  const [name, setName] = useState(editGroup?.name ?? "");
  const [isRequired, setIsRequired] = useState(editGroup?.is_required ?? false);
  const [opts, setOpts] = useState<any[]>(
    options && options.length > 0 
      ? options.map((o: any) => ({ id: o.id, name: o.name, price: o.price }))
      : [{ id: "", name: "", price: 0 }]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("กรุณาระบุชื่อกลุ่ม");
    const validOpts = opts.filter(o => o.name.trim() !== "");
    if (validOpts.length === 0) return toast.error("ต้องมีตัวเลือกอย่างน้อย 1 รายการ");

    onSave({
      id: editGroup?.id,
      name: name.trim(),
      isRequired,
      options: validOpts.map((o, i) => ({ id: o.id || undefined, name: o.name.trim(), price: Number(o.price) || 0, sortOrder: i }))
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-3xl bg-card p-5 shadow-xl animate-in zoom-in-95">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{editGroup ? "แก้ไขกลุ่มส่วนขยาย" : "สร้างกลุ่มส่วนขยาย"}</h2>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>ชื่อกลุ่ม (เช่น ความหวาน, เมล็ดกาแฟ)</Label>
            <Input value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="req" checked={isRequired} onChange={e => setIsRequired(e.target.checked)} className="w-4 h-4" />
            <Label htmlFor="req">จำเป็นต้องเลือก</Label>
          </div>

          <div className="pt-2 border-t border-border">
            <Label className="mb-2 block">ตัวเลือกย่อย</Label>
            <div className="space-y-2">
              {opts.map((o, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Input placeholder="ชื่อ เช่น 50%" value={o.name} onChange={e => {
                    const next = [...opts]; next[i].name = e.target.value; setOpts(next);
                  }} />
                  <Input type="number" placeholder="+฿" value={o.price || ""} onChange={e => {
                    const next = [...opts]; next[i].price = e.target.value; setOpts(next);
                  }} className="w-20" />
                  <button type="button" onClick={() => setOpts(opts.filter((_, idx) => idx !== i))} className="text-destructive p-2 hover:bg-destructive/10 rounded-lg">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="w-full mt-3" onClick={() => setOpts([...opts, { id: "", name: "", price: 0 }])}>
              <Plus className="h-4 w-4 mr-1" /> เพิ่มตัวเลือก
            </Button>
          </div>

          <div className="pt-4 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>ยกเลิก</Button>
            <Button type="submit" className="flex-1">บันทึก</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemSettings() {
  const listFn = useServerFn(listCatalog);
  const upProd = useServerFn(upsertProduct);
  const delProd = useServerFn(deleteProduct);
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => listFn() });
  const [prodModal, setProdModal] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [activeCat, setActiveCat] = useState<string | "all">("all");
  const refetch = () => catalog.refetch();

  const filteredProducts = (catalog.data?.products ?? []).filter(
    (p) => activeCat === "all" || p.category_id === activeCat
  );

  return (
    <main className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-semibold text-muted-foreground">สินค้าทั้งหมด ({filteredProducts.length})</p>
        <Button size="sm" onClick={() => setProdModal({ open: true })}><Plus className="h-4 w-4 mr-1" />เพิ่มสินค้า</Button>
      </div>

      {(catalog.data?.categories?.length ?? 0) > 0 && (
        <select
          value={activeCat}
          onChange={(e) => setActiveCat(e.target.value)}
          className="h-10 w-full rounded-xl border border-input bg-card px-4 text-sm font-medium shadow-sm outline-none focus:border-primary mb-2"
        >
          <option value="all">หมวดหมู่ทั้งหมด</option>
          {catalog.data!.categories.map((c: any) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}

      <ul className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
        {filteredProducts.map((p) => (
          <li key={p.id} className="flex items-center gap-3 px-3 py-2.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white text-xs font-bold" style={{ backgroundColor: p.color ?? "#2d8ac9" }}>
              {p.name.slice(0, 2)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-xs text-muted-foreground">{formatTHB(Number(p.price))}</p>
                {p.category_id && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/50 text-muted-foreground border border-border">
                    {catalog.data?.categories?.find((c: any) => c.id === p.category_id)?.name ?? 'ไม่มีหมวดหมู่'}
                  </span>
                )}
              </div>
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
      
      <ProductModal
        open={prodModal.open}
        edit={prodModal.edit}
        categories={catalog.data?.categories ?? []}
        modifierGroups={catalog.data?.modifierGroups ?? []}
        productModifiers={catalog.data?.productModifiers ?? []}
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
    </main>
  );
}

function CategorySettings() {
  const listFn = useServerFn(listCatalog);
  const upCat = useServerFn(upsertCategory);
  const delCat = useServerFn(deleteCategory);
  const catalog = useQuery({ queryKey: ["catalog"], queryFn: () => listFn() });
  
  const [catModal, setCatModal] = useState<{ open: boolean; edit?: any }>({ open: false });
  const refetch = () => catalog.refetch();

  return (
    <main className="p-4 space-y-4">
      <div className="flex justify-between items-center mb-2">
        <p className="text-sm font-semibold text-muted-foreground">หมวดหมู่ทั้งหมด ({catalog.data?.categories.length ?? 0})</p>
        <Button size="sm" onClick={() => setCatModal({ open: true })}><Plus className="h-4 w-4 mr-1" />เพิ่มหมวดหมู่</Button>
      </div>

      <div className="flex flex-col gap-2">
        {(catalog.data?.categories ?? []).map((c) => (
          <div key={c.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.color ?? "#2d8ac9" }} />
              <span className="text-sm font-medium">{c.name}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setCatModal({ open: true, edit: c })} className="grid h-8 w-8 place-items-center rounded-full hover:bg-muted">
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
              <button
                onClick={async () => {
                  if (!confirm(`ลบหมวด "${c.name}"?`)) return;
                  await delCat({ data: { id: c.id } });
                  toast.success("ลบแล้ว");
                  refetch();
                }}
                className="grid h-8 w-8 place-items-center rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
        {(catalog.data?.categories.length ?? 0) === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีหมวดหมู่</p>
        )}
      </div>

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
    </main>
  );
}

// ----------------------------------------------------
// Reused Modals
// ----------------------------------------------------

function ProductModal({ open, edit, categories, modifierGroups, productModifiers, onClose, onSave }: any) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [color, setColor] = useState<string>("#2d8ac9");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const options = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      
      try {
        file = await imageCompression(file, options);
      } catch (err) {
        console.error("Compression error:", err);
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('product_images')
        .upload(fileName, file);

      if (error) {
        console.error('Error uploading image:', error);
        alert('อัปโหลดล้มเหลว กรุณาตรวจสอบว่าได้สร้าง bucket "product_images" ไว้แล้วและเปิดสิทธิ์ให้อัปโหลดได้');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('product_images')
        .getPublicUrl(fileName);

      setImageUrl(publicUrl);
    } catch (error) {
      console.error('Error in upload process:', error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const [selectedModifiers, setSelectedModifiers] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setName(edit?.name ?? "");
      setPrice(edit?.price?.toString() ?? "");
      setCategoryId(edit?.category_id ?? "");
      setColor(edit?.color ?? "#2d8ac9");
      setImageUrl(edit?.image_url ?? "");
      
      if (edit?.id) {
        const linked = productModifiers.filter((pm: any) => pm.product_id === edit.id).map((pm: any) => pm.group_id);
        setSelectedModifiers(linked);
      } else {
        setSelectedModifiers([]);
      }
    }
  }, [open, edit, productModifiers]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
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
            <Label>รูปภาพ</Label>
            <div className="flex flex-col gap-2 mt-1.5">
              <Input 
                type="file" 
                accept="image/*" 
                onChange={handleImageUpload} 
                disabled={isUploadingImage}
                className="cursor-pointer"
              />
              <Input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="ลิงก์รูปภาพ (URL) หรือเลือกไฟล์อัปโหลด" disabled={isUploadingImage} />
              {isUploadingImage && <p className="text-xs text-muted-foreground mt-1">กำลังอัปโหลด...</p>}
              {imageUrl && (
                <div className="mt-2">
                  <img src={imageUrl} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
                </div>
              )}
            </div>
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
          
          {modifierGroups && modifierGroups.length > 0 && (
            <div className="pt-2 border-t border-border">
              <Label className="mb-2 block">ผูกส่วนขยาย (Modifiers)</Label>
              <div className="space-y-2 max-h-[120px] overflow-y-auto pr-2">
                {modifierGroups.map((g: any) => (
                  <label key={g.id} className="flex items-center gap-2 text-sm">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded"
                      checked={selectedModifiers.includes(g.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedModifiers([...selectedModifiers, g.id]);
                        else setSelectedModifiers(selectedModifiers.filter(id => id !== g.id));
                      }}
                    />
                    {g.name}
                  </label>
                ))}
              </div>
            </div>
          )}
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
                imageUrl: imageUrl.trim() || null,
                modifierGroupIds: selectedModifiers,
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
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>("#2d8ac9");

  useEffect(() => {
    if (open) {
      setName(edit?.name ?? "");
      setColor(edit?.color ?? "#2d8ac9");
    }
  }, [open, edit]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onClose();
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
