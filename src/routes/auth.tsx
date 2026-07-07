import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Coffee, Delete } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "เข้าสู่ระบบ — Kafe POS" },
      { name: "description", content: "เข้าสู่ระบบ POS ร้านกาแฟ" },
    ],
  }),
  component: AuthPage,
});

const PIN_CODE = "1111";
const DEMO_EMAIL = "demo@kafepos.local";
const DEMO_PASS = "demo-password-1111";

function AuthPage() {
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/" });
    });
  }, [navigate]);

  useEffect(() => {
    if (pin.length === 4) {
      if (pin === PIN_CODE) {
        handleLogin();
      } else {
        toast.error("รหัส PIN ไม่ถูกต้อง");
        setPin("");
      }
    }
  }, [pin]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: DEMO_EMAIL,
        password: DEMO_PASS,
      });

      if (signInError) {
        // If sign in fails (likely doesn't exist yet), we sign them up automatically
        const { error: signUpError } = await supabase.auth.signUp({
          email: DEMO_EMAIL,
          password: DEMO_PASS,
          options: { data: { shop_name: "ร้าน Demo", full_name: "พนักงาน 1111" } },
        });
        if (signUpError) throw signUpError;
        toast.success("สร้างบัญชี Demo สำหรับรหัส 1111 สำเร็จ");
      }
      
      navigate({ to: "/" });
    } catch (err) {
      toast.error((err as Error).message);
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  const pressNumber = (num: number) => {
    if (pin.length < 4 && !loading) {
      setPin((prev) => prev + num);
    }
  };

  const pressDelete = () => {
    if (pin.length > 0 && !loading) {
      setPin((prev) => prev.slice(0, -1));
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
            <h1 className="text-2xl font-bold">Kafe POS</h1>
            <p className="mt-1 text-sm text-muted-foreground">เข้าสู่ระบบด้วยรหัส PIN (1111)</p>
          </div>
        </div>

        <div className="flex justify-center gap-4 mb-10">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-4 w-4 rounded-full transition-all duration-200 ${
                pin.length > i ? "bg-primary scale-110" : "bg-muted-foreground/20"
              }`}
            />
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-primary font-medium animate-pulse">
            กำลังเข้าสู่ระบบ...
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4 mx-auto max-w-[280px]">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => pressNumber(num)}
                className="grid h-20 w-20 place-items-center rounded-full bg-card text-3xl font-semibold shadow-sm border border-border transition active:bg-muted active:scale-95"
              >
                {num}
              </button>
            ))}
            <div /> {/* Empty space bottom left */}
            <button
              onClick={() => pressNumber(0)}
              className="grid h-20 w-20 place-items-center rounded-full bg-card text-3xl font-semibold shadow-sm border border-border transition active:bg-muted active:scale-95"
            >
              0
            </button>
            <button
              onClick={pressDelete}
              className="grid h-20 w-20 place-items-center rounded-full bg-card/50 text-muted-foreground transition active:bg-muted active:scale-95"
            >
              <Delete className="h-8 w-8" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
