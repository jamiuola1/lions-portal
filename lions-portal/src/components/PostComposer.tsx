"use client";
import { useState, useTransition } from "react";
import { createBrowser } from "@/lib/supabase/browser";
import { createPost } from "@/app/community/actions";
import { MAX_FILES, MAX_FILE_BYTES, safeFileName } from "@/lib/community";

type Cat = { id: number; name: string };

export default function PostComposer({ categories, userId }: { categories: Cat[]; userId: string }) {
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const files = (data.getAll("files") as File[]).filter((f) => f.size > 0);
    if (files.length > MAX_FILES) return setError(`Attach up to ${MAX_FILES} files.`);
    if (files.some((f) => f.size > MAX_FILE_BYTES)) return setError("Each file must be under 50 MB.");
    setError("");
    start(async () => {
      const supabase = createBrowser();
      const uploaded: { path: string; name: string }[] = [];
      for (const f of files) {
        const path = `${userId}/${crypto.randomUUID()}-${safeFileName(f.name)}`;
        const { error: upErr } = await supabase.storage.from("community-media").upload(path, f, { upsert: false });
        if (upErr) { setError(`"${f.name}" didn't upload. Check the file type and size.`); return; }
        uploaded.push({ path, name: f.name });
      }
      const res = await createPost({ categoryId: Number(data.get("categoryId")), body: String(data.get("body") ?? ""), files: uploaded });
      if (res?.error) setError(res.error); // on success the server redirects to the new post
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 border border-lions-line p-4">
      <h2 className="text-xl font-bold">Start a conversation</h2>
      {error && <p role="alert" className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-900">{error}</p>}
      <div>
        <label htmlFor="categoryId" className="block text-sm font-semibold">Category</label>
        <select id="categoryId" name="categoryId" required className="mt-1 w-full rounded border border-lions-line px-3 py-3">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <label htmlFor="body" className="block text-sm font-semibold">What would you like to share?</label>
        <textarea id="body" name="body" required rows={4} maxLength={5000} className="mt-1 w-full rounded border border-lions-line px-3 py-3" />
      </div>
      <div>
        <label htmlFor="files" className="block text-sm font-semibold">Photos, documents or video (optional)</label>
        <input id="files" name="files" type="file" multiple accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,video/mp4,video/webm" className="mt-1 block text-sm" />
        <p className="mt-1 text-xs">Up to {MAX_FILES} files, 50 MB each. JPEG, PNG, WebP, GIF, PDF, MP4 or WebM.</p>
      </div>
      <button disabled={pending} className="rounded bg-lions-blue px-5 py-3 font-semibold text-white disabled:opacity-60">{pending ? "Posting..." : "Post"}</button>
    </form>
  );
}
