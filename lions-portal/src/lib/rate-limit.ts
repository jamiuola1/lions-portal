import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

export function clientIp(): string {
  const h = headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "unknown").trim();
}

/** Returns true when the call is allowed. Fails open if the limiter itself is unavailable. */
export async function allow(action: string, identity: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc("check_rate_limit", { p_key: `${action}:${identity}`, p_max: max, p_window_seconds: windowSeconds });
    if (error) { console.error("rate limit check failed", error.message); return true; }
    return data === true;
  } catch (e) {
    console.error("rate limit unavailable", e);
    return true;
  }
}
