import type { Metadata } from "next";
import Link from "next/link";
import { Field, NotConfigured, Notice } from "@/components/Field";
import GoogleButton from "@/components/GoogleButton";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { safeNext } from "@/lib/validation";
import { signIn } from "./actions";
export const metadata: Metadata = { title: "Member login", robots: { index: false } };

export default function Login({ searchParams }: { searchParams: { error?: string; next?: string; notice?: string } }) {
  const next = safeNext(searchParams.next);
  return (
    <div className="mx-auto max-w-md px-4 pt-12">
      <h1 className="text-3xl font-bold">Member login</h1>
      {searchParams.notice && <p className="mt-4 rounded bg-lions-mist p-3 text-sm">{searchParams.notice}</p>}
      <div className="mt-6">
        {!isSupabaseConfigured ? <NotConfigured /> : (
          <>
            <Notice error={searchParams.error} />
            <GoogleButton next={next} />
            <p className="my-4 text-center text-sm">or use your email or username</p>
            <form action={signIn} className="space-y-4">
              <input type="hidden" name="next" value={next} />
              <Field id="identifier" label="Email or username" autoComplete="username" />
              <Field id="password" label="Password" type="password" autoComplete="current-password" />
              <button className="w-full rounded bg-lions-blue px-4 py-3 font-semibold text-white">Log in</button>
            </form>
            <p className="mt-4 text-sm"><Link href="/forgot-password" className="underline">Forgot your password?</Link></p>
            <p className="mt-2 text-sm">New here? <Link href="/register" className="font-semibold text-lions-blue underline">Create an account</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
