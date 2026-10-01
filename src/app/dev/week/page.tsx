// Development-only preview of the week view with sample data, without logging in.
import { DayCard } from "@/components/week/DayCard";
import { WeekNavigation } from "@/components/week/WeekNavigation";
import { WeekTotals } from "@/components/week/WeekTotals";
import { addDays, startOfWeek, todayInTimeZone } from "@/core/dates";
import { weekdays } from "@/core/training";
import { groupByWeekday } from "@/core/week";
import type { PlannedWorkout } from "@/services/workouts";

export default function WeekPreviewPage() {
  const today = todayInTimeZone("Europe/Amsterdam");
  const weekStart = startOfWeek(today);
  const availability = [90, 0, 120, 105, 90, 105, 0];

  const workout = (dayIndex: number, sport: PlannedWorkout["sport"], title: string, minutes: number) => ({
    id: `${dayIndex}-${title}`,
    scheduled_on: addDays(weekStart, dayIndex),
    sport,
    title,
    duration_minutes: minutes,
    position: 0,
  });
  const workouts: PlannedWorkout[] = [
    workout(0, "swimming", "Technique swim", 60),
    workout(1, "running", "Easy run", 45), // on a rest day -> warning
    workout(2, "cycling", "Intervals", 75),
    workout(2, "running", "Brick run", 60), // too much for the day -> warning
    workout(5, "cycling", "Long ride", 105),
  ];

  return (
    <main className="flex flex-col gap-4 py-6">
      <WeekNavigation weekStart={weekStart} isCurrentWeek />
      <WeekTotals
        plannedMinutes={workouts.reduce((sum, item) => sum + item.duration_minutes, 0)}
        availableMinutes={availability.reduce((sum, minutes) => sum + minutes, 0)}
      />
      {weekdays.map((weekday, index) => {
        const date = addDays(weekStart, index);
        return (
          <DayCard
            key={weekday}
            date={date}
            availableMinutes={availability[index]}
            workouts={groupByWeekday(weekStart, workouts)[index]}
            isToday={date === today}
            isPast={date < today}
          />
        );
      })}
    </main>
  );
}
