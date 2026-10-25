import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { moderate } from "./actions";
export const metadata: Metadata = { title: "Moderation queue", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Who = { display_name: string; username: string } | null;
type Report = { id: string; reason: string; created_at: string; reporter: { username: string } | null;
  post: { id: string; body: string; author_id: string; author: Who } | null;
  comment: { id: string; body: string; author_id: string; author: Who } | null };

export default async function Moderation() {
  if (!isSupabaseConfigured) notFound();
  const supabase = createClient();
  const { data: ok } = await supabase.rpc("is_moderator");
  if (ok !== true) notFound();
  const { data } = await supabase.from("reports")
    .select("id, reason, created_at, reporter:profiles!reports_reporter_id_fkey(username), post:posts(id, body, author_id, author:profiles!posts_author_id_fkey(display_name, username)), comment:comments(id, body, author_id, author:profiles!comments_author_id_fkey(display_name, username))")
    .eq("status", "open").order("created_at");
  const rows = (data ?? []) as unknown as Report[];
  return (
    <div className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="text-3xl font-bold">Moderation queue</h1>
      {rows.length === 0 ? <p className="mt-6">No open reports.</p> : (
        <ul className="mt-6 space-y-5">{rows.map((r) => {
          const item = r.post ?? r.comment; const kind = r.post ? "post" : "comment";
          return (
            <li key={r.id} className="border border-lions-line p-4">
              <p className="text-sm">Reported by @{r.reporter?.username} on {new Date(r.created_at).toLocaleDateString("en-CA")}: <strong>{r.reason}</strong></p>
              <p className="mt-3 text-sm font-semibold">{kind === "post" ? "Post" : "Comment"} by {item?.author?.display_name} (@{item?.author?.username})</p>
              <p className="mt-1 whitespace-pre-wrap rounded bg-lions-mist p-3">{item?.body ?? "Content already removed."}</p>
              <form action={moderate} className="mt-4 space-y-3">
                <input type="hidden" name="reportId" value={r.id} /><input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={item?.id ?? ""} /><input type="hidden" name="userId" value={item?.author_id ?? ""} />
                <label htmlFor={`n-${r.id}`} className="block text-sm font-semibold">Note for the log (optional)</label>
                <input id={`n-${r.id}`} name="note" maxLength={500} className="w-full rounded border border-lions-line px-3 py-2" />
                <div className="flex flex-wrap gap-3">
                  <button name="decision" value="remove" className="rounded bg-lions-blue px-4 py-2 font-semibold text-white">Remove {kind}</button>
                  <button name="decision" value="dismiss" className="rounded border border-lions-line px-4 py-2 font-semibold">Dismiss report</button>
                  <button name="decision" value="suspend" className="rounded border border-red-300 px-4 py-2 font-semibold text-red-800">Suspend author</button>
                </div>
              </form>
            </li>);
        })}</ul>
      )}
    </div>
  );
}
