import type { Metadata } from "next";
import Link from "next/link";
import { club } from "@/content/site";
export const metadata: Metadata = { title: "About us" };

export default function About() {
  return (
    <article className="mx-auto max-w-3xl px-4 pt-12">
      <h1 className="text-4xl font-bold">About us</h1>
      <p className="mt-6">Lions are service-minded people who want to improve their communities. The {club.name} is one of about 46,000 clubs chartered under Lions Clubs International, a volunteer organization with roughly 1.4 million members.</p>
      <h2 className="mt-10 text-2xl font-bold">What we do</h2>
      <p className="mt-3">Locally, we plan year-round events that entertain people in our community and raise money. All profits go to local charities that don&rsquo;t receive government funding. Our Lions year runs from July 1 to June 30.</p>
      <h2 className="mt-10 text-2xl font-bold">Meetings</h2>
      <p className="mt-3">{club.meetings.schedule}. {club.meetings.third}. {club.meetings.first}.</p>
      <p className="mt-10"><Link href="/about/leadership" className="font-semibold text-lions-blue underline">Meet the club executive</Link></p>
    </article>
  );
}
