"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applicationSchema } from "@/lib/validation";
import { allow } from "@/lib/rate-limit";

export async function submitApplication(formData: FormData) {
  const parsed = applicationSchema.safeParse({ message: formData.get("message") || undefined });
  if (!parsed.success) redirect("/membership/apply?error=" + encodeURIComponent("Keep your note under 1000 characters."));
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/membership/apply");
  if (!(await allow("apply", user.id, 3, 3600))) redirect("/membership/apply?error=" + encodeURIComponent("Too many attempts. Try again later."));
  const { error } = await supabase.from("membership_applications").insert({ user_id: user.id, message: parsed.data.message ?? null });
  if (error) redirect("/membership/apply?error=" + encodeURIComponent(error.code === "23505" ? "You already have an application waiting for review." : "We couldn't send your application. Please try again."));
  redirect("/member/dashboard?applied=1");
}
