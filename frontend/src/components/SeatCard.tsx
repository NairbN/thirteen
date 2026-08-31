import type { PublicSeat } from "@/lib/socket/types";

interface SeatCardProps {
  seat: PublicSeat;
  isSelf: boolean;
}

export default function SeatCard({ seat, isSelf }: SeatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl dark:bg-zinc-800">
        {seat.icon}
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {seat.username}
            {isSelf ? " (you)" : ""}
          </span>
          {seat.isHost && (
            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900 dark:text-amber-200">
              Host
            </span>
          )}
          {seat.connection === "disconnected" && (
            <span className="rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
              Disconnected
            </span>
          )}
        </div>
      </div>
      <span
        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
          seat.isReady
            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200"
            : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
        }`}
      >
        {seat.isReady ? "Ready" : "Not ready"}
      </span>
    </div>
  );
}

export function OpenSeatCard() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-zinc-300 px-4 py-3 text-zinc-400 dark:border-zinc-700">
      Open slot
    </div>
  );
}
