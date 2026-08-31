"use client";

import { useGameStore } from "@/store/gameStore";
import ExitGameButton from "./ExitGameButton";
import PlacementsList from "./PlacementsList";
import RematchControls from "./RematchControls";
import ScoreboardTable from "./ScoreboardTable";

export default function EndScreen() {
  const publicState = useGameStore((s) => s.publicState);
  const mySeatIndex = useGameStore((s) => s.mySeatIndex);
  const lastGameOver = useGameStore((s) => s.lastGameOver);

  if (!publicState) return null;

  const mySeat = publicState.seats.find((s) => s.seatIndex === mySeatIndex);

  return (
    <main className="relative mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-10">
      <ExitGameButton />
      <h1 className="text-center font-display text-3xl font-bold text-ink">Game over</h1>
      <PlacementsList seats={publicState.seats} reason={lastGameOver?.reason ?? null} />
      <ScoreboardTable seats={publicState.seats} />
      <RematchControls mySeat={mySeat} gameNumber={publicState.gameNumber} />
    </main>
  );
}
