// Builds the Supabase email templates in the Runvex style (French Blue, Burnt Coral,
// Chalk). Run: node supabase/email-templates/build.mjs
// Then paste each .html file into Supabase → Authentication → Emails → Templates.
//
// Each email is in Dutch or English: Supabase fills {{ .Data.locale }} with the
// language chosen at sign-up (see signUp in src/app/(guest)/actions.ts).
// Emails use tables and inline styles, because mail apps ignore most modern CSS.

import { writeFileSync } from "node:fs";

const colors = {
  background: "#0f1420",
  card: "#182031",
  line: "#2e3850",
  text: "#ded9d3",
  muted: "#8c93a3",
  coral: "#ef6a45",
  blue: "#3e5889",
};
const font = "'Space Grotesk', 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** One language's content of an email. */
function content({ eyebrow, title, accent, text, button, link, note }) {
  return `
              <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:${colors.muted};">
                <span style="display:inline-block;width:20px;height:2px;background:${colors.coral};vertical-align:middle;margin-right:8px;"></span>${eyebrow}
              </p>
              <h1 style="margin:0 0 16px;font-size:32px;line-height:1.05;font-weight:700;letter-spacing:-0.5px;color:${colors.text};">
                ${title} <span style="color:${colors.coral};">${accent}</span>
              </h1>
              <p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:${colors.muted};">${text}</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="border-radius:16px;background:${colors.coral};">
                    <a href="${link}" style="display:block;padding:18px 24px;font-size:16px;font-weight:700;color:${colors.background};text-decoration:none;">
                      ${button} &nbsp;&rarr;
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:${colors.muted};">${note}</p>`;
}

function email({ nl, en, link }) {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="dark" />
    <meta name="supported-color-schemes" content="dark" />
    <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;700&display=swap" rel="stylesheet" />
  </head>
  <body style="margin:0;padding:0;background:${colors.background};">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${colors.background};background-image:linear-gradient(160deg, ${colors.blue}55 0%, ${colors.background} 45%, ${colors.background} 70%, ${colors.coral}33 100%);font-family:${font};">
      <tr>
        <td align="center" style="padding:40px 16px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:480px;border-collapse:separate;">
            <!-- Logo -->
            <tr>
              <td style="padding:0 4px 24px;">
                <img src="https://runvex.app/icon.png" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;border-radius:10px;border:0;" />
                <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;font-weight:700;letter-spacing:-0.3px;color:${colors.text};">RUN<span style="color:${colors.coral};">VEX</span></span>
              </td>
            </tr>
            <!-- Card -->
            <tr>
              <td style="background:${colors.card};border:1px solid ${colors.line};border-radius:28px;padding:32px 28px;">
{{ if eq .Data.locale "nl" }}${content({ ...nl, link })}
{{ else }}${content({ ...en, link })}
{{ end }}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="padding:24px 8px 0;font-size:12px;line-height:1.6;color:${colors.muted};">
                {{ if eq .Data.locale "nl" }}Train rustig. Race hard.{{ else }}Train easy. Race hard.{{ end }}<br />
                <a href="https://runvex.app" style="color:${colors.muted};text-decoration:underline;">runvex.app</a>
                &nbsp;·&nbsp;
                <a href="https://runvex.app/privacy" style="color:${colors.muted};text-decoration:underline;">{{ if eq .Data.locale "nl" }}Privacy{{ else }}Privacy{{ end }}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`;
}

const templates = {
  // Sign-up: the link works in any browser (token_hash), see src/app/auth/confirm/route.ts.
  "confirm-signup.html": email({
    link: "{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=email",
    nl: {
      eyebrow: "Welkom bij Runvex",
      title: "Bijna klaar om te",
      accent: "starten.",
      text: "Bevestig je e-mailadres en je AI-coach plant je trainingen rond jouw rooster.",
      button: "Bevestig mijn e-mail",
      note: "Heb je geen account gemaakt bij Runvex? Dan kun je deze mail negeren.",
    },
    en: {
      eyebrow: "Welcome to Runvex",
      title: "Almost ready to",
      accent: "start.",
      text: "Confirm your email address and your AI coach will plan your training around your schedule.",
      button: "Confirm my email",
      note: "Didn't create a Runvex account? You can ignore this email.",
    },
  }),
  // Forgot password: back to where it was asked (localhost or runvex.app), see requestPasswordReset.
  "reset-password.html": email({
    link: "{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery",
    nl: {
      eyebrow: "Wachtwoord vergeten",
      title: "Kies een nieuw",
      accent: "wachtwoord.",
      text: "Klik op de knop om een nieuw wachtwoord te kiezen. De link werkt één keer en is maar kort geldig.",
      button: "Kies een nieuw wachtwoord",
      note: "Heb je dit niet aangevraagd? Dan kun je deze mail negeren; je wachtwoord blijft hetzelfde.",
    },
    en: {
      eyebrow: "Forgot password",
      title: "Choose a new",
      accent: "password.",
      text: "Tap the button to choose a new password. The link works once and is only valid for a short time.",
      button: "Choose a new password",
      note: "Didn't ask for this? You can ignore this email; your password stays the same.",
    },
  }),
};

for (const [name, html] of Object.entries(templates)) {
  writeFileSync(new URL(name, import.meta.url), html);
}
console.log("Written:", Object.keys(templates).join(", "));
