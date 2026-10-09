# Prompt: Runvex landing page

> Gebruik: geef deze hele tekst aan de AI die de landing page bouwt (of aan mij in een nieuwe sessie).
> Lees eerst de **open beslissingen** onderaan; die moet jij invullen.

---

## 1. Rol en doel

Je bent een senior product designer én frontend engineer. Bouw de publieke **landing page van Runvex** in de bestaande Next.js-app (`web/`). De pagina moet één ding doen: een bezoeker die Runvex niet kent binnen 10 seconden laten snappen **voor wie** dit is en **waarom het anders is**, en hem dan laten klikken op **"Start gratis"** (naar `/register`).

Het is géén generieke fitness-template. Het is een premium, donkere, sportieve pagina die voelt als hetzelfde product als de app: zelfde kleuren, zelfde glas-kaarten, zelfde lettertype, zelfde beweging.

## 2. Het product (alleen ware claims)

Runvex is een AI-trainingscoach voor amateur duursporters (hardlopen, fietsen, zwemmen, triatlon) met een **druk of wisselend werkrooster** (diensten, nachtdiensten, onregelmatige weken).

Wat de app écht kan (gebruik niets anders):

- **Coachteam**: een coach (hoofdcoach) die overlegt met een loop-, fiets- en zwemcoach. Je kunt met de coach chatten ("ik heb deze week 3 nachtdiensten").
- **Plan mijn week**: de coach plant je week rond je beschikbare tijd per dag en je doel. Hij stelt wijzigingen voor; jij tikt op *Toepassen*. Niets verandert zonder jou.
- **Trainingsblokken / seizoensopbouw**: vanaf je doel terugrekenen: basis → opbouw → piek → taper → wedstrijd. Blokken van 3 weken opbouw + 1 herstelweek (2+1 voor beginners). Volume groeit geleidelijk (eerste blok ±55%, piek 100%). Een **maximum aantal uren per week** passend bij doel en niveau. Je kunt zelf een week tot herstelweek maken (bijv. drukke werkweek).
- **Feedback na je training**: "Hoe ging het?" (RPE 1-10 + notitie) en de coach reageert en past zo nodig aan, maar checkt eerst of de training juist rustig bedoeld was.
- **Zwemtrainingen** opgebouwd uit techniekblokken met materiaal (pull buoy, paddles, vinnen, snorkel), voor 25 m of 50 m bad, en **uitprinten als kaartje voor op je bidon**.
- **Training uploaden**: .FIT-bestand van je horloge (bijv. uit Garmin Connect) → training wordt afgevinkt, je ziet tijd, afstand, tempo, vermogen. Hartslag alleen met toestemming.
- **Doelpagina** met tijdlijn van je hele seizoen; **countdown** naar je wedstrijd op Home.
- Werkt als app op je telefoon (PWA, "zet op beginscherm"), Nederlands en Engels.
- Privacy: database in de EU (Supabase eu-west-1), Row Level Security, de AI-coach (Anthropic, VS) krijgt een samenvatting zonder naam/e-mail/geboortedatum en nooit hartslag, account verwijderen in de app.

**Verboden** (eerlijkheid is een harde eis):
- Geen verzonnen aantallen gebruikers, sterren, reviews, "trusted by"-merklogo's (geen Nike/Garmin/Strava-logo's: merkrecht).
- Niet beweren dat Runvex "automatisch synct met Garmin". Wel: "upload je training in seconden; directe koppelingen komen eraan."
- Geen medische claims ("voorkomt blessures"). Wel: "bouwt rustig op", "plant herstel in".
- Testimonials alleen als echte quotes van echte gebruikers aangeleverd worden (zie open beslissingen). Tot die tijd: sectie weglaten.

## 3. Doelgroep en boodschap

Primair: verpleegkundigen, politie, brandweer, defensie, cabinepersoneel, horeca, fabrieksploegen, jonge ouders, die een 10 km, marathon of triatlon willen doen.

Kernbelofte (hero): **"Train easy. Race hard."** (zelfde als het loginscherm)
Onderkop (NL): *"De AI-coach die je training plant rond je diensten, niet andersom."*
EN: *"The AI coach that plans your training around your shifts, not the other way around."*

Toon: direct, warm, sportief, in je-vorm, korte zinnen. Geen jargon zonder uitleg. Spreek de pijn aan: *"Schema's gaan uit van een 9-tot-5. Jouw week niet."*

