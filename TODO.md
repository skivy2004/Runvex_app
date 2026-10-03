# Runvex – TODO

Things we decided to do later. Move an item to "Done" (with the date) when it's finished.

## Features
- [ ] **Watch sync for every user:** now one intervals.icu account via .env (development). Next: request an intervals.icu OAuth app (email david@intervals.icu: app name, description, website, logo, privacy policy URL, redirect URIs), then "Connect intervals.icu" in Profile with tokens stored per user. Garmin closed our direct Training API request (2026-10-02); Terra (from ~$399/month) is an option once there are paying users.
- [ ] **Swim blocks, next steps:** test with friends, then tune block distances. Per-block swap ("other technique block") is now part of Swap; a dedicated per-section picker could come later. The old swim library (data/swimming.json) is only kept so already planned swims still open; remove it once those are in the past.
- [ ] **Strength workouts:** add a strength training library (for now strength trainings are filled in freely: title and duration).
- [ ] **Emails in two languages:** let the Supabase email templates pick Dutch or English based on `{{ .Data.locale }}`.
- [ ] **Validate sports per day on the server:** check that the sports chosen per day are among the user's own sports.
- [ ] **Delete AI request log rows after 30 days:** ai_requests only needs the last 24 hours (data minimisation).

## Before launch
- [ ] **Leaked password protection:** turn on in Supabase (Authentication → Attack Protection), may need a paid plan.
- [ ] **Data processing agreements (DPA / verwerkersovereenkomst):** accept them at Supabase, Vercel, Resend, Anthropic and intervals.icu (Claude API: week plans get sports, levels, availability and goal, no name/e-mail/birth date).
- [ ] **Privacy statement:** page is live at /privacy (src/content/privacy.ts). Still to do: fill in name, city and email in PRIVACY_CONTACT, have it checked, and update it whenever the app stores or shares something new.
- [ ] **Remove development pages:** `/styleguide` and everything under `/dev`.
- [ ] **Production URLs:** set Site URL and Redirect URLs in Supabase to the real domain (replace `localhost`).
- [ ] **Domain runvex.app:** turn on auto-renew in Vercel (expires around March 2027).
- [ ] **Claude API key in Vercel:** add ANTHROPIC_API_KEY as a (sensitive) environment variable in the Vercel project, and set a monthly spend limit in the Anthropic Console.
- [ ] **Trademark check:** check the name "Runvex" in the trademark register (BOIP).

## Done
- [x] Check off trainings (done/skipped, RPE 1-10, note), print card for swims, "Delete my account" in Profile; privacy statement updated (2026-10-03)
- [x] Custom SMTP via Resend on runvex.app, with a confirmation link that works in any browser (2026-10-01)
