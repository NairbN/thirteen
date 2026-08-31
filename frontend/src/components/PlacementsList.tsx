import type { GameOverReason, PublicSeat } from "@/lib/socket/types";

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
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">This game</h2>
        {reason && reason !== "normal" && (
          <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900 dark:text-amber-200">
            {REASON_LABEL[reason]}
          </span>
        )}
      </div>
      <ol className="flex flex-col gap-1">
        {placed.map((seat) => (
          <li
            key={seat.seatIndex}
            className="flex items-center gap-3 rounded-md bg-white px-3 py-2 dark:bg-zinc-900"
          >
            <span className="w-10 font-semibold text-zinc-500 dark:text-zinc-400">
              {ORDINALS[(seat.placement ?? 1) - 1] ?? seat.placement}
            </span>
            <span>{seat.icon}</span>
            <span className="text-zinc-900 dark:text-zinc-50">{seat.username}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
