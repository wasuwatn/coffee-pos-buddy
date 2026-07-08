import { createFileRoute, redirect, Outlet } from "@tanstack/react-router";
import { getStoredUser } from "@/lib/hub/client";
import { BottomNav } from "@/components/bottom-nav";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const user = getStoredUser();
    if (!user) throw redirect({ to: "/auth" });
    return { user };
  },
  component: () => (
    <div
      className="min-h-screen bg-background"
      style={{ paddingBottom: "calc(64px + env(safe-area-inset-bottom))" }}
    >
      <Outlet />
      <BottomNav />
    </div>
  ),
});
