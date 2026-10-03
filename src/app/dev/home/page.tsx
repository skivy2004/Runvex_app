// Development-only preview of the Home dashboard with sample data, without logging in.
import { ComingUp } from "@/components/home/ComingUp";
import { CoachCard } from "@/components/home/CoachCard";
import { HomeHeader } from "@/components/home/HomeHeader";
import { RaceCard } from "@/components/home/RaceCard";
import { TodayCard } from "@/components/home/TodayCard";
import { WeekOverviewCard } from "@/components/home/WeekOverviewCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { addDays, startOfWeek, todayInTimeZone } from "@/core/dates";
import { weekSportProgress } from "@/core/home";
import type { PlannedWorkout } from "@/services/workouts";

export default function HomePreviewPage() {
  const timeZone = "Europe/Amsterdam";
  const today = todayInTimeZone(timeZone);
  const weekStart = startOfWeek(today);

  const sample = (day: number, sport: PlannedWorkout["sport"], templateId: string, minutes: number, status = "planned"): PlannedWorkout => ({
    id: `sample-${day}-${sport}`,
    scheduled_on: addDays(today, day),
    sport,
    title: templateId,
    duration_minutes: minutes,
    position: 0,
    template_id: templateId,
    notes: day === 0 ? "Rustige week tot nu toe, dus vandaag mag het stevig: houd de drempelblokken netjes op tempo." : null,
    status,
    rpe: null,
    feedback_note: null,
  });
  const next = sample(0, "running", "run_60_4_threshold", 60);
  const later = [sample(1, "swimming", "swim_25_i_w2_t5_m2_s0_c1", 50), sample(2, "cycling", "bike_90min_1_easy", 90)];
  const week = [sample(-2, "swimming", "swim_25_i_w1_t1_m1_s0_c1", 45, "done"), sample(-1, "cycling", "bike_60min_1_easy", 60, "done"), next, ...later];

  return (
    <main className="flex flex-col gap-5 py-6">
      <HomeHeader name="Jeremy" today={today} partOfDay="morning" streak={4} />
      <TodayCard workout={next} today={today} weekDone={0.35} />
      <RaceCard
        goal={{ id: "g", description: "Ironman", sports: [], event_name: "Ironman Tallinn", event_date: addDays(today, 330), race_preset: null, segments: [] }}
        today={today}
        timeZone={timeZone}
      />
      <section className="flex flex-col gap-3">
        <SectionHeading eyebrow="This week" title="Training overview" link={{ href: "/week", label: "See plan" }} />
        <WeekOverviewCard progress={weekSportProgress(week)} weekStart={weekStart} today={today} workouts={week} />
      </section>
      <CoachCard note={next.notes!} workoutName="1h Threshold" />
      <ComingUp workouts={later} today={today} />
    </main>
  );
}
