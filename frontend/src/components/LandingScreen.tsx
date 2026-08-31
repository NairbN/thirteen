"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocketClient } from "@/lib/socket/client";
import { buttonClass } from "@/lib/buttonStyles";
import {
  ANIMAL_OPTIONS,
  GLASSES_OPTIONS,
  HAT_OPTIONS,
  SHIRT_OPTIONS,
  parseAvatarConfig,
  serializeAvatarConfig,
  type AvatarConfig,
} from "@/lib/avatars";
import { getStoredProfile, setStoredProfile } from "@/lib/storage";
import { useGameStore } from "@/store/gameStore";
import AvatarRenderer from "./AvatarRenderer";

function titleCase(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

interface ArrowRowProps<T extends string> {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  topPercent: number;
}

// Rows sit at a fixed vertical percentage of the preview box (see
// AvatarRenderer's "full" viewBox, `0 -18 100 130`) so each arrow pair reads
// as physically attached to the part of the avatar it edits, per
// doc/ui_ux.md's "Builder UI (revised)".
function ArrowRow<T extends string>({ label, options, value, onChange, topPercent }: ArrowRowProps<T>) {
  const step = (direction: 1 | -1) => {
    const index = options.indexOf(value);
    const next = options[(index + direction + options.length) % options.length];
    onChange(next);
  };

  const arrowClass =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-[3px] border-ink bg-[#fffaf0] font-display text-lg font-bold text-ink shadow-[0_3px_0_rgba(43,24,16,0.35)] transition-transform duration-150 ease-out hover:scale-105 active:translate-y-[2px] active:shadow-none";

  return (
    <div className="absolute inset-x-0 flex -translate-y-1/2 items-center justify-between" style={{ top: `${topPercent}%` }}>
      <button type="button" onClick={() => step(-1)} aria-label={`Previous ${label.toLowerCase()}`} className={arrowClass}>
        ‹
      </button>
      <button type="button" onClick={() => step(1)} aria-label={`Next ${label.toLowerCase()}`} className={arrowClass}>
        ›
      </button>
    </div>
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const sessionRestore = useGameStore((s) => s.sessionRestore);
  const roomCode = useGameStore((s) => s.roomCode);
  const publicState = useGameStore((s) => s.publicState);
  const pushToast = useGameStore((s) => s.pushToast);

  const [username, setUsername] = useState(() => getStoredProfile()?.username ?? "");
  const [avatar, setAvatar] = useState<AvatarConfig>(() => parseAvatarConfig(getStoredProfile()?.icon));
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
      <main className="flex min-h-screen flex-col items-center justify-center gap-2 bg-[var(--background)]">
        <p className="font-display font-semibold text-ink">Reconnecting…</p>
      </main>
    );
  }

  const canSubmit = username.trim().length > 0 && !busy;
  const icon = serializeAvatarConfig(avatar);

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
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[var(--background)] px-4 py-10">
      <div className="text-center">
        <h1 className="font-display text-4xl font-bold text-ink">Thirteen</h1>
        <p className="mt-2 text-stone-600">A real-time Tiến lên table for 2–4 players.</p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-5 rounded-2xl border-[3px] border-ink bg-[#fffaf0] p-6 shadow-[0_6px_0_rgba(43,24,16,0.35)]">
        <label className="flex flex-col gap-1 text-sm font-semibold text-ink">
          Username
          <input
            className="rounded-xl border-[3px] border-ink bg-white px-3 py-2 text-base text-ink placeholder:text-stone-400"
            value={username}
            maxLength={20}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
          />
        </label>

        <div className="flex flex-col items-center gap-2 rounded-2xl border-[3px] border-dashed border-stone-300 p-3">
          <p className="text-center text-sm text-stone-500">Use the arrows to build your critter.</p>
          <div className="relative h-80 w-full max-w-[18rem]">
            <div className="flex h-full items-center justify-center">
              <AvatarRenderer config={avatar} size="full" className="h-full w-auto" />
            </div>
            <ArrowRow
              label="Hat"
              options={HAT_OPTIONS}
              value={avatar.hat}
              onChange={(hat) => setAvatar((c) => ({ ...c, hat }))}
              topPercent={18}
            />
            <ArrowRow
              label="Glasses"
              options={GLASSES_OPTIONS}
              value={avatar.glasses}
              onChange={(glasses) => setAvatar((c) => ({ ...c, glasses }))}
              topPercent={48}
            />
            <ArrowRow
              label="Animal"
              options={ANIMAL_OPTIONS}
              value={avatar.animal}
              onChange={(animal) => setAvatar((c) => ({ ...c, animal }))}
              topPercent={63}
            />
            <ArrowRow
              label="Shirt"
              options={SHIRT_OPTIONS}
              value={avatar.shirt}
              onChange={(shirt) => setAvatar((c) => ({ ...c, shirt }))}
              topPercent={83}
            />
          </div>
          <p className="text-center text-xs font-semibold text-stone-500">
            {titleCase(avatar.animal)} &middot; {titleCase(avatar.hat)} hat &middot; {titleCase(avatar.glasses)} glasses &middot;{" "}
            {titleCase(avatar.shirt)} shirt
          </p>
        </div>

        <button type="button" onClick={handleCreate} disabled={!canSubmit} className={buttonClass("primary", "lg")}>
          Create Lobby
        </button>

        <div className="flex items-center gap-2">
          <div className="h-px flex-1 bg-stone-300" />
          <span className="text-xs font-semibold text-stone-400">or</span>
          <div className="h-px flex-1 bg-stone-300" />
        </div>

        <div className="flex gap-2">
          <input
            className="min-w-0 flex-1 rounded-xl border-[3px] border-ink bg-white px-3 py-2 text-base uppercase text-ink placeholder:text-stone-400 placeholder:normal-case"
            value={joinCode}
            maxLength={8}
            onChange={(e) => setJoinCode(e.target.value)}
            placeholder="Room code"
          />
          <button
            type="button"
            onClick={handleJoin}
            disabled={!canSubmit || joinCode.trim().length === 0}
            className={buttonClass("secondary", "lg")}
          >
            Join
          </button>
        </div>
      </div>
    </main>
  );
}
