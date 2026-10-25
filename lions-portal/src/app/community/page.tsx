import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import PostComposer from "@/components/PostComposer";
import { createClient } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/avatar";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NotConfigured } from "@/components/Field";
export const metadata: Metadata = { title: "Community", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
const PAGE = 20;

type Row = { id: string; body: string; created_at: string; comment_count: number; reaction_count: number;
  author: { display_name: string; username: string; avatar_path: string | null } | null;
  category: { name: string; slug: string } | null; post_media: { id: string }[] };

export default async function Community({ searchParams }: { searchParams: { category?: string; sort?: string; page?: string } }) {
  if (!isSupabaseConfigured) return <div className="mx-auto max-w-3xl px-4 pt-12"><NotConfigured /></div>;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community");

  const [{ data: cats }, { data: mod }] = await Promise.all([
    supabase.from("discussion_categories").select("id, slug, name, staff_only").eq("archived", false).order("sort_order"),
    supabase.rpc("is_moderator"),
  ]);
  const categories = (cats ?? []) as { id: number; slug: string; name: string; staff_only: boolean }[];
  const postable = categories.filter((c) => !c.staff_only || mod === true);

  const sort = ["new", "popular", "following"].includes(searchParams.sort ?? "") ? searchParams.sort! : "new";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const cat = categories.find((c) => c.slug === searchParams.category);

  let q = supabase.from("posts")
    .select("id, body, created_at, comment_count, reaction_count, author:profiles!posts_author_id_fkey(display_name, username, avatar_path), category:discussion_categories(name, slug), post_media(id)")
    .eq("status", "visible");
  if (cat) q = q.eq("category_id", cat.id);
  if (sort === "following") {
    const { data: f } = await supabase.from("follows").select("followee_id").eq("follower_id", user.id);
    q = q.in("author_id", (f ?? []).map((r: { followee_id: string }) => r.followee_id).concat("00000000-0000-0000-0000-000000000000"));
  }
  q = sort === "popular" ? q.order("reaction_count", { ascending: false }).order("created_at", { ascending: false }) : q.order("created_at", { ascending: false });
  const { data } = await q.range((page - 1) * PAGE, page * PAGE); // one extra row tells us if there is a next page
  const rows = (data ?? []) as unknown as Row[];
  const hasNext = rows.length > PAGE;

  const qs = (o: Record<string, string | undefined>) => {
    const p = new URLSearchParams(); const m = { category: searchParams.category, sort: searchParams.sort, ...o };
    Object.entries(m).forEach(([k, v]) => v && p.set(k, v)); const s = p.toString(); return s ? `/community?${s}` : "/community";
  };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12">
      <div className="flex items-baseline justify-between"><h1 className="text-3xl font-bold">Community</h1><Link href="/community/notifications" className="text-sm font-semibold text-lions-blue underline">Notifications</Link></div>
      <p className="mt-2 text-sm">A place for Oshawa and Durham Region neighbours. Be kind, stay on topic, and report anything that doesn&rsquo;t belong.</p>

      <div className="mt-6"><PostComposer categories={postable.map((c) => ({ id: c.id, name: c.name }))} userId={user.id} /></div>

      <nav aria-label="Filter posts" className="mt-8 flex flex-wrap gap-2 text-sm">
        <Link href={qs({ category: undefined, page: undefined })} aria-current={!cat ? "page" : undefined} className={`rounded border px-3 py-2 ${!cat ? "border-lions-blue bg-lions-blue text-white" : "border-lions-line"}`}>All</Link>
        {categories.map((c) => <Link key={c.id} href={qs({ category: c.slug, page: undefined })} aria-current={cat?.id === c.id ? "page" : undefined} className={`rounded border px-3 py-2 ${cat?.id === c.id ? "border-lions-blue bg-lions-blue text-white" : "border-lions-line"}`}>{c.name}</Link>)}
      </nav>
      <nav aria-label="Sort posts" className="mt-3 flex gap-4 text-sm">
        {[["new", "Newest"], ["popular", "Popular"], ["following", "Following"]].map(([k, l]) => <Link key={k} href={qs({ sort: k, page: undefined })} aria-current={sort === k ? "page" : undefined} className={sort === k ? "font-bold underline" : ""}>{l}</Link>)}
      </nav>

      {rows.length === 0 ? <p className="mt-8">{sort === "following" ? "Follow a few members to fill this tab." : "No posts here yet. Be the first."}</p> : (
        <ul className="mt-6 space-y-4">
          {rows.slice(0, PAGE).map((p) => {
            const pic = avatarUrl(p.author?.avatar_path);
            return (
              <li key={p.id} className="border border-lions-line p-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {pic ? <img src={pic} alt="" width={36} height={36} loading="lazy" className="h-9 w-9 rounded-full object-cover" /> : <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-lions-mist text-sm font-bold">{p.author?.display_name?.[0]}</span>}
                  <div className="text-sm"><span className="font-semibold">{p.author?.display_name}</span> in {p.category?.name}<br /><time dateTime={p.created_at}>{new Date(p.created_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto" })}</time></div>
                </div>
                <p className="mt-3 line-clamp-4 whitespace-pre-wrap">{p.body}</p>
                <p className="mt-3 text-sm"><Link href={`/community/post/${p.id}`} className="font-semibold text-lions-blue underline">Open</Link> &middot; {p.reaction_count} likes &middot; {p.comment_count} comments{p.post_media.length > 0 && <> &middot; {p.post_media.length} attachment{p.post_media.length > 1 ? "s" : ""}</>}</p>
              </li>
            );
          })}
        </ul>
      )}
      <div className="mt-6 flex gap-6 text-sm">
        {page > 1 && <Link href={qs({ page: String(page - 1) })} className="underline">Newer posts</Link>}
        {hasNext && <Link href={qs({ page: String(page + 1) })} className="underline">Older posts</Link>}
      </div>
    </div>
  );
}
