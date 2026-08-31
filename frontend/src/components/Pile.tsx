"use client";

import { useEffect, useRef, useState } from "react";
import type { Combo } from "@/lib/rules-engine/combos";
import type { PublicSeat } from "@/lib/socket/types";
import Card from "./Card";

interface PileProps {
  pile: Combo | null;
  lastPlayerToPlay: number | null;
  seats: PublicSeat[];
}

type Phase = "idle" | "entering" | "leaving";

// Leaving duration must match the CSS transition duration below so the pile
// is cleared exactly when the fade/slide-out finishes.
const LEAVE_MS = 200;

function pileKey(pile: Combo | null): string | null {
  return pile ? `${pile.type}:${pile.cards.slice().sort((a, b) => a - b).join(",")}` : null;
}

export default function Pile({ pile, lastPlayerToPlay, seats }: PileProps) {
  const lastPlayer = seats.find((s) => s.seatIndex === lastPlayerToPlay);
  const [displayedPile, setDisplayedPile] = useState(pile);
  const [phase, setPhase] = useState<Phase>(pile ? "entering" : "idle");
  const prevKeyRef = useRef<string | null>(pileKey(pile));

  useEffect(() => {
    const key = pileKey(pile);
    if (key === prevKeyRef.current) return;
    prevKeyRef.current = key;

    if (pile) {
      // Two rAFs: one to commit the new (pre-transition) cards + phase, one
      // to flip to "idle" on the following frame so the browser animates it.
      const showFrame = requestAnimationFrame(() => {
        setDisplayedPile(pile);
        setPhase("entering");
        requestAnimationFrame(() => setPhase("idle"));
      });
      return () => cancelAnimationFrame(showFrame);
    }

    const leaveFrame = requestAnimationFrame(() => setPhase("leaving"));
    const clearTimer = setTimeout(() => setDisplayedPile(null), LEAVE_MS);
    return () => {
      cancelAnimationFrame(leaveFrame);
      clearTimeout(clearTimer);
    };
  }, [pile]);

  return (
    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
      {displayedPile ? (
        <>
          <div
            className={`flex gap-1 transition-all duration-200 ease-out ${
              phase === "entering"
                ? "translate-y-6 opacity-0"
                : phase === "leaving"
                  ? "-translate-y-6 opacity-0"
                  : "translate-y-0 opacity-100"
            }`}
          >
            {displayedPile.cards.map((card) => (
              <Card key={card} card={card} size="sm" />
            ))}
          </div>
          {lastPlayer && (
            <span className="rounded-full bg-[#fffaf0]/90 px-2 py-0.5 text-xs font-semibold text-ink">
              played by {lastPlayer.username}
            </span>
          )}
        </>
      ) : (
        <span className="rounded-full bg-[#fffaf0]/70 px-3 py-1 text-sm font-semibold text-stone-500">
          Pile empty
        </span>
      )}
    </div>
  );
}
