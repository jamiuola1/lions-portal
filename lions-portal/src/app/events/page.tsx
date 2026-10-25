import type { Metadata } from "next";
import { club } from "@/content/site";
export const metadata: Metadata = { title: "Events" };

export default function Events() {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="text-4xl font-bold">Events</h1>
      <p className="mt-6">Regular meetings: {club.meetings.schedule}. {club.meetings.third}.</p>
      <p className="mt-4 text-sm">The full events calendar arrives with the admin panel.</p>
    </article>
  );
}
