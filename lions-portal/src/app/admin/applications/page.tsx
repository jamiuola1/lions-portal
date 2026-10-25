import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { review } from "./actions";
export const metadata: Metadata = { title: "Membership applications", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Applications() {
  if (!isSupabaseConfigured) notFound();
  const supabase = createClient();
  const [{ data: isAdmin }, { data: isOfficer }] = await Promise.all([supabase.rpc("has_role", { role_key: "admin" }), supabase.rpc("has_role", { role_key: "membership_officer" })]);
  if (!isAdmin && !isOfficer) notFound();

  const { data: apps } = await supabase
    .from("membership_applications")
    .select("id, message, created_at, profiles!membership_applications_user_id_fkey(display_name, username)")
    .eq("status", "submitted").order("created_at");
  type Row = { id: string; message: string | null; created_at: string; profiles: { display_name: string; username: string } | null };
  const rows = (apps ?? []) as unknown as Row[];

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="text-3xl font-bold">Membership applications</h1>
      {rows.length === 0 ? <p className="mt-6">No applications are waiting.</p> : (
        <ul className="mt-6 space-y-4">
          {rows.map((a) => (
            <li key={a.id} className="border border-lions-line p-4">
              <p className="font-semibold">{a.profiles?.display_name} <span className="font-normal">(@{a.profiles?.username})</span></p>
              <p className="text-sm">Sent {new Date(a.created_at).toLocaleDateString("en-CA")}</p>
              {a.message && <p className="mt-2 whitespace-pre-wrap">{a.message}</p>}
              <form action={review} className="mt-4 flex gap-3">
                <input type="hidden" name="id" value={a.id} />
                <button name="decision" value="approve" className="rounded bg-lions-blue px-4 py-2 font-semibold text-white">Approve</button>
                <button name="decision" value="reject" className="rounded border border-lions-line px-4 py-2 font-semibold">Reject</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
