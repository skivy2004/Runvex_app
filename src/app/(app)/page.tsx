import { getLocale, getTranslations } from "next-intl/server";
import { CoachCard } from "@/components/home/CoachCard";
import { ComingUp } from "@/components/home/ComingUp";
import { FeedbackCard } from "@/components/home/FeedbackCard";
import { HomeHeader } from "@/components/home/HomeHeader";
import { RaceCard } from "@/components/home/RaceCard";
import { TodayCard } from "@/components/home/TodayCard";
import { WeekOverviewCard } from "@/components/home/WeekOverviewCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { addDays, startOfWeek, todayInTimeZone } from "@/core/dates";
import { isLocale } from "@/core/locale";
import { doneStreak, FEEDBACK_DAYS, feedbackTarget, hourInTimeZone, partOfDay, weekSportProgress } from "@/core/home";
import { getWorkout } from "@/core/workouts/library";
import { getRequestClient, getRequestProfile } from "@/lib/currentUser";
import { getMessagesAboutWorkouts } from "@/services/coachMessages";
import { getCurrentGoal } from "@/services/goals";
import { getPlannedWorkouts, getUpcomingWorkouts } from "@/services/workouts";

/** How many trainings "Coming up" shows after the next one. */
const COMING_UP = 5;
/** How far back the streak looks. */
const STREAK_DAYS = 60;

export default async function HomePage() {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const supabase = await getRequestClient();
  const profile = await getRequestProfile();
  // The proxy already sends logged-out visitors to /login.
  if (!profile) return null;

  // "Today" in the user's own time zone, not the server's.
  const today = todayInTimeZone(profile.timezone);
  const weekStart = startOfWeek(today);

  // These don't depend on each other, so we fetch them at the same time.
  const [weekWorkouts, upcoming, recent, goal] = await Promise.all([
    getPlannedWorkouts(supabase, profile.id, weekStart, addDays(weekStart, 6)),
    getUpcomingWorkouts(supabase, profile.id, today, COMING_UP + 1),
    getPlannedWorkouts(supabase, profile.id, addDays(today, -STREAK_DAYS), today),
    getCurrentGoal(supabase, profile.id, today),
  ]);

  // "How did your training go?": the latest recent training without a coach reaction,
  // and the coach's latest reaction (shown since yesterday, or while its proposal waits).
  const earliest = addDays(today, -FEEDBACK_DAYS);
  const recentIds = recent.filter((workout) => workout.scheduled_on >= earliest).map((workout) => workout.id);
  const reactions = await getMessagesAboutWorkouts(supabase, profile.id, recentIds);
  const target = feedbackTarget(recent, new Set(reactions.flatMap((message) => message.workout_id ?? [])), today, earliest);
  const since = addDays(today, -1);
  const reaction =
    reactions.find((message) => message.proposal_status === "pending" || message.created_at.slice(0, 10) >= since) ?? null;

  const [next = null, ...later] = upcoming;
  const progress = weekSportProgress(weekWorkouts);
  const planned = progress.reduce((total, item) => total + item.plannedMinutes, 0);
  const done = progress.reduce((total, item) => total + item.doneMinutes, 0);
  const nextTemplate = next?.template_id ? getWorkout(next.template_id) : undefined;

  // The sections come in one after the other.
  const rise = (index: number) => ({ className: "rise-in", style: { animationDelay: `${index * 60}ms` } });

  return (
    <div className="flex flex-col gap-5">
      <div {...rise(0)}>
        <HomeHeader
          name={profile.display_name}
          today={today}
          partOfDay={partOfDay(hourInTimeZone(profile.timezone))}
          streak={doneStreak(recent, today)}
        />
      </div>
      <div {...rise(1)}>
        <TodayCard workout={next} today={today} weekDone={planned === 0 ? 0 : done / planned} />
      </div>
      <div {...rise(2)}>
        <FeedbackCard target={target} reaction={reaction} today={today} />
      </div>
      <div {...rise(2)}>
        <RaceCard goal={goal} today={today} timeZone={profile.timezone} />
      </div>
      <section className="rise-in flex flex-col gap-3" style={rise(3).style}>
        <SectionHeading eyebrow={t("thisWeek")} title={t("trainingOverview")} link={{ href: "/week", label: t("seePlan") }} />
        <WeekOverviewCard progress={progress} weekStart={weekStart} today={today} workouts={weekWorkouts} />
      </section>
      {next?.notes && (
        <div {...rise(4)}>
          <CoachCard key={next.notes} note={next.notes} workoutName={nextTemplate?.name[isLocale(locale) ? locale : "en"] ?? next.title} />
        </div>
      )}
      <div {...rise(5)}>
        <ComingUp workouts={later} today={today} />
      </div>
    </div>
  );
}
