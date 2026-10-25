import type { Metadata } from "next";
export const metadata: Metadata = { title: "Donate" };

export default function Donate() {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="text-4xl font-bold">Donate</h1>
      <p className="mt-6">Online donations are not open yet. They will launch after the club connects its payment account and confirms how it issues receipts.</p>
    </article>
  );
}
