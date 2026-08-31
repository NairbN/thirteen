import type { Card } from "@/lib/rules-engine/cards";
import { beats, parseCombo, type Combo } from "@/lib/rules-engine/combos";
import type { GamePhase } from "@/lib/socket/types";

export interface SelectionEvaluation {
  combo: Combo | null;
  legal: boolean;
}

// Advisory only — the server is the sole authority (see v1_planning.md
// "Authority"). PublicState never exposes isFirstLead/lowestCardInPlay, so
// the "must include lowest card" first-lead constraint cannot be checked
// here; a violating lead is still rejected server-side.
export function evaluateSelection(
  selected: Card[],
  phase: GamePhase,
  pile: Combo | null,
): SelectionEvaluation {
  const combo = parseCombo(selected);
  if (!combo) return { combo: null, legal: false };
  if (phase === "awaiting_lead") return { combo, legal: true };
  if (!pile) return { combo, legal: false };
  return { combo, legal: beats(combo, pile) };
}
