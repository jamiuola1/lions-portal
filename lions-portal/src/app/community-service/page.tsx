import type { Metadata } from "next";
import { causes, localSupport, lionsPrograms } from "@/content/site";
export const metadata: Metadata = { title: "Community service" };

export default function Service() {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="text-4xl font-bold">Community service</h1>
      <p className="mt-6">We raise money through community events. All of it goes back to non-government-funded charities and not-for-profits. We also help families and individuals who need support, and give to school events, community groups and seniors.</p>
      <h2 className="mt-10 text-2xl font-bold">Local causes</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6">{causes.map((c) => <li key={c.title}><strong>{c.title}.</strong> {c.text}</li>)}</ul>
      <h2 className="mt-10 text-2xl font-bold">Organizations we support</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6">{localSupport.map((s) => <li key={s}>{s}</li>)}</ul>
      <p className="mt-6">Each Christmas we also sponsor a local family through Simcoe Hall Settlement House, covering winter clothing, school supplies, toys and groceries for a holiday dinner.</p>
      <h2 className="mt-10 text-2xl font-bold">Lions programs we back</h2>
      <ul className="mt-4 list-disc space-y-2 pl-6">{lionsPrograms.map((s) => <li key={s}>{s}</li>)}</ul>
      <h2 id="photos" className="mt-10 text-2xl font-bold">Photos</h2>
      <p className="mt-3">Event photos will appear here once the club confirms which images it owns and has permission to publish.</p>
    </article>
  );
}
