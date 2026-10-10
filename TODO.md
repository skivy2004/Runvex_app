# Runvex – TODO

Things we decided to do later. Move an item to "Done" (with the date) when it's finished.

## Features
- [ ] **Watch sync for every user:** now one intervals.icu account via .env (development). Next: request an intervals.icu OAuth app (email david@intervals.icu: app name, description, website, logo, privacy policy URL, redirect URIs), then "Connect intervals.icu" in Profile with tokens stored per user. Garmin closed our direct Training API request (2026-10-02); Terra (from ~$399/month) is an option once there are paying users.
- [ ] **Swim blocks, next steps:** test with friends, then tune block distances. Per-block swap ("other technique block") is now part of Swap; a dedicated per-section picker could come later. The old swim library (data/swimming.json) is only kept so already planned swims still open; remove it once those are in the past.
- [ ] **Strength workouts:** add a strength training library (for now strength trainings are filled in freely: title and duration).
- [ ] **Emails in two languages:** let the Supabase email templates pick Dutch or English based on `{{ .Data.locale }}`.
- [ ] **Validate sports per day on the server:** check that the sports chosen per day are among the user's own sports.
- [ ] **Remove the old ai_requests table:** replaced by ai_usage (cost per call, weekly budget). Drop it with a migration once the new coach is live.
- [ ] **Delete old AI usage rows:** ai_usage only needs the current week for the budget; keep e.g. 3 months for cost insight, then delete (data minimisation).

- [ ] **Landing page redesign (now feels like "AI slop"):** the current page (src/components/landing/) mixes eight Dribbble references and uses the standard AI template: hero, marquee, problem, "01 02 03", bento, privacy, pricing, FAQ, CTA. Same glass card, eyebrow and glow everywhere; a mock phone with a made-up "Sanne"; slogan-style copy. Fix:
  1. **Pick one direction**, not a mix: e.g. editorial and strict (big type, lots of black, coral only for the button, no glass) or raw and sporty (real photos, hard contrast).
  2. **Use real things:** a screenshot of Jeremy's own week with his real shifts, a photo of a printed swim card on his water bottle, a photo after a shift. Rough phone photos are fine.
  3. **Cut half:** hero with one real week, how it works in three sentences, the beta counter (real and unique), a short FAQ.
  4. **Own words:** a few sentences from Jeremy on why he builds Runvex instead of taglines.
  5. **Design the hero first in Figma** (Jeremy), then build it exactly and carry the style through. Optional: a critique first with the `emil-design-eng` skill.
  - Open questions for Jeremy: why he builds Runvex (does he work shifts himself?), which 2-3 photos he can take, Figma hero or one Dribbble reference to follow.
  - Hero photo chosen: Unsplash ["Man running fast at night with motion blur"](https://unsplash.com/photos/man-running-fast-at-night-with-motion-blur-DDoyi1dxAgg) (free license, ~610 KB jpg → ~200 KB webp as public/landing-hero.webp). Not downloaded yet: ask before downloading.
  - Keep: the beta limit (DB trigger + beta_spots_left, live) and routing (landing on "/" for visitors). Spec: docs/landing-page-prompt.md.

## Before launch
- [ ] **Leaked password protection:** turn on in Supabase (Authentication → Attack Protection), may need a paid plan.
- [ ] **Data processing agreements (DPA / verwerkersovereenkomst):** accept them at Supabase, Vercel, Resend, Anthropic and intervals.icu (Claude API: week plans get sports, levels, availability and goal, no name/e-mail/birth date).
- [ ] **Privacy statement:** page is live at /privacy (src/content/privacy.ts). Name, city and email are filled in; AI-coach chat/feedback and the waitlist (source, promo code, news consent) are described (2026-10-10). Still to do: add the KvK number after 21 Oct, have it checked, and update it whenever the app stores or shares something new.
- [ ] **Vercel env:** make sure `INTERVALS_API_KEY` / `INTERVALS_ATHLETE_ID` are NOT set in production (otherwise every user sends their week to Jeremy's own intervals.icu account). Then remove intervals.icu from the privacy statement's processor list.
- [ ] **Before the first newsletter:** move people with `news_consent_at` to Resend Audiences (unsubscribe link built in), consider double opt-in (a confirm mail), and delete waitlist addresses without news consent after launch.
- [ ] **Remove development pages:** `/styleguide` and everything under `/dev`.
- [ ] **Production URLs:** set Site URL and Redirect URLs in Supabase to the real domain (replace `localhost`).
- [ ] **Domain runvex.app:** turn on auto-renew in Vercel (expires around March 2027).
- [ ] **Claude API key in Vercel:** add ANTHROPIC_API_KEY as a (sensitive) environment variable in the Vercel project, and set a monthly spend limit in the Anthropic Console.
- [ ] **Trademark check:** check the name "Runvex" in the trademark register (BOIP).

## Done
- [x] Check off trainings (done/skipped, RPE 1-10, note), print card for swims, "Delete my account" in Profile; privacy statement updated (2026-10-03)
- [x] Custom SMTP via Resend on runvex.app, with a confirmation link that works in any browser (2026-10-01)
