import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hub, HubApiError } from "@/lib/hub/client";
import {
  useCatalog,
  parseModifierCategories,
  isLegacyAddon,
  categoryKind,
  optionKind,
  type MenuItem,
  type Addon,
  type Category,
  type ChildMenu,
  type Material,
  type ModifierCategory,
  type ModifierMode,
} from "@/lib/hub/catalog";
import { useHubUser } from "@/lib/hub/session";
import { formatTHB } from "@/lib/cart-store";
import {
  LogOut,
  Store,
  User,
  ChevronRight,
  ArrowLeft,
  Clock,
  KeyRound,
  Coffee,
  Tag,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

type ActivePage =
  "main" | "shop" | "shift" | "password" | "menu" | "category" | "modifier" | "childmenu";

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useHubUser();
  const catalog = useCatalog();
  const [activePage, setActivePage] = useState<ActivePage>("main");

  const signOut = () => {
    qc.clear();
    hub.logout();
    navigate({ to: "/auth", replace: true });
  };

  if (activePage === "shop") {
    const s = catalog.data?.settings;
    return (
      <SubPage title="ข้อมูลร้านค้า" onBack={() => setActivePage("main")}>
        <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Store className="h-4 w-4 text-primary" />
            ข้อมูลร้าน
          </div>
          <Row label="ชื่อร้าน" value={s?.shop_name || "—"} />
          <Row label="ที่อยู่" value={s?.shop_address || "—"} />
          <Row label="โทรศัพท์" value={s?.shop_phone || "—"} />
          <Row label="เลข PromptPay" value={s?.promptpay_id || "—"} />
          <p className="pt-2 text-xs text-muted-foreground">แก้ไขข้อมูลร้านได้ที่แอป Mother</p>
        </section>
      </SubPage>
    );
  }

  if (activePage === "menu") {
    return (
      <SubPage title="จัดการเมนู" onBack={() => setActivePage("main")}>
        <MenuManageSection />
      </SubPage>
    );
  }

  if (activePage === "category") {
    return (
      <SubPage title="หมวดหมู่" onBack={() => setActivePage("main")}>
        <CategoryManageSection />
      </SubPage>
    );
  }

  if (activePage === "modifier") {
    return (
      <SubPage title="Modifier" onBack={() => setActivePage("main")}>
        <ModifierManageSection />
      </SubPage>
    );
  }

  if (activePage === "childmenu") {
    return (
      <SubPage title="ตัวเลือกเมนู (Child Menu)" onBack={() => setActivePage("main")}>
        <ChildMenuManageSection />
      </SubPage>
    );
  }

  if (activePage === "shift") {
    return (
      <SubPage title="กะเงินสด" onBack={() => setActivePage("main")}>
        <ShiftSection />
      </SubPage>
    );
  }

  if (activePage === "password") {
    return (
      <SubPage title="เปลี่ยนรหัสผ่าน" onBack={() => setActivePage("main")}>
        <ChangePasswordSection onDone={() => setActivePage("main")} />
      </SubPage>
    );
  }

  return (
    <div className="mx-auto max-w-md">
      <header
        className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <h1 className="text-lg font-bold">ตั้งค่า</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border shadow-sm">
          <MenuRow
            icon={<Clock className="h-5 w-5 text-blue-500" />}
            label="กะเงินสด (เปิด / ปิดกะ)"
            onClick={() => setActivePage("shift")}
          />
          <MenuRow
            icon={<Store className="h-5 w-5 text-zinc-500" />}
            label="ข้อมูลร้านค้า"
            onClick={() => setActivePage("shop")}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border shadow-sm">
          <MenuRow
            icon={<Coffee className="h-5 w-5 text-amber-600" />}
            label="จัดการเมนู"
            onClick={() => setActivePage("menu")}
          />
          <MenuRow
            icon={<Tag className="h-5 w-5 text-emerald-600" />}
            label="หมวดหมู่"
            onClick={() => setActivePage("category")}
          />
          <MenuRow
            icon={<SlidersHorizontal className="h-5 w-5 text-indigo-500" />}
            label="Modifier"
            onClick={() => setActivePage("modifier")}
          />
          <MenuRow
            icon={<Layers className="h-5 w-5 text-rose-500" />}
            label="ตัวเลือกเมนู (Child Menu)"
            onClick={() => setActivePage("childmenu")}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border shadow-sm">
          <div className="flex items-center gap-3 px-4 py-4">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted/50">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-semibold">{user?.username ?? "—"}</p>
              <p className="text-xs text-muted-foreground">
                {user?.role === "Admin" ? "ผู้ดูแลระบบ" : "พนักงาน"}
              </p>
            </div>
          </div>
          <MenuRow
            icon={<KeyRound className="h-5 w-5 text-purple-500" />}
            label="เปลี่ยนรหัสผ่าน"
            onClick={() => setActivePage("password")}
          />
        </section>

        <button
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3.5 text-sm font-semibold text-destructive shadow-sm"
          onClick={signOut}
        >
          <LogOut className="h-4 w-4" />
          ออกจากระบบ
        </button>

        <p className="pt-4 text-center text-xs text-muted-foreground">KPOS · เชื่อมต่อ SMA08 hub</p>
      </main>
    </div>
  );
}

