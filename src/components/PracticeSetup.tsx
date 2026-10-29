import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Briefcase, Mic2, Presentation, Users } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { SCENARIOS } from "@/components/practice/settings";
import { MAX_AUDIENCE } from "@/components/audience/look";

const ICONS = { pitch: Briefcase, interview: Users, speech: Presentation } as const;

export function PracticeSetup({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState<"pitch" | "interview" | "speech">("speech");
  const [count, setCount] = useState(MAX_AUDIENCE);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-xl p-0">
        <DialogHeader className="border-b border-border p-6">
          <DialogTitle className="flex items-center font-display text-2xl">
            <Mic2 className="mr-3 h-6 w-6 text-primary" />
            Set up your practice
          </DialogTitle>
          <DialogDescription>Choose what you're practicing and how many people you'll talk to.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 pb-6">
          <div>
            <h3 className="mb-3 text-sm font-semibold">What are you practicing?</h3>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
              className="space-y-2"
            >
              {SCENARIOS.map((s) => {
                const Icon = ICONS[s.id];
                const active = scenario === s.id;
                return (
                  <motion.button
                    key={s.id}
                    variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setScenario(s.id);
                      setCount(s.count);
                    }}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-colors ${
                      active ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <span className="flex flex-col">
                      <span className="text-sm font-semibold">{s.label}</span>
                      <span className="text-xs text-muted-foreground">{s.hint}</span>
                    </span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold">How many people?</h3>
              <span className="text-sm font-semibold tabular-nums text-primary">{count}</span>
            </div>
            <Slider min={1} max={MAX_AUDIENCE} step={1} value={[count]} onValueChange={(v) => setCount(v[0] ?? 1)} />
            <p className="mt-2 text-xs text-muted-foreground">To change it later, head back and set it up again.</p>
          </div>

          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate({ to: "/practice", search: { scenario, count } })}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
          >
            Enter the room
          </motion.button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
