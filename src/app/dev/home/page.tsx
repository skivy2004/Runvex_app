// Development-only preview of the Home cards with sample data, without logging in.
import { GoalCard } from "@/components/home/GoalCard";
import { HomeHeader } from "@/components/home/HomeHeader";
import { NextWorkoutCard } from "@/components/home/NextWorkoutCard";
import { WeekSummaryCard } from "@/components/home/WeekSummaryCard";
import { addDays, isoWeekday, todayInTimeZone } from "@/core/dates";

export default function HomePreviewPage() {
  const today = todayInTimeZone("Europe/Amsterdam");

  return (
    <main className="flex flex-col gap-4 py-6">
      <HomeHeader name="Sam" today={today} />
      <WeekSummaryCard
        plannedMinutes={270}
        availability={[90, 90, 120, 105, 90, 105, 0]}
        todayWeekday={isoWeekday(today)}
      />
      <NextWorkoutCard
        today={today}
        workout={{
          id: "sample",
          scheduled_on: addDays(today, 1),
          sport: "cycling",
          title: "Endurance ride",
          duration_minutes: 90,
          position: 0,
        }}
      />
      <GoalCard
        today={today}
        goal={{
          id: "sample",
          description: "Ironman",
          sports: ["swimming", "cycling", "running"],
          event_name: "Ironman Hamburg",
          event_date: addDays(today, 367),
          race_preset: "ironman",
          segments: [
            { sport: "swimming", distanceMeters: 3800 },
            { sport: "cycling", distanceMeters: 180000 },
            { sport: "running", distanceMeters: 42195 },
          ],
        }}
      />
      <h2 className="pt-4 text-sm text-muted">Empty states</h2>
      <NextWorkoutCard today={today} workout={null} />
      <GoalCard today={today} goal={null} />
    </main>
  );
}
