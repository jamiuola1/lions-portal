"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { allow } from "@/lib/rate-limit";
import { sniffFile } from "@/lib/files";
import { MAX_FILES, MAX_FILE_BYTES, commentSchema, postSchema, reportSchema } from "@/lib/community";

async function requireUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/community");
  return { supabase, user };
}

type Upload = { path: string; name: string };

async function verifyUpload(path: string, uid: string): Promise<{ mime: string; size: number } | null> {
  if (!path.startsWith(`${uid}/`) || path.includes("..")) return null;
  const admin = createAdminClient();
  const { data } = await admin.storage.from("community-media").createSignedUrl(path, 60);
  if (!data) return null;
  const res = await fetch(data.signedUrl, { headers: { Range: "bytes=0-31" } });
  if (res.status !== 206 && res.status !== 200) return null;
  const head = new Uint8Array(await res.arrayBuffer()).slice(0, 32);
  const total = Number(res.headers.get("content-range")?.split("/")[1] ?? res.headers.get("content-length"));
  const mime = sniffFile(head);
  if (!mime || !Number.isFinite(total) || total > MAX_FILE_BYTES) return null;
  return { mime, size: total };
}

export async function createPost(input: { categoryId: number; body: string; files: Upload[] }): Promise<{ error: string }> {
  const { supabase, user } = await requireUser();
  const cleanup = async (paths: string[]) => { if (paths.length) await createAdminClient().storage.from("community-media").remove(paths); };
  const paths = input.files.map((f) => f.path);

  if (!(await allow("post", user.id, 10, 3600))) { await cleanup(paths); return { error: "You're posting quickly. Try again in a little while." }; }
  const parsed = postSchema.safeParse({ categoryId: input.categoryId, body: input.body });
  if (!parsed.success || input.files.length > MAX_FILES) { await cleanup(paths); return { error: parsed.success ? `Attach up to ${MAX_FILES} files.` : parsed.error.issues[0].message }; }

  const verified: { path: string; name: string; mime: string; size: number }[] = [];
  for (const f of input.files) {
    const v = await verifyUpload(f.path, user.id);
    if (!v) { await cleanup(paths); return { error: `"${f.name}" isn't a supported file. Use JPEG, PNG, WebP, GIF, PDF, MP4 or WebM under 50 MB.` }; }
    verified.push({ ...f, ...v });
  }

  const { data: post, error } = await supabase.from("posts").insert({ author_id: user.id, category_id: parsed.data.categoryId, body: parsed.data.body }).select("id").single();
  if (error || !post) { await cleanup(paths); return { error: "We couldn't publish that post. Check the category and try again." }; }
  if (verified.length) {
    const { error: mErr } = await supabase.from("post_media").insert(verified.map((v) => ({ post_id: post.id, storage_path: v.path, mime_type: v.mime, original_name: v.name.slice(0, 120), size_bytes: v.size })));
    if (mErr) { await supabase.from("posts").delete().eq("id", post.id); await cleanup(paths); return { error: "We couldn't attach your files. Please try again." }; }
  }
  redirect(`/community/post/${post.id}`);
}

export async function addComment(formData: FormData) {
  const { supabase, user } = await requireUser();
  const parsed = commentSchema.safeParse({ postId: formData.get("postId"), parentId: formData.get("parentId") || undefined, body: formData.get("body") });
  if (!parsed.success) return;
  const postId = parsed.data.postId;
  if (!(await allow("comment", user.id, 30, 3600))) redirect(`/community/post/${postId}?error=${encodeURIComponent("You're commenting quickly. Try again shortly.")}`);
  const { error } = await supabase.from("comments").insert({ post_id: postId, parent_id: parsed.data.parentId ?? null, author_id: user.id, body: parsed.data.body });
  if (error) redirect(`/community/post/${postId}?error=${encodeURIComponent("We couldn't post that comment.")}`);
  revalidatePath(`/community/post/${postId}`);
}

async function toggle(table: "reactions" | "saved_posts", formData: FormData) {
  const { supabase, user } = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(postId)) return;
  const { data: existing } = await supabase.from(table).select("post_id").eq("post_id", postId).eq("user_id", user.id).maybeSingle();
  if (existing) await supabase.from(table).delete().eq("post_id", postId).eq("user_id", user.id);
  else await supabase.from(table).insert({ post_id: postId, user_id: user.id });
  revalidatePath(`/community/post/${postId}`);
}
export const toggleReaction = async (f: FormData) => toggle("reactions", f);
export const toggleSave = async (f: FormData) => toggle("saved_posts", f);

export async function toggleFollow(formData: FormData) {
  const { supabase, user } = await requireUser();
  const target = String(formData.get("userId") ?? "");
  const postId = String(formData.get("postId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(target) || target === user.id) return;
  const { data: existing } = await supabase.from("follows").select("followee_id").eq("follower_id", user.id).eq("followee_id", target).maybeSingle();
  if (existing) await supabase.from("follows").delete().eq("follower_id", user.id).eq("followee_id", target);
  else await supabase.from("follows").insert({ follower_id: user.id, followee_id: target });
  revalidatePath(`/community/post/${postId}`);
}

export async function reportContent(formData: FormData) {
  const { supabase, user } = await requireUser();
  const postId = String(formData.get("postId") ?? "");
  const parsed = reportSchema.safeParse({ kind: formData.get("kind"), id: formData.get("id"), reason: formData.get("reason") });
  if (!parsed.success) redirect(`/community/post/${postId}?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  if (!(await allow("report", user.id, 10, 3600))) redirect(`/community/post/${postId}?error=${encodeURIComponent("Too many reports. Try again later.")}`);
  const d = parsed.data!;
  await supabase.from("reports").insert({ reporter_id: user.id, post_id: d.kind === "post" ? d.id : null, comment_id: d.kind === "comment" ? d.id : null, reason: d.reason });
  redirect(`/community/post/${postId}?notice=${encodeURIComponent("Thanks. A moderator will take a look.")}`);
}

export async function deletePost(formData: FormData) {
  const { supabase } = await requireUser();
  const id = String(formData.get("postId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const { data: media } = await supabase.from("post_media").select("storage_path").eq("post_id", id);
  const { error } = await supabase.from("posts").delete().eq("id", id); // RLS: author only
  if (!error && media?.length) await supabase.storage.from("community-media").remove(media.map((m: { storage_path: string }) => m.storage_path));
  redirect("/community");
}

export async function markAllRead() {
  const { supabase, user } = await requireUser();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
  revalidatePath("/community/notifications");
}
