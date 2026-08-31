"use client";

import { computeOpponentPositions } from "@/lib/layout/ovalPositions";
import { useGameStore } from "@/store/gameStore";
import ActionBar from "./ActionBar";
import OpponentSeat from "./OpponentSeat";
import Pile from "./Pile";
import ScoreboardStrip from "./ScoreboardStrip";
import SelfHand from "./SelfHand";

export default function TableScreen() {
  const publicState = useGameStore((s) => s.publicState);
  const mySeatIndex = useGameStore((s) => s.mySeatIndex);
  const hand = useGameStore((s) => s.hand);
  const selectedCardIds = useGameStore((s) => s.selectedCardIds);

  if (!publicState || mySeatIndex === null) return null;

  const { seats, game } = publicState;
  const positions = computeOpponentPositions(mySeatIndex, seats.length);
  const sortedHand = [...hand].sort((a, b) => a - b);

  return (
    <main className="relative min-h-screen overflow-hidden bg-emerald-800">
      <ScoreboardStrip seats={seats} mySeatIndex={mySeatIndex} />

      <div className="relative mx-auto h-screen max-w-4xl">
        {positions.map((position) => {
          const seat = seats.find((s) => s.seatIndex === position.seatIndex);
          if (!seat) return null;
          return (
            <OpponentSeat
              key={seat.seatIndex}
              seat={seat}
              position={position}
              isCurrentTurn={game?.currentSeat === seat.seatIndex}
              turnDeadline={game?.turnDeadline ?? null}
            />
          );
        })}

        {game && <Pile pile={game.pile} lastPlayerToPlay={game.lastPlayerToPlay} seats={seats} />}

        <SelfHand hand={sortedHand} selectedCardIds={selectedCardIds} />

        {game && (
          <ActionBar
            phase={game.phase}
            pile={game.pile}
            isMyTurn={game.currentSeat === mySeatIndex}
            selectedCardIds={selectedCardIds}
          />
        )}
      </div>
    </main>
  );
}
