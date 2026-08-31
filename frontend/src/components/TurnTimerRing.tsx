"use client";

import { useEffect, useState } from "react";
import { remainingFraction } from "@/lib/turnTimer";

interface TurnTimerRingProps {
  turnDeadline: number;
  size?: number;
}

export default function TurnTimerRing({ turnDeadline, size = 64 }: TurnTimerRingProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(interval);
  }, []);

  const fraction = remainingFraction(turnDeadline, now);
  const radius = size / 2 - 4;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="pointer-events-none -rotate-90"
      role="img"
      aria-label="Turn timer"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        className="stroke-zinc-200 dark:stroke-zinc-700"
        strokeWidth={4}
        fill="none"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        className={fraction < 0.25 ? "stroke-rose-500" : "stroke-sky-500"}
        strokeWidth={4}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 200ms linear" }}
      />
    </svg>
  );
}
