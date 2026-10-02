import { getLocale, getTranslations } from "next-intl/server";
import { PageHeading } from "@/components/PageHeading";
import { BackLink } from "@/components/profile/BackLink";
import { AddWorkoutForm, type LibraryOption } from "@/components/week/AddWorkoutForm";
import { startOfWeek, todayInTimeZone } from "@/core/dates";
import { isHardWorkout, maxDifficulty, plannableSports } from "@/core/planner";
import { isValidIsoDate } from "@/core/week";
import { estimatedMinutes } from "@/core/workouts/estimate";
import { workoutsForSport } from "@/core/workouts/library";
import { createClient } from "@/lib/supabase/server";
import { getAthleteSports } from "@/services/athleteSports";
import { getCurrentProfile } from "@/services/profile";

export default async function AddWorkoutPage({ searchParams }: PageProps<"/add">) {
  const t = await getTranslations("AddWorkout");
  const tWeek = await getTranslations("Week");
  const locale = await getLocale();
  const supabase = await createClient();
  const profile = await getCurrentProfile(supabase);
  if (!profile) return null;

  // ?date=2026-10-05 comes from "Add training" on a day; otherwise today.
  const today = todayInTimeZone(profile.timezone);
  const { date } = await searchParams;
  const initialDate = typeof date === "string" && isValidIsoDate(date) ? date : today;

  const sports = await getAthleteSports(supabase, profile.id);

  // The library workouts you can choose, per sport, suited to your level. Distance
  // runs and rides are left out: without a known duration they can't be planned.
  const library: LibraryOption[] = sports.flatMap(({ sport, level }) =>
    (plannableSports as readonly string[]).includes(sport)
      ? workoutsForSport(sport).flatMap((workout) => {
          const minutes = estimatedMinutes(workout, level);
          if (minutes === null || workout.difficulty > maxDifficulty[level]) return [];
          return [{ id: workout.id, sport, name: workout.name[locale], minutes, isHard: isHardWorkout(workout) }];
        })
      : [],
  );
  library.sort((a, b) => a.minutes - b.minutes || a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-6">
      <BackLink href={`/week?week=${startOfWeek(initialDate)}`} label={tWeek("title")} />
      <PageHeading title={t("title")} />
      <AddWorkoutForm
        initialDate={initialDate}
        sports={sports.map((item) => item.sport)}
        library={library}
      />
    </div>
  );
}
