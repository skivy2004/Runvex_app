import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Pages only for logged-out visitors. Logged-in users are sent home.
const GUEST_ONLY_PATHS = ["/login", "/register", "/forgot-password"];
// Pages anyone may open (robots and sitemap are for search engines).
const PUBLIC_PATHS = ["/auth/confirm", "/privacy", "/robots.txt", "/sitemap.xml"];
// Pages of the app itself: logged out, these send you to the login page.
const APP_PATHS = ["/add", "/coach", "/goal", "/profile", "/week", "/admin", "/intake", "/onboarding", "/print"];
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
  // "/" is the landing page for visitors and Home for logged-in users ((app)/page.tsx).
  if (pathname === "/") return response;

  if (matches(pathname, GUEST_ONLY_PATHS)) {
    return isLoggedIn ? redirectTo("/", request, response) : response;
  }

  if (isLoggedIn) return response;
  if (matches(pathname, APP_PATHS)) return redirectTo("/login", request, response);

  // Any other address doesn't exist for visitors, e.g. pages of the old website
  // that Google still remembers. A real 404 (instead of a redirect to the login
  // page) tells search engines to drop them. Also a page missing from APP_PATHS
  // ends up here, so a forgotten page is never shown to someone logged out.
  return notFound(request, response);
}

/** Shows the 404 page, keeping any refreshed session cookies. */
function notFound(request: NextRequest, response: NextResponse) {
  // This path never exists, so Next.js renders its not-found page with status 404.
  const rewrite = NextResponse.rewrite(new URL("/_page-not-found", request.url));
  response.cookies.getAll().forEach((cookie) => rewrite.cookies.set(cookie));
  return rewrite;
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
  // Skip static files, images and the app manifest so they always load, also
  // when logged out (the phone fetches the manifest without your login).
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
