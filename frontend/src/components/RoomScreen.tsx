"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSocketClient } from "@/lib/socket/client";
import { useGameStore } from "@/store/gameStore";
import LobbyScreen from "./LobbyScreen";
import TableScreen from "./TableScreen";
import EndScreen from "./EndScreen";

interface RoomScreenProps {
  code: string;
}

export default function RoomScreen({ code }: RoomScreenProps) {
  const router = useRouter();
  const roomCode = useGameStore((s) => s.roomCode);
  const publicState = useGameStore((s) => s.publicState);
  const sessionRestore = useGameStore((s) => s.sessionRestore);

  useEffect(() => {
    getSocketClient();
  }, []);

  const belongsToThisRoom = roomCode === code;

  useEffect(() => {
    if (!belongsToThisRoom && sessionRestore === "resolved") {
      router.replace("/");
    }
  }, [belongsToThisRoom, sessionRestore, router]);

  if (!belongsToThisRoom || !publicState) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
        <p className="font-display font-semibold text-ink">Connecting…</p>
      </main>
    );
  }

  switch (publicState.state) {
    case "waiting":
      return <LobbyScreen />;
    case "starting":
    case "in_progress":
      return <TableScreen />;
    case "finished":
      return <EndScreen />;
    case "abandoned":
      return (
        <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)]">
          <p className="font-display font-semibold text-ink">This room no longer exists.</p>
        </main>
      );
    default:
      return null;
  }
}
