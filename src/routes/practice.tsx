import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, ChevronDown, SlidersHorizontal, Users, Volume2 } from "lucide-react";
import { practiceAudienceCount, practiceScenario, validatePracticeSearch } from "@/components/practice/search";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Captions } from "@/components/Captions";
import { Audience2D } from "@/components/audience/Audience2D";
import { MAX_AUDIENCE, MOODS, moodFromReaction, nextMood, shuffledCast, type Mood } from "@/components/audience/look";
import { CATEGORIES, SCENARIOS, defaultSettings, type Scenario, type Settings } from "@/components/practice/settings";
import type { Reaction } from "@/routes/api/speech";
import classroomBg from "@/assets/venues/classroom.jpg";
import boardroomBg from "@/assets/venues/boardroom.jpg";
import auditoriumBg from "@/assets/venues/auditorium.jpg";
import officeBg from "@/assets/venues/office.jpg";
import cafeBg from "@/assets/venues/cafe.jpg";

const VENUE_BG: Record<string, string> = {
  Classroom: classroomBg,
  Boardroom: boardroomBg,
  Auditorium: auditoriumBg,
  Office: officeBg,
  "Café": cafeBg,
};

export const Route = createFileRoute("/practice")({
  validateSearch: validatePracticeSearch,
  head: () => ({
    meta: [
      { title: "Practice Room — SpeakEasy" },
      { name: "description", content: "Rehearse a sales pitch, interview or speech in front of a reacting audience." },
      { property: "og:title", content: "Practice Room — SpeakEasy" },
      { property: "og:description", content: "Pick a scenario, choose your audience and start speaking." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Practice,
});

function ScoreBadge({ avg }: { avg: number | null }) {
  const R = 25;
  const C = 2 * Math.PI * R;
  const pct = avg === null ? 0 : Math.min(10, Math.max(0, avg)) / 10;
  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center" title="Average audience interest">
      <svg viewBox="0 0 64 64" className="h-14 w-14 -rotate-90">
        <circle cx="32" cy="32" r={R} fill="none" className="stroke-border" strokeWidth="5" />
        <circle
          cx="32"
          cy="32"
          r={R}
          fill="none"
          className="stroke-primary transition-[stroke-dashoffset] duration-700"
          strokeWidth="5"
          strokeLinecap="round"
          style={{ strokeDasharray: C, strokeDashoffset: C * (1 - pct) }}
        />
      </svg>
      <span className="absolute text-sm font-bold tabular-nums">{avg === null ? "–" : Math.round(avg)}</span>
    </div>
  );
}

function Practice() {
  const search = Route.useSearch();
  const scenario = practiceScenario(search.scenario);
  const count = practiceAudienceCount(search.count);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [cast] = useState(shuffledCast);
  const [moods, setMoods] = useState<Mood[]>(() => Array(MAX_AUDIENCE).fill("listening"));
  const [reactions, setReactions] = useState<Reaction[]>([]);

  const activeReactions = reactions.slice(0, count);
  const avgScore = activeReactions.length
    ? activeReactions.reduce((sum, r) => sum + (r.interest ?? 0), 0) / activeReactions.length
    : null;


  const applyReactions = (members: Reaction[]) => {
    setReactions(members);
    setMoods((m) => m.map((v, i) => (members[i] ? moodFromReaction(members[i]!) : v)));
  };
  const setAll = (fn: (i: number) => Mood) => setMoods(Array.from({ length: MAX_AUDIENCE }, (_, i) => fn(i)));

  const [speaking, setSpeaking] = useState<number | null>(null);
  const [voiceError, setVoiceError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speak = async (seat: number, text?: string) => {
    if (!text || speaking !== null) return;
    setVoiceError("");
    setSpeaking(seat);
    try {
      const res = await fetch("/api/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, who: cast[seat]!.who }),
      });
      if (!res.ok) throw new Error(res.status === 402 ? "Out of AI credits — add credits to hear questions." : "Couldn't play this question. Try again.");
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = audio.onerror = () => { setSpeaking(null); URL.revokeObjectURL(url); };
      await audio.play();
    } catch (e) {
      setSpeaking(null);
      setVoiceError(e instanceof Error ? e.message : "Couldn't play this question.");
    }
  };

  const chip = (active: boolean) =>
    `rounded-xl border-2 px-4 py-1.5 text-sm font-semibold transition-colors ${
      active ? "border-primary bg-primary text-primary-foreground" : "border-border text-foreground hover:border-primary hover:text-primary"
    }`;

  const questions = reactions
    .map((r, i) => ({ ...r, seat: i }))
    .filter((r) => r.hasQuestion && r.seat < count);

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <p className="flex items-center gap-2 text-sm font-semibold">
          {SCENARIOS.find((x) => x.id === scenario)?.label ?? "Practice"}
          <span className="text-muted-foreground">·</span>
          <Users className="h-4 w-4 text-muted-foreground" />
          {count} {count === 1 ? "person" : "people"}
        </p>
        <ScoreBadge avg={avgScore} />
      </header>

      {/* Settings bar */}
      <nav className="flex flex-wrap items-center justify-center gap-2 border-b border-border px-6 py-3">
        <SlidersHorizontal className="mr-1 h-4 w-4 text-muted-foreground" />
        {CATEGORIES.map((c) => (
          <Popover key={c.id}>
            <PopoverTrigger className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted data-[state=open]:bg-muted">
              {c.label}
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-xl" align="center">
              <div className="space-y-4">
                {c.fields.map((f) => (
                  <div key={f.id}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{f.label}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {f.options.map((o) => (
                        <button
                          key={o}
                          onClick={() => setSettings((s) => ({ ...s, [f.id]: o }))}
                          className={`rounded-xl border px-2.5 py-1 text-xs font-medium transition-colors ${
                            settings[f.id] === o ? "border-primary bg-primary text-primary-foreground" : "border-border hover:border-primary"
                          }`}
                        >
                          {o}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        ))}
      </nav>

      <section className="flex flex-1 flex-col px-4 pb-8 pt-8">
        <div
          className="relative mx-auto flex w-full max-w-6xl items-end justify-center overflow-hidden rounded-xl bg-cover bg-center px-4 pt-16"
          style={{ backgroundImage: `url(${VENUE_BG[settings["venue"] ?? ""] ?? classroomBg})`, minHeight: "28rem" }}
        >
          {count === 0 ? (
            <p className="self-center rounded-xl bg-background/80 px-4 py-2 text-center text-sm text-muted-foreground">The room is empty. Add some audience members.</p>
          ) : (
            <Audience2D
              count={count}
              cast={cast}
              moods={moods}
              closeUp={settings["venue"] === "Café" && count <= 3}
              pro={settings["formality"] === "Professional"}
              onPersonClick={(seat) => setMoods((m) => m.map((v, i) => (i === seat ? nextMood(v) : v)))}
            />
          )}
        </div>

        {questions.length > 0 && (
          <div className="mx-auto mt-6 w-full max-w-3xl space-y-2">
            <p className="text-center text-xs uppercase tracking-widest text-muted-foreground">Questions asked — click to hear them</p>
            {questions.map((q) => (
              <button
                key={q.seat}
                onClick={() => speak(q.seat, q.question)}
                disabled={speaking !== null && speaking !== q.seat}
                className={`flex w-full items-center gap-2 rounded-xl border px-4 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${speaking === q.seat ? "border-primary" : "border-border enabled:hover:border-primary"}`}
              >
                <span>❓</span>
                <span className="flex-1"><span className="font-semibold">Seat {q.seat + 1} asks:</span> {q.question}</span>
                <Volume2 className={`h-4 w-4 shrink-0 ${speaking === q.seat ? "animate-pulse text-primary" : "text-muted-foreground"}`} />
              </button>
            ))}
            {voiceError && <p className="text-center text-xs text-destructive">{voiceError}</p>}
          </div>
        )}

        <details className="mx-auto mt-4 text-sm text-muted-foreground">
          <summary className="cursor-pointer text-center">Debug</summary>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {MOODS.map((m) => (
              <button key={m} className={chip(false)} onClick={() => setAll(() => m)}>
                Everyone {m}
              </button>
            ))}
          </div>
        </details>

        <Captions audienceSize={count} scenario={scenario} settings={settings} onReactions={applyReactions} />
        <p className="mt-6 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          You are here — at the front of the room
        </p>
      </section>
    </main>
  );
}
