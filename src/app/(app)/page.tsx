import { GoalCard } from "@/components/home/GoalCard";
import { HomeHeader } from "@/components/home/HomeHeader";
import { NextWorkoutCard } from "@/components/home/NextWorkoutCard";
import { WeekSummaryCard } from "@/components/home/WeekSummaryCard";
import { addDays, isoWeekday, startOfWeek, todayInTimeZone } from "@/core/dates";
import { createClient } from "@/lib/supabase/server";
import { getWeeklyAvailability } from "@/services/availability";
import { getCurrentGoal } from "@/services/goals";
import { getCurrentProfile } from "@/services/profile";
import { getNextWorkout, getPlannedWorkouts } from "@/services/workouts";

export default async function HomePage() {
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  // The proxy already sends logged-out visitors to /login.
  if (!profile) return null;

  // "Today" in the user's own time zone, not the server's.
  const today = todayInTimeZone(profile.timezone);
  const weekStart = startOfWeek(today);

  // These don't depend on each other, so we fetch them at the same time.
  const [availability, weekWorkouts, nextWorkout, goal] = await Promise.all([
    getWeeklyAvailability(supabase, profile.id),
    getPlannedWorkouts(supabase, profile.id, weekStart, addDays(weekStart, 6)),
    getNextWorkout(supabase, profile.id, today),
    getCurrentGoal(supabase, profile.id, today),
  ]);

  const plannedMinutes = weekWorkouts.reduce((sum, workout) => sum + workout.duration_minutes, 0);

  return (
    <div className="flex flex-col gap-4">
      <HomeHeader name={profile.display_name} today={today} />
      <WeekSummaryCard
        plannedMinutes={plannedMinutes}
        availability={availability.map((day) => day.minutes)}
        todayWeekday={isoWeekday(today)}
      />
      <NextWorkoutCard
        workout={nextWorkout}
        today={today}
        isLongSession={
          nextWorkout !== null &&
          (availability[isoWeekday(nextWorkout.scheduled_on) - 1].longSessions as string[]).includes(
            nextWorkout.sport,
          )
        }
      />
      <GoalCard goal={goal} today={today} />
    </div>
  );
}
