import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { hub, HubApiError } from "@/lib/hub/client";
import { getStoredUser } from "@/lib/hub/client";
import { Coffee, User } from "lucide-react";
import { toast } from "sonner";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ — KPOS" },
      { name: "description", content: "เข้าสู่ระบบ POS ร้านกาแฟ" },
    ],
  }),
  component: AuthPage,
});

const KEYPAD_ROWS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
];

function AuthPage() {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<string[] | null>(null);
  const [staffError, setStaffError] = useState("");
  const [username, setUsername] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getStoredUser()) navigate({ to: "/" });
  }, [navigate]);

  useEffect(() => {
    hub
      .staffList()
      .then(setStaff)
      .catch(() => setStaffError("โหลดรายชื่อพนักงานไม่สำเร็จ"));
  }, []);

  // Auto-submit once 4 digits are entered.
  useEffect(() => {
    if (!username || pin.length !== 4 || loading) return;
    setLoading(true);
    hub
      .loginWithPin(username, pin)
      .then(() => navigate({ to: "/" }))
      .catch((err) => {
        const message = err instanceof HubApiError ? err.message : "เข้าสู่ระบบไม่สำเร็จ";
        toast.error(message);
        setPin("");
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, username]);

  const pickStaff = (name: string) => {
    setUsername(name);
    setPin("");
  };

  const backToPicker = () => {
    setUsername(null);
    setPin("");
  };

  const pressDigit = (d: string) => {
    if (loading) return;
    setPin((p) => (p.length < 4 ? p + d : p));
  };

  const backspace = () => {
    if (loading) return;
    setPin((p) => p.slice(0, -1));
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
            <p className="mt-1 text-sm text-muted-foreground">
              {username ? `กรอก PIN ของ ${username}` : "แตะชื่อของคุณเพื่อเข้าสู่ระบบ"}
            </p>
          </div>
        </div>

        {!username ? (
          <div className="space-y-2">
            {staffError && (
              <div className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
                {staffError}
              </div>
            )}
            {!staff && !staffError && (
              <p className="py-8 text-center text-sm text-muted-foreground">กำลังโหลด...</p>
            )}
            {staff?.map((name) => (
              <button
                key={name}
                onClick={() => pickStaff(name)}
                className="flex h-14 w-full items-center gap-3 rounded-xl border border-input bg-card px-4 text-base font-medium outline-none transition active:scale-[0.98] hover:border-primary"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </span>
                {name}
              </button>
            ))}
            {staff && staff.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">ยังไม่มีบัญชีพนักงาน</p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <InputOTP
              maxLength={4}
              value={pin}
              onChange={setPin}
              pattern="^[0-9]*$"
              containerClassName="justify-center"
              disabled={loading}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="h-14 w-14 text-xl" />
                <InputOTPSlot index={1} className="h-14 w-14 text-xl" />
                <InputOTPSlot index={2} className="h-14 w-14 text-xl" />
                <InputOTPSlot index={3} className="h-14 w-14 text-xl" />
              </InputOTPGroup>
            </InputOTP>

            <div className="grid grid-cols-3 gap-3">
              {KEYPAD_ROWS.flat().map((d) => (
                <Button
                  key={d}
                  type="button"
                  variant="outline"
                  disabled={loading}
                  onClick={() => pressDigit(d)}
                  className="h-14 rounded-xl text-xl font-semibold"
                >
                  {d}
                </Button>
              ))}
              <div />
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => pressDigit("0")}
                className="h-14 rounded-xl text-xl font-semibold"
              >
                0
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={backspace}
                className="h-14 rounded-xl text-xl font-semibold"
                aria-label="ลบ"
              >
                ⌫
              </Button>
            </div>

            <button
              type="button"
              onClick={backToPicker}
              disabled={loading}
              className="mx-auto block text-sm font-medium text-muted-foreground disabled:opacity-50"
            >
              ‹ กลับ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
