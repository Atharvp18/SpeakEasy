import { createFileRoute } from "@tanstack/react-router";

const MAX_BYTES = 10 * 1024 * 1024;

export const Route = createFileRoute("/api/transcribe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const len = Number(request.headers.get("content-length") ?? 0);
        if (len > MAX_BYTES) return new Response("Audio too large", { status: 413 });
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Captions are not configured", { status: 500 });
        const form = await request.formData();
        const file = form.get("file");
        if (!(file instanceof File) || !file.size || file.size > MAX_BYTES || !file.type.startsWith("audio/")) {
          return new Response("Invalid audio", { status: 400 });
        }
        const out = new FormData();
        out.append("model", "openai/gpt-transcribe");
        out.append("file", file, file.name);
        out.append("response_format", "json");
        out.append("stream", "true");
        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/audio/transcriptions", {
          method: "POST",
          headers: { Authorization: `Bearer ${apiKey}` },
          body: out,
          signal: request.signal,
        });
        return new Response(upstream.body, {
          status: upstream.status,
          headers: { "content-type": upstream.headers.get("content-type") ?? "text/event-stream" },
        });
      },
    },
  },
});
