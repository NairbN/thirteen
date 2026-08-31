"use client";

import { useGameStore } from "@/store/gameStore";
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
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-10">
      <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Game over</h1>
      <PlacementsList seats={publicState.seats} reason={lastGameOver?.reason ?? null} />
      <ScoreboardTable seats={publicState.seats} />
      <RematchControls mySeat={mySeat} gameNumber={publicState.gameNumber} />
    </main>
  );
}
