import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CrowdCanvas, PEEPS_SRC } from "@/components/ui/skiper39";
import { Button } from "@/components/ui/button";
import { PracticeSetup } from "@/components/PracticeSetup";
import { useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SpeakEasy — Practice public speaking" },
      { name: "description", content: "Step out of your comfort zone and rehearse in front of a virtual crowd." },
      { property: "og:title", content: "SpeakEasy — Practice public speaking" },
      { property: "og:description", content: "Rehearse your talk in front of a virtual audience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const [open, setOpen] = useState(false);
  return (
    <main className="relative h-screen w-full overflow-hidden bg-background text-foreground">
      <header className="absolute left-6 top-6 z-20 md:left-10 md:top-8">
        <Link to="/" className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          SpeakEasy
        </Link>
      </header>
      <div className="absolute left-1/2 top-[12vh] z-10 grid -translate-x-1/2 justify-items-center gap-6 text-center">
        <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Get out of your comfort zone
        </span>
        <h1 className="font-display text-5xl font-extrabold tracking-tight leading-none md:text-7xl">
          Speak to the room.
        </h1>
        <Button
          onClick={() => setOpen(true)}
          size="lg"
          variant="outline"
          className="group h-12 rounded-xl border-2 font-semibold border-primary bg-transparent px-11 text-lg text-primary shadow-none transition-all duration-300 hover:scale-[1.03] hover:bg-primary hover:text-primary-foreground hover:shadow-md"
        >
          <>
            Practice
            <ArrowRight
              className="-me-1 ms-2 opacity-60 transition-transform group-hover:translate-x-0.5"
              size={16}
              strokeWidth={2}
              aria-hidden="true"
            />
          </>
        </Button>
        <PracticeSetup open={open} onOpenChange={setOpen} />
      </div>
      <div className="absolute bottom-0 h-full w-screen">
        <CrowdCanvas src={PEEPS_SRC} rows={15} cols={7} />
      </div>
    </main>
  );
}
