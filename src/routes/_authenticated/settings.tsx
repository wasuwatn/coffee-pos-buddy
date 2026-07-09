import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { hub, HubApiError } from "@/lib/hub/client";
import { useCatalog } from "@/lib/hub/catalog";
import { useHubUser } from "@/lib/hub/session";
import { formatTHB } from "@/lib/cart-store";
import { LogOut, Store, User, ChevronRight, ArrowLeft, Clock, KeyRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = useHubUser();
  const catalog = useCatalog();
  const [activePage, setActivePage] = useState<"main" | "shop" | "shift" | "password">("main");

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
          <p className="pt-2 text-xs text-muted-foreground">
            แก้ไขข้อมูลร้าน เมนู หมวดหมู่ และส่วนขยายได้ที่แอป Mother
          </p>
        </section>
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

        <p className="pt-4 text-center text-xs text-muted-foreground">
          Kafe POS · เชื่อมต่อ SMA08 hub
        </p>
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
