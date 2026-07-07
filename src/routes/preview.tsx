import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag, Sparkles, Plus, Minus, Pencil, Trash2, FolderPlus, ArrowLeft, Banknote, Smartphone, X, ChevronRight, Package, Settings2, Percent } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/preview")({
  component: PreviewPage,
});

function PreviewPage() {
  return (
    <div className="mx-auto max-w-md bg-background min-h-screen pb-20">
      <div className="p-4 bg-primary text-primary-foreground font-bold text-center">
        UI Preview Mode
      </div>

      <div className="space-y-12">
        <PreviewSection title="1. หน้าจอขาย (Sell Page / Home)">
          <SellPagePreview />
        </PreviewSection>

        <PreviewSection title="2. หน้าตะกร้า (Cart)">
          <CartPreview />
        </PreviewSection>

        <PreviewSection title="3. หน้าตะกร้าว่าง (Empty Cart)">
          <EmptyCartPreview />
        </PreviewSection>
        
        <PreviewSection title="4. หน้าชำระเงิน (Checkout)">
          <CheckoutPreview />
        </PreviewSection>

        <PreviewSection title="5. หน้าจัดการสินค้า (Products)">
          <ProductsPreview />
        </PreviewSection>

        <PreviewSection title="6. หน้าตั้งค่า (Settings Main & Sub-pages)">
          <SettingsPreview />
        </PreviewSection>
      </div>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t-[8px] border-muted">
      <div className="px-4 py-2 bg-muted/50 text-sm font-bold text-muted-foreground">
        {title}
      </div>
      <div className="relative border-x border-b border-border bg-background shadow-sm">
        {children}
      </div>
    </div>
  );
}

// ==========================================
// MOCK COMPONENTS
// ==========================================

