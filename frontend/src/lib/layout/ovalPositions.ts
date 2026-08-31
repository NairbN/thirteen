export type SeatLabel = "top" | "top-left" | "top-right" | "left" | "right";

export interface SeatPosition {
  seatIndex: number;
  label: SeatLabel;
  xPct: number;
  yPct: number;
}

// Percent coordinates within the table container, self always at (50, 92).
const LABEL_COORDS: Record<SeatLabel, { xPct: number; yPct: number }> = {
  top: { xPct: 50, yPct: 10 },
  "top-left": { xPct: 22, yPct: 22 },
  "top-right": { xPct: 78, yPct: 22 },
  left: { xPct: 12, yPct: 55 },
  right: { xPct: 88, yPct: 55 },
};

// Label sequence per opponent count, ordered clockwise starting from the
// seat immediately clockwise of self, per ui_ux.md ("1 opponent at 2p (top),
// top-left/top-right at 3p, left/top/right at 4p").
const LABEL_SEQUENCES: Record<number, SeatLabel[]> = {
  1: ["top"],
  2: ["top-left", "top-right"],
  3: ["left", "top", "right"],
};

export function computeOpponentPositions(mySeatIndex: number, seatCount: number): SeatPosition[] {
  if (seatCount < 2 || seatCount > 4) {
    throw new Error(`seatCount must be between 2 and 4, got ${seatCount}`);
  }
  const opponentCount = seatCount - 1;
  const labels = LABEL_SEQUENCES[opponentCount];
  const opponentSeatIndexes = Array.from(
    { length: opponentCount },
    (_, i) => (mySeatIndex + i + 1) % seatCount,
  );

  return opponentSeatIndexes.map((seatIndex, i) => {
    const label = labels[i];
    const { xPct, yPct } = LABEL_COORDS[label];
    return { seatIndex, label, xPct, yPct };
  });
}
