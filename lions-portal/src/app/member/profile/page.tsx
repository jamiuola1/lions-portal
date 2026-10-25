import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { avatarUrl } from "@/lib/avatar";
import { MUNICIPALITIES } from "@/lib/validation";
import { Notice } from "@/components/Field";
import { updateProfile, uploadAvatar } from "./actions";
export const metadata: Metadata = { title: "My profile", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const input = "mt-1 w-full rounded border border-lions-line px-3 py-3 text-base";

export default async function Profile({ searchParams }: { searchParams: { error?: string; saved?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/member/profile");
  const [{ data: p }, { data: priv }] = await Promise.all([
    supabase.from("profiles").select("display_name, nickname, bio, municipality, avatar_path, username").eq("id", user.id).single(),
    supabase.from("profile_private").select("directory_visible, email_visible_to_members").eq("id", user.id).single(),
  ]);
  const pic = avatarUrl(p?.avatar_path);
  return (
    <div className="mx-auto max-w-xl px-4 pt-12">
      <h1 className="text-3xl font-bold">My profile</h1>
      <Notice error={searchParams.error} />
      {searchParams.saved && <p role="status" className="mt-4 rounded bg-lions-mist p-3 text-sm">{searchParams.saved}</p>}

      <form action={uploadAvatar} className="mt-8 flex items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {pic ? <img src={pic} alt="Your profile picture" width={72} height={72} className="h-[72px] w-[72px] rounded-full object-cover" /> : <div aria-hidden className="grid h-[72px] w-[72px] place-items-center rounded-full bg-lions-mist font-bold">{p?.display_name?.[0]}</div>}
        <div>
          <label htmlFor="avatar" className="block text-sm font-semibold">Profile picture</label>
          <input id="avatar" name="avatar" type="file" accept="image/jpeg,image/png,image/webp" className="mt-1 block text-sm" />
          <button className="mt-2 rounded border border-lions-line px-3 py-2 text-sm font-semibold">Upload picture</button>
        </div>
      </form>

      <form action={updateProfile} className="mt-8 space-y-4">
        <div><label htmlFor="displayName" className="block text-sm font-semibold">Display name</label><input id="displayName" name="displayName" required maxLength={60} defaultValue={p?.display_name} className={input} /></div>
        <div><label htmlFor="nickname" className="block text-sm font-semibold">Nickname (optional)</label><input id="nickname" name="nickname" maxLength={30} defaultValue={p?.nickname ?? ""} className={input} /></div>
        <div><label htmlFor="bio" className="block text-sm font-semibold">About you</label><textarea id="bio" name="bio" rows={4} maxLength={500} defaultValue={p?.bio ?? ""} className={input} /></div>
        <div><label htmlFor="municipality" className="block text-sm font-semibold">Where in Durham Region? (optional)</label>
          <select id="municipality" name="municipality" defaultValue={p?.municipality ?? ""} className={input}>
            <option value="">Prefer not to say</option>{MUNICIPALITIES.map((m) => <option key={m}>{m}</option>)}
          </select></div>
        <fieldset className="space-y-2"><legend className="text-sm font-semibold">Privacy</legend>
          <label className="flex gap-2 text-sm"><input type="checkbox" name="directoryVisible" defaultChecked={priv?.directory_visible} /> Show me in the member directory</label>
          <label className="flex gap-2 text-sm"><input type="checkbox" name="emailVisible" defaultChecked={priv?.email_visible_to_members} /> Let other members see my email</label>
        </fieldset>
        <p className="text-sm">Username: @{p?.username}</p>
        <button className="rounded bg-lions-blue px-5 py-3 font-semibold text-white">Save profile</button>
      </form>
    </div>
  );
}
