import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) throw redirect({ to: "/auth" });
    return { user: data.session.user };
  },
  component: () => (
    <div className="min-h-screen bg-background" style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}>
      <Outlet />
      <BottomNav />
    </div>
  ),
});
