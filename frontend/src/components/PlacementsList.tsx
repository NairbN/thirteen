import { parseAvatarConfig } from "@/lib/avatars";
import type { GameOverReason, PublicSeat } from "@/lib/socket/types";
import AvatarRenderer from "./AvatarRenderer";

interface PlacementsListProps {
  seats: PublicSeat[];
  reason: GameOverReason | null;
}

const ORDINALS = ["1st", "2nd", "3rd", "4th"];

const REASON_LABEL: Record<Exclude<GameOverReason, "normal">, string> = {
  instant_win: "Instant win",
  players_left: "Ended early — players left",
};

export default function PlacementsList({ seats, reason }: PlacementsListProps) {
  const placed = seats
    .filter((s) => s.placement !== null)
    .sort((a, b) => (a.placement ?? 0) - (b.placement ?? 0));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">This game</h2>
        {reason && reason !== "normal" && (
          <span className="rounded-full border-2 border-ink bg-amber-300 px-2 py-0.5 text-xs font-medium text-ink">
            {REASON_LABEL[reason]}
          </span>
        )}
      </div>
      <ol className="flex flex-col gap-1.5">
        {placed.map((seat) => (
          <li
            key={seat.seatIndex}
            className="flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-[#fffaf0] px-3 py-2 shadow-[0_3px_0_rgba(43,24,16,0.3)]"
          >
            <span className="w-10 font-display font-bold text-stone-500">
              {ORDINALS[(seat.placement ?? 1) - 1] ?? seat.placement}
            </span>
            <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-ink bg-amber-100">
              <AvatarRenderer config={parseAvatarConfig(seat.icon)} size="compact" className="h-11 w-11" />
            </span>
            <span className="text-ink">{seat.username}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
