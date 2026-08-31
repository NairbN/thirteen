"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSocketClient } from "@/lib/socket/client";
import { buttonClass } from "@/lib/buttonStyles";

// Rendered on every in-room screen (waiting/in_progress/finished). Fixed
// top-right keeps it clear of ScoreboardStrip (top-left) and ActionBar
// (bottom-right) on TableScreen, and reads consistently across all three
// screens rather than three bespoke placements.
export default function ExitGameButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleExit() {
    if (busy) return;
    setBusy(true);
    await getSocketClient().leaveRoom();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleExit}
      disabled={busy}
      aria-label="Exit game"
      className={`fixed top-3 right-3 z-40 ${buttonClass("danger", "sm")}`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 16l4-4-4-4M20 12H9"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      Exit Game
    </button>
  );
}
