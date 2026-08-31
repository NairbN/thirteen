import type { PublicSeat } from "@/lib/socket/types";

interface ScoreboardStripProps {
  seats: PublicSeat[];
  mySeatIndex: number | null;
}

export default function ScoreboardStrip({ seats, mySeatIndex }: ScoreboardStripProps) {
  return (
    <div className="fixed left-3 top-3 z-30 flex flex-col gap-1 rounded-md bg-white/90 px-3 py-2 text-xs shadow-md backdrop-blur dark:bg-zinc-900/90">
      {seats.map((seat) => (
        <div key={seat.seatIndex} className="flex items-center gap-2">
          <span>{seat.icon}</span>
          <span className={`flex-1 truncate ${seat.seatIndex === mySeatIndex ? "font-semibold" : ""}`}>
            {seat.username}
          </span>
          <span className="tabular-nums text-zinc-500 dark:text-zinc-400">{seat.score}</span>
        </div>
      ))}
    </div>
  );
}
