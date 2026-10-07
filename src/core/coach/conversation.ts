import { z } from "zod";
import { agentIds, type AgentId } from "./agents";
import { proposalChangeSchema, type ChangeableTraining } from "./proposal";

// What the coaches get to read when the athlete tells how a training went, or
// writes to the head coach in the chat. The athlete's data comes in as JSON
// ("the situation"); the answer has a fixed shape so we can check proposals.
// No name, e-mail or birth date is ever sent.

/** Everything a coach needs to know about the athlete right now. */
export type Situation = {
  language: "Dutch" | "English";
  today: string;
  athlete: { workPattern: string | null; sports: string[] };
  goal: { description: string; race: string | null; eventDate: string | null; weeksToGo: number | null } | null;
  /** Trainings of the last 7 days with how they went. */
  recent: {
    date: string;
    sport: string;
    name: string;
    status: string;
    effort: number | null;
    note: string | null;
    /** What the watch recorded, when the athlete uploaded the activity file. */
    actual?: { minutes: number; distanceKm: number | null; avgPower: number | null };
  }[];
  /** Planned trainings of the next two weeks, with what each may become. */
  upcoming: (ChangeableTraining & { name: string; minutes: number; difficulty: number | null; coachNote: string | null })[];
  /** The dates a training may move to. */
  moveDates: string[];
  /** Where the athlete is in the training blocks: this week and the coming weeks. */
  trainingBlocks: { weekStart: string; phase: string; weekType: string; week: string; volumePercent: number }[];
  /** Coming weeks that may become a recovery week (Mondays). */
  recoveryWeekOptions: string[];
};

const PROPOSALS = `You may propose changes to upcoming trainings, at most 3. Each change refers to a training in "upcoming" by its "id":
- "swap": replace it by one of its "options" (easier, similar or harder; give the id without ":minutes" as "newWorkoutId").
- "move": move it to one of "moveDates" ("newDate").
- "remove": take it out, e.g. when rest is wiser.
- "recovery_week": turn a whole coming week into a recovery week, e.g. a week of night shifts; give its Monday from "recoveryWeekOptions" as "newDate" and leave "workoutId" empty. The training blocks ("trainingBlocks") shift around it.
Only propose a change when it really helps; otherwise return no changes. The athlete decides whether to apply it, so explain in your text what you propose and why.`;

// ---------------------------------------------------------------------------
// Feedback after a training
// ---------------------------------------------------------------------------

export const feelings = ["easy", "right", "hard"] as const;
export type Feeling = (typeof feelings)[number];

export const feedbackAnswerSchema = z.object({
  /** The reaction to the athlete, 2-4 sentences. */
  reaction: z.string(),
  changes: z.array(proposalChangeSchema),
});
export type FeedbackAnswer = z.infer<typeof feedbackAnswerSchema>;

export function buildFeedbackMessage(
  situation: Situation,
  training: { date: string; sport: string; name: string; description: string; difficulty: number | null; category: string | null; coachNote: string | null },
  feedback: { feeling: Feeling; effort: number | null; note: string | null },
): string {
  return `The athlete just told how a training went. React as their coach for this sport in 2-4 sentences: acknowledge it, and say what it means.

A recent training may have "actual": what the watch recorded (minutes, distance, average power). Use it to see what was really done, e.g. much longer or shorter than planned.

When the training felt too easy or too hard, first check what it was meant to be. An easy, recovery or long session is meant to feel easy (effort about 2-4 of 10); then explain that this is right and why it matters. When a session that should be challenging felt too easy, or any session felt too hard, look at the upcoming trainings of this sport and consider making the next comparable one harder or easier. Take the work schedule and recent trainings into account: one hard day after a night shift is no reason to change the plan.

${PROPOSALS}

The training: ${JSON.stringify(training)}
How it went: ${JSON.stringify(feedback)}
The situation: ${JSON.stringify(situation)}`;
}

// ---------------------------------------------------------------------------
// Chat with the head coach
// ---------------------------------------------------------------------------

export const consultSchema = z.object({
  sport: z.enum(["running", "cycling", "swimming"]),
  question: z.string(),
});

export const chatAnswerSchema = z.object({
  /** The reply to the athlete. Empty when first consulting the specialists. */
  reply: z.string(),
  /** Questions for the specialists, only when their expertise is really needed. */
  consult: z.array(consultSchema),
  changes: z.array(proposalChangeSchema),
});
export type ChatAnswer = z.infer<typeof chatAnswerSchema>;

export const chatFinalSchema = z.object({ reply: z.string(), changes: z.array(proposalChangeSchema) });
export type ChatFinal = z.infer<typeof chatFinalSchema>;

/** Earlier messages, so the coach knows what was said before. */
export type TranscriptLine = { from: "athlete" | AgentId; text: string };

const transcript = (lines: TranscriptLine[]) =>
  lines.length === 0 ? "(no earlier messages)" : lines.map((line) => `${line.from}: ${line.text}`).join("\n");

export function buildChatMessage(situation: Situation, history: TranscriptLine[], question: string): string {
  return `The athlete writes to you, the head coach. Answer as their coach: listen, explain, and help with their situation (less time, tired, a niggle, a busy work week, a question about a training). Keep it short: 2-6 sentences.

When the question really needs a specialist's knowledge (e.g. a swim drill, a running niggle, a bike interval), you may first ask the run, bike or swim coach: put your questions in "consult" and leave "reply" empty; you'll then get their answers and write the final reply. Otherwise answer right away with "consult" empty.

${PROPOSALS}

The conversation so far:
${transcript(history)}

The situation: ${JSON.stringify(situation)}

The athlete's new message: ${JSON.stringify(question)}`;
}

export function buildConsultMessage(situation: Situation, question: string, athleteMessage: string): string {
  return `The head coach asks for your expertise about the athlete below. Answer the head coach in 2-4 sentences, specific to your sport. Write in the athlete's language.

The athlete wrote: ${JSON.stringify(athleteMessage)}
The head coach asks: ${JSON.stringify(question)}
The situation: ${JSON.stringify(situation)}`;
}

export function buildChatFinalMessage(
  situation: Situation,
  history: TranscriptLine[],
  question: string,
  advice: { sport: AgentId; answer: string }[],
): string {
  return `${buildChatMessage(situation, history, question)}

You asked the specialists; their answers:
${advice.map((item) => `${item.sport}: ${item.answer}`).join("\n")}

Now write the final reply to the athlete (and propose changes if useful).`;
}

export function isAgentId(value: string | null): value is AgentId {
  return value !== null && (agentIds as readonly string[]).includes(value);
}
