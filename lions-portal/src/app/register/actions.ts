"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation";
import { allow, clientIp } from "@/lib/rate-limit";

export async function register(formData: FormData) {
  if (!(await allow("register", clientIp(), 5, 3600))) redirect(`/register?error=${encodeURIComponent("Too many sign-ups from this connection. Try again later.")}`);
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(`/register?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  const { email, username, displayName, password } = parsed.data;
  const origin = headers().get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email, password,
    options: { data: { username, display_name: displayName }, emailRedirectTo: `${origin}/auth/callback?next=/member/dashboard` },
  });
  if (error) redirect(`/register?error=${encodeURIComponent("We couldn't create that account. Check the details or try logging in.")}`);
  redirect(`/login?notice=${encodeURIComponent("Check your email to confirm your address, then log in.")}`);
}
