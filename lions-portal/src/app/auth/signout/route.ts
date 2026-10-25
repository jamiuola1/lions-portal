import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST only, so a third-party page can't log someone out with an image tag.
export async function POST(request: NextRequest) {
  await createClient().auth.signOut();
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
