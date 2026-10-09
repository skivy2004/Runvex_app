import { describe, expect, it } from "vitest";
import { waitlistSchema } from "./waitlist";

describe("waitlistSchema", () => {
  it("accepts an address and normalizes it", () => {
    expect(waitlistSchema.parse({ email: "  Jane@Example.COM " })).toEqual({ email: "jane@example.com" });
  });

  it("refuses something that isn't an email address", () => {
    expect(waitlistSchema.safeParse({ email: "jane" }).success).toBe(false);
    expect(waitlistSchema.safeParse({ email: "" }).success).toBe(false);
  });

  it("refuses an address longer than 254 characters", () => {
    expect(waitlistSchema.safeParse({ email: `${"a".repeat(250)}@x.nl` }).success).toBe(false);
  });
});
