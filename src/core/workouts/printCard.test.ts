import { describe, expect, it } from "vitest";
import { getWorkout } from "./library";
import { printLines, stepsMeters } from "./printCard";

describe("printLines", () => {
  const workout = getWorkout("swim_25_i_w2_t5_m2_s4_c1")!;
  const section = (name: string) => workout.swim!.sections.find((item) => item.section === name)!.steps;

  it("writes drill sets like a coach, with the equipment and the rest apart", () => {
    expect(printLines(section("technique"), "nl")).toEqual([
      { text: "3 × 50m (25m hondjes + 25m BC) met zoomers en snorkel", restSeconds: 10 },
      { text: "3 × 50m (25m rits + 25m BC) met zoomers", restSeconds: 10 },
    ]);
  });

  it("writes single sets with zone and equipment", () => {
    expect(printLines(section("main"), "nl")).toEqual([{ text: "3 × 200m armen Z2 met pullbuoy", restSeconds: 20 }]);
    expect(printLines(section("speed"), "en")).toEqual([{ text: "6 × 100m free Z3 with paddles", restSeconds: 30 }]);
  });

  it("writes the warm-up one set per line", () => {
    expect(printLines(section("warmup"), "nl")).toEqual([
      { text: "100m BC", restSeconds: 10 },
      { text: "4 × 50m (25m SS + 25m BC)", restSeconds: 10 },
      { text: "100m BC", restSeconds: null },
    ]);
  });

  it("adds up the meters of a block", () => {
    expect(stepsMeters(section("technique"))).toBe(300);
    expect(workout.swim!.sections.reduce((total, item) => total + stepsMeters(item.steps), 0)).toBe(
      workout.distanceMeters,
    );
  });
});
