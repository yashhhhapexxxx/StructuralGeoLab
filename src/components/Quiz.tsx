import { useState } from "react";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import type { Question } from "@/content/levels";
import { recordScore } from "@/lib/progress";
import { cn } from "@/lib/utils";

/** End-of-level check: instant feedback, no "exam" — 2/3 correct marks the level complete. */
export function Quiz({ level, questions }: { level: number; questions: Question[] }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => questions.map(() => null));
  const [result, setResult] = useState<null | { correct: number; passed: boolean }>(null);
  const answered = picked.every((p) => p !== null);

  const pick = (qi: number, oi: number) => {
    if (picked[qi] !== null) return;
    const next = [...picked];
    next[qi] = oi;
    setPicked(next);
    if (next.every((p) => p !== null)) {
      const correct = next.filter((p, i) => p === questions[i].answer).length;
      setResult({ correct, passed: recordScore(level, correct, questions.length) });
    }
  };

  return (
    <section className="rounded-3xl border border-line bg-white/[0.02] p-6 md:p-8" aria-labelledby={`quiz-${level}`}>
      <h2 id={`quiz-${level}`} className="font-display text-3xl uppercase tracking-wide">
        Check your understanding
      </h2>
      <p className="mt-1 text-muted">Three questions. Instant feedback. Two right unlocks the level badge.</p>
      <ol className="mt-6 space-y-6">
        {questions.map((q, qi) => (
          <li key={q.q}>
            <p className="text-lg font-semibold">
              {qi + 1}. {q.q}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => {
                const chosen = picked[qi] === oi;
                const reveal = picked[qi] !== null;
                const isAnswer = q.answer === oi;
                return (
                  <button
                    key={o}
                    type="button"
                    disabled={reveal}
                    onClick={() => pick(qi, oi)}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-[15px] transition-colors",
                      !reveal && "border-line hover:border-lichen/60 hover:bg-white/[0.03]",
                      reveal && isAnswer && "border-lichen/70 bg-moss/20",
                      reveal && chosen && !isAnswer && "border-clay/70 bg-clay/15",
                      reveal && !chosen && !isAnswer && "border-line opacity-60",
                    )}
                  >
                    {reveal && isAnswer && <CheckCircle2 size={18} className="shrink-0 text-lichen" />}
                    {reveal && chosen && !isAnswer && <XCircle size={18} className="shrink-0 text-[#f0a57c]" />}
                    {o}
                  </button>
                );
              })}
            </div>
            {picked[qi] !== null && <p className="mt-2 text-[15px] text-muted">{q.why}</p>}
          </li>
        ))}
      </ol>
      {answered && result && (
        <div className={cn("mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5", result.passed ? "border-lichen/50 bg-moss/15" : "border-clay/50 bg-clay/10")}>
          <p className="font-display text-2xl uppercase tracking-wide">
            {result.correct} / {questions.length} — {result.passed ? "Level complete!" : "Nearly — have another look"}
          </p>
          <button type="button" onClick={() => { setPicked(questions.map(() => null)); setResult(null); }} className="flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm">
            <RotateCcw size={14} /> Try again
          </button>
        </div>
      )}
    </section>
  );
}
