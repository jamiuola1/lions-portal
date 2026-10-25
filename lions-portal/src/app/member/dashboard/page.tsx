import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { NotConfigured } from "@/components/Field";
export const metadata: Metadata = { title: "My dashboard", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  active: "Active member", renewal_due: "Renewal due", past_due: "Payment past due", suspended: "Suspended",
  expired: "Expired", cancelled: "Cancelled", applicant: "Applicant", pending_approval: "Pending approval",
};

export default async function Dashboard({ searchParams }: { searchParams: { applied?: string } }) {
  if (!isSupabaseConfigured) return <div className="mx-auto max-w-3xl px-4 pt-12"><NotConfigured /></div>;
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/member/dashboard");

  const [{ data: profile }, { data: membership }, { data: application }] = await Promise.all([
    supabase.from("profiles").select("username, display_name, nickname, bio").eq("id", user.id).single(),
    supabase.from("memberships").select("member_number, status, joined_at, renews_on").eq("user_id", user.id).maybeSingle(),
    supabase.from("membership_applications").select("status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="text-3xl font-bold">Welcome, {profile?.display_name ?? "member"}</h1>
      {searchParams.applied && <p className="mt-4 rounded bg-lions-mist p-3 text-sm">Application sent. A club officer will review it.</p>}
      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="border-l-4 border-lions-gold bg-lions-mist p-4"><dt className="text-sm font-semibold">Username</dt><dd>{profile?.username}</dd></div>
        <div className="border-l-4 border-lions-gold bg-lions-mist p-4"><dt className="text-sm font-semibold">Member ID</dt><dd>{membership ? membership.member_number : "Not a club member yet"}</dd></div>
        <div className="border-l-4 border-lions-gold bg-lions-mist p-4"><dt className="text-sm font-semibold">Membership status</dt>
          <dd>{membership ? STATUS_LABEL[membership.status] ?? membership.status : application?.status === "submitted" ? "Application under review" : application?.status === "rejected" ? "Application not approved" : "Not a member"}</dd></div>
        <div className="border-l-4 border-lions-gold bg-lions-mist p-4"><dt className="text-sm font-semibold">Joined</dt><dd>{membership?.joined_at ?? "Not applicable"}</dd></div>
      </dl>
      {!membership && application?.status !== "submitted" && (
        <p className="mt-8"><Link href="/membership/apply" className="rounded bg-lions-blue px-5 py-3 font-semibold text-white">Apply for membership</Link></p>
      )}
      <p className="mt-8 text-sm"><Link href="/member/profile" className="font-semibold text-lions-blue underline">Edit your profile and picture</Link></p>
      <form action="/auth/signout" method="post" className="mt-10"><button className="text-sm underline">Log out</button></form>
    </div>
  );
}
