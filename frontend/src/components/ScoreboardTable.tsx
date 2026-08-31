import { parseAvatarConfig } from "@/lib/avatars";
import type { PublicSeat } from "@/lib/socket/types";
import AvatarRenderer from "./AvatarRenderer";

interface ScoreboardTableProps {
  seats: PublicSeat[];
}

export default function ScoreboardTable({ seats }: ScoreboardTableProps) {
  const ranked = [...seats].sort((a, b) => b.score - a.score);
  // Ties share a position (rules.md: "Ties in cumulative score are not broken").
  const positions = ranked.map((seat, i) => (i === 0 || seat.score !== ranked[i - 1].score ? i + 1 : null));
  for (let i = 1; i < positions.length; i++) {
    if (positions[i] === null) positions[i] = positions[i - 1];
  }

  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold text-ink">Standings</h2>
      <table className="w-full overflow-hidden rounded-2xl border-[3px] border-ink bg-[#fffaf0] text-sm shadow-[0_4px_0_rgba(43,24,16,0.35)]">
        <tbody>
          {ranked.map((seat, i) => (
            <tr key={seat.seatIndex} className="border-b-2 border-amber-100 last:border-0">
              <td className="px-3 py-2 font-display font-semibold text-stone-500">#{positions[i]}</td>
              <td className="px-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-ink bg-amber-100">
                  <AvatarRenderer config={parseAvatarConfig(seat.icon)} size="compact" className="h-10 w-10" />
                </span>
              </td>
              <td className="px-3 py-2 text-ink">{seat.username}</td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold text-ink">{seat.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
