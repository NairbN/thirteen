import type { Card as CardId } from "@/lib/rules-engine/cards";
import { cardLabel } from "@/lib/cardDisplay";

interface CardProps {
  card: CardId;
  selected?: boolean;
  onClick?: () => void;
  size?: "sm" | "md";
}

const SIZE_CLASSES: Record<NonNullable<CardProps["size"]>, string> = {
  sm: "h-16 w-11 text-sm",
  md: "h-28 w-[4.5rem] text-lg",
};

const GLYPH_SIZE: Record<NonNullable<CardProps["size"]>, string> = {
  sm: "text-2xl",
  md: "text-4xl",
};

// A soft rounded-corner gloss blob in the top-left, echoing the shine on the
// avatar heads — the same "sticker" cue used to sell the anime-cute art
// language on a shape that otherwise has no room for a face.
function CardShine() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute left-1.5 top-1.5 h-3.5 w-2 rotate-[-18deg] rounded-full bg-white/60"
    />
  );
}

export default function Card({ card, selected = false, onClick, size = "md" }: CardProps) {
  const { rank, glyph, isRed } = cardLabel(card);
  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      aria-pressed={interactive ? selected : undefined}
      aria-label={`${rank}${glyph}`}
      className={`relative flex flex-col items-center justify-between overflow-hidden rounded-2xl border-[3px] border-ink bg-gradient-to-br from-white to-amber-50 p-1.5 font-display font-bold shadow-[0_4px_0_rgba(43,24,16,0.55)] transition-all duration-150 ease-out ${SIZE_CLASSES[size]} ${
        isRed ? "text-rose-600" : "text-ink"
      } ${
        selected
          ? "-translate-y-4 rotate-1 ring-4 ring-amber-300 shadow-[0_8px_0_rgba(43,24,16,0.55)]"
          : ""
      } ${interactive ? "cursor-pointer hover:-translate-y-2 hover:-rotate-1 active:translate-y-0" : "cursor-default"}`}
    >
      <CardShine />
      <span className="self-start leading-none [text-shadow:1px_1px_0_rgba(43,24,16,0.12)]">{rank}</span>
      <span className={`leading-none drop-shadow-[1px_2px_0_rgba(43,24,16,0.15)] ${GLYPH_SIZE[size]}`}>{glyph}</span>
    </button>
  );
}

export function CardBack({ size = "md" }: { size?: CardProps["size"] }) {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-2xl border-[3px] border-ink bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_3px_0_rgba(43,24,16,0.55)] ${SIZE_CLASSES[size ?? "md"]}`}
      aria-hidden
    >
      <span className="pointer-events-none absolute left-2 top-1.5 h-3 w-1.5 rotate-[-18deg] rounded-full bg-white/35" />
      <svg viewBox="0 0 40 40" className="h-2/3 w-2/3 opacity-95">
        <circle cx={20} cy={20} r={11} fill="#2f9e5e" stroke="#2b1810" strokeWidth={1.5} />
        <path
          d="M20 10 C24 14 24 18 20 21 C16 18 16 14 20 10 Z"
          fill="#ffd43b"
          stroke="#2b1810"
          strokeWidth={1.3}
          strokeLinejoin="round"
        />
        <circle cx={16.5} cy={17.5} r={1.6} fill="#2b1810" />
        <circle cx={23.5} cy={17.5} r={1.6} fill="#2b1810" />
        <circle cx={16.1} cy={17.1} r={0.5} fill="#fff" />
        <circle cx={23.1} cy={17.1} r={0.5} fill="#fff" />
        <path d="M18 24 Q20 26 22 24" fill="none" stroke="#2b1810" strokeWidth={1.1} strokeLinecap="round" />
      </svg>
    </div>
  );
}
