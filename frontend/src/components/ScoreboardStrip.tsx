import { parseAvatarConfig } from "@/lib/avatars";
import type { PublicSeat } from "@/lib/socket/types";
import AvatarRenderer from "./AvatarRenderer";

interface ScoreboardStripProps {
  seats: PublicSeat[];
  mySeatIndex: number | null;
}

export default function ScoreboardStrip({ seats, mySeatIndex }: ScoreboardStripProps) {
  return (
    <div className="fixed left-3 top-3 z-30 flex flex-col gap-1.5 rounded-2xl border-[3px] border-ink bg-[#fffaf0]/95 px-3 py-2 text-xs shadow-[0_4px_0_rgba(43,24,16,0.35)] backdrop-blur">
      {seats.map((seat) => (
        <div key={seat.seatIndex} className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-ink bg-amber-100">
            <AvatarRenderer config={parseAvatarConfig(seat.icon)} size="compact" className="h-8 w-8" />
          </span>
          <span className={`flex-1 truncate ${seat.seatIndex === mySeatIndex ? "font-display font-semibold" : ""}`}>
            {seat.username}
          </span>
          <span className="tabular-nums font-semibold text-ink">{seat.score}</span>
        </div>
      ))}
    </div>
  );
}
