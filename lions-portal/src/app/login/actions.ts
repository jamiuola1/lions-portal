"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeNext } from "@/lib/validation";
import { allow, clientIp } from "@/lib/rate-limit";

const GENERIC = "That email, username or password didn't work.";

export async function signIn(formData: FormData) {
  const identifier = String(formData.get("identifier") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));
  if (!(await allow("login-ip", clientIp(), 20, 600)) || !(await allow("login-id", identifier || "none", 8, 600)))
    redirect(`/login?error=${encodeURIComponent("Too many attempts. Wait a few minutes and try again.")}`);
  let email = identifier;

  if (!identifier.includes("@")) {
    // Username login: resolve the email on the server only; it is never sent to the browser.
    const admin = createAdminClient();
    const { data: profile } = await admin.from("profiles").select("id").eq("username", identifier).maybeSingle();
    if (profile) {
      const { data } = await admin.auth.admin.getUserById(profile.id);
      email = data.user?.email ?? "";
    }
  }
  if (!email || !password) redirect(`/login?error=${encodeURIComponent(GENERIC)}`);

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/login?error=${encodeURIComponent(GENERIC)}`);
  redirect(next);
}
