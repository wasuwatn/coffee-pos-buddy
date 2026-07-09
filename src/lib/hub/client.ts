// Thin REST client for the SMA08 hub API. This app is a satellite of that
// hub (same role as pos.html in the SMA08 repo) — it has no database or
// server functions of its own; every read/write goes straight to the hub
// from the browser, authenticated with the hub's own JWT (not Supabase).
// See INTEGRATION_PLAN.md (Phase 2) in the SMA08 repo for the full design.
const BASE = (import.meta.env.VITE_API_BASE || "").replace(/\/$/, "");

const TOKEN_KEY = "KAFE_HUB_TOKEN";
const USER_KEY = "KAFE_HUB_USER";

export type HubUser = {
  username: string;
  role: string;
  access: string;
  mustChangePassword?: boolean;
};

export class HubApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

let token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) || "" : "";

// Fired on login/logout/401 so route guards and React Query can react
// without a Supabase-style onAuthStateChange subscription.
export const AUTH_EVENT = "kafe-hub-auth-change";
function notifyAuthChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(AUTH_EVENT));
}

export function getToken() {
  return token;
}

export function getStoredUser(): HubUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as HubUser;
  } catch {
    return null;
  }
}

function setSession(t: string, user: HubUser) {
  token = t;
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, t);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
  notifyAuthChange();
}

export function clearSession() {
  token = "";
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
  notifyAuthChange();
}

async function req<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const opts: RequestInit = { method, headers };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(BASE + url, opts);
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // no body
  }
  if (res.status === 401 && url !== "/api/auth/login") clearSession();
  if (!res.ok) {
    const hasErrorField = !!data && typeof data === "object" && "error" in data;
    const message = hasErrorField
      ? String((data as { error: unknown }).error)
      : `Request failed (${res.status})`;
    throw new HubApiError(message, res.status, data);
  }
  return data as T;
}

export type ShiftRow = {
  id: number;
  status: "open" | "closed";
  opened_at: string;
  opened_by: string;
  opening_cash: number;
  closed_at?: string | null;
  closed_by?: string | null;
  closing_cash?: number | null;
  expected_cash?: number | null;
  cash_sales?: number | null;
  promptpay_sales?: number | null;
  transfer_sales?: number | null;
  orders?: number | null;
  over_short?: number | null;
  note?: string | null;
};

export type CheckoutRequirement = { material_id: string; qty: number; note?: string };
export type CheckoutSaleRow = Record<string, unknown>;
export type CheckoutPayload = {
  client_txn_id: string;
  date: string;
  sales: CheckoutSaleRow[];
  requirements: CheckoutRequirement[];
};

export const hub = {
  async login(username: string, password: string) {
    const res = await req<{
      token: string;
      user: Omit<HubUser, "mustChangePassword">;
      mustChangePassword?: boolean;
    }>("POST", "/api/auth/login", { username, password });
    const user: HubUser = { ...res.user, mustChangePassword: !!res.mustChangePassword };
    setSession(res.token, user);
    return user;
  },
  logout() {
    clearSession();
  },
  changePassword(currentPassword: string, newPassword: string) {
    return req<{ ok: true }>("POST", "/api/auth/change-password", {
      currentPassword,
      newPassword,
    }).then((r) => {
      const u = getStoredUser();
      if (u) setSession(token, { ...u, mustChangePassword: false });
      return r;
    });
  },
  list<T = Record<string, unknown>>(table: string, params?: Record<string, string | number>) {
    const qs =
      params && Object.keys(params).length
        ? "?" + new URLSearchParams(params as Record<string, string>).toString()
        : "";
    return req<T[]>("GET", `/api/${table}${qs}`);
  },
  shiftCurrent: () => req<ShiftRow | null>("GET", "/api/shift/current"),
  shiftOpen: (opening_cash: number) => req<ShiftRow>("POST", "/api/shift/open", { opening_cash }),
  shiftClose: (closing_cash: number | null, note?: string) =>
    req<{ shift: ShiftRow; totals: { total_sales: number; cups: number; free_cups: number } }>(
      "POST",
      "/api/shift/close",
      {
        closing_cash,
        note,
      },
    ),
  checkoutPos: (payload: CheckoutPayload) =>
    req<CheckoutSaleRow[] | { duplicate: true }>("POST", "/api/checkout/pos", payload),
};
