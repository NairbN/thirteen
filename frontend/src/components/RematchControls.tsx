"use client";

import { useEffect, useState } from "react";
import { getSocketClient } from "@/lib/socket/client";
import { REMATCH_TIMEOUT_MS } from "@/lib/constants";
import type { PublicSeat } from "@/lib/socket/types";

interface RematchControlsProps {
  mySeat: PublicSeat | undefined;
  gameNumber: number;
}

// PublicState carries no rematch-deadline timestamp (unlike turnDeadline for
// in-game turns), so the countdown is approximated client-side from the
// moment this client observes the `finished` state, anchored per gameNumber.
export default function RematchControls({ mySeat, gameNumber }: RematchControlsProps) {
  const [enteredAt] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, [gameNumber]);

  const remainingS = Math.max(0, Math.ceil((REMATCH_TIMEOUT_MS - (now - enteredAt)) / 1000));

  async function vote(accept: boolean) {
    await getSocketClient().rematch(accept);
  }

  if (!mySeat) return null;

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Rematch window closes in {remainingS}s</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => vote(true)}
          className={`rounded px-4 py-2 font-semibold text-white ${
            mySeat.rematchVote === "accept" ? "bg-emerald-700" : "bg-emerald-600"
          }`}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => vote(false)}
          className={`rounded px-4 py-2 font-semibold text-white ${
            mySeat.rematchVote === "decline" ? "bg-zinc-600" : "bg-zinc-500"
          }`}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
