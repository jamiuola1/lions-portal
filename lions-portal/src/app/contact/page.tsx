import type { Metadata } from "next";
import { club } from "@/content/site";
export const metadata: Metadata = { title: "Contact us" };

export default function Contact() {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="text-4xl font-bold">Contact us</h1>
      <p className="mt-6">Email: {club.email}</p>
      <p className="mt-4">We meet on the {club.meetings.schedule.toLowerCase()}. {club.meetings.third}.</p>
      <p className="mt-4 text-sm">An online contact form with spam protection is planned for the next phase.</p>
    </article>
  );
}
