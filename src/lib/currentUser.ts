import { cache } from "react";
import { getCurrentProfile } from "@/services/profile";
import { createClient } from "./supabase/server";

// While rendering one page, the layout and the page both need the Supabase client
// and the profile. React's cache() makes them share one per request instead of
// asking the database twice. The cache is per request, so users never share it.

/** The Supabase client for this request (Server Components only). */
export const getRequestClient = cache(createClient);

/** The logged-in user's profile for this request, or null. */
export const getRequestProfile = cache(async () => getCurrentProfile(await getRequestClient()));
