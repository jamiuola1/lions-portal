import Link from "next/link";
import { causes, club, signatureEvents } from "@/content/site";

export default function Home() {
  return (
    <>
      <section className="bg-lions-blue text-white">
        <div className="mx-auto max-w-5xl px-4 py-16 md:py-24">
          <p className="font-serif text-6xl font-bold leading-none md:text-8xl">{club.motto}.</p>
          <p className="mt-6 max-w-xl text-lg text-white/90">
            We are volunteers in Oshawa who run community events and give the money back to local charities.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/donate" className="rounded bg-lions-gold px-6 py-3 font-semibold text-lions-navy">Donate</Link>
            <Link href="/membership" className="rounded border border-white px-6 py-3 font-semibold">Become a member</Link>
          </div>
        </div>
        <div className="runway" aria-hidden="true" />
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-16">
        <h2 className="text-3xl font-bold">Where the money goes</h2>
        <p className="mt-3 max-w-2xl">Every dollar the club raises goes back to non-government-funded charities and not-for-profits in our community.</p>
        <ul className="mt-8 grid gap-4 md:grid-cols-2">
          {causes.map((c) => (
            <li key={c.title} className="border-l-4 border-lions-gold bg-lions-mist p-4">
              <h3 className="text-lg font-bold">{c.title}</h3>
              <p className="mt-1 text-sm">{c.text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-5xl px-4 pt-16">
        <h2 className="text-3xl font-bold">Our yearly events</h2>
        <ul className="mt-6 space-y-4">
          {signatureEvents.map((e) => (
            <li key={e.title}>
              <h3 className="text-lg font-bold">{e.title}</h3>
              <p className="text-sm">{e.note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm">We meet on the {club.meetings.schedule.toLowerCase()}. Visitors are welcome.</p>
      </section>
    </>
  );
}
