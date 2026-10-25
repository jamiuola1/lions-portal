"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const uuid = (v: FormDataEntryValue | null) => (typeof v === "string" && /^[0-9a-f-]{36}$/i.test(v) ? v : null);

// Authorization is enforced inside each database function (is_moderator check), not here.
export async function moderate(formData: FormData) {
  const supabase = createClient();
  const decision = formData.get("decision");
  const note = String(formData.get("note") ?? "").slice(0, 500) || null;
  const id = uuid(formData.get("id"));
  if (decision === "remove" && id) {
    const kind = formData.get("kind") === "comment" ? "comment" : "post";
    await supabase.rpc("remove_content", { p_kind: kind, p_id: id, p_note: note });
  } else if (decision === "dismiss") {
    const reportId = uuid(formData.get("reportId"));
    if (reportId) await supabase.rpc("dismiss_report", { p_id: reportId, p_note: note });
  } else if (decision === "suspend") {
    const userId = uuid(formData.get("userId"));
    if (userId) await supabase.rpc("set_suspended", { p_user: userId, p_suspended: true, p_note: note });
  }
  revalidatePath("/admin/moderation");
}
