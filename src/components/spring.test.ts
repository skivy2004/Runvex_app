import { expect, it, vi } from "vitest";
import { projectedDistance, rubberband, spring } from "@/components/spring";

it("settles on the target without overshoot at damping 1, and stops", () => {
  let now = 0;
  const queue: FrameRequestCallback[] = [];
  vi.stubGlobal("performance", { now: () => now });
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => (queue.push(cb), queue.length));
  vi.stubGlobal("cancelAnimationFrame", () => {});
  const values: number[] = [];
  let done = false;
  spring({ from: 70, to: 0, velocity: 300, response: 0.35, damping: 1, onUpdate: (v) => values.push(v), onDone: () => (done = true) });
  for (let i = 0; i < 200 && !done; i++) { now += 16; queue.shift()!(now); }
  expect(done).toBe(true);
  expect(values.at(-1)).toBe(0);
  expect(Math.min(...values)).toBeGreaterThan(-1);
  // It first keeps moving down with the finger's speed, then comes back.
  expect(Math.max(...values)).toBeGreaterThan(70);
  console.log("frames", values.length, "peak", Math.max(...values).toFixed(1));
});

it("projects flicks and resists past an edge", () => {
  expect(projectedDistance(1000)).toBeCloseTo(499, 0);
  expect(Math.abs(rubberband(-200, 400))).toBeLessThan(200);
});
