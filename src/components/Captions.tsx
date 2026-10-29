import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { encodeWav } from "@/lib/wav";
import type { Reaction } from "@/routes/api/speech";

const CHUNK_MS = 4000;

async function transcribeChunk(file: File, onDelta: (t: string) => void) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/transcribe", { method: "POST", body: form });
  if (!res.ok || !res.body) throw new Error((await res.text()) || `Captions failed (${res.status})`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "transcript.text.delta" && ev.delta) onDelta(ev.delta);
        if (ev.type === "error") throw new Error(ev.error?.message ?? "Captions failed");
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
}

function sendSpeech(body: Record<string, unknown>) {
  return fetch("/api/speech", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, timestamp: new Date().toISOString() }),
  }).then((r) => r.json() as Promise<{ ok: boolean; feedback?: { summary: string }; members?: Reaction[]; error?: string }>);
}

export function Captions({
  audienceSize,
  scenario,
  settings,
  onReactions,
}: {
  settings?: Record<string, string>;
  audienceSize: number;
  scenario: "pitch" | "interview" | "speech" | "custom";
  /** Called with Gemini's per-member reaction after each chunk. */
  onReactions?: (members: Reaction[]) => void;
}) {
  const reactRef = useRef(onReactions);
  reactRef.current = onReactions;
  const scenarioRef = useRef(scenario);
  scenarioRef.current = scenario;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const [on, setOn] = useState(false);
  const [feedback, setFeedback] = useState("");
  const sizeRef = useRef(audienceSize);
  sizeRef.current = audienceSize;
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const stopRef = useRef<() => void>(() => {});
  const genRef = useRef(0);

  useEffect(() => {
    return () => {
      genRef.current++;
      stopRef.current();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function start() {
    stopRef.current();
    const gen = ++genRef.current;
    setError("");
    setText("");
    setFeedback("");
    const sessionId = crypto.randomUUID();
    const startedAt = Date.now();
    let full = "";
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      if (gen === genRef.current) setError("Microphone access is needed for captions.");
      return;
    }
    if (gen !== genRef.current) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    const ctx = new AudioContext();
    await ctx.resume();
    const source = ctx.createMediaStreamSource(stream);
    const node = ctx.createScriptProcessor(4096, 1, 1);
    let chunks: Float32Array[] = [];
    let queue = Promise.resolve();
    let stopped = false;
    node.onaudioprocess = (e) => chunks.push(new Float32Array(e.inputBuffer.getChannelData(0)));
    source.connect(node);
    node.connect(ctx.destination);

    const flush = () => {
      const blob = encodeWav(chunks, ctx.sampleRate);
      chunks = [];
      if (blob.size < 8192) return;
      const file = new File([blob], "chunk.wav", { type: "audio/wav" });
      queue = queue
        .then(() => {
          if (stopped) return;
          setText((t) => (t ? t + " " : t));
          let chunkText = "";
          return transcribeChunk(file, (d) => {
            if (stopped) return;
            chunkText += d;
            setText((t) => (t + d).slice(-400));
          }).then(() => {
            if (!chunkText.trim()) return;
            full = (full + " " + chunkText).trim();
            void sendSpeech({
              sessionId,
              text: chunkText,
              context: full.slice(-4000),
              scenario: scenarioRef.current,
              settings: settingsRef.current,
              isFinal: false,
              audienceSize: sizeRef.current,
            })
              .then((r) => {
                if (!stopped && r.members) reactRef.current?.(r.members);
              })
              .catch(() => {});
          });
        })
        .catch((e: Error) => {
          setError(e.message);
          stop();
        });
    };
    const timer = window.setInterval(flush, CHUNK_MS);

    const stop = () => {
      if (stopped) return;
      stopped = true;
      window.clearInterval(timer);
      chunks = [];
      node.disconnect();
      source.disconnect();
      stream.getTracks().forEach((t) => t.stop());
      void ctx.close();
      setOn(false);
      void queue.then(() =>
        sendSpeech({
          sessionId,
          text: full.slice(0, 10000),
          isFinal: true,
          audienceSize: sizeRef.current,
          durationSeconds: (Date.now() - startedAt) / 1000,
        })
          .then((r) => r.feedback && setFeedback(r.feedback.summary))
          .catch(() => {}),
      );
    };
    stopRef.current = stop;
    setOn(true);
  }

  return (
    <div className="mx-auto mt-10 flex w-full max-w-3xl flex-col items-center gap-4">
      <button
        onClick={() => (on ? stopRef.current() : void start())}
        className="flex items-center gap-2 rounded-xl border-2 border-primary px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
      >
        {on ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        {on ? "Stop speaking" : "Start speaking"}
      </button>
      <div className="min-h-16 w-full rounded-xl bg-foreground/90 px-5 py-3 text-center text-lg leading-snug text-background">
        {error ? (
          <span className="text-destructive-foreground">{error}</span>
        ) : text.trim() ? (
          text.trim().split(" ").slice(-30).join(" ")
        ) : (
          <span className="opacity-60">{on ? "Listening…" : "Your captions will appear here"}</span>
        )}
      </div>
      {feedback && <p className="text-center text-sm text-muted-foreground">{feedback}</p>}
    </div>
  );
}
