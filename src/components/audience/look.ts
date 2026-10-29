import type { Reaction } from "@/routes/api/speech";
// Shared audience data (browser-safe).
export type Mood = "bored" | "distracted" | "interested" | "listening" | "question";
export const MOODS: Mood[] = ["listening", "interested", "bored", "distracted", "question"];
export const MAX_AUDIENCE = 16;
export const PER_ROW = 8;

export const MOOD_EMOJI: Record<Mood, string | null> = {
  bored: "😴",
  distracted: null,
  question: "❓",
  interested: null,
  listening: null,
};

export function nextMood(m: Mood): Mood {
  return MOODS[(MOODS.indexOf(m) + 1) % MOODS.length] ?? "listening";
}

/** Number of drawn characters (a–d), each drawn in every mood pose. */
export const CHARACTERS = ["a", "b", "c", "d"] as const;

/** Random, evenly represented characters with no identical neighbouring seats. */
export function shuffledCast() {
  const usage = new Map<string, number>(CHARACTERS.map((who) => [who, 0]));
  let previous: (typeof CHARACTERS)[number] | undefined;
  return Array.from({ length: MAX_AUDIENCE }, () => {
    const available = CHARACTERS.filter((who) => who !== previous);
    const minimum = Math.min(...available.map((who) => usage.get(who) ?? 0));
    const candidates = available.filter((who) => usage.get(who) === minimum);
    const who = candidates[Math.floor(Math.random() * candidates.length)] ?? CHARACTERS[0];
    usage.set(who, (usage.get(who) ?? 0) + 1);
    previous = who;
    return { who, flip: Math.random() < 0.5 };
  });
}
export type CastMember = ReturnType<typeof shuffledCast>[number];

/** Keep rows within capacity and distribute extra seats one per row. */
export function seatingRows(count: number): number[][] {
  const total = Math.max(0, Math.min(MAX_AUDIENCE, Math.floor(count)));
  if (!total) return [];
  const rowCount = Math.ceil(total / PER_ROW);
  const baseSize = Math.floor(total / rowCount);
  const extra = total % rowCount;
  let seat = 0;
  return Array.from({ length: rowCount }, (_, row) =>
    Array.from({ length: baseSize + (row < extra ? 1 : 0) }, () => seat++),
  );
}

/** Interest 1–2 → on their phone, 3–4 → bored, 5–6 → listening, 7–10 → interested; a question overrides. */
export function moodFromReaction(r: Reaction): Mood {
  if (r.hasQuestion) return "question";
  return r.interest <= 2 ? "distracted" : r.interest <= 4 ? "bored" : r.interest <= 6 ? "listening" : "interested";
}
