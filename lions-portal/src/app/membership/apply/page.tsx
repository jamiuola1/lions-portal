import type { Metadata } from "next";
import { Notice } from "@/components/Field";
import { submitApplication } from "./actions";
export const metadata: Metadata = { title: "Apply for membership", robots: { index: false } };

export default function Apply({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="mx-auto max-w-lg px-4 pt-12">
      <h1 className="text-3xl font-bold">Apply for membership</h1>
      <p className="mt-2 text-sm">A club officer reviews every application. You will see the decision on your dashboard.</p>
      <form action={submitApplication} className="mt-6 space-y-4">
        <Notice error={searchParams.error} />
        <label htmlFor="message" className="block text-sm font-semibold">Anything you&rsquo;d like the club to know (optional)</label>
        <textarea id="message" name="message" rows={5} maxLength={1000} className="w-full rounded border border-lions-line px-3 py-3" />
        <button className="rounded bg-lions-blue px-5 py-3 font-semibold text-white">Send application</button>
      </form>
    </div>
  );
}
