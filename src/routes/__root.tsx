import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AUTH_EVENT } from "@/lib/hub/client";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">ไม่พบหน้านี้</h2>
        <p className="mt-2 text-sm text-muted-foreground">หน้าที่คุณค้นหาไม่มีอยู่หรือถูกย้าย</p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            กลับหน้าหลัก
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">โหลดหน้านี้ไม่สำเร็จ</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          มีบางอย่างผิดพลาด ลองรีเฟรชหรือกลับไปหน้าหลัก
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            ลองใหม่
          </button>
          <a
            href="/"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            กลับหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover",
      },
      { name: "theme-color", content: "#2d8ac9" },
      { title: "Kafe POS — ระบบขายหน้าร้านกาแฟ" },
      {
        name: "description",
        content:
          "POS สำหรับร้านกาแฟ ใช้ง่ายบนไอโฟน จัดการเมนู เก็บเงิน และดูประวัติการขายในที่เดียว",
      },
      { property: "og:title", content: "Kafe POS — ระบบขายหน้าร้านกาแฟ" },
      { property: "og:description", content: "POS สำหรับร้านกาแฟ ใช้ง่ายบนไอโฟน" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      // "Add to Home Screen" installability — standalone display + custom
      // icon. No service worker on purpose: offline mode isn't built yet
      // (see README "Known gaps"), and a half-wired SW would risk caching
      // stale API responses, which is worse than no SW at all. iOS Safari
      // reads these apple-* tags more reliably than the manifest alone on
      // older iOS versions, so both are set.
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "Kafe POS" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "icon", href: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
      { rel: "apple-touch-icon", href: "/icons/apple-touch-icon.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        // crossOrigin + Google's Access-Control-Allow-Origin: * is what
        // lets code read this stylesheet's cssRules (e.g. for font embedding
        // during receipt image export) instead of hitting a cross-origin
        // CSSOM SecurityError. Doesn't change how the font loads normally.
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Noto+Sans+Thai:wght@400;500;600;700&display=swap",
        crossOrigin: "anonymous",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="th">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    const onAuthChange = () => {
      router.invalidate();
      queryClient.invalidateQueries();
    };
    window.addEventListener(AUTH_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_EVENT, onAuthChange);
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