function SubPage({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-md bg-background min-h-screen">
      <header
        className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-card px-3 py-3"
        style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}
      >
        <button
          onClick={onBack}
          className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-bold">{title}</h1>
      </header>
      <main className="px-4 py-4 space-y-4">{children}</main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function MenuRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between bg-card px-4 py-4 transition active:bg-muted"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-muted/50">{icon}</div>
        <span className="font-semibold">{label}</span>
      </div>
      <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
    </button>
  );
}

function ShiftSection() {
  const qc = useQueryClient();
  const shift = useQuery({ queryKey: ["hub-shift-current"], queryFn: () => hub.shiftCurrent() });
  const [openingCash, setOpeningCash] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [zReport, setZReport] = useState<Awaited<ReturnType<typeof hub.shiftClose>> | null>(null);

  const openShift = async () => {
    setBusy(true);
    try {
      await hub.shiftOpen(Number(openingCash) || 0);
      toast.success("เปิดกะแล้ว");
      setOpeningCash("");
      qc.invalidateQueries({ queryKey: ["hub-shift-current"] });
    } catch (e) {
      toast.error(e instanceof HubApiError ? e.message : "เปิดกะไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const closeShift = async () => {
    setBusy(true);
    try {
      const res = await hub.shiftClose(
        closingCash === "" ? null : Number(closingCash),
        note.trim(),
      );
      setZReport(res);
      setClosingCash("");
      setNote("");
      qc.invalidateQueries({ queryKey: ["hub-shift-current"] });
    } catch (e) {
      toast.error(e instanceof HubApiError ? e.message : "ปิดกะไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  if (zReport) {
    const { shift: s, totals } = zReport;
    return (
      <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <p className="text-sm font-semibold">สรุปกะ #{s.id}</p>
        <Row label="ออเดอร์ / แก้ว" value={`${s.orders ?? 0} / ${totals.cups}`} />
        <Row label="เงินสด" value={formatTHB(Number(s.cash_sales))} />
        <Row label="PromptPay" value={formatTHB(Number(s.promptpay_sales))} />
        <Row label="โอนเงิน" value={formatTHB(Number(s.transfer_sales))} />
        <Row label="ยอดขายรวม" value={formatTHB(totals.total_sales)} />
        <Row label="เงินสดที่คาดไว้" value={formatTHB(Number(s.expected_cash))} />
        {s.closing_cash != null && (
          <>
            <Row label="เงินสดที่นับได้" value={formatTHB(Number(s.closing_cash))} />
            <Row label="ส่วนต่าง" value={formatTHB(Number(s.over_short))} />
          </>
        )}
        <button
          className="mt-2 h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground"
          onClick={() => setZReport(null)}
        >
          ปิด
        </button>
      </section>
    );
  }

  if (shift.isLoading)
    return <p className="text-center text-sm text-muted-foreground py-8">กำลังโหลด...</p>;

  if (!shift.data) {
    return (
      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <p className="text-sm font-semibold">เปิดกะใหม่</p>
        <div>
          <label className="mb-1.5 block text-sm font-medium">เงินสดตั้งต้นในลิ้นชัก (บาท)</label>
          <input
            type="number"
            inputMode="decimal"
            value={openingCash}
            onChange={(e) => setOpeningCash(e.target.value)}
            placeholder="0"
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <button
          disabled={busy}
          className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          onClick={openShift}
        >
          {busy ? "กำลังเปิดกะ..." : "เปิดกะ"}
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <p className="text-sm font-semibold">กะ #{shift.data.id} — เปิดอยู่</p>
      <Row label="เปิดโดย" value={shift.data.opened_by} />
      <Row label="เงินตั้งต้น" value={formatTHB(Number(shift.data.opening_cash))} />
      <div>
        <label className="mb-1.5 block text-sm font-medium">
          เงินสดที่นับได้ตอนปิดกะ (เว้นว่างได้)
        </label>
        <input
          type="number"
          inputMode="decimal"
          value={closingCash}
          onChange={(e) => setClosingCash(e.target.value)}
          placeholder="ไม่บังคับ"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">หมายเหตุ</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="ไม่บังคับ"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
      </div>
      <button
        disabled={busy}
        className="h-11 w-full rounded-xl bg-destructive text-sm font-semibold text-destructive-foreground disabled:opacity-50"
        onClick={closeShift}
      >
        {busy ? "กำลังปิดกะ..." : "ปิดกะ"}
      </button>
    </section>
  );
}

function ChangePasswordSection({ onDone }: { onDone: () => void }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) {
      toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    setBusy(true);
    try {
      await hub.changePassword(current, next);
      toast.success("เปลี่ยนรหัสผ่านแล้ว");
      onDone();
    } catch (e2) {
      toast.error(e2 instanceof HubApiError ? e2.message : "เปลี่ยนรหัสผ่านไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div>
        <label className="mb-1.5 block text-sm font-medium">รหัสผ่านปัจจุบัน</label>
        <input
          type="password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">รหัสผ่านใหม่ (อย่างน้อย 6 ตัว)</label>
        <input
          type="password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
      </div>
      <button
        type="submit"
        disabled={busy}
        className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {busy ? "กำลังบันทึก..." : "บันทึก"}
      </button>
    </form>
  );
}

// ---- Category management ---------------------------------------------------
// Real categories table (added alongside this feature) — a proper add/edit/
// delete list instead of retyping a category name per menu item.
function CategoryManageSection() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["hub-categories"],
    queryFn: () => hub.list<Category>("categories"),
  });
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["hub-categories"] });
    qc.invalidateQueries({ queryKey: ["hub-catalog"] });
  };

  const cancelEdit = () => {
    setEditing(null);
    setName("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      if (editing) {
        await hub.update("categories", editing.id, { name: trimmed });
        toast.success("แก้ไขหมวดหมู่แล้ว");
      } else {
        await hub.insert("categories", { name: trimmed });
        toast.success("เพิ่มหมวดหมู่แล้ว");
      }
      cancelEdit();
      refresh();
    } catch (e2) {
      toast.error(e2 instanceof HubApiError ? e2.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: Category) => {
    if (!confirm(`ลบหมวดหมู่ "${c.name}"?`)) return;
    try {
      await hub.remove("categories", c.id);
      toast.success("ลบหมวดหมู่แล้ว");
      refresh();
    } catch (e) {
      toast.error(e instanceof HubApiError ? e.message : "ลบไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <label className="mb-1.5 block text-sm font-medium">
          {editing ? `แก้ไข "${editing.name}"` : "ชื่อหมวดหมู่ใหม่"}
        </label>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="เช่น กาแฟ, ชา, ของหวาน"
            className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "…" : editing ? "บันทึก" : "เพิ่ม"}
          </button>
        </div>
        {editing && (
          <button
            type="button"
            onClick={cancelEdit}
            className="text-xs font-medium text-muted-foreground underline"
          >
            ยกเลิกแก้ไข
          </button>
        )}
      </form>

      <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
        {list.isLoading ? (
          <p className="p-4 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : (list.data ?? []).length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">ยังไม่มีหมวดหมู่</p>
        ) : (
          (list.data ?? []).map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">{c.name}</span>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditing(c);
                    setName(c.name);
                  }}
                  className="text-xs font-semibold text-primary"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => remove(c)}
                  className="text-xs font-semibold text-destructive"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// ---- Modifier management -----------------------------------------------
// Still the same "addons" table Recipes.jsx's "Add-on Options" manages in
// the Mother app, but now organized into user-created categories (e.g.
// "ความหวาน") each with its own single/multi-select mode and option list.
// There's no dedicated categories table in the hub, so this overloads the
// existing `kind` column via catalog.ts's modcat:/modopt: tags — see the
// comment on the `Addon` type there. The old fixed container/sweetness/
// extra rows get one-time migrated into three such categories.
const LEGACY_MIGRATION_PLAN: { kind: string; label: string; mode: ModifierMode }[] = [
  { kind: "container", label: "ภาชนะ", mode: "single" },
  { kind: "sweetness", label: "ความหวาน", mode: "single" },
  { kind: "extra", label: "ของเพิ่ม", mode: "multi" },
];

function ModifierManageSection() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["hub-addons"], queryFn: () => hub.list<Addon>("addons") });
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["hub-addons"] });
    qc.invalidateQueries({ queryKey: ["hub-catalog"] });
  };

  const addons = list.data ?? [];
  const categories = parseModifierCategories(addons);
  const selected = categories.find((c) => c.id === selectedCategoryId) ?? null;

  if (selected) {
    return (
      <ModifierCategoryDetail
        category={selected}
        onBack={() => setSelectedCategoryId(null)}
        onChanged={refresh}
        onDeleted={() => {
          setSelectedCategoryId(null);
          refresh();
        }}
      />
    );
  }

  return (
    <ModifierCategoryList
      addons={addons}
      categories={categories}
      loading={list.isLoading}
      onOpen={setSelectedCategoryId}
      onChanged={refresh}
    />
  );
}

