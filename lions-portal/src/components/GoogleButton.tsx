"use client";
import { createBrowser } from "@/lib/supabase/browser";

export default function GoogleButton({ next }: { next: string }) {
  async function go() {
    const supabase = createBrowser();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
  }
  return (
    <button type="button" onClick={go} className="w-full rounded border border-lions-line px-4 py-3 font-semibold hover:bg-lions-mist">
      Continue with Google
    </button>
  );
}
