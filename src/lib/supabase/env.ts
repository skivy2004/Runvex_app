// NEXT_PUBLIC_ variables must be written out literally (not via process.env[name])
// so Next.js can replace them with their values in the browser bundle.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !publishableKey) {
  throw new Error(
    "Missing Supabase environment variables. Copy .env.example to .env.local and fill in the values.",
  );
}

export const supabaseUrl = url;
export const supabasePublishableKey = publishableKey;
