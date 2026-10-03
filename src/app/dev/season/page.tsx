// Development-only preview of the training blocks for an Ironman next summer.
import { SeasonTimeline } from "@/components/season/SeasonTimeline";
import { SeasonWeekCard } from "@/components/season/SeasonWeekCard";
import { Card } from "@/components/ui/Card";
import { seasonPlan } from "@/core/periodization";

export default function DevSeasonPage() {
  const plan = seasonPlan({ goalCreatedOn: "2026-10-03", eventDate: "2027-08-29", racePreset: "ironman", beginner: false });
  const current = plan.find((week) => week.weekStart === "2026-10-26")!;
  return (
    <main className="flex flex-col gap-5 py-6">
      <SeasonWeekCard week={plan[2]} canChange={false} isOverride={false} />
      <SeasonWeekCard week={current} canChange={false} isOverride={false} />
      <Card>
        <SeasonTimeline weeks={plan} currentWeek="2026-10-05" />
      </Card>
    </main>
  );
}
