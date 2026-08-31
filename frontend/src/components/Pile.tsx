import type { Combo } from "@/lib/rules-engine/combos";
import type { PublicSeat } from "@/lib/socket/types";
import Card from "./Card";

interface PileProps {
  pile: Combo | null;
  lastPlayerToPlay: number | null;
  seats: PublicSeat[];
}

export default function Pile({ pile, lastPlayerToPlay, seats }: PileProps) {
  const lastPlayer = seats.find((s) => s.seatIndex === lastPlayerToPlay);

  return (
    <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2">
      {pile ? (
        <>
          <div className="flex gap-1 transition-opacity duration-200">
            {pile.cards.map((card) => (
              <Card key={card} card={card} size="sm" />
            ))}
          </div>
          {lastPlayer && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">played by {lastPlayer.username}</span>
          )}
        </>
      ) : (
        <span className="text-sm text-zinc-400 dark:text-zinc-600">Pile empty</span>
      )}
    </div>
  );
}
