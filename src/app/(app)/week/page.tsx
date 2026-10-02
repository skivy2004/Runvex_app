import { getTranslations } from "next-intl/server";
import { PageHeading } from "@/components/PageHeading";
import { DayCard } from "@/components/week/DayCard";
import { PlanWeekButton } from "@/components/week/PlanWeekButton";
import { WeekNavigation } from "@/components/week/WeekNavigation";
import { WeekTotals } from "@/components/week/WeekTotals";
import { addDays, startOfWeek, todayInTimeZone } from "@/core/dates";
import { weekdays } from "@/core/training";
import { groupByWeekday, resolveWeekStart } from "@/core/week";
import { createClient } from "@/lib/supabase/server";
import { getWeeklyAvailability } from "@/services/availability";
import { getCurrentProfile } from "@/services/profile";
import { getPlannedWorkouts } from "@/services/workouts";

export default async function WeekPage({ searchParams }: PageProps<"/week">) {
  const t = await getTranslations("Week");
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  // The proxy already sends logged-out visitors to /login.
  if (!profile) return null;

  const today = todayInTimeZone(profile.timezone);
  // ?week=2026-09-28 in the URL picks the week; without it we show this week.
  const { week } = await searchParams;
  const weekStart = resolveWeekStart(typeof week === "string" ? week : undefined, today);

  const [availability, workouts] = await Promise.all([
    getWeeklyAvailability(supabase, profile.id),
    getPlannedWorkouts(supabase, profile.id, weekStart, addDays(weekStart, 6)),
  ]);
  const workoutsPerDay = groupByWeekday(weekStart, workouts);
  // Show "Plan my week" while a training day from today on is still empty.
  const hasOpenDays = availability.some(
    (day, index) =>
      day.minutes > 0 && addDays(weekStart, index) >= today && workoutsPerDay[index].length === 0,
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeading title={t("title")} />
      <WeekNavigation weekStart={weekStart} isCurrentWeek={weekStart === startOfWeek(today)} />
      <WeekTotals
        plannedMinutes={workouts.reduce((sum, workout) => sum + workout.duration_minutes, 0)}
        availableMinutes={availability.reduce((sum, day) => sum + day.minutes, 0)}
      />
      {hasOpenDays && <PlanWeekButton weekStart={weekStart} />}
      {weekdays.map((weekday, index) => {
        const date = addDays(weekStart, index);
        return (
          <DayCard
            key={weekday}
            date={date}
            availableMinutes={availability[index].minutes}
            preferredSports={availability[index].sports}
            longSessions={availability[index].longSessions}
            workouts={workoutsPerDay[index]}
            isToday={date === today}
            // ISO dates compare correctly as plain text: "2026-09-30" < "2026-10-01".
            isPast={date < today}
          />
        );
      })}
    </div>
  );
}
