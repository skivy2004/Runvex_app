import type { Locale } from "@/core/locale";

// The privacy statement, in both languages. Keep it true to what the app really
// does: when the app starts storing or sharing something new, update this text
// (and LAST_UPDATED) in the same change.

/** Who is responsible for the data (the "controller" under the GDPR). */
export const PRIVACY_CONTACT = {
  name: "Jeremy Cordes",
  city: "Enschede, Netherlands",
  email: "Jeremycordes31@gmail.com",
};

export const LAST_UPDATED = "2026-10-03";

export type PrivacySection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
  /** A small table: who processes what. */
  processors?: { name: string; purpose: string; location: string }[];
};

type PrivacyContent = { title: string; updatedLabel: string; intro: string; sections: PrivacySection[] };

const { name, city, email } = PRIVACY_CONTACT;

export const privacyContent: Record<Locale, PrivacyContent> = {
  nl: {
    title: "Privacyverklaring",
    updatedLabel: "Laatst bijgewerkt",
    intro:
      "Runvex is een trainingsapp voor duursporters met een druk of wisselend rooster. In deze verklaring lees je welke gegevens we van je gebruiken, waarom, met wie we ze delen en welke rechten je hebt. We gebruiken zo weinig mogelijk gegevens, en nooit voor advertenties.",
    sections: [
      {
        heading: "Wie is verantwoordelijk?",
        paragraphs: [
          `Runvex wordt gemaakt door ${name} uit ${city}. Wij zijn de verwerkingsverantwoordelijke volgens de Algemene Verordening Gegevensbescherming (AVG). Vragen over je gegevens? Mail naar ${email}.`,
        ],
      },
      {
        heading: "Welke gegevens gebruiken we?",
        items: [
          "Account: je e-mailadres en je wachtwoord. Je wachtwoord wordt alleen versleuteld (gehasht) opgeslagen; niemand kan het lezen, ook wij niet.",
          "Profiel: je voornaam (als je die invult), je geboortedatum, je taal, je tijdzone en het soort werkrooster dat je hebt.",
          "Training: je sporten en niveau per sport, je doel (beschrijving, wedstrijd, datum en afstanden), hoeveel tijd je per dag hebt, je geplande trainingen en de uitleg van de coach daarbij, of je een training hebt gedaan of overgeslagen, hoe zwaar die voelde (1-10) met je eventuele notitie, en je zwembad en zwemmateriaal.",
          "AI-coach: het tijdstip waarop je een weekplanning laat maken, zodat we een daglimiet kunnen bewaken.",
          "Technische gegevens: je IP-adres en browsergegevens komen in de logbestanden van onze hosting en database, voor beveiliging en het oplossen van storingen.",
        ],
        paragraphs: [
          "We verzamelen geen locatie, hartslag, slaap of andere gezondheidsmetingen. Als we dat later toevoegen, vragen we daar eerst uitdrukkelijk je toestemming voor.",
        ],
      },
      {
        heading: "Waarom, en op welke grondslag?",
        items: [
          "Om de app te laten werken (account, intake, weekplanning, trainingen): dit is nodig voor de overeenkomst met jou (art. 6 lid 1 sub b AVG).",
          "Je geboortedatum: om te controleren dat je minimaal 16 jaar bent en om je training op je leeftijd af te stemmen (overeenkomst).",
          "E-mails zoals de bevestiging van je account (overeenkomst).",
          "Je trainingen naar je horloge sturen: alleen als je dat zelf koppelt, op basis van je toestemming. Je kunt die altijd weer intrekken (art. 6 lid 1 sub a AVG).",
          "Beveiliging, misbruik voorkomen en de daglimiet van de AI-coach: ons gerechtvaardigd belang bij een veilige en betaalbare app (art. 6 lid 1 sub f AVG).",
        ],
      },
      {
        heading: "De AI-coach",
        paragraphs: [
          "Als je op ‘Plan mijn week’ tikt, sturen we een samenvatting naar Claude, het AI-model van Anthropic: je sporten en niveaus, je werkrooster, je beschikbare tijd per dag, je doel, je trainingen van deze en vorige week en hoeveel je daarvan gedaan of overgeslagen hebt met de gemiddelde zwaarte (zonder je notities). Je naam, e-mailadres en geboortedatum sturen we niet mee. Anthropic gebruikt deze gegevens niet om zijn modellen te trainen.",
          "Elke planning van de coach wordt eerst gecontroleerd met vaste trainingsregels. Lukt dat niet, dan maakt Runvex de planning zelf, zonder AI.",
        ],
      },
      {
        heading: "Met wie delen we gegevens?",
        paragraphs: [
          "We verkopen je gegevens nooit. We werken met deze dienstverleners (verwerkers), die je gegevens alleen voor ons mogen gebruiken:",
        ],
        processors: [
          { name: "Supabase", purpose: "Database en inloggen", location: "EU (Ierland)" },
          { name: "Vercel", purpose: "Hosting van de app", location: "VS / EU" },
          { name: "Resend", purpose: "Versturen van e-mails", location: "VS" },
          { name: "Anthropic", purpose: "AI-coach (weekplanning)", location: "VS" },
          { name: "intervals.icu", purpose: "Trainingen naar je horloge (alleen als je koppelt)", location: "Buiten de EU mogelijk" },
        ],
      },
      {
        heading: "Gegevens buiten de EU",
        paragraphs: [
          "Sommige dienstverleners zitten buiten de Europese Unie, vooral in de Verenigde Staten. Daarvoor gebruiken we de waarborgen die de AVG vraagt, zoals de standaardcontractbepalingen van de Europese Commissie of het EU-VS Data Privacy Framework.",
        ],
      },
      {
        heading: "Hoe lang bewaren we je gegevens?",
        paragraphs: [
          `Zolang je account bestaat. Je kunt je account zelf verwijderen in Profiel → Account verwijderen: dan worden je account en al je gegevens direct gewist. Lukt dat niet, mail dan naar ${email}; dan doen wij het binnen een maand. Gegevens kunnen daarna nog kort in automatische back-ups staan, tot die worden overschreven. Technische logbestanden worden na korte tijd automatisch verwijderd door onze dienstverleners.`,
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "We gebruiken alleen cookies die nodig zijn om de app te laten werken: één om je ingelogd te houden en één die je taalkeuze een jaar onthoudt. We gebruiken geen cookies voor advertenties of om je te volgen, en geen analysediensten.",
        ],
      },
      {
        heading: "Beveiliging",
        items: [
          "Alle verbindingen zijn versleuteld (HTTPS).",
          "Elke gebruiker kan in de database alleen bij zijn eigen gegevens (Row Level Security).",
          "Geheime sleutels staan alleen op de server, nooit in de app op je telefoon of in je browser.",
        ],
      },
      {
        heading: "Jouw rechten",
        paragraphs: [
          `Je mag je gegevens inzien, laten verbeteren of laten verwijderen. Je mag ook vragen om minder te verwerken (beperking), bezwaar maken, je gegevens in een gangbaar bestand meekrijgen (overdraagbaarheid) en je toestemming intrekken. Mail daarvoor naar ${email}; we reageren binnen een maand. Veel gegevens kun je ook zelf aanpassen in je profiel.`,
          "Ben je niet tevreden over hoe we met je gegevens omgaan? Dan kun je een klacht indienen bij de Autoriteit Persoonsgegevens (autoriteitpersoonsgegevens.nl).",
        ],
      },
      {
        heading: "Minimumleeftijd",
        paragraphs: ["Runvex is bedoeld voor mensen van 16 jaar en ouder."],
      },
      {
        heading: "Wijzigingen",
        paragraphs: [
          "Als de app verandert, passen we deze verklaring aan. Bovenaan zie je wanneer dat voor het laatst gebeurde. Bij grote wijzigingen laten we het je in de app weten.",
        ],
      },
    ],
  },

  en: {
    title: "Privacy statement",
    updatedLabel: "Last updated",
    intro:
      "Runvex is a training app for endurance athletes with a busy or changing schedule. This statement explains which data we use, why, who we share it with and what your rights are. We use as little data as possible, and never for advertising.",
    sections: [
      {
        heading: "Who is responsible?",
        paragraphs: [
          `Runvex is made by ${name} from ${city}. We are the data controller under the General Data Protection Regulation (GDPR). Questions about your data? Email ${email}.`,
        ],
      },
      {
        heading: "Which data do we use?",
        items: [
          "Account: your email address and password. Your password is only stored encrypted (hashed); nobody can read it, not even us.",
          "Profile: your first name (if you fill it in), date of birth, language, time zone and the kind of work schedule you have.",
          "Training: your sports and level per sport, your goal (description, race, date and distances), how much time you have per day, your planned trainings and the coach's explanation for them, whether you did or skipped a training, how hard it felt (1-10) with any note you add, and your pool and swim equipment.",
          "AI coach: the time you ask for a week plan, so we can keep a daily limit.",
          "Technical data: your IP address and browser details end up in the log files of our hosting and database, for security and fixing problems.",
        ],
        paragraphs: [
          "We don't collect location, heart rate, sleep or other health measurements. If we add that later, we'll ask for your explicit consent first.",
        ],
      },
      {
        heading: "Why, and on what legal basis?",
        items: [
          "To make the app work (account, intake, week planning, trainings): necessary for our agreement with you (Art. 6(1)(b) GDPR).",
          "Your date of birth: to check that you are at least 16 and to match your training to your age (agreement).",
          "Emails such as the confirmation of your account (agreement).",
          "Sending your trainings to your watch: only when you connect it yourself, based on your consent, which you can withdraw at any time (Art. 6(1)(a) GDPR).",
          "Security, preventing abuse and the AI coach's daily limit: our legitimate interest in a safe and affordable app (Art. 6(1)(f) GDPR).",
        ],
      },
      {
        heading: "The AI coach",
        paragraphs: [
          "When you tap ‘Plan my week’, we send a summary to Claude, Anthropic's AI model: your sports and levels, your work schedule, your available time per day, your goal, your trainings of this week and last week and how many of them you did or skipped with the average effort (without your notes). We don't send your name, email address or date of birth. Anthropic doesn't use this data to train its models.",
          "Every plan from the coach is first checked against fixed training rules. If that fails, Runvex makes the plan itself, without AI.",
        ],
      },
      {
        heading: "Who do we share data with?",
        paragraphs: [
          "We never sell your data. We work with these service providers (processors), who may only use your data on our behalf:",
        ],
        processors: [
          { name: "Supabase", purpose: "Database and login", location: "EU (Ireland)" },
          { name: "Vercel", purpose: "Hosting the app", location: "US / EU" },
          { name: "Resend", purpose: "Sending emails", location: "US" },
          { name: "Anthropic", purpose: "AI coach (week planning)", location: "US" },
          { name: "intervals.icu", purpose: "Trainings to your watch (only when you connect)", location: "Possibly outside the EU" },
        ],
      },
      {
        heading: "Data outside the EU",
        paragraphs: [
          "Some service providers are outside the European Union, mainly in the United States. For those we use the safeguards the GDPR requires, such as the European Commission's Standard Contractual Clauses or the EU-US Data Privacy Framework.",
        ],
      },
      {
        heading: "How long do we keep your data?",
        paragraphs: [
          `As long as your account exists. You can delete your account yourself in Profile → Delete account: your account and all your data are erased right away. If that doesn't work, email ${email} and we'll do it within a month. Data may stay in automatic backups for a short while until they are overwritten. Technical log files are deleted automatically after a short time by our service providers.`,
        ],
      },
      {
        heading: "Cookies",
        paragraphs: [
          "We only use cookies the app needs to work: one to keep you logged in and one that remembers your language for a year. We don't use cookies for advertising or tracking, and no analytics services.",
        ],
      },
      {
        heading: "Security",
        items: [
          "All connections are encrypted (HTTPS).",
          "In the database, every user can only reach their own data (Row Level Security).",
          "Secret keys are only on the server, never in the app on your phone or in your browser.",
        ],
      },
      {
        heading: "Your rights",
        paragraphs: [
          `You may view, correct or delete your data. You may also ask us to process less (restriction), object, get your data in a common file format (portability) and withdraw your consent. Email ${email}; we'll respond within a month. You can also change much of your data yourself in your profile.`,
          "Not happy with how we handle your data? You can file a complaint with the Dutch Data Protection Authority (autoriteitpersoonsgegevens.nl), or with the authority in your own country.",
        ],
      },
      {
        heading: "Minimum age",
        paragraphs: ["Runvex is meant for people aged 16 and over."],
      },
      {
        heading: "Changes",
        paragraphs: [
          "When the app changes, we update this statement. The date at the top shows when that last happened. For big changes, we'll let you know in the app.",
        ],
      },
    ],
  },
};
