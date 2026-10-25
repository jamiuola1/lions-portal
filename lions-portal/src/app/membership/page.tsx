import type { Metadata } from "next";
import Link from "next/link";
import { club } from "@/content/site";
export const metadata: Metadata = { title: "Membership" };

export default function Membership() {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="text-4xl font-bold">Become a member</h1>
      <p className="mt-6">We are always looking for new volunteers. Come to a meeting and see what we do: {club.meetings.schedule.toLowerCase()}.</p>
      <p className="mt-4">Membership is approved by the club. Creating an account or paying online does not make someone a member on its own.</p>
      <h2 className="mt-10 text-2xl font-bold">Dues</h2>
      <p className="mt-3">Dues amounts are not published yet. The club will confirm them before online payment opens.</p>
      <h2 className="mt-10 text-2xl font-bold">Apply</h2>
      <p className="mt-3"><Link href="/membership/apply" className="font-semibold text-lions-blue underline">Apply online</Link> (you will be asked to log in or create an account first), or write to {club.email}.</p>
    </article>
  );
}
