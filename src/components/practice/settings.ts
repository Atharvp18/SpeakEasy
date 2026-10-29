// Practice room settings: categories shown in the top settings bar.
export type Scenario = "pitch" | "interview" | "speech" | "custom";

export const SCENARIOS: { id: Exclude<Scenario, "custom">; label: string; count: number; hint: string }[] = [
  { id: "pitch", label: "Sales pitch", count: 1, hint: "Pitch to a buyer" },
  { id: "interview", label: "Interview", count: 4, hint: "Face an interview panel" },
  { id: "speech", label: "Speech", count: 16, hint: "Address a full room" },
];

export type SettingField = { id: string; label: string; options: string[] };
export type SettingCategory = { id: string; label: string; fields: SettingField[] };

export const CATEGORIES: SettingCategory[] = [
  {
    id: "setting",
    label: "Setting",
    fields: [
      { id: "venue", label: "Venue", options: ["Classroom", "Boardroom", "Auditorium", "Office", "Café"] },
      { id: "formality", label: "Room formality", options: ["Casual", "Professional"] },
    ],
  },
  {
    id: "audience",
    label: "Audience",
    fields: [{ id: "age", label: "Age range", options: ["Mixed", "College students", "Young professionals", "Middle-aged adults", "Seniors"] }],
  },
  {
    id: "interaction",
    label: "Interaction",
    fields: [
      { id: "questions", label: "Questions", options: ["Occasional", "None", "Frequent", "Rapid-fire"] },
      { id: "questionTone", label: "Question tone", options: ["Curious", "Friendly", "Skeptical", "Aggressive"] },
    ],
  },
  {
    id: "difficulty",
    label: "Difficulty",
    fields: [
      { id: "strictness", label: "Strictness", options: ["Standard", "Beginner", "Advanced"] },
      { id: "pressure", label: "Social pressure", options: ["Friendly practice", "Important meeting", "High-stakes event", "Hostile room"] },
    ],
  },
];

export type Settings = Record<string, string>;

export function defaultSettings(): Settings {
  const s: Settings = {};
  for (const c of CATEGORIES) for (const f of c.fields) s[f.id] = f.options[0]!;
  return s;
}
