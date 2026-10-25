import type { Metadata } from "next";
import { club, officers } from "@/content/site";
export const metadata: Metadata = { title: "Club executive" };

export default function Leadership() {
  const showAll = process.env.SHOW_UNVERIFIED === "true";
  const list = officers.filter((o) => o.verified || showAll);
  return (
    <article className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="text-4xl font-bold">Club executive</h1>
      {list.length === 0 ? (
        <p className="mt-6">We are updating this list for the current Lions year. To reach the executive, write to {club.email}.</p>
      ) : (
        <>
          {showAll && <p className="mt-4 rounded bg-lions-gold/30 p-3 text-sm">Development view: these entries come from the club&rsquo;s 2023-2024 list and have not been confirmed.</p>}
          <dl className="mt-8 divide-y divide-lions-line">
            {list.map((o) => (
              <div key={o.role} className="flex justify-between gap-4 py-3">
                <dt className="font-semibold">{o.role}</dt>
                <dd>{o.name}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-6 text-sm">General enquiries: {club.email}</p>
        </>
      )}
    </article>
  );
}
