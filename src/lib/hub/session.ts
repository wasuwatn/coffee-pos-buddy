import { useEffect, useState } from "react";
import { AUTH_EVENT, getStoredUser, type HubUser } from "./client";

// Replaces Supabase's onAuthStateChange — the hub session is just a JWT +
// user blob in localStorage (see client.ts), so "auth state" here is a
// custom event fired on login/logout/401.
export function useHubUser(): HubUser | null {
  const [user, setUser] = useState<HubUser | null>(() => getStoredUser());
  useEffect(() => {
    const onChange = () => setUser(getStoredUser());
    window.addEventListener(AUTH_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(AUTH_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);
  return user;
}

export function hasAccess(user: HubUser | null, flag: string) {
  if (!user) return false;
  if (user.role === "Admin") return true;
  return String(user.access || "")
    .split(",")
    .map((s) => s.trim())
    .includes(flag);
}
