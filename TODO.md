# Runvex – TODO

Things we decided to do later. Move an item to "Done" (with the date) when it's finished.

## Features
- [ ] **Strength workouts:** add a strength training library (for now strength trainings are filled in freely: title and duration).
- [ ] **Emails in two languages:** let the Supabase email templates pick Dutch or English based on `{{ .Data.locale }}`.
- [ ] **Validate sports per day on the server:** check that the sports chosen per day are among the user's own sports.
- [ ] **Delete AI request log rows after 30 days:** ai_requests only needs the last 24 hours (data minimisation).

## Before launch
- [ ] **Leaked password protection:** turn on in Supabase (Authentication → Attack Protection), may need a paid plan.
- [ ] **Data processing agreements (DPA / verwerkersovereenkomst):** accept them at Supabase, Vercel, Resend and Anthropic (Claude API: week plans get sports, levels, availability and goal, no name/e-mail/birth date).
- [ ] **Privacy statement:** explain which data we store and why (e.g. date of birth for age-based training advice).
- [ ] **Remove development pages:** `/styleguide` and everything under `/dev`.
- [ ] **Production URLs:** set Site URL and Redirect URLs in Supabase to the real domain (replace `localhost`).
- [ ] **Domain runvex.app:** turn on auto-renew in Vercel (expires around March 2027).
- [ ] **Claude API key in Vercel:** add ANTHROPIC_API_KEY as a (sensitive) environment variable in the Vercel project, and set a monthly spend limit in the Anthropic Console.
- [ ] **Trademark check:** check the name "Runvex" in the trademark register (BOIP).

## Done
- [x] Custom SMTP via Resend on runvex.app, with a confirmation link that works in any browser (2026-10-01)
