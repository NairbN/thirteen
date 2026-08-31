import { parseAvatarConfig } from "@/lib/avatars";
import type { SeatPosition } from "@/lib/layout/ovalPositions";
import type { PublicSeat } from "@/lib/socket/types";
import AvatarRenderer from "./AvatarRenderer";
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
        <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-amber-100 shadow-[0_2px_0_rgba(43,24,16,0.4)]">
          <AvatarRenderer config={parseAvatarConfig(seat.icon)} size="compact" className="h-14 w-14" />
        </span>
      </div>
      <span className="max-w-[6rem] truncate rounded-full bg-[#fffaf0]/90 px-2 py-0.5 text-sm font-semibold text-ink">
        {seat.username}
      </span>
      <div className="flex -space-x-8">
        {Array.from({ length: seat.handCount }).map((_, i) => (
          <CardBack key={i} size="sm" />
        ))}
      </div>
      <div className="flex gap-1">
        {seat.connection === "disconnected" && (
          <span className="rounded-full border border-ink bg-stone-200 px-1.5 py-0.5 text-[10px] text-ink">
            Disconnected
          </span>
        )}
        {statusLabel && (
          <span className="rounded-full border border-ink bg-amber-300 px-1.5 py-0.5 text-[10px] font-medium text-ink">
            {statusLabel}
          </span>
        )}
      </div>
    </div>
  );
}
