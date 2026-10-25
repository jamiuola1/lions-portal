"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { profileSchema } from "@/lib/validation";
import { AVATAR_TYPES, EXT, sniffFile } from "@/lib/files";

const back = (key: "error" | "saved", msg: string) => redirect(`/member/profile?${key}=${encodeURIComponent(msg)}`);

export async function updateProfile(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/member/profile");
  const parsed = profileSchema.safeParse({
    displayName: formData.get("displayName"), nickname: formData.get("nickname") ?? undefined,
    bio: formData.get("bio") ?? undefined, municipality: formData.get("municipality") ?? undefined,
  });
  if (!parsed.success) back("error", parsed.error.issues[0].message);
  const d = parsed.data!;
  const { error } = await supabase.from("profiles").update({
    display_name: d.displayName, nickname: d.nickname, bio: d.bio, municipality: d.municipality ?? null,
  }).eq("id", user.id);
  const { error: e2 } = await supabase.from("profile_private").update({
    directory_visible: formData.get("directoryVisible") === "on",
    email_visible_to_members: formData.get("emailVisible") === "on",
  }).eq("id", user.id);
  if (error || e2) back("error", "We couldn't save your profile. Please try again.");
  back("saved", "Profile saved.");
}

export async function uploadAvatar(formData: FormData) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/member/profile");
  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) back("error", "Choose an image first.");
  const f = file as File;
  if (f.size > 2 * 1024 * 1024) back("error", "Pictures must be under 2 MB.");
  const type = sniffFile(new Uint8Array(await f.slice(0, 32).arrayBuffer()));
  if (!type || !AVATAR_TYPES.includes(type)) back("error", "Use a JPEG, PNG or WebP picture.");
  const path = `${user.id}/${Date.now()}.${EXT[type!]}`;
  const { data: old } = await supabase.from("profiles").select("avatar_path").eq("id", user.id).single();
  const { error } = await supabase.storage.from("avatars").upload(path, f, { contentType: type!, upsert: false });
  if (error) back("error", "The upload failed. Please try again.");
  await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
  if (old?.avatar_path) await supabase.storage.from("avatars").remove([old.avatar_path]);
  back("saved", "Picture updated.");
}
