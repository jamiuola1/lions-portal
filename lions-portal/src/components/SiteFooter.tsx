import { club } from "@/content/site";

export default function SiteFooter() {
  return (
    <footer className="mt-20 bg-lions-navy text-white">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="font-serif text-lg font-bold">{club.name}</p>
          <p className="mt-2 text-sm text-white/80">Oshawa, Ontario &middot; {club.district}</p>
          <p className="mt-1 text-sm text-white/80">Part of Lions Clubs International.</p>
        </div>
        <div className="text-sm text-white/80">
          <p className="font-semibold text-white">Meetings</p>
          <p className="mt-2">{club.meetings.schedule}</p>
          <p>{club.meetings.third}</p>
          <p>{club.meetings.first}</p>
        </div>
        <div className="text-sm text-white/80">
          <p className="font-semibold text-white">Contact</p>
          <p className="mt-2 break-all">{club.email}</p>
        </div>
      </div>
      <p className="border-t border-white/15 px-4 py-4 text-center text-xs text-white/70">
        Privacy, terms and accessibility pages are drafted for the club to review before launch.
      </p>
    </footer>
  );
}