function SellPagePreview() {
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  return (
    <div className="relative pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-4 pt-3 pb-2 backdrop-blur">
        <div className="flex items-baseline justify-between">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">ร้าน</p>
            <h1 className="truncate text-lg font-bold">ร้านกาแฟ Preview</h1>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-muted-foreground">แคชเชียร์</p>
            <p className="truncate text-xs font-medium">คุณ พนักงาน</p>
          </div>
        </div>

        <div className="mt-4">
          <select className="h-10 w-full rounded-xl border border-input bg-card px-4 text-sm font-medium shadow-sm outline-none focus:border-primary">
            <option>หมวดหมู่ทั้งหมด</option>
            <option>กาแฟ</option>
            <option>ชา</option>
          </select>
        </div>
      </header>

      <main className="px-4 py-4">
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 1, name: "อเมริกาโน่เย็น", price: 55, color: "#6b3a2a", image_url: "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=400&q=80" },
            { id: 2, name: "ลาเต้ร้อน", price: 60, color: "#c9a568", image_url: "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=400&q=80" },
            { id: 3, name: "ชาเขียวเย็น", price: 65, color: "#4a6741", image_url: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=400&q=80" },
            { id: 4, name: "โกโก้ปั่น", price: 70, color: "#1a4a6e", image_url: "https://images.unsplash.com/photo-1574169208507-550772d5b6b8?auto=format&fit=crop&w=400&q=80" },
            { id: 5, name: "ชาไทย", price: 50, color: "#e88aab" },
          ].map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition active:scale-95"
            >
              <div
                className="absolute inset-0 opacity-90"
                style={{ background: `linear-gradient(135deg, ${p.color} 0%, color-mix(in oklab, ${p.color} 60%, black) 100%)` }}
              />
              {p.image_url && (
                <img src={p.image_url} alt={p.name} className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-60" />
              )}
              <div className="relative flex h-full flex-col justify-between text-white">
                <p className="line-clamp-2 text-sm font-semibold leading-snug drop-shadow">{p.name}</p>
                <p className="text-lg font-bold drop-shadow">฿{p.price}</p>
              </div>
            </button>
          ))}
        </div>
      </main>

      <div
        className="absolute inset-x-0 mx-auto flex max-w-md items-center justify-between rounded-2xl bg-primary px-4 py-3.5 text-primary-foreground shadow-xl shadow-primary/30"
        style={{ left: "1rem", right: "1rem", bottom: "1rem" }}
      >
        <span className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary-foreground/20 text-sm font-bold">3</span>
          <span className="text-sm font-semibold">ดูตะกร้า</span>
        </span>
        <span className="flex items-center gap-2 text-base font-bold">
          ฿180
          <ShoppingBag className="h-5 w-5" />
        </span>
      </div>

      {/* Product Option Modal Overlay */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-md animate-in slide-in-from-bottom-full rounded-t-3xl bg-card pb-8 pt-5 sm:rounded-3xl sm:slide-in-from-bottom-0 sm:zoom-in-95">
            <div className="px-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selectedProduct.name}</h2>
                  <p className="text-lg font-semibold text-primary">฿{selectedProduct.price}</p>
                </div>
                <button 
                  onClick={() => setSelectedProduct(null)}
                  className="grid h-8 w-8 place-items-center rounded-full bg-muted text-muted-foreground hover:bg-muted/80"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 space-y-5">
                {/* Options Group 1 */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">ระดับความหวาน (Sweetness)</h3>
                  <div className="grid grid-cols-3 gap-2">
                    <button className="rounded-xl border-2 border-primary bg-primary/5 py-2.5 text-sm font-medium text-primary transition">หวานปกติ</button>
                    <button className="rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:border-primary/50 transition">หวานน้อย</button>
                    <button className="rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:border-primary/50 transition">ไม่หวานเลย</button>
                  </div>
                </div>

                {/* Options Group 2 */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold text-muted-foreground">เมล็ดกาแฟ (Beans)</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="rounded-xl border-2 border-primary bg-primary/5 py-2.5 text-sm font-medium text-primary transition">คั่วกลาง (บราซิล)</button>
                    <button className="rounded-xl border border-border bg-card py-2.5 text-sm font-medium text-foreground hover:border-primary/50 transition">คั่วเข้ม (คอสตาริกา) <span className="block text-xs text-muted-foreground">+฿15</span></button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <div className="mb-5 flex items-center justify-between rounded-xl border border-border bg-card p-2 shadow-sm">
                  <span className="pl-3 font-semibold text-foreground">จำนวน</span>
                  <div className="flex items-center gap-2">
                    <button className="grid h-10 w-10 place-items-center rounded-lg bg-muted text-foreground hover:bg-muted/80">
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-10 text-center text-lg font-bold">1</span>
                    <button className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button className="h-12 flex-1 text-base font-semibold" onClick={() => setSelectedProduct(null)}>
                    เพิ่มลงตะกร้า • ฿{selectedProduct.price}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyCartPreview() {
  return (
    <div className="px-6 py-16 text-center">
      <p className="text-muted-foreground">ตะกร้าว่างเปล่า</p>
      <Button className="mt-4" variant="outline">กลับหน้าขาย</Button>
    </div>
  );
}

function CartPreview() {
  return (
    <div className="mx-auto max-w-md rounded-t-3xl bg-card">
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">ตะกร้า</h2>
          <button className="text-xs text-muted-foreground hover:text-destructive">
            ล้างตะกร้า
          </button>
        </div>
      </div>

      <div className="px-5 py-3">
        <ul className="space-y-3">
          {[
            { id: 1, name: "อเมริกาโน่เย็น", price: 55, color: "#6b3a2a", qty: 2, options: ["หวาน 50%", "Brazil Santos"], image_url: "https://images.unsplash.com/photo-1551030173-122aabc4489c?auto=format&fit=crop&w=400&q=80" },
            { id: 3, name: "ชาเขียวเย็น", price: 65, color: "#4a6741", qty: 1, options: ["หวานปกติ"], image_url: "https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=400&q=80" },
          ].map((i) => (
            <li key={i.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-lg text-white text-xs font-bold" style={{ backgroundColor: i.color }}>
                {i.image_url && <img src={i.image_url} alt={i.name} className="absolute inset-0 h-full w-full object-cover mix-blend-overlay opacity-60" />}
                <span className="relative z-10 drop-shadow">{i.name.slice(0, 2)}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{i.name}</p>
                {i.options && <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{i.options.join(", ")}</p>}
                <p className="mt-0.5 text-xs font-medium text-primary">฿{i.price}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <button className="grid h-8 w-8 place-items-center rounded-full bg-muted text-foreground hover:bg-muted/80">
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{i.qty}</span>
                <button className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <button className="text-muted-foreground hover:text-destructive p-1">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-border bg-card px-5 py-4 pb-8">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="text-sm text-muted-foreground">ยอดรวม</span>
          <span className="text-2xl font-bold">฿175</span>
        </div>
        <Button className="h-12 w-full text-base font-semibold">
          เก็บเงิน
        </Button>
      </div>
    </div>
  );
}

function CheckoutPreview() {
  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3">
        <button className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">เก็บเงิน</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-sm text-muted-foreground">ยอดที่ต้องชำระ</p>
          <p className="mt-1 text-4xl font-bold text-primary">฿180</p>
          <p className="mt-1 text-xs text-muted-foreground">3 รายการ</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <p className="mb-3 text-sm font-semibold">สรุปรายการสั่งซื้อ</p>
          <ul className="space-y-3">
            <li className="flex items-start justify-between text-sm">
              <div className="flex gap-2">
                <span className="font-semibold text-muted-foreground">2x</span>
                <div>
                  <p>อเมริกาโน่เย็น</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">หวาน 50%, Brazil Santos</p>
                </div>
              </div>
              <span className="font-medium">฿110</span>
            </li>
            <li className="flex items-start justify-between text-sm">
              <div className="flex gap-2">
                <span className="font-semibold text-muted-foreground">1x</span>
                <div>
                  <p>โกโก้ปั่น</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">หวานปกติ</p>
                </div>
              </div>
              <span className="font-medium">฿70</span>
            </li>
          </ul>
          <div className="mt-3 flex justify-between border-t border-dashed border-border pt-3 font-bold">
            <span>ยอดรวมทั้งสิ้น</span>
            <span className="text-primary">฿180</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">ชื่อลูกค้า (ไม่บังคับ)</label>
            <input 
              placeholder="กรอกชื่อลูกค้า" 
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-11"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">ที่อยู่จัดส่ง (ไม่บังคับ)</label>
            <input 
              placeholder="กรอกที่อยู่จัดส่ง" 
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 h-11"
            />
          </div>
        </div>

        <Button className="h-14 w-full text-base font-semibold">
          ยืนยันการสั่งซื้อ
        </Button>
      </main>
    </div>
  );
}

function ProductsPreview() {
  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">จัดการสินค้า</h1>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline">
              <FolderPlus className="mr-1 h-4 w-4" />หมวด
            </Button>
            <Button size="sm">
              <Plus className="mr-1 h-4 w-4" />สินค้า
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-5">
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground">หมวดหมู่</p>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-1 rounded-full border border-border bg-card pl-3 pr-1 py-1">
              <span className="h-2 w-2 rounded-full bg-[#6b3a2a]" />
              <span className="text-sm font-medium">กาแฟ</span>
              <button className="grid h-6 w-6 place-items-center rounded-full hover:bg-muted">
                <Pencil className="h-3 w-3" />
              </button>
              <button className="grid h-6 w-6 place-items-center rounded-full hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          </div>
        </section>

        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground">สินค้าทั้งหมด (2)</p>
          <ul className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
            <li className="flex items-center gap-3 px-3 py-2.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white text-xs font-bold bg-[#6b3a2a]">
                อม
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">อเมริกาโน่เย็น</p>
                <p className="text-xs text-muted-foreground">฿55</p>
              </div>
              <button className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted">
                <Pencil className="h-4 w-4" />
              </button>
              <button className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          </ul>
        </section>
      </main>
    </div>
  );
}

function SettingsPreview() {
  const [activePage, setActivePage] = useState<"main" | "item" | "category" | "modifier" | "discount">("main");

  if (activePage !== "main") {
    let title = "";
    let desc = "";
    if (activePage === "item") { title = "จัดการสินค้า (Item)"; desc = "ใช้เพิ่ม/แก้ไขสินค้า"; }
    if (activePage === "category") { title = "จัดการหมวดหมู่ (Category)"; desc = "ใช้เพิ่ม/แก้ไขหมวดหมู่"; }
    if (activePage === "modifier") { title = "ปรับแต่งเมนู (Modifier)"; desc = "ใช้เพิ่ม การปรับแต่งเมนู เช่น ความหวาน, เมล็ดกาแฟ, Add-on"; }
    if (activePage === "discount") { title = "ส่วนลด (Discount)"; desc = "ใช้เพิ่มส่วนลด แบบ %"; }

    return (
      <div className="bg-background min-h-[400px]">
        <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3">
          <button onClick={() => setActivePage("main")} className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">{title}</h1>
        </header>
        <main className="p-4">
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
            <p className="text-sm font-semibold text-muted-foreground">{desc}</p>
            <Button className="mt-6" size="sm"><Plus className="mr-2 h-4 w-4" /> เพิ่มข้อมูล</Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[400px]">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3">
        <h1 className="text-lg font-bold">ตั้งค่าร้านค้า</h1>
      </header>
      <main className="px-4 py-4 space-y-4">
        <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border shadow-sm">
          <MenuRow icon={<Package className="h-5 w-5 text-blue-500" />} label="จัดการสินค้า (Item)" onClick={() => setActivePage("item")} />
          <MenuRow icon={<FolderPlus className="h-5 w-5 text-orange-500" />} label="หมวดหมู่ (Category)" onClick={() => setActivePage("category")} />
          <MenuRow icon={<Settings2 className="h-5 w-5 text-purple-500" />} label="ปรับแต่งเมนู (Modifier)" onClick={() => setActivePage("modifier")} />
          <MenuRow icon={<Percent className="h-5 w-5 text-green-500" />} label="ส่วนลด (Discount)" onClick={() => setActivePage("discount")} />
        </section>
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
