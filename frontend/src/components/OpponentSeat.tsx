import type { SeatPosition } from "@/lib/layout/ovalPositions";
import type { PublicSeat } from "@/lib/socket/types";
import { CardBack } from "./Card";
import TurnTimerRing from "./TurnTimerRing";

interface OpponentSeatProps {
  seat: PublicSeat;
  position: SeatPosition;
  isCurrentTurn: boolean;
  turnDeadline: number | null;
}

const STATUS_LABEL: Partial<Record<PublicSeat["participation"], string>> = {
  passed: "Passed",
  out: "Out",
  forfeited: "Forfeited",
};

export default function OpponentSeat({ seat, position, isCurrentTurn, turnDeadline }: OpponentSeatProps) {
  const statusLabel = STATUS_LABEL[seat.participation];

  return (
    <div
      className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
      style={{ left: `${position.xPct}%`, top: `${position.yPct}%` }}
    >
      <div className="relative flex h-16 w-16 items-center justify-center">
        {isCurrentTurn && turnDeadline !== null && (
          <div className="absolute inset-0">
            <TurnTimerRing turnDeadline={turnDeadline} size={64} />
          </div>
        )}
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-2xl dark:bg-zinc-800">
          {seat.icon}
        </span>
      </div>
      <span className="max-w-[6rem] truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {seat.username}
      </span>
      <div className="flex -space-x-6">
        {Array.from({ length: seat.handCount }).map((_, i) => (
          <CardBack key={i} size="sm" />
        ))}
      </div>
      <div className="flex gap-1">
        {seat.connection === "disconnected" && (
          <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            Disconnected
          </span>
        )}
        {statusLabel && (
          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            {statusLabel}
          </span>
        )}
      </div>
    </div>
  );
}
