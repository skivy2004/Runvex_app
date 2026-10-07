// Development-only preview of the week view with sample data, without logging in.
import { DayCard, type DayEditing } from "@/components/week/DayCard";
import { WeekDragAndDrop } from "@/components/week/WeekDragAndDrop";
import { WeekNavigation } from "@/components/week/WeekNavigation";
import { WeekTotals } from "@/components/week/WeekTotals";
import type { LongSessionSport } from "@/core/availability";
import { addDays, startOfWeek, todayInTimeZone } from "@/core/dates";
import { isHardWorkout, workoutAlternatives } from "@/core/planner";
import { weekdays } from "@/core/training";
import { getWorkout, zoneLegend } from "@/core/workouts/library";
import { groupByWeekday } from "@/core/week";
import type { PlannedWorkout } from "@/services/workouts";
import type { Activity } from "@/services/activities";
import { FitUpload } from "@/components/week/FitUpload";

export default function WeekPreviewPage() {
  const today = todayInTimeZone("Europe/Amsterdam");
  const weekStart = startOfWeek(today);
  const availability = [90, 0, 120, 105, 90, 105, 90];

  const workout = (
    dayIndex: number,
    sport: PlannedWorkout["sport"],
    title: string,
    minutes: number,
    templateId: string | null = null,
    notes: string | null = null,
  ) => ({
    id: `${dayIndex}-${title}`,
    scheduled_on: addDays(weekStart, dayIndex),
    sport,
    title,
    duration_minutes: minutes,
    position: 0,
    template_id: templateId,
    notes,
    status: "planned",
    rpe: null,
    feedback_note: null,
  });
  const workouts: PlannedWorkout[] = [
    workout(0, "swimming", "Watergevoel · Rustige duur", 45, "swim_25_i_w2_t1_m1_s0_c1", "Rustige duur in het water na het weekend."),
    workout(1, "running", "Easy run", 45), // on a rest day -> warning, own training without details
    workout(2, "cycling", "Intervals", 75, "bike_75min_4_threshold", "Je zware rit van de week, met een rustdag ervoor."),
    workout(2, "running", "Brick run", 60), // too much for the day -> warning
    workout(4, "running", "Fartlek", 45, "run_45_3_tempo"),
    workout(5, "cycling", "Long ride", 90,"bike_90min_1_easy", "Je lange rit: rustig in zone 2."),
  ];
  // Uploaded from the watch: the Monday swim (linked) and an extra ride on Thursday.
  const activity = (dayIndex: number, sport: Activity["sport"], plannedId: string | null, seconds: number, meters: number, extra: Partial<Activity> = {}): Activity => ({
    id: `activity-${dayIndex}`,
    planned_workout_id: plannedId,
    sport,
    started_at: `${addDays(weekStart, dayIndex)}T06:00:00Z`,
    performed_on: addDays(weekStart, dayIndex),
    duration_seconds: seconds,
    distance_meters: meters,
    avg_heart_rate: null,
    max_heart_rate: null,
    avg_power: null,
    ascent_meters: null,
    ...extra,
  });
  const activities: Activity[] = [
    activity(0, "swimming", workouts[0].id, 2700, 1650, { avg_heart_rate: 128, max_heart_rate: 151 }),
    activity(3, "cycling", null, 4320, 36400, { avg_power: 182, ascent_meters: 240 }),
  ];
  workouts[0].status = "done";

  // Saturday holds the long ride, Sunday the long run (not planned yet).
  const longSessions: LongSessionSport[][] = [[], [], [], [], [], ["cycling"], ["running"]];

  // Buttons and dragging show, but saving needs a logged-in user (real week page).
  const editing: DayEditing = {
    weekDates: weekdays.map((_, index) => addDays(weekStart, index)),
    alternativesFor: (item, isLong) => {
      const current = item.template_id ? getWorkout(item.template_id) : undefined;
      if (!current) return [];
      return workoutAlternatives(current, "intermediate", 90, isLong).map((c) => ({
        id: c.workout.id,
        name: c.workout.name.en,
        minutes: c.minutes,
        isHard: isHardWorkout(c.workout),
        description: c.workout.description["en"],
        sport: c.workout.sport,
        steps: c.workout.steps,
        zones: zoneLegend(c.workout, "en"),
      }));
    },
  };

  return (
    <main className="flex flex-col gap-4 py-6">
      <WeekNavigation weekStart={weekStart} isCurrentWeek />
      <WeekTotals
        plannedMinutes={workouts.reduce((sum, item) => sum + item.duration_minutes, 0)}
        availableMinutes={availability.reduce((sum, minutes) => sum + minutes, 0)}
      />
      <FitUpload hasHealthConsent />
      <WeekDragAndDrop>
      <div className="flex flex-col gap-4">
      {weekdays.map((weekday, index) => {
        const date = addDays(weekStart, index);
        return (
          <DayCard
            key={weekday}
            date={date}
            availableMinutes={availability[index]}
            longSessions={longSessions[index]}
            workouts={groupByWeekday(weekStart, workouts)[index]}
            activities={activities.filter((item) => item.performed_on === date)}
            isToday={date === today}
            isPast={date < today}
            weekIsPlanned={workouts.length > 0}
            editing={editing}
          />
        );
      })}
      </div>
      </WeekDragAndDrop>
    </main>
  );
}
