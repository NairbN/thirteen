"use client";

import { getSocketClient } from "@/lib/socket/client";
import { MAX_SEATS } from "@/lib/constants";
import { buttonClass } from "@/lib/buttonStyles";
import { useGameStore } from "@/store/gameStore";
import ExitGameButton from "./ExitGameButton";
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
    <main className="relative mx-auto flex min-h-screen max-w-lg flex-col gap-6 px-4 py-10">
      <ExitGameButton />
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold text-ink">Lobby</h1>
        <p className="mt-1 text-sm text-stone-500">Room {publicState.code}</p>
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
          className={buttonClass(mySeat.isReady ? "muted" : "primary", "lg")}
        >
          {mySeat.isReady ? "Not ready" : "Ready"}
        </button>
      )}
    </main>
  );
}
