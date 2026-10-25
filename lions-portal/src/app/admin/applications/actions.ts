"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// Authorization lives in the database functions (has_role check inside); this only relays the call.
export async function review(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const decision = formData.get("decision");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = createClient();
  await supabase.rpc(decision === "approve" ? "approve_application" : "reject_application", { app_id: id });
  revalidatePath("/admin/applications");
}
