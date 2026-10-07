import { Encoder, Profile } from "@garmin/fitsdk";
import { describe, expect, it } from "vitest";
import { matchPlannedWorkout, performedOn, readFitFile, sportFromFit } from "./activities";

/** Message data in the shape the SDK writes (its types only describe the common fields). */
type MesgData = Parameters<Encoder["onMesg"]>[1];
const mesg = (data: Record<string, unknown>) => data as MesgData;

/** A small .FIT file like a watch writes, with one session per entry. */
function fitFile(sessions: Record<string, unknown>[]): Uint8Array {
  const encoder = new Encoder();
  const start = new Date("2026-10-05T05:30:00Z");
  encoder.onMesg(Profile.MesgNum.FILE_ID, mesg({ manufacturer: "development", product: 1, timeCreated: start, type: "activity" }));
  for (const session of sessions) {
    encoder.onMesg(Profile.MesgNum.SESSION, mesg({ timestamp: start, startTime: start, ...session }));
  }
  encoder.onMesg(Profile.MesgNum.ACTIVITY, mesg({ timestamp: start, numSessions: sessions.length, type: "manual" }));
  return encoder.close();
}

describe("readFitFile", () => {
  it("reads a run's summary", () => {
    const result = readFitFile(
      fitFile([{ sport: "running", totalTimerTime: 2820, totalElapsedTime: 2900, totalDistance: 8250.4, avgHeartRate: 142, maxHeartRate: 171, totalAscent: 35 }]),
    );
    expect(result).toEqual({
      ok: true,
      unsupported: 0,
      activities: [
        {
          sport: "running",
          startedAt: new Date("2026-10-05T05:30:00Z"),
          durationSeconds: 2820,
          distanceMeters: 8250,
          avgHeartRate: 142,
          maxHeartRate: 171,
          avgPower: null,
          ascentMeters: 35,
        },
      ],
    });
  });

  it("splits a triathlon into its sports and skips the transitions", () => {
    const result = readFitFile(
      fitFile([
        { sport: "swimming", totalTimerTime: 1500, totalDistance: 1500 },
        { sport: "transition", totalTimerTime: 120 },
        { sport: "cycling", totalTimerTime: 4000, totalDistance: 40000, avgPower: 210 },
        { sport: "running", totalTimerTime: 2500, totalDistance: 10000 },
      ]),
    );
    expect(result.ok && result.activities.map((activity) => activity.sport)).toEqual(["swimming", "cycling", "running"]);
  });

  it("counts sports it doesn't track and refuses files that aren't FIT", () => {
    expect(readFitFile(fitFile([{ sport: "walking", totalTimerTime: 1800 }]))).toEqual({ ok: true, activities: [], unsupported: 1 });
    expect(readFitFile(new TextEncoder().encode("not a fit file at all"))).toEqual({ ok: false, error: "notFit" });
  });
});

describe("matching", () => {
  it("maps strength training and e-bikes", () => {
    expect(sportFromFit("training", "strengthTraining")).toBe("strength");
    expect(sportFromFit("eBiking", "generic")).toBe("cycling");
    expect(sportFromFit("hiking", "generic")).toBeNull();
  });

  it("uses the athlete's own day, also just after midnight", () => {
    expect(performedOn({ startedAt: new Date("2026-10-05T22:30:00Z") }, "Europe/Amsterdam")).toBe("2026-10-06");
  });

  it("links to the open training of the same sport closest in length", () => {
    const planned = [
      { id: "bike", sport: "cycling" as const, status: "planned", duration_minutes: 60 },
      { id: "short", sport: "running" as const, status: "planned", duration_minutes: 30 },
      { id: "long", sport: "running" as const, status: "planned", duration_minutes: 50 },
      { id: "done", sport: "running" as const, status: "done", duration_minutes: 47 },
    ];
    expect(matchPlannedWorkout({ sport: "running", durationSeconds: 47 * 60 }, planned, new Set())).toBe("long");
    expect(matchPlannedWorkout({ sport: "running", durationSeconds: 47 * 60 }, planned, new Set(["long", "short"]))).toBe("done");
    expect(matchPlannedWorkout({ sport: "swimming", durationSeconds: 1800 }, planned, new Set())).toBeNull();
  });
});
