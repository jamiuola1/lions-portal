import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./config";

// Service-role client. Server only; never import from a client component.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(supabaseUrl, key, { auth: { persistSession: false } });
}
