import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { markAllRead } from "../actions";
export const metadata: Metadata = { title: "Notifications", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const TEXT: Record<string, string> = { comment: "commented on your post", reply: "replied to your comment", reaction: "liked your post" };

export default async function Notifications() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community/notifications");
  const { data } = await supabase.from("notifications")
    .select("id, kind, post_id, read_at, created_at, actor:profiles!notifications_actor_id_fkey(display_name)")
    .eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
  const rows = (data ?? []) as unknown as { id: string; kind: string; post_id: string; read_at: string | null; created_at: string; actor: { display_name: string } | null }[];
  return (
    <div className="mx-auto max-w-2xl px-4 pt-12">
      <h1 className="text-3xl font-bold">Notifications</h1>
      {rows.length === 0 ? <p className="mt-6">Nothing yet. Replies and likes will show up here.</p> : (
        <>
          <form action={markAllRead} className="mt-4"><button className="text-sm underline">Mark all as read</button></form>
          <ul className="mt-4 divide-y divide-lions-line">{rows.map((n) => (
            <li key={n.id} className={`py-3 ${n.read_at ? "" : "font-semibold"}`}>
              <Link href={`/community/post/${n.post_id}`} className="hover:underline">{n.actor?.display_name ?? "Someone"} {TEXT[n.kind]}</Link>
              <span className="ml-2 text-xs font-normal">{new Date(n.created_at).toLocaleDateString("en-CA")}</span>
            </li>))}</ul>
        </>
      )}
    </div>
  );
}
