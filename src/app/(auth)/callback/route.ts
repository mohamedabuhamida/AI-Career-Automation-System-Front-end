import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const redirect = requestUrl.searchParams.get("redirect") || "/dashboard";

  if (code) {
    const cookieStore = await cookies();
    const supabase = await createClient();

    // Exchange code for session
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (session?.provider_token) {
      // Convert cookies to string manually
      const cookieHeader = cookieStore
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join("; ");

      await fetch(`${requestUrl.origin}/api/auth/google/tokens`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeader,
        },
        body: JSON.stringify({
          access_token: session.provider_token,
          refresh_token: session.provider_refresh_token,
          expires_at: new Date(
            Date.now() + (session.expires_in || 3600) * 1000,
          ).toISOString(),
        }),
      });
    }
  }

  return NextResponse.redirect(new URL(redirect, request.url));
}
