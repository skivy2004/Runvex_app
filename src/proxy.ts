import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Pages only for logged-out visitors. Logged-in users are sent home.
const GUEST_ONLY_PATHS = ["/login", "/register"];
// Pages anyone may open.
const PUBLIC_PATHS = ["/auth/confirm"];
// Preview pages, only reachable while developing.
const DEV_PATHS = ["/styleguide", "/dev"];

function matches(pathname: string, paths: string[]) {
  return paths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

// Runs before every page request (see `config` below).
export async function proxy(request: NextRequest) {
  const { response, isLoggedIn } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const isDevPath = process.env.NODE_ENV === "development" && matches(pathname, DEV_PATHS);
  if (isDevPath || matches(pathname, PUBLIC_PATHS)) return response;

  if (matches(pathname, GUEST_ONLY_PATHS)) {
    return isLoggedIn ? redirectTo("/", request, response) : response;
  }

  return isLoggedIn ? response : redirectTo("/login", request, response);
}

/** Redirects while keeping any refreshed session cookies. */
function redirectTo(pathname: string, request: NextRequest, response: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";

  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}

export const config = {
  // Skip static files and images so they always load.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
