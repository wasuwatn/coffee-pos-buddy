import { createStart, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// No functionMiddleware needed: this app has no TanStack Start server
// functions of its own — every read/write goes straight from the browser to
// the SMA08 hub API (see src/lib/hub/client.ts) with its own JWT, not
// Supabase's bearer-token-attacher pattern.
export const startInstance = createStart(() => ({
  requestMiddleware: [errorMiddleware],
}));
