"use client";

import { getSocketClient } from "@/lib/socket/client";
import { MAX_SEATS } from "@/lib/constants";
import { useGameStore } from "@/store/gameStore";
import SeatCard, { OpenSeatCard } from "./SeatCard";
import ShareLinkBox from "./ShareLinkBox";

export default function LobbyScreen() {
  const publicState = useGameStore((s) => s.publicState);
  const mySeatIndex = useGameStore((s) => s.mySeatIndex);

  if (!publicState) return null;

  const mySeat = publicState.seats.find((seat) => seat.seatIndex === mySeatIndex);
  const openSlots = Math.max(0, MAX_SEATS - publicState.seats.length);

  async function toggleReady() {
    if (!mySeat) return;
    await getSocketClient().setReady({ ready: !mySeat.isReady });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Lobby</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Room {publicState.code}</p>
      </div>

      <ShareLinkBox code={publicState.code} />

      <div className="flex flex-col gap-2">
        {publicState.seats.map((seat) => (
          <SeatCard key={seat.seatIndex} seat={seat} isSelf={seat.seatIndex === mySeatIndex} />
        ))}
        {Array.from({ length: openSlots }).map((_, i) => (
          <OpenSeatCard key={`open-${i}`} />
        ))}
      </div>

      {mySeat && (
        <button
          type="button"
          onClick={toggleReady}
          className={`rounded px-4 py-3 font-semibold text-white ${
            mySeat.isReady ? "bg-zinc-500" : "bg-emerald-600"
          }`}
        >
          {mySeat.isReady ? "Not ready" : "Ready"}
        </button>
      )}
    </main>
  );
}
