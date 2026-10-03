// Development-only preview of the coach conversation with sample messages.
import { CoachComposer } from "@/components/coach/CoachComposer";
import { StoredMessage } from "@/components/coach/StoredMessage";
import { TrainingFeedbackForm } from "@/components/coach/TrainingFeedbackForm";
import { PageHeading } from "@/components/PageHeading";
import type { CoachMessage } from "@/services/coachMessages";

const message = (id: string, role: string, agent: string | null, content: string, proposal: CoachMessage["proposal"] = null): CoachMessage => ({
  id: `00000000-0000-4000-8000-00000000000${id}`,
  role,
  agent,
  content,
  workout_id: null,
  proposal,
  proposal_status: proposal ? "pending" : null,
  created_at: "2026-10-03T08:00:00Z",
});

export default function DevCoachPage() {
  const messages = [
    message("1", "coach", "head", "Deze week bouwen we rustig op: twee kwaliteitsprikkels en een lange rit op zaterdag."),
    message("2", "user", null, "Ik heb deze week nachtdiensten van dinsdag tot donderdag."),
    message("3", "coach", "running", "Na nachtdiensten liever geen tempo: een rustige 30 minuten houdt de benen fris zonder extra vermoeidheid."),
    message(
      "4",
      "coach",
      "head",
      "Dan maken we woensdag lichter en schuiven we de drempeltraining naar vrijdag, na je eerste nacht slaap.",
      { changes: [{ label: "wo 7 okt · Tempo 45 → Easy 30 (lichter)", reason: "Herstel tussen je nachtdiensten." }, { label: "Drempel 4x6 · do 8 okt → vr 9 okt", reason: "Na een nacht goed slapen." }] },
    ),
  ];
  return (
    <main className="flex flex-col gap-5 py-6">
      <PageHeading eyebrow="Runvex AI" title="Je coaches" subtitle="Praat met je coach." />
      <TrainingFeedbackForm workoutId="00000000-0000-4000-8000-000000000009" />
      {messages.map((item) => (
        <StoredMessage key={item.id} message={item} />
      ))}
      <CoachComposer suggestions={["Ik heb deze week minder tijd", "Ik ben moe"]} />
    </main>
  );
}
