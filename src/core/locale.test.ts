import { describe, expect, it } from "vitest";
import { isLocale, pickLocaleFromAcceptLanguage } from "./locale";

describe("pickLocaleFromAcceptLanguage", () => {
  it("picks Dutch for a Dutch browser", () => {
    expect(pickLocaleFromAcceptLanguage("nl-NL,nl;q=0.9,en;q=0.8")).toBe("nl");
  });

  it("picks the first supported language", () => {
    expect(pickLocaleFromAcceptLanguage("de-DE,de;q=0.9,nl;q=0.8,en;q=0.7")).toBe("nl");
  });

  it("falls back to English for unsupported languages", () => {
    expect(pickLocaleFromAcceptLanguage("fr-FR,fr;q=0.9")).toBe("en");
  });

  it("falls back to English without a header", () => {
    expect(pickLocaleFromAcceptLanguage(null)).toBe("en");
  });
});

describe("isLocale", () => {
  it("only accepts supported languages", () => {
    expect(isLocale("nl")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});
