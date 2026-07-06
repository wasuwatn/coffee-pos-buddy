import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyContext, updateShopName } from "@/lib/pos.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogOut, Store, User } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

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

  return (
    <div className="mx-auto max-w-md">
      <header className="sticky top-0 z-10 border-b border-border bg-card px-4 py-3" style={{ paddingTop: "calc(0.75rem + env(safe-area-inset-top))" }}>
        <h1 className="text-lg font-bold">ตั้งค่า</h1>
      </header>

      <main className="px-4 py-4 space-y-4">
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Store className="h-4 w-4 text-primary" />ข้อมูลร้าน
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

        <p className="pt-4 text-center text-xs text-muted-foreground">Kafe POS · v1</p>
      </main>
    </div>
  );
}
