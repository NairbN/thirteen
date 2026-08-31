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
      className={`flex flex-col items-center justify-between rounded-2xl border-[3px] border-ink bg-[#fffaf0] p-1.5 font-display font-bold shadow-[0_4px_0_rgba(43,24,16,0.55)] transition-all duration-150 ease-out ${SIZE_CLASSES[size]} ${
        isRed ? "text-rose-600" : "text-ink"
      } ${
        selected
          ? "-translate-y-4 rotate-1 ring-4 ring-amber-300 shadow-[0_8px_0_rgba(43,24,16,0.55)]"
          : ""
      } ${interactive ? "cursor-pointer hover:-translate-y-2 hover:-rotate-1 active:translate-y-0" : "cursor-default"}`}
    >
      <span className="self-start leading-none">{rank}</span>
      <span className={`leading-none ${GLYPH_SIZE[size]}`}>{glyph}</span>
    </button>
  );
}

export function CardBack({ size = "md" }: { size?: CardProps["size"] }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl border-[3px] border-ink bg-emerald-500 shadow-[0_3px_0_rgba(43,24,16,0.55)] ${SIZE_CLASSES[size ?? "md"]}`}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" className="h-2/3 w-2/3 opacity-90">
        <path
          d="M20 6 Q28 14 20 20 Q12 14 20 6 Z M20 20 Q28 26 20 34 Q12 26 20 20 Z"
          fill="#ffd43b"
          stroke="#2b1810"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
