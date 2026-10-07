import { getLocale, getTranslations } from "next-intl/server";
import { PageHeading } from "@/components/PageHeading";
import { DayCard, type DayEditing } from "@/components/week/DayCard";
import { PlanWeekButton } from "@/components/week/PlanWeekButton";
import { SendWeekToWatchButton } from "@/components/week/SendWeekToWatchButton";
import { WeekDragAndDrop } from "@/components/week/WeekDragAndDrop";
import { WeekNavigation } from "@/components/week/WeekNavigation";
import { WeekTotals } from "@/components/week/WeekTotals";
import { addDays, daysBetween, startOfWeek, todayInTimeZone } from "@/core/dates";
import { isHardWorkout, workoutAlternatives } from "@/core/planner";
import { weekdays } from "@/core/training";
import { swimSettingsOf } from "@/core/validation/swim";
import { groupByWeekday, resolveWeekStart } from "@/core/week";
import { getWorkout, zoneLegend } from "@/core/workouts/library";
import { getAthleteSports } from "@/services/athleteSports";
import { getWeeklyAvailability } from "@/services/availability";
import { isWatchSyncConfigured } from "@/services/watchSync";
import { getRequestClient, getRequestProfile } from "@/lib/currentUser";
import { getPlannedWorkouts } from "@/services/workouts";
import { getActivities } from "@/services/activities";
import { FitUpload } from "@/components/week/FitUpload";
import { loadSeason } from "@/services/season";
import { SeasonWeekCard } from "@/components/season/SeasonWeekCard";

export default async function WeekPage({ searchParams }: PageProps<"/week">) {
  const t = await getTranslations("Week");
  const locale = await getLocale();
  const supabase = await getRequestClient();
  const profile = await getRequestProfile();
  // The proxy already sends logged-out visitors to /login.
  if (!profile) return null;

  const today = todayInTimeZone(profile.timezone);
  // ?week=2026-09-28 in the URL picks the week; without it we show this week.
  const { week } = await searchParams;
  const weekStart = resolveWeekStart(typeof week === "string" ? week : undefined, today);

  const [availability, workouts, sports, season, activities] = await Promise.all([
    getWeeklyAvailability(supabase, profile.id),
    getPlannedWorkouts(supabase, profile.id, weekStart, addDays(weekStart, 6)),
    getAthleteSports(supabase, profile.id),
    loadSeason(supabase, profile.id, today),
    getActivities(supabase, profile.id, weekStart, addDays(weekStart, 6)),
  ]);
  const workoutsPerDay = groupByWeekday(weekStart, workouts);
  // Show "Plan my week" while a training day from today on is still empty.
  const hasOpenDays = availability.some(
    (day, index) =>
      day.minutes > 0 && addDays(weekStart, index) >= today && workoutsPerDay[index].length === 0,
  );

  // What "Swap" offers per training: library workouts of the same kind that fit the day.
  const editing: DayEditing = {
    weekDates: weekdays.map((_, index) => addDays(weekStart, index)),
    alternativesFor: (workout, isLongSession) => {
      const current = workout.template_id ? getWorkout(workout.template_id) : undefined;
      const level = sports.find((item) => item.sport === workout.sport)?.level;
      if (!current || !level) return [];
      const dayMinutes = availability[daysBetween(weekStart, workout.scheduled_on)]?.minutes ?? 0;
      const swim = swimSettingsOf(profile);
      return workoutAlternatives(current, level, dayMinutes, isLongSession, swim).map((candidate) => ({
        id: candidate.workout.id,
        name: candidate.workout.name[locale],
        minutes: candidate.minutes,
        isHard: isHardWorkout(candidate.workout),
        description: candidate.workout.description[locale],
        sport: candidate.workout.sport,
        steps: candidate.workout.steps,
        zones: zoneLegend(candidate.workout, locale),
        swim: candidate.workout.swim,
      }));
    },
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeading title={t("title")} />
      <WeekNavigation weekStart={weekStart} isCurrentWeek={weekStart === startOfWeek(today)} />
      <WeekTotals
        plannedMinutes={workouts.reduce((sum, workout) => sum + workout.duration_minutes, 0)}
        availableMinutes={availability.reduce((sum, day) => sum + day.minutes, 0)}
      />
      <SeasonWeekCard
        week={season.weekFor(weekStart)}
        canChange={weekStart >= startOfWeek(today)}
        isOverride={season.recoveryWeeks.includes(weekStart)}
      />
      {hasOpenDays && <PlanWeekButton weekStart={weekStart} />}
      {isWatchSyncConfigured() && workouts.length > 0 && <SendWeekToWatchButton weekStart={weekStart} />}
      {/* Trainings you did can only be uploaded for this week and earlier. */}
      {weekStart <= today && <FitUpload hasHealthConsent={profile.health_consent_at !== null} />}
      <WeekDragAndDrop>
        <div className="flex flex-col gap-4">
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
                activities={activities.filter((activity) => activity.performed_on === date)}
                isToday={date === today}
                // ISO dates compare correctly as plain text: "2026-09-30" < "2026-10-01".
                isPast={date < today}
                weekIsPlanned={workouts.length > 0}
                editing={editing}
              />
            );
          })}
        </div>
      </WeekDragAndDrop>
    </div>
  );
}
