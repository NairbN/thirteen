"use client";

import { useEffect, useState } from "react";
import { getSocketClient } from "@/lib/socket/client";
import { REMATCH_TIMEOUT_MS } from "@/lib/constants";
import { buttonClass } from "@/lib/buttonStyles";
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
    <div className="flex flex-col items-center gap-3 rounded-2xl border-[3px] border-ink bg-[#fffaf0] p-4 shadow-[0_4px_0_rgba(43,24,16,0.35)]">
      <p className="text-sm text-stone-500">Rematch window closes in {remainingS}s</p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => vote(true)}
          className={buttonClass(mySeat.rematchVote === "accept" ? "primary" : "secondary")}
        >
          Accept
        </button>
        <button
          type="button"
          onClick={() => vote(false)}
          className={buttonClass(mySeat.rematchVote === "decline" ? "muted" : "neutral")}
        >
          Decline
        </button>
      </div>
    </div>
  );
}
