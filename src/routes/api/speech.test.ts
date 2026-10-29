import { describe, expect, it } from "vitest";
import { normalizeReactions } from "./speech";

describe("normalizeReactions", () => {
  it("returns exactly one reaction per audience member, interest clamped 1–10", () => {
    const r = normalizeReactions([{ interest: 14, hasQuestion: false, question: "" }, { interest: 0 }], 3);
    expect(r.map((x) => x.interest)).toEqual([10, 1, 5]);
  });
  it("keeps the question text for members who have one", () => {
    const r = normalizeReactions([{ interest: 7, hasQuestion: true, question: "What does it cost?" }], 1);
    expect(r[0]).toEqual({ interest: 7, hasQuestion: true, question: "What does it cost?" });
  });
});
