import type { Metadata } from "next";
import Link from "next/link";
import { Field, NotConfigured, Notice } from "@/components/Field";
import GoogleButton from "@/components/GoogleButton";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { register } from "./actions";
export const metadata: Metadata = { title: "Create an account", robots: { index: false } };

export default function Register({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="mx-auto max-w-md px-4 pt-12">
      <h1 className="text-3xl font-bold">Create an account</h1>
      <p className="mt-2 text-sm">An account lets you join the community. Club membership is a separate step and is approved by the club.</p>
      <div className="mt-6">
        {!isSupabaseConfigured ? <NotConfigured /> : (
          <>
            <Notice error={searchParams.error} />
            <GoogleButton next="/member/dashboard" />
            <p className="my-4 text-center text-sm">or sign up with email</p>
            <form action={register} className="space-y-4">
              <Field id="email" label="Email" type="email" autoComplete="email" />
              <Field id="username" label="Username" autoComplete="username" hint="3 to 30 letters, numbers or underscores." />
              <Field id="displayName" label="Display name" autoComplete="name" />
              <Field id="password" label="Password" type="password" autoComplete="new-password" hint="At least 10 characters." />
              <button className="w-full rounded bg-lions-blue px-4 py-3 font-semibold text-white">Create account</button>
            </form>
            <p className="mt-6 text-sm">Already have an account? <Link href="/login" className="font-semibold text-lions-blue underline">Log in</Link></p>
          </>
        )}
      </div>
    </div>
  );
}
