import { describe, expect, it } from "vitest";
import { practiceAudienceCount, practiceScenario, validatePracticeSearch } from "./search";

describe("practice link validation", () => {
  it("accepts an old 20-person link and caps the room at 16", () => {
    const search = validatePracticeSearch({ scenario: "speech", count: 20 });
    expect(search.count).toBe(20);
    expect(practiceAudienceCount(search.count)).toBe(16);
  });
  it("keeps counts within 1–16, including malformed values", () => {
    expect(practiceAudienceCount(-5)).toBe(1);
    expect(practiceAudienceCount(16)).toBe(16);
    expect(practiceAudienceCount(4.9)).toBe(4);
    expect(practiceAudienceCount(validatePracticeSearch({ count: "bad" }).count)).toBe(8);
  });
  it("handles unrecognized scenarios without rejecting the link", () => {
    expect(practiceScenario(validatePracticeSearch({ scenario: "unknown" }).scenario)).toBe("custom");
    expect(practiceScenario("speech")).toBe("speech");
  });
});