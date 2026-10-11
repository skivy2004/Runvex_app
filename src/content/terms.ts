import type { Locale } from "@/core/locale";
import type { LegalContent } from "./legal";
import { PRIVACY_CONTACT } from "./privacy";

// The terms of use, in both languages. Keep them true to what the app really
// does: when that changes (e.g. paid plans), update this text (and LAST_UPDATED)
// in the same change.

export const LAST_UPDATED = "2026-10-11";

const { name, city, email } = PRIVACY_CONTACT;

export const termsContent: Record<Locale, LegalContent> = {
  nl: {
    title: "Gebruiksvoorwaarden",
    updatedLabel: "Laatst bijgewerkt",
    intro:
      "Dit zijn de afspraken tussen jou en Runvex als je de app gebruikt. We hebben ze zo kort en duidelijk mogelijk gehouden. Door een account aan te maken ga je ermee akkoord. Hoe we met je gegevens omgaan, lees je in onze privacyverklaring.",
    sections: [
      {
        heading: "Wie zijn wij?",
        paragraphs: [
          `Runvex wordt gemaakt door ${name} uit ${city}. Vragen over deze voorwaarden? Mail naar ${email}.`,
        ],
      },
      {
        heading: "Je account",
        items: [
          "Je moet minimaal 16 jaar zijn om Runvex te gebruiken.",
          "Vul gegevens in die kloppen, zoals je geboortedatum. Je coach baseert je training erop.",
          "Je account is persoonlijk. Houd je wachtwoord geheim; je bent zelf verantwoordelijk voor wat er met je account gebeurt.",
        ],
      },
      {
        heading: "Geen medisch advies",
        paragraphs: [
          "Runvex geeft trainingsadvies, geen medisch advies. Het is geen vervanging voor een arts, fysiotherapeut of andere zorgverlener.",
          "Twijfel je over je gezondheid, heb je een blessure, ben je zwanger of gebruik je medicijnen? Overleg dan eerst met een arts voordat je (zwaarder) gaat trainen. Luister tijdens het trainen naar je lichaam: stop bij pijn, duizeligheid of benauwdheid. Je traint altijd op eigen verantwoordelijkheid.",
        ],
      },
      {
        heading: "De AI-coach",
        paragraphs: [
          "Je trainingsschema en de antwoorden in de chat worden gemaakt met AI. Elke planning wordt gecontroleerd met vaste trainingsregels, maar AI kan fouten maken. Zie het advies als een voorstel: kijk of het bij jou past en pas het aan als dat nodig is.",
        ],
      },
      {
        heading: "Wat je niet mag doen",
        items: [
          "De app gebruiken voor iets wat in strijd is met de wet.",
          "Proberen de app, de AI-coach of de beveiliging te misbruiken, te omzeilen of te overbelasten, bijvoorbeeld door de limiet van de AI-coach te ontwijken.",
          "Automatisch gegevens uit de app halen (scrapen) of de app namaken.",
          "Kwetsende, bedreigende of illegale inhoud naar de coach sturen.",
        ],
        paragraphs: [
          "Houd je je hier niet aan, dan mogen we je account tijdelijk blokkeren of verwijderen. Als dat kan, laten we je eerst weten waarom.",
        ],
      },
      {
        heading: "Jouw gegevens en inhoud",
        paragraphs: [
          "Wat je in Runvex zet, zoals je trainingen, notities en berichten, blijft van jou. Je geeft ons alleen toestemming om het te gebruiken voor zover dat nodig is om de app voor jou te laten werken. Lees in de privacyverklaring precies wat we daarmee doen.",
          "De app zelf (de software, het ontwerp, de naam en het logo van Runvex) is van ons. Je mag de app gebruiken, maar niet kopiëren of doorverkopen.",
        ],
      },
      {
        heading: "Koppelingen met andere diensten",
        paragraphs: [
          "Koppel je Runvex aan een andere dienst, zoals intervals.icu om trainingen naar je horloge te sturen, dan gelden voor die dienst ook hun eigen voorwaarden. We zijn niet verantwoordelijk voor hoe die diensten werken.",
        ],
      },
      {
        heading: "Kosten",
        paragraphs: [
          "Runvex is op dit moment gratis. Gaan we in de toekomst geld vragen voor (een deel van) de app, dan laten we je dat ruim van tevoren weten. Je betaalt nooit iets zonder dat je daar zelf voor kiest.",
        ],
      },
      {
        heading: "Beschikbaarheid en wijzigingen van de app",
        paragraphs: [
          "Runvex is nieuw en we verbeteren de app steeds. Functies kunnen veranderen, erbij komen of verdwijnen. We doen ons best om de app altijd goed te laten werken, maar we kunnen niet beloven dat dat zonder storingen of fouten gaat.",
        ],
      },
      {
        heading: "Aansprakelijkheid",
        paragraphs: [
          "We zijn niet aansprakelijk voor schade door het gebruik van de app of het volgen van trainingsadvies, voor zover de wet dat toestaat. Dit geldt niet als de schade komt door opzet of grove nalatigheid van onze kant. Je rechten als consument volgens de wet blijven altijd gelden.",
        ],
      },
      {
        heading: "Stoppen",
        paragraphs: [
          "Je kunt altijd stoppen. Verwijder je account in Profiel → Account verwijderen; dan worden je account en al je gegevens direct gewist.",
        ],
      },
      {
        heading: "Wijzigingen van deze voorwaarden",
        paragraphs: [
          "Als de app verandert, kunnen we deze voorwaarden aanpassen. Bovenaan zie je wanneer dat voor het laatst gebeurde. Bij belangrijke wijzigingen laten we het je vooraf weten in de app of per e-mail. Ga je daarna door met Runvex, dan gelden de nieuwe voorwaarden.",
        ],
      },
      {
        heading: "Toepasselijk recht",
        paragraphs: [
          "Op deze voorwaarden is Nederlands recht van toepassing. Woon je in een ander EU-land, dan houd je de bescherming die het consumentenrecht van jouw land je geeft. Heb je een klacht? Mail ons eerst, dan zoeken we samen een oplossing.",
        ],
      },
    ],
  },

  en: {
    title: "Terms of use",
    updatedLabel: "Last updated",
    intro:
      "These are the agreements between you and Runvex when you use the app. We've kept them as short and clear as we can. By creating an account, you agree to them. How we handle your data is explained in our privacy statement.",
    sections: [
      {
        heading: "Who are we?",
        paragraphs: [`Runvex is made by ${name} from ${city}. Questions about these terms? Email ${email}.`],
      },
      {
        heading: "Your account",
        items: [
          "You must be at least 16 to use Runvex.",
          "Fill in details that are true, such as your date of birth. Your coach bases your training on them.",
          "Your account is personal. Keep your password secret; you are responsible for what happens with your account.",
        ],
      },
      {
        heading: "Not medical advice",
        paragraphs: [
          "Runvex gives training advice, not medical advice. It doesn't replace a doctor, physiotherapist or other healthcare professional.",
          "In doubt about your health, injured, pregnant or on medication? Talk to a doctor before you start training (harder). Listen to your body while training: stop if you feel pain, dizziness or shortness of breath. You always train at your own risk.",
        ],
      },
      {
        heading: "The AI coach",
        paragraphs: [
          "Your training plan and the replies in the chat are made with AI. Every plan is checked against fixed training rules, but AI can make mistakes. See the advice as a suggestion: check whether it suits you and adjust it when needed.",
        ],
      },
      {
        heading: "What you may not do",
        items: [
          "Use the app for anything that breaks the law.",
          "Try to misuse, get around or overload the app, the AI coach or its security, for example by getting around the AI coach's limit.",
          "Automatically pull data from the app (scraping) or copy the app.",
          "Send offensive, threatening or illegal content to the coach.",
        ],
        paragraphs: [
          "If you don't stick to this, we may block or delete your account. When we can, we'll tell you why first.",
        ],
      },
      {
        heading: "Your data and content",
        paragraphs: [
          "What you put into Runvex, such as your trainings, notes and messages, stays yours. You only give us permission to use it as far as needed to make the app work for you. The privacy statement explains exactly what we do with it.",
          "The app itself (the software, the design, the Runvex name and logo) is ours. You may use the app, but not copy or resell it.",
        ],
      },
      {
        heading: "Connections with other services",
        paragraphs: [
          "When you connect Runvex to another service, such as intervals.icu to send trainings to your watch, that service's own terms apply too. We are not responsible for how those services work.",
        ],
      },
      {
        heading: "Costs",
        paragraphs: [
          "Runvex is free right now. If we ever start charging for (part of) the app, we'll tell you well in advance. You never pay for anything without choosing to yourself.",
        ],
      },
      {
        heading: "Availability and changes to the app",
        paragraphs: [
          "Runvex is new and we keep improving it. Features may change, be added or disappear. We do our best to keep the app working well, but we can't promise it will always run without interruptions or errors.",
        ],
      },
      {
        heading: "Liability",
        paragraphs: [
          "We are not liable for damage from using the app or following training advice, as far as the law allows. This doesn't apply if the damage is caused by intent or gross negligence on our side. Your statutory rights as a consumer always remain.",
        ],
      },
      {
        heading: "Stopping",
        paragraphs: [
          "You can stop at any time. Delete your account in Profile → Delete account; your account and all your data are erased right away.",
        ],
      },
      {
        heading: "Changes to these terms",
        paragraphs: [
          "When the app changes, we may update these terms. The date at the top shows when that last happened. For important changes, we'll let you know in advance in the app or by email. If you keep using Runvex after that, the new terms apply.",
        ],
      },
      {
        heading: "Governing law",
        paragraphs: [
          "These terms are governed by Dutch law. If you live in another EU country, you keep the protection your own country's consumer law gives you. Have a complaint? Email us first and we'll look for a solution together.",
        ],
      },
    ],
  },
};
