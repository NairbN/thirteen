import { TURN_TIMER_MS } from "@/lib/constants";

export function remainingMs(turnDeadline: number, now: number = Date.now()): number {
  return Math.max(0, turnDeadline - now);
}

export function remainingFraction(
  turnDeadline: number,
  now: number = Date.now(),
  totalMs: number = TURN_TIMER_MS,
): number {
  return Math.min(1, Math.max(0, remainingMs(turnDeadline, now) / totalMs));
}
