import { parseAvatarConfig } from "@/lib/avatars";
import type { PublicSeat } from "@/lib/socket/types";
import AvatarRenderer from "./AvatarRenderer";

interface SeatCardProps {
  seat: PublicSeat;
  isSelf: boolean;
}

export default function SeatCard({ seat, isSelf }: SeatCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-[#fffaf0] px-4 py-3 shadow-[0_4px_0_rgba(43,24,16,0.35)]">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-amber-100">
        <AvatarRenderer config={parseAvatarConfig(seat.icon)} size="full" className="h-16 w-16" />
      </span>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-ink">
            {seat.username}
            {isSelf ? " (you)" : ""}
          </span>
          {seat.isHost && (
            <span className="rounded-full border-2 border-ink bg-amber-300 px-2 py-0.5 text-xs font-semibold text-ink">
              Host
            </span>
          )}
          {seat.connection === "disconnected" && (
            <span className="rounded-full border-2 border-ink bg-stone-200 px-2 py-0.5 text-xs text-ink">
              Disconnected
            </span>
          )}
        </div>
      </div>
      <span
        className={`rounded-full border-2 border-ink px-2.5 py-1 text-xs font-semibold ${
          seat.isReady ? "bg-emerald-300 text-ink" : "bg-stone-100 text-stone-500"
        }`}
      >
        {seat.isReady ? "Ready" : "Not ready"}
      </span>
    </div>
  );
}

export function OpenSeatCard() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-[3px] border-dashed border-stone-400 px-4 py-3 text-stone-400">
      Open slot
    </div>
  );
}
