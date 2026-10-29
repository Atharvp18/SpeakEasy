import { z } from "zod";
import { MAX_AUDIENCE } from "@/components/audience/look";
import type { Scenario } from "./settings";

export function validatePracticeSearch(search: Record<string, unknown>) {
  const scenario = z.string().safeParse(search.scenario);
  const count = z.number().safeParse(search.count);
  return {
    scenario: scenario.success ? scenario.data : "custom",
    count: count.success ? count.data : 8,
  };
}

export function practiceAudienceCount(count: number) {
  return Number.isFinite(count) ? Math.max(1, Math.min(MAX_AUDIENCE, Math.floor(count))) : 8;
}

export function practiceScenario(scenario: string): Scenario {
  return scenario === "pitch" || scenario === "interview" || scenario === "speech" ? scenario : "custom";
}