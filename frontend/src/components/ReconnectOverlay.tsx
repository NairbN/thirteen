"use client";

import { useGameStore } from "@/store/gameStore";

export default function ReconnectOverlay() {
  const connectionStatus = useGameStore((s) => s.connectionStatus);

  if (connectionStatus !== "disconnected") return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
      <div className="rounded-lg bg-white px-6 py-4 text-center shadow-lg dark:bg-zinc-900">
        <p className="font-semibold text-zinc-900 dark:text-zinc-50">Connection lost</p>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">Attempting to reconnect…</p>
      </div>
    </div>
  );
}
