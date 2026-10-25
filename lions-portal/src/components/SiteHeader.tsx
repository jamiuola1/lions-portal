import Link from "next/link";
import { club, nav } from "@/content/site";

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-lions-line bg-white/95 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-white focus:p-2">Skip to content</a>
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="font-serif text-lg font-bold text-lions-blue">{club.name}</Link>
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm font-medium hover:text-lions-blue">{n.label}</Link>
          ))}
          <Link href="/login" className="text-sm font-medium hover:text-lions-blue">Member login</Link>
          <Link href="/donate" className="rounded bg-lions-gold px-4 py-2 text-sm font-semibold text-lions-navy hover:brightness-95">Donate</Link>
        </nav>
        <details className="relative md:hidden">
          <summary className="cursor-pointer list-none rounded border border-lions-line px-3 py-2 text-sm font-medium">Menu</summary>
          <nav aria-label="Mobile" className="absolute right-0 mt-2 w-56 rounded border border-lions-line bg-white p-2 shadow-lg">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="block rounded px-3 py-3 text-base hover:bg-lions-mist">{n.label}</Link>
            ))}
            <Link href="/login" className="block rounded px-3 py-3 text-base hover:bg-lions-mist">Member login</Link>
            <Link href="/donate" className="mt-1 block rounded bg-lions-gold px-3 py-3 text-center font-semibold">Donate</Link>
          </nav>
        </details>
      </div>
    </header>
  );
}
