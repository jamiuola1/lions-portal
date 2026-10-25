import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/avatar";
import { addComment, deletePost, reportContent, toggleFollow, toggleReaction, toggleSave } from "../../actions";
export const metadata: Metadata = { title: "Post", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

type Author = { id?: string; display_name: string; username: string; avatar_path: string | null } | null;
type Comment = { id: string; body: string; created_at: string; parent_id: string | null; author_id: string; author: Author };
const when = (d: string) => new Date(d).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Toronto" });
const btn = "rounded border border-lions-line px-3 py-2 text-sm font-semibold";

function ReportForm({ kind, id, postId }: { kind: "post" | "comment"; id: string; postId: string }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer underline">Report</summary>
      <form action={reportContent} className="mt-2 space-y-2">
        <input type="hidden" name="kind" value={kind} /><input type="hidden" name="id" value={id} /><input type="hidden" name="postId" value={postId} />
        <label htmlFor={`r-${id}`} className="block font-semibold">What&rsquo;s wrong with this {kind}?</label>
        <input id={`r-${id}`} name="reason" required minLength={3} maxLength={500} className="w-full rounded border border-lions-line px-3 py-2" />
        <button className={btn}>Send report</button>
      </form>
    </details>
  );
}

export default async function PostPage({ params, searchParams }: { params: { id: string }; searchParams: { error?: string; notice?: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/community/post/${params.id}`);

  const { data: post } = await supabase.from("posts")
    .select("id, body, created_at, edited_at, author_id, reaction_count, comment_count, author:profiles!posts_author_id_fkey(display_name, username, avatar_path), category:discussion_categories(name)")
    .eq("id", params.id).eq("status", "visible").maybeSingle();
  if (!post) notFound();

  const [{ data: media }, { data: comments }, { data: liked }, { data: saved }, { data: following }] = await Promise.all([
    supabase.from("post_media").select("id, storage_path, mime_type, original_name").eq("post_id", post.id),
    supabase.from("comments").select("id, body, created_at, parent_id, author_id, author:profiles!comments_author_id_fkey(display_name, username, avatar_path)").eq("post_id", post.id).eq("status", "visible").order("created_at"),
    supabase.from("reactions").select("post_id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle(),
    supabase.from("saved_posts").select("post_id").eq("post_id", post.id).eq("user_id", user.id).maybeSingle(),
    supabase.from("follows").select("followee_id").eq("follower_id", user.id).eq("followee_id", post.author_id).maybeSingle(),
  ]);

  const files = await Promise.all((media ?? []).map(async (m: { id: string; storage_path: string; mime_type: string; original_name: string }) => {
    const { data } = await supabase.storage.from("community-media").createSignedUrl(m.storage_path, 3600);
    return { ...m, url: data?.signedUrl ?? null };
  }));

  const all = (comments ?? []) as unknown as Comment[];
  const top = all.filter((c) => !c.parent_id);
  const replies = (id: string) => all.filter((c) => c.parent_id === id);
  const author = post.author as unknown as Author;
  const pic = avatarUrl(author?.avatar_path);
  const mine = post.author_id === user.id;

  const CommentItem = ({ c, nested }: { c: Comment; nested?: boolean }) => (
    <li className={nested ? "ml-6 border-l-2 border-lions-line pl-4" : ""}>
      <p className="text-sm"><span className="font-semibold">{c.author?.display_name}</span> &middot; <time dateTime={c.created_at}>{when(c.created_at)}</time></p>
      <p className="mt-1 whitespace-pre-wrap">{c.body}</p>
      <div className="mt-1 flex flex-wrap gap-4">
        {!nested && <details className="text-sm"><summary className="cursor-pointer underline">Reply</summary>
          <form action={addComment} className="mt-2 space-y-2"><input type="hidden" name="postId" value={post.id} /><input type="hidden" name="parentId" value={c.id} />
            <label htmlFor={`c-${c.id}`} className="sr-only">Your reply</label><textarea id={`c-${c.id}`} name="body" required rows={2} maxLength={2000} className="w-full rounded border border-lions-line px-3 py-2" />
            <button className={btn}>Reply</button></form></details>}
        {c.author_id !== user.id && <ReportForm kind="comment" id={c.id} postId={post.id} />}
      </div>
    </li>
  );

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12">
      <p className="text-sm"><Link href="/community" className="underline">Back to community</Link></p>
      {searchParams.error && <p role="alert" className="mt-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{searchParams.error}</p>}
      {searchParams.notice && <p role="status" className="mt-4 rounded bg-lions-mist p-3 text-sm">{searchParams.notice}</p>}
      <article className="mt-4">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {pic ? <img src={pic} alt="" width={44} height={44} className="h-11 w-11 rounded-full object-cover" /> : <span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-lions-mist font-bold">{author?.display_name?.[0]}</span>}
          <div className="text-sm"><p className="font-semibold">{author?.display_name} <span className="font-normal">@{author?.username}</span></p><p>{(post.category as unknown as { name: string })?.name} &middot; <time dateTime={post.created_at}>{when(post.created_at)}</time></p></div>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-lg">{post.body}</p>

        {files.length > 0 && <ul className="mt-4 space-y-4">{files.map((f) => (
          <li key={f.id}>{!f.url ? <span className="text-sm">Attachment unavailable.</span>
            : f.mime_type.startsWith("image/") ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={f.url} alt={`Photo attached by ${author?.display_name}`} loading="lazy" className="max-h-[480px] max-w-full rounded" />
            : f.mime_type.startsWith("video/") ? <video src={f.url} controls preload="metadata" className="max-h-[480px] max-w-full rounded" />
            : <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-lions-blue underline">Open document: {f.original_name}</a>}</li>))}</ul>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <form action={toggleReaction}><input type="hidden" name="postId" value={post.id} /><button aria-pressed={!!liked} className={`${btn} ${liked ? "bg-lions-gold" : ""}`}>{liked ? "Liked" : "Like"} ({post.reaction_count})</button></form>
          <form action={toggleSave}><input type="hidden" name="postId" value={post.id} /><button aria-pressed={!!saved} className={btn}>{saved ? "Saved" : "Save"}</button></form>
          {!mine && <form action={toggleFollow}><input type="hidden" name="userId" value={post.author_id} /><input type="hidden" name="postId" value={post.id} /><button aria-pressed={!!following} className={btn}>{following ? "Following" : `Follow ${author?.display_name}`}</button></form>}
          {mine && <form action={deletePost}><input type="hidden" name="postId" value={post.id} /><button className={`${btn} text-red-800`}>Delete post</button></form>}
        </div>
        {!mine && <div className="mt-3"><ReportForm kind="post" id={post.id} postId={post.id} /></div>}
      </article>

      <section className="mt-10" aria-labelledby="comments-h">
        <h2 id="comments-h" className="text-2xl font-bold">{post.comment_count} comment{post.comment_count === 1 ? "" : "s"}</h2>
        <form action={addComment} className="mt-4 space-y-2"><input type="hidden" name="postId" value={post.id} />
          <label htmlFor="new-comment" className="block text-sm font-semibold">Add a comment</label>
          <textarea id="new-comment" name="body" required rows={3} maxLength={2000} className="w-full rounded border border-lions-line px-3 py-3" />
          <button className="rounded bg-lions-blue px-5 py-3 font-semibold text-white">Comment</button></form>
        <ul className="mt-6 space-y-6">{top.map((c) => (<div key={c.id}><CommentItem c={c} /><ul className="mt-3 space-y-4">{replies(c.id).map((r) => <CommentItem key={r.id} c={r} nested />)}</ul></div>))}</ul>
      </section>
    </div>
  );
}