function ModifierCategoryList({
  addons,
  categories,
  loading,
  onOpen,
  onChanged,
}: {
  addons: Addon[];
  categories: ModifierCategory[];
  loading: boolean;
  onOpen: (id: number) => void;
  onChanged: () => void;
}) {
  const [name, setName] = useState("");
  const [mode, setMode] = useState<ModifierMode>("single");
  const [busy, setBusy] = useState(false);
  const [migrating, setMigrating] = useState(false);

  const legacyRows = addons.filter(isLegacyAddon);

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const created = await hub.insert<Addon>("addons", {
        name: trimmed,
        price_change: 0,
        kind: categoryKind(mode),
      });
      toast.success("สร้างหมวดหมู่แล้ว");
      setName("");
      setMode("single");
      onChanged();
      if (created?.id != null) onOpen(created.id);
    } catch (e2) {
      toast.error(e2 instanceof HubApiError ? e2.message : "สร้างหมวดหมู่ไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const migrateLegacy = async () => {
    if (!confirm("ย้ายตัวเลือกแบบเก่า (ภาชนะ/ความหวาน/ของเพิ่ม) เข้าสู่ระบบหมวดหมู่ใหม่?")) return;
    setMigrating(true);
    try {
      for (const plan of LEGACY_MIGRATION_PLAN) {
        const rows = legacyRows.filter((a) => (a.kind || "extra") === plan.kind);
        if (rows.length === 0) continue;
        const created = await hub.insert<Addon>("addons", {
          name: plan.label,
          price_change: 0,
          kind: categoryKind(plan.mode),
        });
        for (const row of rows) {
          await hub.update("addons", row.id, { kind: optionKind(created.id) });
        }
      }
      toast.success("ย้ายข้อมูลเรียบร้อย");
      onChanged();
    } catch (e) {
      toast.error(e instanceof HubApiError ? e.message : "ย้ายข้อมูลไม่สำเร็จ");
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="space-y-4">
      {legacyRows.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
          <p className="text-sm font-semibold">พบตัวเลือกแบบเก่า {legacyRows.length} รายการ</p>
          <p className="mt-1 text-xs">
            ภาชนะ/ความหวาน/ของเพิ่มแบบเดิมยังไม่อยู่ในระบบหมวดหมู่ใหม่
            กดย้ายเพื่อจัดกลุ่มเป็นหมวดหมู่โดยอัตโนมัติ (ตัวเลือกเดิมและราคาจะยังเหมือนเดิมทุกอย่าง)
          </p>
          <button
            disabled={migrating}
            onClick={migrateLegacy}
            className="mt-3 h-10 rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {migrating ? "กำลังย้าย..." : "ย้ายข้อมูล"}
          </button>
        </div>
      )}

      <form
        onSubmit={createCategory}
        className="rounded-2xl border border-border bg-card p-4 space-y-3"
      >
        <label className="mb-1.5 block text-sm font-medium">สร้างหมวดหมู่ใหม่</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="เช่น ความหวาน"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <div className="grid grid-cols-2 gap-2">
          <ModeButton active={mode === "single"} onClick={() => setMode("single")}>
            กดได้แค่ 1
          </ModeButton>
          <ModeButton active={mode === "multi"} onClick={() => setMode("multi")}>
            กดได้มากกว่า 1
          </ModeButton>
        </div>
        <button
          type="submit"
          disabled={busy || !name.trim()}
          className="h-11 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {busy ? "…" : "สร้างหมวดหมู่"}
        </button>
      </form>

      <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
        {loading ? (
          <p className="p-4 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : categories.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">ยังไม่มีหมวดหมู่ modifier</p>
        ) : (
          categories.map((c) => (
            <button
              key={c.id}
              onClick={() => onOpen(c.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left transition active:bg-muted"
            >
              <div>
                <p className="text-sm font-medium">{c.name}</p>
                <p className="text-xs text-muted-foreground">
                  {c.mode === "single" ? "กดได้แค่ 1" : "กดได้มากกว่า 1"} · {c.options.length}{" "}
                  ตัวเลือก
                </p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground/50" />
            </button>
          ))
        )}
      </section>
    </div>
  );
}

function ModifierCategoryDetail({
  category,
  onBack,
  onChanged,
  onDeleted,
}: {
  category: ModifierCategory;
  onBack: () => void;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [name, setName] = useState(category.name);
  const [mode, setMode] = useState<ModifierMode>(category.mode);
  const [optionName, setOptionName] = useState("");
  const [optionPrice, setOptionPrice] = useState("");
  const [editingOption, setEditingOption] = useState<Addon | null>(null);
  const [busy, setBusy] = useState(false);

  const saveCategory = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      await hub.update("addons", category.id, { name: trimmed, kind: categoryKind(mode) });
      toast.success("บันทึกหมวดหมู่แล้ว");
      onChanged();
    } catch (e) {
      toast.error(e instanceof HubApiError ? e.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const deleteCategory = async () => {
    if (
      !confirm(
        `ลบหมวดหมู่ "${category.name}" พร้อมตัวเลือกทั้งหมด (${category.options.length} รายการ)?`,
      )
    )
      return;
    setBusy(true);
    try {
      for (const o of category.options) await hub.remove("addons", o.id);
      await hub.remove("addons", category.id);
      toast.success("ลบหมวดหมู่แล้ว");
      onDeleted();
    } catch (e) {
      toast.error(e instanceof HubApiError ? e.message : "ลบไม่สำเร็จ");
      setBusy(false);
    }
  };

  const cancelOptionEdit = () => {
    setEditingOption(null);
    setOptionName("");
    setOptionPrice("");
  };

  const submitOption = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = optionName.trim();
    if (!trimmed) return;
    setBusy(true);
    try {
      const payload = {
        name: trimmed,
        price_change: Number(optionPrice) || 0,
        kind: optionKind(category.id),
      };
      if (editingOption) {
        await hub.update("addons", editingOption.id, payload);
        toast.success("แก้ไขตัวเลือกแล้ว");
      } else {
        await hub.insert("addons", payload);
        toast.success("เพิ่มตัวเลือกแล้ว");
      }
      cancelOptionEdit();
      onChanged();
    } catch (e2) {
      toast.error(e2 instanceof HubApiError ? e2.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const removeOption = async (o: Addon) => {
    if (!confirm(`ลบตัวเลือก "${o.name}"?`)) return;
    try {
      await hub.remove("addons", o.id);
      toast.success("ลบตัวเลือกแล้ว");
      onChanged();
    } catch (e) {
      toast.error(e instanceof HubApiError ? e.message : "ลบไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm font-semibold text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        กลับไปหมวดหมู่ทั้งหมด
      </button>

      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <label className="mb-1.5 block text-sm font-medium">ชื่อหมวดหมู่</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <div className="grid grid-cols-2 gap-2">
          <ModeButton active={mode === "single"} onClick={() => setMode("single")}>
            กดได้แค่ 1
          </ModeButton>
          <ModeButton active={mode === "multi"} onClick={() => setMode("multi")}>
            กดได้มากกว่า 1
          </ModeButton>
        </div>
        <div className="flex gap-2">
          <button
            disabled={busy || !name.trim()}
            onClick={saveCategory}
            className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            บันทึก
          </button>
          <button
            disabled={busy}
            onClick={deleteCategory}
            className="h-11 rounded-xl border border-destructive px-4 text-sm font-semibold text-destructive disabled:opacity-50"
          >
            ลบหมวดหมู่
          </button>
        </div>
      </div>

      <form
        onSubmit={submitOption}
        className="rounded-2xl border border-border bg-card p-4 space-y-3"
      >
        <label className="mb-1.5 block text-sm font-medium">
          {editingOption ? `แก้ไขตัวเลือก "${editingOption.name}"` : "เพิ่มตัวเลือก"}
        </label>
        <div className="flex gap-2">
          <input
            value={optionName}
            onChange={(e) => setOptionName(e.target.value)}
            placeholder="เช่น ไม่หวาน"
            className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <input
            type="number"
            inputMode="decimal"
            value={optionPrice}
            onChange={(e) => setOptionPrice(e.target.value)}
            placeholder="+฿"
            className="h-11 w-24 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy || !optionName.trim()}
            className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "…" : editingOption ? "บันทึก" : "เพิ่ม"}
          </button>
          {editingOption && (
            <button
              type="button"
              onClick={cancelOptionEdit}
              className="h-11 rounded-xl border border-border px-4 text-sm font-medium"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
        {category.options.length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">
            ยังไม่มีตัวเลือกในหมวดหมู่นี้
          </p>
        ) : (
          category.options.map((o) => (
            <div key={o.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{o.name}</p>
                <p className="text-xs text-muted-foreground">
                  +{formatTHB(Number(o.price_change))}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setEditingOption(o);
                    setOptionName(o.name);
                    setOptionPrice(String(o.price_change));
                  }}
                  className="text-xs font-semibold text-primary"
                >
                  แก้ไข
                </button>
                <button
                  onClick={() => removeOption(o)}
                  className="text-xs font-semibold text-destructive"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

function ModeButton({
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
      type="button"
      onClick={onClick}
      className={`h-11 rounded-xl border-2 text-sm font-medium transition ${
        active
          ? "border-primary bg-primary/5 text-primary"
          : "border-border bg-card text-foreground hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}

// ---- Menu management --------------------------------------------------------
// menuname.id is a text primary key (e.g. "MN007"), assigned client-side —
// mirrors nextSeqId() in the SMA08 client's helpers.js.
function nextMenuId(existing: MenuItem[]) {
  let max = 0;
  const re = /^MN(\d+)$/;
  existing.forEach((m) => {
    const match = re.exec(String(m.id ?? ""));
    if (match) max = Math.max(max, parseInt(match[1], 10));
  });
  return `MN${String(max + 1).padStart(3, "0")}`;
}

const blankMenuForm = {
  category: "",
  name: "",
  front_price: "",
  delivery_price: "",
  status: "Active" as const,
};

function MenuManageSection() {
  const qc = useQueryClient();
  const menuList = useQuery({
    queryKey: ["hub-menuname"],
    queryFn: () => hub.list<MenuItem>("menuname"),
  });
  const categoryList = useQuery({
    queryKey: ["hub-categories"],
    queryFn: () => hub.list<Category>("categories"),
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<{
    category: string;
    name: string;
    front_price: string;
    delivery_price: string;
    status: "Active" | "Inactive";
  }>(blankMenuForm);
  const [busy, setBusy] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["hub-menuname"] });
    qc.invalidateQueries({ queryKey: ["hub-catalog"] });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blankMenuForm);
  };

  const startEdit = (m: MenuItem) => {
    setEditingId(m.id);
    setForm({
      category: m.category || "",
      name: m.name,
      front_price: String(m.front_price ?? ""),
      delivery_price: String(m.delivery_price ?? ""),
      status: m.status === "Inactive" ? "Inactive" : "Active",
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("กรุณากรอกชื่อเมนู");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        front_price: Number(form.front_price) || 0,
        delivery_price: Number(form.delivery_price) || 0,
        status: form.status,
      };
      if (editingId) {
        await hub.update("menuname", editingId, payload);
        toast.success("แก้ไขเมนูแล้ว");
      } else {
        const id = nextMenuId(menuList.data ?? []);
        await hub.insert("menuname", { id, ...payload });
        toast.success("เพิ่มเมนูแล้ว");
      }
      cancelEdit();
      refresh();
    } catch (e2) {
      toast.error(e2 instanceof HubApiError ? e2.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m: MenuItem) => {
    if (!confirm(`ลบเมนู "${m.name}"?`)) return;
    try {
      await hub.remove("menuname", m.id);
      toast.success("ลบเมนูแล้ว");
      refresh();
    } catch (e) {
      toast.error(e instanceof HubApiError ? e.message : "ลบไม่สำเร็จ");
    }
  };

  const categories = categoryList.data ?? [];

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <label className="block text-sm font-medium">
          {editingId ? `แก้ไข "${form.name}"` : "เมนูใหม่"}
        </label>
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="ชื่อเมนู"
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <select
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        >
          <option value="">-- หมวดหมู่ --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            value={form.front_price}
            onChange={(e) => setForm((f) => ({ ...f, front_price: e.target.value }))}
            placeholder="ราคาหน้าร้าน"
            className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <input
            type="number"
            inputMode="decimal"
            value={form.delivery_price}
            onChange={(e) => setForm((f) => ({ ...f, delivery_price: e.target.value }))}
            placeholder="ราคาเดลิเวอรี่"
            className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <select
          value={form.status}
          onChange={(e) =>
            setForm((f) => ({ ...f, status: e.target.value as "Active" | "Inactive" }))
          }
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        >
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={busy}
            className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {busy ? "…" : editingId ? "บันทึก" : "เพิ่มเมนู"}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={cancelEdit}
              className="h-11 rounded-xl border border-border px-4 text-sm font-medium"
            >
              ยกเลิก
            </button>
          )}
        </div>
      </form>

      <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
        {menuList.isLoading ? (
          <p className="p-4 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
        ) : (menuList.data ?? []).length === 0 ? (
          <p className="p-4 text-center text-sm text-muted-foreground">ยังไม่มีเมนู</p>
        ) : (
          (menuList.data ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">
                  {m.name}
                  {m.status === "Inactive" && (
                    <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {m.category || "ไม่มีหมวดหมู่"} · {formatTHB(Number(m.front_price))}
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => startEdit(m)} className="text-xs font-semibold text-primary">
                  แก้ไข
                </button>
                <button
                  onClick={() => remove(m)}
                  className="text-xs font-semibold text-destructive"
                >
                  ลบ
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

// ---- Child menu management --------------------------------------------------
// A "child menu" is a variant a customer picks for one drink (e.g. bean type)
// that deducts a specific material — same table Recipes.jsx's recipe composer
// manages in the Mother app, scoped here to one drink at a time instead of
// bundled with the full BOM ingredient editor.
const blankChildForm = { name: "", category: "", material_id: "", qty_used: "1", price_change: "" };

function ChildMenuManageSection() {
  const qc = useQueryClient();
  const catalog = useCatalog(); // for packagingbom/matprepbom sets, already cached
  const menuList = useQuery({
    queryKey: ["hub-menuname"],
    queryFn: () => hub.list<MenuItem>("menuname"),
  });
  const materialList = useQuery({
    queryKey: ["hub-materials"],
    queryFn: () => hub.list<Material>("materials"),
  });
  const childList = useQuery({
    queryKey: ["hub-childmenu"],
    queryFn: () => hub.list<ChildMenu>("childmenu"),
  });

  const [selectedMenuId, setSelectedMenuId] = useState("");
  const [editingId, setEditingId] = useState<ChildMenu["id"] | null>(null);
  const [form, setForm] = useState(blankChildForm);
  const [busy, setBusy] = useState(false);

  const materials = materialList.data ?? [];
  const packagingbom = catalog.data?.packagingbom ?? [];
  const matprepbom = catalog.data?.matprepbom ?? [];
  const ingredientCategories = Array.from(
    new Set(materials.map((m) => m.category).filter(Boolean)),
  );
  const allCategories = [...ingredientCategories, "Packaging Sets", "Mat Prep Sets"];

  const itemsForCategory = (cat: string): { id: string; label: string }[] => {
    if (cat === "Packaging Sets")
      return packagingbom.map((p) => ({ id: p.id, label: `[Set] ${p.name}` }));
    if (cat === "Mat Prep Sets")
      return matprepbom.map((p) => ({ id: p.id, label: `[Prep] ${p.name}` }));
    return materials
      .filter((m) => m.category === cat)
      .map((m) => ({ id: m.id, label: `${m.item} [${m.unit}]` }));
  };
  const categoryOfMaterial = (materialId: string) => {
    if (!materialId) return "";
    if (materialId.startsWith("PBOM")) return "Packaging Sets";
    if (materialId.startsWith("MPREP")) return "Mat Prep Sets";
    return materials.find((m) => m.id === materialId)?.category ?? "";
  };

  const selectedMenu = (menuList.data ?? []).find((m) => m.id === selectedMenuId) ?? null;
  const rowsForMenu = (childList.data ?? []).filter((c) => c.menu_name === selectedMenu?.name);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["hub-childmenu"] });
    qc.invalidateQueries({ queryKey: ["hub-catalog"] });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(blankChildForm);
  };

  const selectMenu = (id: string) => {
    setSelectedMenuId(id);
    cancelEdit();
  };

  const startEdit = (c: ChildMenu) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      category: categoryOfMaterial(c.material_id),
      material_id: c.material_id,
      qty_used: String(c.qty_used ?? 1),
      price_change: String(c.price_change ?? 0),
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMenu) {
      toast.error("กรุณาเลือกเมนูก่อน");
      return;
    }
    if (!form.name.trim() || !form.material_id) {
      toast.error("กรุณากรอกชื่อตัวเลือกและเลือกวัตถุดิบ");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        menu_name: selectedMenu.name,
        menu_id: selectedMenu.id,
        name: form.name.trim(),
        material_id: form.material_id,
        qty_used: Number(form.qty_used) || 1,
        price_change: Number(form.price_change) || 0,
      };
      if (editingId != null) {
        await hub.update("childmenu", editingId, payload);
        toast.success("แก้ไขตัวเลือกแล้ว");
      } else {
        await hub.insert("childmenu", payload);
        toast.success("เพิ่มตัวเลือกแล้ว");
      }
      cancelEdit();
      refresh();
    } catch (e2) {
      toast.error(e2 instanceof HubApiError ? e2.message : "บันทึกไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c: ChildMenu) => {
    if (!confirm(`ลบตัวเลือก "${c.name}"?`)) return;
    try {
      await hub.remove("childmenu", c.id);
      toast.success("ลบตัวเลือกแล้ว");
      refresh();
    } catch (e) {
      toast.error(e instanceof HubApiError ? e.message : "ลบไม่สำเร็จ");
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <label className="block text-sm font-medium">เลือกเมนู</label>
        <select
          value={selectedMenuId}
          onChange={(e) => selectMenu(e.target.value)}
          className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
        >
          <option value="">-- เลือกเมนู --</option>
          {(menuList.data ?? []).map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {selectedMenu && (
        <>
          <form
            onSubmit={submit}
            className="rounded-2xl border border-border bg-card p-4 space-y-3"
          >
            <label className="block text-sm font-medium">
              {editingId != null
                ? `แก้ไข "${form.name}"`
                : `ตัวเลือกใหม่สำหรับ ${selectedMenu.name}`}
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="เช่น Brasil Santos"
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            />
            <select
              value={form.category}
              onChange={(e) =>
                setForm((f) => ({ ...f, category: e.target.value, material_id: "" }))
              }
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
            >
              <option value="">-- หมวดวัตถุดิบ --</option>
              {allCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              value={form.material_id}
              disabled={!form.category}
              onChange={(e) => setForm((f) => ({ ...f, material_id: e.target.value }))}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary disabled:opacity-50"
            >
              <option value="">
                {form.category ? "-- เลือกวัตถุดิบ --" : "-- เลือกหมวดก่อน --"}
              </option>
              {itemsForCategory(form.category).map((it) => (
                <option key={it.id} value={it.id}>
                  {it.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                inputMode="decimal"
                step="any"
                value={form.qty_used}
                onChange={(e) => setForm((f) => ({ ...f, qty_used: e.target.value }))}
                placeholder="จำนวนที่ใช้"
                className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
              <input
                type="number"
                inputMode="decimal"
                value={form.price_change}
                onChange={(e) => setForm((f) => ({ ...f, price_change: e.target.value }))}
                placeholder="+฿ ราคาเปลี่ยน"
                className="h-11 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="h-11 flex-1 rounded-xl bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {busy ? "…" : editingId != null ? "บันทึก" : "เพิ่มตัวเลือก"}
              </button>
              {editingId != null && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="h-11 rounded-xl border border-border px-4 text-sm font-medium"
                >
                  ยกเลิก
                </button>
              )}
            </div>
          </form>

          <section className="overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
            {childList.isLoading ? (
              <p className="p-4 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
            ) : rowsForMenu.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">
                ยังไม่มีตัวเลือกสำหรับเมนูนี้
              </p>
            ) : (
              rowsForMenu.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {materials.find((m) => m.id === c.material_id)?.item ?? c.material_id} ·{" "}
                      {c.qty_used}
                      {Number(c.price_change) !== 0 && ` · +${formatTHB(Number(c.price_change))}`}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => startEdit(c)}
                      className="text-xs font-semibold text-primary"
                    >
                      แก้ไข
                    </button>
                    <button
                      onClick={() => remove(c)}
                      className="text-xs font-semibold text-destructive"
                    >
                      ลบ
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
