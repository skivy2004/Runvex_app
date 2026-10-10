import { describe, expect, it } from "vitest";
import { parseTracking, waitlistSchema } from "./waitlist";

describe("parseTracking", () => {
  it("normalizes a source and a promo code", () => {
    expect(parseTracking(" Card-Marathon ", "start30")).toEqual({ source: "card-marathon", promoCode: "START30" });
  });

  it("drops anything that doesn't fit instead of failing", () => {
    expect(parseTracking("<script>", "way-too-long-promo-code-123")).toEqual({ source: undefined, promoCode: undefined });
    expect(parseTracking(null, undefined)).toEqual({ source: undefined, promoCode: undefined });
    expect(parseTracking("", "")).toEqual({ source: undefined, promoCode: undefined });
  });
});

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