## 4. Visuele identiteit (uit de bestaande app, niet afwijken)

Tokens staan in `web/src/app/globals.css` (`@theme`). Gebruik alleen deze:

| Token | Waarde | Gebruik |
|---|---|---|
| background | `#0f1420` | pagina |
| surface / surface-raised | `#182031` / `#212a3e` | kaarten |
| line | `#2e3850` | randen |
| foreground (Chalk) | `#ded9d3` | tekst |
| muted | `#8c93a3` | secundaire tekst |
| accent / coral (Burnt Coral) | `#ef6a45` | CTA's, highlights, lopen |
| blue (French Blue) / blue-light | `#3e5889` / `#8fa6d6` | zwemmen, herstel, verloop |
| gradient | blue → coral | balken, accenten |

- Lettertype: **Space Grotesk** (al geladen via `next/font` in `layout.tsx`). Groottes uit de type-schaal; tracking zit in de tokens (`--text-3xl--letter-spacing` enz.), grote display-tekst krap (−0.03em), kleine labels ruim (`.eyebrow`, 0.18em uppercase).
- Glas-kaarten: `rounded-[1.75rem] border border-white/[0.08] bg-surface/70 backdrop-blur-xl` (zie `components/ui/Card.tsx`).
- Achtergrond: de zachte blauw/koraal gloed (`.app-glow`) en voor de hero de zwart-wit hardloopfoto `public/auth-background.webp` met lage opacity + korrel, zoals op het loginscherm (`components/auth/AuthBackground.tsx`).
- Sportkleuren: zwemmen blue-light, fietsen chalk, lopen coral (`components/sportColors.ts`), sport-iconen uit `components/SportIcon.tsx`.
- Bestaande herbruikbare stukken: `AuthHero` (woord-voor-woord intro), `SportDots` (pulserende zwem/fiets/loop-bolletjes), `ProgressRing`, `SeasonTimeline`, `SeasonBadge`, `TodayCard`-stijl, `Logo`.

## 5. Inspiratie (Dribbble), wat we overnemen, niet kopiëren

| Ontwerp | Link | Wat we lenen |
|---|---|---|
| Pacevo (Odama) | https://dribbble.com/shots/26402831 | Donkere hero met **bewegingsonscharpe warme foto** + glazen statistiek-kaart (afstand/tempo) die over de foto zweeft; grote gecentreerde koptekst; telefoonmockup met **één groot getal** ("5.29") |
| Velto (Cansaas) | https://dribbble.com/shots/27678443 | **Zwart → oranje** sfeer die perfect bij Burnt Coral past; zware condensed hero-kop links; telefoon met weekgrafiek; **gigantisch woordmerk "VELTO" in de footer** |
| RUNNR (Latera) | https://dribbble.com/shots/27560506 | Hero met een **route/hoogtelijn die door de pagina loopt**; tekstblok waarin woorden oplichten bij het scrollen; **marquee-band** met korte zinnen; **groot logo-woordmerk in de footer** |
| Momento (Kris Anfalova) | https://dribbble.com/shots/27089395 | **Mega-typografie** over een sporter heen ("track / your activity"), glazen route-kaart linksonder; schuine streep als typografisch accent |
| Track your progress (Crevio) | https://dribbble.com/shots/27651554 | Gestapelde rijen trainingsdata die **naar achteren vervagen** (diepte); glazen kaart met route |
| Run the city (Deluxewebsite) | https://dribbble.com/shots/27725463 | **Race-countdown** (dagen : uren : min : sec) als blikvanger; cijferrij met grote getallen |
| RIDE (triatlon coaching) | https://dribbble.com/shots/27232181 | Rustige **prijskaart**-opbouw met één uitgelichte optie |
| Motiona (AI coach) | https://dribbble.com/shots/27551213 | **AI-tip-kaartje** dat naast de hero zweeft; feature-strip met 4 iconen onder de hero |

Niet overnemen: neon-groen, robots/AI-clichés, stockfoto's van modellen, nep-statistieken.

## 6. Pagina-opbouw (mobile-first, in deze volgorde)

Elke sectie: max-breedte ±1200px op desktop, maar **ontwerp eerst voor 375px** (16px zijmarge, geen horizontaal scrollen).

1. **Navigatie** (sticky, glas): logo links; rechts *Inloggen* (tekstlink) + *Start gratis* (koraal knop). Taalwissel NL/EN (bestaande `LanguageSwitcher`). Op mobiel geen hamburger nodig: alleen logo + *Start gratis*.

