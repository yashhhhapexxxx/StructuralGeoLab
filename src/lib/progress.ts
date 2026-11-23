import { useSyncExternalStore } from "react";

/** Levels completed (quiz passed), saved on this device only. */
const KEY = "sgl-progress-v1";
type Progress = { done: number[]; scores: Record<number, number> };

const read = (): Progress => {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Progress;
  } catch {
    /* storage blocked — progress just isn't remembered */
  }
  return { done: [], scores: {} };
};

let state: Progress = typeof window === "undefined" ? { done: [], scores: {} } : read();
const listeners = new Set<() => void>();

function save(next: Progress) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function recordScore(level: number, correct: number, total: number) {
  const passed = correct / total >= 2 / 3;
  const done = passed && !state.done.includes(level) ? [...state.done, level].sort((a, b) => a - b) : state.done;
  save({ done, scores: { ...state.scores, [level]: Math.max(state.scores[level] ?? 0, correct) } });
  return passed;
}

export function resetProgress() {
  save({ done: [], scores: {} });
}

export function useProgress() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => state,
  );
}
