import { Link, useLocation } from "@tanstack/react-router";
import { ShoppingCart, Package, History, Ticket, Settings } from "lucide-react";

const tabs = [
  { to: "/", label: "ขาย", icon: ShoppingCart },
  { to: "/history", label: "ประวัติ", icon: History },
  { to: "/coupons", label: "คูปอง", icon: Ticket },
  { to: "/settings", label: "ตั้งค่า", icon: Settings },
] as const;

export function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map((t) => {
          const active =
            t.to === "/" ? pathname === "/" : pathname === t.to || pathname.startsWith(t.to + "/");
          const Icon = t.icon;
          return (
            <Link
              key={t.to}
              to={t.to}
              className={`flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2.4 : 1.8} />
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
