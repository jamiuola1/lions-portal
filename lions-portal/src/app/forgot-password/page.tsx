import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Field, NotConfigured, Notice } from "@/components/Field";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { allow, clientIp } from "@/lib/rate-limit";
import { z } from "zod";
export const metadata: Metadata = { title: "Reset your password", robots: { index: false } };

async function requestReset(formData: FormData) {
  "use server";
  const done = "/forgot-password?sent=1";
  if (!(await allow("reset", clientIp(), 5, 3600))) redirect("/forgot-password?error=" + encodeURIComponent("Too many requests. Try again later."));
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) redirect("/forgot-password?error=" + encodeURIComponent("Enter a valid email address."));
  const origin = headers().get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";
  await createClient().auth.resetPasswordForEmail(email.data, { redirectTo: `${origin}/auth/callback?next=/reset-password` });
  redirect(done); // same response whether or not the address has an account
}

export default function Forgot({ searchParams }: { searchParams: { sent?: string; error?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-12">
      <h1 className="text-3xl font-bold">Reset your password</h1>
      <div className="mt-6">
        {!isSupabaseConfigured ? <NotConfigured /> : searchParams.sent ? (
          <p className="rounded bg-lions-mist p-4 text-sm">If an account uses that address, a reset link is on its way. It can take a few minutes.</p>
        ) : (
          <form action={requestReset} className="space-y-4">
            <Notice error={searchParams.error} />
            <Field id="email" label="Email" type="email" autoComplete="email" />
            <button className="w-full rounded bg-lions-blue px-4 py-3 font-semibold text-white">Send reset link</button>
          </form>
        )}
      </div>
    </div>
  );
}
