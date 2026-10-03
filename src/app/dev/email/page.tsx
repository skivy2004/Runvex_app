import { readFile } from "node:fs/promises";
import path from "node:path";

// Preview of the Supabase email templates (development only). ?name=reset-password&lang=en
export default async function DevEmailPage({ searchParams }: PageProps<"/dev/email">) {
  const { name, lang } = await searchParams;
  const file = name === "reset-password" ? "reset-password.html" : "confirm-signup.html";
  const template = await readFile(path.join(process.cwd(), "supabase/email-templates", file), "utf8");
  // Keep one language and fill the Supabase placeholders with a dummy link.
  const oneLanguage =
    lang === "en"
      ? template.replace(/\{\{ if [^}]*\}\}[\s\S]*?\{\{ else \}\}/g, "").replace(/\{\{ end \}\}/g, "")
      : template.replace(/\{\{ else \}\}[\s\S]*?\{\{ end \}\}/g, "").replace(/\{\{ if [^}]*\}\}/g, "");
  // Only the body: the root layout already provides the page around it.
  const body = oneLanguage
    .replace(/\{\{ [^}]*\}\}/g, "#")
    .replace(/^[\s\S]*<body[^>]*>/, "")
    .replace(/<\/body>[\s\S]*$/, "");
  return <div className="-mx-4" dangerouslySetInnerHTML={{ __html: body }} />;
}
