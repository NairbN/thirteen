"use client";

import { useGameStore } from "@/store/gameStore";

export default function ReconnectOverlay() {
  const connectionStatus = useGameStore((s) => s.connectionStatus);

  if (connectionStatus !== "disconnected") return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="rounded-2xl border-[3px] border-ink bg-[#fffaf0] px-6 py-4 text-center shadow-[0_6px_0_rgba(43,24,16,0.4)]">
        <p className="font-display font-semibold text-ink">Connection lost</p>
        <p className="mt-1 text-sm text-stone-500">Attempting to reconnect…</p>
      </div>
    </div>
  );
}
