import { redirect } from "next/navigation";

/**
 * Registration is closed while Runvex has a waitlist (the database refuses new
 * accounts too, see supabase/migrations/20261009120000_waitlist.sql). Anyone who
 * lands here goes to the waitlist on the landing page instead.
 */
export default function RegisterPage() {
  redirect("/#waitlist");
}
