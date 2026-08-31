"use client";

import type { Card as CardId } from "@/lib/rules-engine/cards";
import { useGameStore } from "@/store/gameStore";
import Card from "./Card";

interface SelfHandProps {
  hand: CardId[];
  selectedCardIds: CardId[];
}

export default function SelfHand({ hand, selectedCardIds }: SelfHandProps) {
  const toggleCardSelection = useGameStore((s) => s.toggleCardSelection);

  return (
    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 -space-x-6 pt-3">
      {hand.map((card) => (
        <Card
          key={card}
          card={card}
          selected={selectedCardIds.includes(card)}
          onClick={() => toggleCardSelection(card)}
        />
      ))}
    </div>
  );
}
