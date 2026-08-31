"use client";

import { useEffect, useRef, useState } from "react";
import type { Card as CardId } from "@/lib/rules-engine/cards";
import { useGameStore } from "@/store/gameStore";
import Card from "./Card";

interface SelfHandProps {
  hand: CardId[];
  selectedCardIds: CardId[];
}

type CardStatus = "entering" | "idle" | "leaving";
interface DisplayCard {
  id: CardId;
  status: CardStatus;
}

// Leaving duration must match the CSS transition duration below so the DOM
// node is dropped exactly when the fade/slide finishes.
const LEAVE_MS = 200;

export default function SelfHand({ hand, selectedCardIds }: SelfHandProps) {
  const toggleCardSelection = useGameStore((s) => s.toggleCardSelection);
  const [displayCards, setDisplayCards] = useState<DisplayCard[]>(() =>
    hand.map((id) => ({ id, status: "idle" })),
  );
  const prevHandRef = useRef<CardId[]>(hand);

  useEffect(() => {
    const prevHand = prevHandRef.current;
    prevHandRef.current = hand;
    const added = hand.filter((id) => !prevHand.includes(id));
    const removed = prevHand.filter((id) => !hand.includes(id));
    if (added.length === 0 && removed.length === 0) return;

    setDisplayCards((current) => {
      const kept = current
        .filter((c) => hand.includes(c.id) || removed.includes(c.id))
        .map((c) => (removed.includes(c.id) ? { ...c, status: "leaving" as const } : c));
      const entering = added.map((id) => ({ id, status: "entering" as const }));
      return [...kept, ...entering];
    });

    if (removed.length > 0) {
      const timer = setTimeout(() => {
        setDisplayCards((current) => current.filter((c) => c.status !== "leaving"));
      }, LEAVE_MS);
      return () => clearTimeout(timer);
    }
  }, [hand]);

  useEffect(() => {
    if (!displayCards.some((c) => c.status === "entering")) return;
    // Two-phase mount: paint the off-fan position first, then flip to idle
    // on the next frame so the browser animates the transition.
    const frame = requestAnimationFrame(() => {
      setDisplayCards((current) =>
        current.map((c) => (c.status === "entering" ? { ...c, status: "idle" } : c)),
      );
    });
    return () => cancelAnimationFrame(frame);
  }, [displayCards]);

  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 -space-x-6 pt-3">
      {displayCards.map(({ id, status }) => (
        <div
          key={id}
          className={`transition-all ease-out ${
            status === "entering"
              ? "duration-0 translate-y-16 opacity-0"
              : status === "leaving"
                ? "duration-200 -translate-y-10 opacity-0"
                : "duration-200 translate-y-0 opacity-100"
          }`}
        >
          <Card
            card={id}
            selected={selectedCardIds.includes(id)}
            onClick={status === "idle" ? () => toggleCardSelection(id) : undefined}
          />
        </div>
      ))}
    </div>
  );
}
