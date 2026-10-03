import { getLocale } from "next-intl/server";
import { SwimPrintCard } from "@/components/week/SwimPrintCard";
import { getWorkout } from "@/core/workouts/library";

// Preview of the swim print card with a sample training (development only).
export default async function DevPrintPage() {
  const locale = await getLocale();
  const workout = getWorkout("swim_25_i_w2_t5_m2_s4_c1")!;
  return (
    <div className="py-6">
      <SwimPrintCard workout={workout} swim={workout.swim!} date="za 3 okt" locale={locale} />
    </div>
  );
}
