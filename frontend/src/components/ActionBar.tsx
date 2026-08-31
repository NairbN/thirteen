"use client";

import { useState } from "react";
import { getSocketClient } from "@/lib/socket/client";
import { buttonClass } from "@/lib/buttonStyles";
import type { Card as CardId } from "@/lib/rules-engine/cards";
import type { Combo } from "@/lib/rules-engine/combos";
import { evaluateSelection } from "@/lib/selectionLegality";
import type { GamePhase } from "@/lib/socket/types";
import { useGameStore } from "@/store/gameStore";

interface ActionBarProps {
  phase: GamePhase;
  pile: Combo | null;
  isMyTurn: boolean;
  selectedCardIds: CardId[];
}

export default function ActionBar({ phase, pile, isMyTurn, selectedCardIds }: ActionBarProps) {
  const clearSelection = useGameStore((s) => s.clearSelection);
  const pushToast = useGameStore((s) => s.pushToast);
  const [busy, setBusy] = useState(false);

  const { legal } = evaluateSelection(selectedCardIds, phase, pile);
  const canPlay = isMyTurn && legal && !busy;
  const canPass = isMyTurn && phase !== "awaiting_lead" && !busy;

  async function handlePlay() {
    if (!canPlay) return;
    setBusy(true);
    const res = await getSocketClient().play({ cards: selectedCardIds });
    setBusy(false);
    if (res.ok) {
      clearSelection();
    } else {
      pushToast({ variant: "error", message: res.message, code: res.code });
    }
  }

  async function handlePass() {
    if (!canPass) return;
    setBusy(true);
    const res = await getSocketClient().pass();
    setBusy(false);
    if (!res.ok) {
      pushToast({ variant: "error", message: res.message, code: res.code });
    }
  }

  return (
    <div className="absolute bottom-4 right-4 z-20 flex gap-3">
      {phase !== "awaiting_lead" && (
        <button type="button" onClick={handlePass} disabled={!canPass} className={buttonClass("neutral", "lg")}>
          Pass
        </button>
      )}
      <button type="button" onClick={handlePlay} disabled={!canPlay} className={buttonClass("primary", "lg")}>
        Play
      </button>
    </div>
  );
}
