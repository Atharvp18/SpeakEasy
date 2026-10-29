import { describe, expect, it } from "vitest";
import { moodFromReaction, seatingRows, shuffledCast } from "./look";

const r = (interest: number, hasQuestion = false) => ({ interest, hasQuestion, question: hasQuestion ? "Why?" : "" });

describe("seating arrangement", () => {
  it("never seats identical characters next to each other in any row", () => {
    for (let attempt = 0; attempt < 100; attempt++) {
      const cast = shuffledCast();
      for (let count = 1; count <= 16; count++) {
        for (const row of seatingRows(count)) {
          for (let i = 1; i < row.length; i++) {
            expect(cast[row[i] ?? 0]?.who).not.toBe(cast[row[i - 1] ?? 0]?.who);
          }
        }
      }
    }
  });

  it("splits 10 people into 5 and 5, and 9 into 5 and 4", () => {
    expect(seatingRows(10).map((row) => row.length)).toEqual([5, 5]);
    expect(seatingRows(9).map((row) => row.length)).toEqual([5, 4]);
  });

  it("balances every supported count within two rows of eight", () => {
    for (let count = 1; count <= 16; count++) {
      const rows = seatingRows(count);
      const sizes = rows.map((row) => row.length);
      expect(Math.max(...sizes) - Math.min(...sizes)).toBeLessThanOrEqual(1);
      expect(Math.max(...sizes)).toBeLessThanOrEqual(8);
      expect(rows.length).toBeLessThanOrEqual(2);
      expect(rows.flat()).toEqual(Array.from({ length: count }, (_, i) => i));
    }
  });
});

describe("moodFromReaction", () => {
  it("maps interest bands to poses", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 10].map((i) => moodFromReaction(r(i)))).toEqual([
      "distracted", "distracted", "bored", "bored", "listening", "listening", "interested", "interested",
    ]);
  });
  it("a question always raises the hand", () => {
    expect(moodFromReaction(r(2, true))).toBe("question");
  });
});
