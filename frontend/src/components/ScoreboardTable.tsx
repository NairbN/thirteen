import type { PublicSeat } from "@/lib/socket/types";

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
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Standings</h2>
      <table className="w-full overflow-hidden rounded-md bg-white text-sm dark:bg-zinc-900">
        <tbody>
          {ranked.map((seat, i) => (
            <tr key={seat.seatIndex} className="border-b border-zinc-100 last:border-0 dark:border-zinc-800">
              <td className="px-3 py-2 font-semibold text-zinc-500 dark:text-zinc-400">#{positions[i]}</td>
              <td className="px-3 py-2">{seat.icon}</td>
              <td className="px-3 py-2 text-zinc-900 dark:text-zinc-50">{seat.username}</td>
              <td className="px-3 py-2 text-right tabular-nums text-zinc-900 dark:text-zinc-50">{seat.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
