import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Field, Notice } from "@/components/Field";
import { createClient } from "@/lib/supabase/server";
import { passwordSchema } from "@/lib/validation";
export const metadata: Metadata = { title: "Choose a new password", robots: { index: false } };
export const dynamic = "force-dynamic";

async function setPassword(formData: FormData) {
  "use server";
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=" + encodeURIComponent("That reset link has expired. Request a new one."));
  const pw = passwordSchema.safeParse(formData.get("password"));
  if (!pw.success) redirect("/reset-password?error=" + encodeURIComponent(pw.error.issues[0].message));
  const { error } = await supabase.auth.updateUser({ password: pw.data });
  if (error) redirect("/reset-password?error=" + encodeURIComponent("We couldn't update the password. Try a different one."));
  redirect("/member/dashboard");
}

export default async function Reset({ searchParams }: { searchParams: { error?: string } }) {
  const { data: { user } } = await createClient().auth.getUser();
  if (!user) redirect("/forgot-password?error=" + encodeURIComponent("Open the link from your email, or request a new one."));
  return (
    <div className="mx-auto max-w-md px-4 pt-12">
      <h1 className="text-3xl font-bold">Choose a new password</h1>
      <form action={setPassword} className="mt-6 space-y-4">
        <Notice error={searchParams.error} />
        <Field id="password" label="New password" type="password" autoComplete="new-password" hint="At least 10 characters." />
        <button className="w-full rounded bg-lions-blue px-4 py-3 font-semibold text-white">Save password</button>
      </form>
    </div>
  );
}
