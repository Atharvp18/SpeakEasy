import { MOOD_EMOJI, seatingRows, type CastMember, type Mood } from "./look";

// Seated poses: src/assets/seated/{character}-{pose}.png
const CASUAL = import.meta.glob("@/assets/seated/*.png", { eager: true, import: "default" }) as Record<string, string>;
const PRO = import.meta.glob("@/assets/seated-pro/*.png", { eager: true, import: "default" }) as Record<string, string>;
const POSE: Record<Mood, string> = {
  listening: "listening",
  interested: "interested",
  bored: "bored",
  distracted: "phone",
  question: "question",
};
function img(who: string, mood: Mood, pro: boolean) {
  const IMAGES = pro ? PRO : CASUAL;
  const key = Object.keys(IMAGES).find((k) => k.endsWith(`/${who}-${POSE[mood]}.png`));
  return key ? IMAGES[key] ?? "" : "";
}

/** Fewer people → bigger, closer figures. */
function sizeFor(count: number) {
  if (count <= 1) return "w-80 sm:w-[26rem]";
  if (count <= 3) return "w-48 sm:w-60";
  if (count <= 8) return "w-28 sm:w-36";
  return "w-24 sm:w-32";
}

function Person({ cast, mood, size, pro, onClick }: { cast: CastMember; mood: Mood; size: string; pro: boolean; onClick: () => void }) {
  const emoji = MOOD_EMOJI[mood];
  return (
    <button onClick={onClick} className={`relative ${size}`} title={mood}>
      {emoji && (
        <span
          key={mood}
          className="absolute -top-1 right-0 z-10 grid h-9 w-9 animate-in zoom-in-50 fade-in place-items-center rounded-full border border-border bg-background text-lg shadow-sm duration-300"
        >
          {emoji}
        </span>
      )}
      <img
        src={img(cast.who, mood, pro)}
        alt={`Audience member, ${mood}`}
        width={520}
        height={620}
        loading="lazy"
        className={`h-auto w-full select-none ${cast.flip ? "-scale-x-100" : ""}`}
        draggable={false}
      />
    </button>
  );
}

export function Audience2D({
  count, cast, moods, onPersonClick, closeUp = false, pro = false,
}: {
  count: number;
  cast: CastMember[];
  moods: Mood[];
  onPersonClick: (seat: number) => void;
  /** Close-up: legs run off the bottom of the frame. */
  closeUp?: boolean;
  pro?: boolean;
}) {
  const size = sizeFor(count);
  const rows = seatingRows(count);
  // Back rows first and slightly smaller, so the front row sits closest to you.
  return (
    <div className="relative flex flex-col items-center" style={closeUp ? { marginBottom: count <= 1 ? "-7rem" : "-4rem" } : undefined}>
      {rows.reverse().map((r, i, all) => (
        <div
          key={i}
          className="-mt-6 flex justify-center first:mt-0"
          style={i === all.length - 1 ? undefined : { transform: `scale(${1 - (all.length - 1 - i) * 0.08})`, transformOrigin: "bottom center" }}
        >
          {r.map((seat) => {
            const member = cast[seat];
            if (!member) return null;
            return <Person key={seat} size={size} pro={pro} cast={member} mood={moods[seat] ?? "listening"} onClick={() => onPersonClick(seat)} />;
          })}
        </div>
      ))}
    </div>
  );
}
