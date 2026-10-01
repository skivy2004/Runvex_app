import { describe, expect, it } from "vitest";
import { racePresets } from "@/core/racePresets";
import { sports, weekdays } from "@/core/training";
import en from "../../messages/en.json";
import nl from "../../messages/nl.json";

/** All texts of a nested object as ["Section.key", text] pairs. */
function flatten(value: object, prefix = ""): [string, unknown][] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof child === "object" && child !== null
      ? flatten(child, path)
      : [[path, child] as [string, unknown]];
  });
}

const languages = { en, nl };

describe("translations", () => {
  it("has the same keys in English and Dutch", () => {
    const keys = (messages: object) => flatten(messages).map(([path]) => path).sort();
    // If this fails, the diff shows exactly which key is missing where.
    expect(keys(nl)).toEqual(keys(en));
  });

  it("has no empty texts", () => {
    for (const [language, messages] of Object.entries(languages)) {
      const empty = flatten(messages)
        .filter(([, text]) => typeof text !== "string" || text.trim() === "")
        .map(([path]) => `${language}: ${path}`);
      expect(empty).toEqual([]);
    }
  });

  it("names every sport, weekday and race preset", () => {
    for (const messages of Object.values(languages)) {
      for (const sport of sports) expect(messages.Sports[sport]).toBeTruthy();
      for (const weekday of weekdays) expect(messages.Weekdays[weekday]).toBeTruthy();
      for (const preset of racePresets) {
        expect(messages.RacePresets[preset.key].label).toBeTruthy();
        expect(messages.RacePresets[preset.key].description).toBeTruthy();
      }
    }
  });
});
