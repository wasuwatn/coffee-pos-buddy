import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { hub, HubApiError } from "@/lib/hub/client";
import { getStoredUser } from "@/lib/hub/client";
import { Coffee, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ — KPOS" },
      { name: "description", content: "เข้าสู่ระบบ POS ร้านกาแฟ" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (getStoredUser()) navigate({ to: "/" });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    try {
      const user = await hub.login(username.trim(), password);
      if (user.mustChangePassword) {
        toast.info("กรุณาเปลี่ยนรหัสผ่าน (ยังใช้รหัสผ่านตั้งต้นอยู่)");
      }
      navigate({ to: "/" });
    } catch (err) {
      const message = err instanceof HubApiError ? err.message : "เข้าสู่ระบบไม่สำเร็จ";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
            <Coffee className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">KPOS</h1>
            <p className="mt-1 text-sm text-muted-foreground">เข้าสู่ระบบด้วยบัญชีพนักงาน</p>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
              {error}
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">ชื่อผู้ใช้</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              autoCapitalize="none"
              autoCorrect="off"
              placeholder="admin"
              className="h-12 w-full rounded-xl border border-input bg-card px-4 text-base outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground">รหัสผ่าน</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="h-12 w-full rounded-xl border border-input bg-card px-4 pr-11 text-base outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground"
                aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPw ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </button>
        </form>
      </div>
    </div>
  );
}
