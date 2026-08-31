"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocketClient } from "@/lib/socket/client";
import { DEFAULT_ICON, PLAYER_ICONS } from "@/lib/icons";
import { getStoredProfile, setStoredProfile } from "@/lib/storage";
import { useGameStore } from "@/store/gameStore";

export default function LandingScreen() {
  const router = useRouter();
  const sessionRestore = useGameStore((s) => s.sessionRestore);
  const roomCode = useGameStore((s) => s.roomCode);
  const publicState = useGameStore((s) => s.publicState);
  const pushToast = useGameStore((s) => s.pushToast);

  const [username, setUsername] = useState(() => getStoredProfile()?.username ?? "");
  const [icon, setIcon] = useState<string>(() => getStoredProfile()?.icon ?? DEFAULT_ICON);
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getSocketClient();
  }, []);

  useEffect(() => {
    if (sessionRestore === "resolved" && publicState && roomCode) {
      router.push(`/room/${roomCode}`);
    }
  }, [sessionRestore, publicState, roomCode, router]);

  if (sessionRestore === "checking") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-zinc-50 dark:bg-black">
        <p className="text-zinc-600 dark:text-zinc-400">Reconnecting…</p>
      </main>
    );
  }

  const canSubmit = username.trim().length > 0 && !busy;

  async function handleCreate() {
    if (!canSubmit) return;
    setBusy(true);
    setStoredProfile({ username: username.trim(), icon });
    const client = getSocketClient();
    const res = await client.createRoom(username.trim(), icon);
    setBusy(false);
    if (res.ok) {
      router.push(`/room/${res.code}`);
    } else {
      pushToast({ variant: "error", message: res.message, code: res.code });
    }
  }

  async function handleJoin() {
    const code = joinCode.trim().toUpperCase();
    if (!canSubmit || code.length === 0) return;
    setBusy(true);
    setStoredProfile({ username: username.trim(), icon });
    const client = getSocketClient();
    const res = await client.joinRoom(code, username.trim(), icon);
    setBusy(false);
    if (res.ok) {
      router.push(`/room/${code}`);
    } else {
      pushToast({ variant: "error", message: res.message, code: res.code });
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-4 dark:bg-black">
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-black dark:text-zinc-50">Thirteen</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">A real-time Tiến lên table for 2–4 players.</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Username
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-base text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
          />
        </label>

        <div className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          Icon
          <div className="flex flex-wrap gap-2">
            {PLAYER_ICONS.map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setIcon(candidate)}
                aria-pressed={icon === candidate}
                className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${
                  icon === candidate ? "bg-sky-500/20 ring-2 ring-sky-500" : "bg-zinc-100 dark:bg-zinc-800"
                }`}
              >
                {candidate}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          disabled={!canSubmit}
          className="rounded bg-sky-600 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Create Lobby
        </button>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
          <span className="text-xs text-zinc-400">or</span>
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
        </div>

        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded border border-zinc-300 px-3 py-2 text-base uppercase text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            value={joinCode}
            maxLength={8}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Room code"
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={!canSubmit || joinCode.trim().length === 0}
            className="rounded bg-zinc-800 px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-700"
          >
            Join
          </button>
        </div>
      </div>
    </main>
  );
}
