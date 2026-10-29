import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

// Reads an audience member's question aloud. Each drawn character has its own voice.
export const VOICES: Record<string, string> = { a: "Kore", b: "Puck", c: "Aoede", d: "Charon" };

const Body = z.object({ text: z.string().min(1).max(500), who: z.enum(["a", "b", "c", "d"]) });

export const Route = createFileRoute("/api/voice")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Voice is not configured", { status: 500 });
        const parsed = Body.safeParse(await request.json().catch(() => null));
        if (!parsed.success) return new Response("Invalid request", { status: 400 });
        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-3.1-flash-tts-preview",
            contents: [{ role: "user", parts: [{ text: parsed.data.text }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICES[parsed.data.who] } } },
            },
            stream_format: "audio",
          }),
          signal: request.signal,
        });
        return new Response(upstream.body, {
          status: upstream.status,
          headers: { "content-type": upstream.headers.get("content-type") ?? "audio/wav" },
        });
      },
    },
  },
});