2. **Hero**
   - Achtergrond: zwart-wit hardloopfoto, lage opacity, warme koraal-gloed van onderen (Velto/Pacevo-sfeer), korrel.
   - Kop met de bestaande woord-intro: **"Train easy. Race hard."** (coral accent op "hard").
   - Onderkop: de diensten-belofte (zie §3).
   - CTA's: **Start gratis** (koraal, primair) + *Zo werkt het* (secundair, scrollt naar sectie 4).
   - Rechts (desktop) / onder (mobiel): **telefoonframe met de échte Home-UI** (TodayCard + seizoenslabel "Opbouw · week 2 van 4" + ring 64%), gebouwd met de echte componenten en demo-data, géén screenshot-afbeelding.
   - Zwevend glazen kaartje naast de telefoon (Motiona/Pacevo): *"Coach: Na je nachtdienst plan ik morgen een rustige duurloop van 40 min."*
   - Onder de hero: `SportDots` (zwemmen/fietsen/lopen pulserend).

3. **Probleem → oplossing** ("Schema's gaan uit van een 9-tot-5. Jouw week niet.")
   - Links een "standaard schema" (vaste dagen, grijs, doorgestreept bij nachtdiensten); rechts het Runvex-schema dat om de diensten heen schuift. Simpele, eerlijke visual met de echte dag-kaarten-stijl.

4. **Zo werkt het**: 3 stappen, genummerd:
   1. *Vertel je doel en je tijd* (intake: sporten, niveau, beschikbare minuten per dag, werkrooster).
   2. *Je coachteam plant je week* (hoofdcoach + loop/fiets/zwemcoach overleggen).
   3. *Train, vink af, de coach past aan* (feedback, voorstellen met Toepassen).

5. **Je seizoen in één oogopslag**: de echte `SeasonTimeline` met demo-seizoen (Ironman), balkjes die van onder groeien bij in beeld komen. Tekst: *"Geen 3 maanden na je start al marathonvolume. Basis, opbouw, piek, taper, met een herstelweek in elk blok."* Plus de countdown-blikvanger (Run the city): *"Nog 128 dagen tot je wedstrijd"* (demo).

6. **Feature-grid** (bento, glas-kaarten, 2 kolommen mobiel → 3 desktop):
   - Chat met je coach ("Ik heb deze week 3 nachtdiensten" → voorstel + Toepassen-knop).
   - Herstelweek met één tik.
   - Zwemkaart voor op je bidon (mini-print van de echte `SwimPrintCard`).
   - Upload je horloge-training (.FIT) → afgevinkt met tempo/afstand.
   - Maximum uren per week passend bij je doel.
   - Werkt als app op je telefoon, NL/EN.

7. **Marquee-band** (RUNNR): langzaam lopende zinnen: *Nachtdienst · Vroege dienst · Vrije dag · Lange duurloop · Herstelweek · Taper · Wedstrijddag ·* (pauzeert bij `prefers-reduced-motion`).

8. **Privacy & vertrouwen**: kort, eerlijk: je gegevens staan in een EU-database; de AI-coach (Anthropic, VS) krijgt alleen een samenvatting zonder naam, e-mail of geboortedatum en traint er niet op; jij beslist over hartslag en die gaat nooit naar de AI; account verwijderen met één knop. Link naar `/privacy`. Niet beweren dat "alles in de EU blijft".

9. **Prijs** (zie open beslissing): één kaart, *"€10 per maand"*, wat erin zit, CTA *Start gratis*. Geen nep-"populair"-labels.

10. **FAQ** (accordion met `<details>`): Werkt het met mijn Garmin? (eerlijk antwoord: .FIT-upload nu, koppelingen later) · Ben ik beginner genoeg? · Wat als mijn rooster verandert? · Wat doet de AI met mijn gegevens? · Kan ik opzeggen?

11. **Slot-CTA**: *"Je volgende PR begint met een week die wél past."* + Start gratis.

12. **Footer**: links (Privacy, Inloggen, taal) + **gigantisch "RUNVEX"-woordmerk** onderaan dat half wegvalt (Velto/RUNNR), in surface-kleur met subtiele gradient.

## 7. Beweging (volg de regels die al in de app gelden)

