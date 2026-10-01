// Development-only page that checks whether the app can reach Supabase.
import { Card } from "@/components/ui/Card";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/env";

type CheckResult = { ok: true } | { ok: false; reason: string };

async function checkConnection(): Promise<CheckResult> {
  try {
    // The auth health endpoint answers 200 only when the URL and key are valid.
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      headers: { apikey: supabasePublishableKey },
      cache: "no-store",
    });
    if (response.ok) return { ok: true };
    if (response.status === 401) return { ok: false, reason: "The publishable key is not valid." };
    return { ok: false, reason: `Supabase answered with status ${response.status}.` };
  } catch {
    return { ok: false, reason: "Could not reach the Supabase URL. Is it spelled correctly?" };
  }
}

export default async function SupabaseCheckPage() {
  const result = await checkConnection();

  return (
    <main className="flex flex-1 flex-col justify-center py-8">
      <Card className="flex flex-col gap-2">
        <h1 className="text-lg font-bold">Supabase connection</h1>
        {result.ok ? (
          <p className="text-accent">Connected to {new URL(supabaseUrl).hostname}</p>
        ) : (
          <p className="text-danger">{result.reason}</p>
        )}
      </Card>
    </main>
  );
}
