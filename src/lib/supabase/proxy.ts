import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublishableKey, supabaseUrl } from "./env";

/**
 * Refreshes the Supabase session (if needed) and reports whether the visitor
 * is logged in. Refreshed session cookies are written to the returned response.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // Update the request so pages rendered after this see the new session...
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        // ...and the response so the browser stores it.
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
        // Prevents caches from serving one user's session to another user.
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // getClaims() verifies the login token's signature, so it can't be faked.
  // Don't run other code between createServerClient and this call.
  const { data } = await supabase.auth.getClaims();

  return { response, isLoggedIn: Boolean(data?.claims) };
}