- Tokens: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, `--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1)`. Geen andere curves.
- Scroll-onthulling: secties komen één keer binnen met `opacity 0 → 1` + `translateY(12px → 0)`, 400 ms `--ease-out`, gestaffeld 60 ms. Gebruik `IntersectionObserver` of CSS `animation-timeline: view()` met fallback; **geen** animatielibrary toevoegen.
- Tijdlijn-balken groeien van onder (`.bar-grow-up` bestaat al), ring vult (`.ring-fill`).
- Hero: woord-voor-woord (bestaand `AuthHero`), telefoon zweeft heel licht (max 6px, 6 s), zwevend coach-kaartje komt 400 ms na de kop binnen.
- Countdown telt echt af (1× per seconde, `tabular-nums`).
- Hover-effecten alleen achter `@media (hover: hover) and (pointer: fine)`; knoppen `active:scale-[0.97]`.
- Alleen `transform` en `opacity` animeren. `prefers-reduced-motion`: alles statisch of alleen fade, marquee stil.

## 8. Techniek

- Next.js 16 App Router, TypeScript, Tailwind 4, next-intl. **Lees eerst `web/AGENTS.md`** (Next 16 wijkt af; check `node_modules/next/dist/docs/`).
- **Routing**: uitgelogde bezoekers op `/` zien de landing page; ingelogde gebruikers houden hun Home op `/`. Pas `src/proxy.ts` zo aan dat `/` voor gasten niet meer naar `/login` stuurt, zonder bestaande login/redirect-logica te breken. Alternatief als dat te ingrijpend is: landing op `/welkom` en `/` stuurt gasten daarheen; bespreek de keuze eerst.
- Server Components standaard; alleen client-componenten waar nodig (countdown, scroll-onthulling, accordion is native `<details>`).
- Teksten in `messages/nl.json` en `messages/en.json` onder namespace `Landing`. Geen hardcoded strings.
- Demo-data voor de telefoon/tijdlijn: in een apart bestand (bijv. `src/content/landingDemo.ts`), gebruikt de echte core-functies (`seasonPlan`) zodat het klopt.
- Afbeeldingen via `next/image` met `placeholder="blur"`; hero-foto ≤ 200 KB (webp). Geen externe fonts of scripts, **geen trackers/analytics-cookies** (dan is er ook geen cookiebanner nodig).
- SEO: `metadata` met titel *"Runvex: AI-trainingscoach voor wie in diensten werkt"*, description, Open Graph-afbeelding (1200×630, maak met `next/og` `ImageResponse` in de huisstijl), `lang` correct, één `h1`.
- Performance: LCP < 2.5 s op 4G, CLS ≈ 0, JS voor de landing minimaal.
- Toegankelijkheid: WCAG AA-contrast (let op muted-tekst op glas), focus-ringen zichtbaar, alle iconen `aria-hidden` met tekstlabel, telefoon-mockup `aria-hidden` of met beschrijving, toetsenbord-navigeerbaar.
- Code-stijl: zoals de rest van de repo (Engelse code + korte Engelse comments, kleine componenten in `src/components/landing/`).

## 9. Opleveren en checken

- [ ] Ziet er goed uit op 375px, 768px, 1440px (geen horizontaal scrollen).
- [ ] Ingelogd → `/` is nog steeds de Home van de app. Uitgelogd → landing. Login/registratie/wachtwoord-vergeten werken nog.
- [ ] Alle teksten NL én EN.
- [ ] Geen verzonnen cijfers, reviews of merklogo's.
- [ ] `npx tsc --noEmit`, `npx eslint src`, `npx vitest run` slagen.
- [ ] Lighthouse mobiel: Performance ≥ 90, Accessibility ≥ 95, SEO 100.
- [ ] `prefers-reduced-motion` getest.

## 10. Open beslissingen (vul in vóór het bouwen)

1. **Prijs op de pagina**: *"€10/maand"* tonen of *"Gratis tijdens de beta"* (betalen is nog niet gebouwd)? En een proefperiode (bijv. 14 dagen)?
2. **URL**: landing op `/` voor gasten (aanbevolen, beter voor Google) of op `/welkom`?
3. **Testimonials**: heb je 2-3 echte quotes van je vrienden (met voornaam + sport, en hun toestemming)? Anders laten we die sectie weg.
4. **Hero-foto**: de huidige zwart-wit loopfoto hergebruiken, of heb je een eigen foto (bijv. iemand in werkkleding/na een dienst die gaat lopen)? Een eigen foto maakt het verhaal sterker.
5. **Wachtlijst of direct registreren**: mag iedereen zich nu aanmelden, of eerst een wachtlijst?
