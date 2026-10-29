import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const Body = z.object({
  sessionId: z.string().min(1).max(100),
  text: z.string().max(10000),
  isFinal: z.boolean(),
  timestamp: z.string().max(40),
  audienceSize: z.number().int().min(0).max(16),
  durationSeconds: z.number().min(0).max(36000).optional(),
  scenario: z.enum(["pitch", "interview", "speech", "custom"]).default("custom"),
  /** Recent transcript for context (the chunk alone is too short to judge). */
  context: z.string().max(4000).optional(),
  /** Practice settings chosen in the settings bar (venue, age range, question frequency…). */
  settings: z.record(z.string().max(40), z.string().max(60)).optional(),
});

const FILLERS = ["um", "uh", "like", "you know", "so", "basically", "actually"];

export function analyzeSpeech(text: string, durationSeconds: number) {
  const lower = ` ${text.toLowerCase().replace(/[^a-z' ]/g, " ")} `;
  const words = lower.trim().split(/\s+/).filter(Boolean);
  const fillerWords: Record<string, number> = {};
  for (const f of FILLERS) {
    const n = lower.split(` ${f} `).length - 1;
    if (n) fillerWords[f] = n;
  }
  const wordsPerMinute = durationSeconds > 0 ? Math.round((words.length / durationSeconds) * 60) : 0;
  const totalFillers = Object.values(fillerWords).reduce((a, b) => a + b, 0);
  const pace =
    wordsPerMinute === 0 ? "" : wordsPerMinute < 110 ? "a bit slowly" : wordsPerMinute > 170 ? "a bit fast" : "at a comfortable pace";
  const summary = words.length
    ? `You spoke ${words.length} words${pace ? ` ${pace} (${wordsPerMinute} wpm)` : ""} and used ${totalFillers} filler word${totalFillers === 1 ? "" : "s"}.`
    : "We didn't catch any words this time.";
  return { wordCount: words.length, wordsPerMinute, fillerWords, summary };
}

export type Reaction = { interest: number; hasQuestion: boolean; question: string };

const MODEL = "google/gemini-3.8-flash";
const SCENARIO_LABEL = { pitch: "a sales pitch", interview: "a job interview", speech: "a public speech", custom: "a public talk" } as const;

/** Clamp/pad the model's answer to exactly `n` members, at most 2 with questions. */
export function normalizeReactions(raw: unknown, n: number): Reaction[] {
  const list = Array.isArray(raw) ? raw : [];
  let asked = 0;
  return Array.from({ length: n }, (_, i) => {
    const r = (list[i] ?? {}) as Partial<Reaction>;
    const interest = Math.min(10, Math.max(1, Math.round(Number.isFinite(Number(r.interest)) && r.interest !== undefined ? Number(r.interest) : 5)));
    const wants = r.hasQuestion === true && typeof r.question === "string" && r.question.trim().length > 0 && asked < 2;
    if (wants) asked++;
    return { interest, hasQuestion: wants, question: wants ? r.question!.trim().slice(0, 200) : "" };
  });
}

async function gradeAudience(apiKey: string, text: string, n: number, scenario: keyof typeof SCENARIO_LABEL, settings: Record<string, string>, signal: AbortSignal) {
  const schema = {
    type: "object",
    additionalProperties: false,
    required: ["members"],
    properties: {
      members: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["interest", "hasQuestion", "question"],
          properties: {
            interest: { type: "integer", minimum: 1, maximum: 10 },
            hasQuestion: { type: "boolean" },
            question: { type: "string" },
          },
        },
      },
    },
  };
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      response_format: { type: "json_schema", json_schema: { name: "audience", strict: true, schema } },
      messages: [
        {
          role: "system",
          content:
            `You are simulating ${n} audience members listening to a live talk: ${SCENARIO_LABEL[scenario]}. ` +
            `Each member has their own personality and patience level, but they are a normal, polite audience who WANTS the talk to be good.

The transcript below is raw speech-to-text: it has no punctuation and may contain recognition errors. Do NOT penalize missing punctuation, run-on text, or transcription mistakes. Judge the speaker, not the transcription.

Focus mostly on the LAST 2-3 sentences, since that is what the audience is reacting to right now. Earlier parts matter only a little.

Give each member an "interest" score from 1 to 10 using this scale:

- 1-2: asleep or on their phone. Pure filler, rambling, nothing being said.

- 3-4: bored. Vague, repetitive, lots of "um/uh/like", no specifics.

- 5-6: neutral, politely listening. Clear but plain information.

- 7-8: engaged. Concrete facts, clear points, good flow.

- 9-10: captivated. A story, a surprising fact, a specific number, humor, or a question to the audience.

Start every member at 6 and move up or down based on what was said. A clear, specific, energetic passage should get mostly 7-10. A vague, filler-heavy passage should get mostly 1-4. Members should differ by 1-2 points from each other, not wildly.

Occasionally (at most 2 members, and only if something specific was said worth asking about), a member has a question: set hasQuestion true and write the short question. Otherwise hasQuestion false and question "". ` +
            (Object.keys(settings).length ? `Practice settings to role-play: ${Object.entries(settings).slice(0, 20).map(([k, v]) => `${k}: ${v}`).join("; ")}. ` : "") +
            `Return exactly ${n} members.`,
        },
        { role: "user", content: text || "(the speaker has not said anything yet)" },
      ],
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text();
    console.error(`[speech] gateway ${res.status}: ${body.slice(0, 300)}`);
    return { status: res.status, error: body.slice(0, 300) };
  }
  // Accumulate the streamed answer server-side.
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  let out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const d = line.startsWith("data:") ? line.slice(5).trim() : "";
      if (!d || d === "[DONE]") continue;
      try {
        out += JSON.parse(d).choices?.[0]?.delta?.content ?? "";
      } catch {
        /* partial frame */
      }
    }
  }
  try {
    return { members: normalizeReactions(JSON.parse(out).members, n) };
  } catch {
    return { status: 502, error: "Could not read the audience reaction" };
  }
}

export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let json: unknown;
        try {
          json = await request.json();
        } catch {
          return Response.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
        }
        const parsed = Body.safeParse(json);
        if (!parsed.success) {
          return Response.json({ ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
        }
        const b = parsed.data;
        console.log(`[speech] ${b.sessionId} ${b.isFinal ? "FINAL" : "chunk"}: ${b.text.slice(0, 200)}`);
        if (b.isFinal) return Response.json({ ok: true, feedback: analyzeSpeech(b.text, b.durationSeconds ?? 0) });
        if (b.audienceSize === 0) return Response.json({ ok: true, members: [] });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return Response.json({ ok: false, error: "AI is not configured" }, { status: 500 });
        const r = await gradeAudience(apiKey, b.context ?? b.text, b.audienceSize, b.scenario, b.settings ?? {}, request.signal);
        if ("error" in r) return Response.json({ ok: false, error: r.error }, { status: r.status === 402 || r.status === 429 || r.status === 403 ? r.status : 502 });
        return Response.json({ ok: true, members: r.members });
      },
    },
  },
});
