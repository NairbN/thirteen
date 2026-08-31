import { useId, type ReactNode } from "react";
import type {
  AnimalOption,
  AvatarConfig,
  GlassesOption,
  HatOption,
  ShirtOption,
} from "@/lib/avatars";

interface AvatarRendererProps {
  config: AvatarConfig;
  size?: "full" | "compact";
  className?: string;
}

const INK = "#2b1810";
const STROKE = 3;

const ANIMAL_PALETTE: Record<AnimalOption, { fur: string; accent: string; muzzle: string }> = {
  bear: { fur: "#b9855a", accent: "#8a5a30", muzzle: "#fbe6c4" },
  cat: { fur: "#f8bd6b", accent: "#e29a3c", muzzle: "#fff6e8" },
  fox: { fur: "#f4915a", accent: "#d66a30", muzzle: "#fff8f0" },
  panda: { fur: "#fffdf9", accent: "#37343a", muzzle: "#ffffff" },
  tiger: { fur: "#f7a94a", accent: "#37343a", muzzle: "#fff6e6" },
  bunny: { fur: "#fbdcea", accent: "#f0aecb", muzzle: "#fff8fb" },
};

// Head circle is centered at (50, 46) with r=28 for every animal so ear/hat
// placement lines up regardless of which animal is selected.
const HEAD_CX = 50;
const HEAD_CY = 46;
const HEAD_R = 28;

// Chibi anime eyes: oversized dark irises with a bright primary shine plus a
// tiny secondary sparkle, softened blush beneath — the two cues that read as
// "cute" at a glance even at compact/opponent-seat size.
function Eye({ cx, cy, flip = false }: { cx: number; cy: number; flip?: boolean }) {
  const dir = flip ? -1 : 1;
  return (
    <g>
      <ellipse cx={cx} cy={cy} rx={5.6} ry={6.8} fill={INK} />
      <ellipse cx={cx - dir * 1.7} cy={cy - 2.6} rx={2.1} ry={2.7} fill="#fff" />
      <circle cx={cx + dir * 1.6} cy={cy + 2} r={1.15} fill="#fff" opacity={0.9} />
    </g>
  );
}

function Face() {
  return (
    <g>
      <Eye cx={38.5} cy={44.5} />
      <Eye cx={61.5} cy={44.5} flip />
      <ellipse cx={31} cy={53.5} rx={4.4} ry={2.8} fill="#ff9caf" opacity={0.55} />
      <ellipse cx={69} cy={53.5} rx={4.4} ry={2.8} fill="#ff9caf" opacity={0.55} />
    </g>
  );
}

function Muzzle({ color }: { color: string }) {
  return (
    <g>
      <ellipse cx={50} cy={57.5} rx={11.5} ry={8} fill={color} stroke={INK} strokeWidth={STROKE - 0.5} />
      <path d="M 45.5 58.5 Q 50 62.5 54.5 58.5" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <ellipse cx={50} cy={52.5} rx={2.6} ry={2.1} fill={INK} />
      <circle cx={49} cy={51.7} r={0.7} fill="#fff" opacity={0.8} />
    </g>
  );
}

function AnimalHead({ animal }: { animal: AnimalOption }) {
  const { fur, accent, muzzle } = ANIMAL_PALETTE[animal];
  const shineId = useId();

  const ears: Record<AnimalOption, ReactNode> = {
    bear: (
      <g>
        <circle cx={22} cy={23} r={11.5} fill={fur} stroke={INK} strokeWidth={STROKE} />
        <circle cx={78} cy={23} r={11.5} fill={fur} stroke={INK} strokeWidth={STROKE} />
        <circle cx={22} cy={23} r={5.2} fill={accent} />
        <circle cx={78} cy={23} r={5.2} fill={accent} />
      </g>
    ),
    cat: (
      <g strokeLinejoin="round">
        <path d="M 16 29 Q 18 6 27 3 Q 34 8 35 27 Q 25 21 16 29 Z" fill={fur} stroke={INK} strokeWidth={STROKE} />
        <path d="M 84 29 Q 82 6 73 3 Q 66 8 65 27 Q 75 21 84 29 Z" fill={fur} stroke={INK} strokeWidth={STROKE} />
        <path d="M 21 24 Q 23 12 27 10 Q 31 13 31 23 Q 26 19 21 24 Z" fill={accent} />
        <path d="M 79 24 Q 77 12 73 10 Q 69 13 69 23 Q 74 19 79 24 Z" fill={accent} />
      </g>
    ),
    fox: (
      <g strokeLinejoin="round">
        <path d="M 14 31 Q 15 6 24 2 Q 32 9 33 28 Q 23 21 14 31 Z" fill={fur} stroke={INK} strokeWidth={STROKE} />
        <path d="M 86 31 Q 85 6 76 2 Q 68 9 67 28 Q 77 21 86 31 Z" fill={fur} stroke={INK} strokeWidth={STROKE} />
        <path d="M 19 26 Q 21 13 25 10 Q 29 14 28 25 Q 23 21 19 26 Z" fill="#fff6ec" />
        <path d="M 81 26 Q 79 13 75 10 Q 71 14 72 25 Q 77 21 81 26 Z" fill="#fff6ec" />
      </g>
    ),
    panda: (
      <g>
        <circle cx={21} cy={21} r={12.5} fill={accent} stroke={INK} strokeWidth={STROKE} />
        <circle cx={79} cy={21} r={12.5} fill={accent} stroke={INK} strokeWidth={STROKE} />
        <ellipse cx={38} cy={43} rx={8.5} ry={10.5} fill={accent} />
        <ellipse cx={62} cy={43} rx={8.5} ry={10.5} fill={accent} />
      </g>
    ),
    tiger: (
      <g>
        <circle cx={22} cy={22} r={11.5} fill={fur} stroke={INK} strokeWidth={STROKE} />
        <circle cx={78} cy={22} r={11.5} fill={fur} stroke={INK} strokeWidth={STROKE} />
        <circle cx={22} cy={23} r={5.2} fill="#fff3e0" />
        <circle cx={78} cy={23} r={5.2} fill="#fff3e0" />
      </g>
    ),
    bunny: (
      <g>
        <ellipse cx={31} cy={2} rx={7.5} ry={21} fill={fur} stroke={INK} strokeWidth={STROKE} transform="rotate(-11 31 2)" />
        <ellipse cx={69} cy={2} rx={7.5} ry={21} fill={fur} stroke={INK} strokeWidth={STROKE} transform="rotate(11 69 2)" />
        <ellipse cx={31} cy={2} rx={3.4} ry={14.5} fill={accent} transform="rotate(-11 31 2)" />
        <ellipse cx={69} cy={2} rx={3.4} ry={14.5} fill={accent} transform="rotate(11 69 2)" />
      </g>
    ),
  };

  return (
    <g>
      {ears[animal]}
      <defs>
        <clipPath id={shineId}>
          <circle cx={HEAD_CX} cy={HEAD_CY} r={HEAD_R} />
        </clipPath>
      </defs>
      <circle cx={HEAD_CX} cy={HEAD_CY} r={HEAD_R} fill={fur} stroke={INK} strokeWidth={STROKE} />
      {animal === "tiger" && (
        <g stroke={accent} strokeWidth={2.5} strokeLinecap="round" fill="none">
          <path d="M 26 30 Q 22 34 25 39" />
          <path d="M 74 30 Q 78 34 75 39" />
          <path d="M 30 22 Q 33 18 37 20" />
          <path d="M 70 22 Q 67 18 63 20" />
        </g>
      )}
      {animal === "panda" && (
        <>
          <ellipse cx={38} cy={43} rx={7.5} ry={9.5} fill={accent} />
          <ellipse cx={62} cy={43} rx={7.5} ry={9.5} fill={accent} />
        </>
      )}
      <ellipse
        cx={38}
        cy={28}
        rx={13}
        ry={8}
        fill="#ffffff"
        opacity={0.35}
        clipPath={`url(#${shineId})`}
        transform="rotate(-18 38 28)"
      />
      <Face />
      <Muzzle color={muzzle} />
    </g>
  );
}

function Glasses({ glasses }: { glasses: GlassesOption }) {
  if (glasses === "none") return null;

  if (glasses === "round") {
    return (
      <g fill="#d7f2ff" stroke={INK} strokeWidth={2.5} opacity={0.9}>
        <circle cx={38.5} cy={44.5} r={7.6} />
        <circle cx={61.5} cy={44.5} r={7.6} />
        <line x1={46} y1={44.5} x2={54} y2={44.5} />
        <circle cx={36} cy={42} r={1.6} fill="#fff" stroke="none" opacity={0.8} />
        <circle cx={59} cy={42} r={1.6} fill="#fff" stroke="none" opacity={0.8} />
      </g>
    );
  }

  if (glasses === "cool") {
    return (
      <g fill={INK} stroke={INK} strokeWidth={2} strokeLinejoin="round">
        <rect x={30} y={39} width={17} height={11} rx={5} />
        <rect x={53} y={39} width={17} height={11} rx={5} />
        <line x1={47} y1={44.5} x2={53} y2={44.5} stroke={INK} strokeWidth={2.5} />
        <path d="M 34 42 Q 36 40 39 41" stroke="#fff" strokeWidth={1.4} fill="none" opacity={0.6} />
        <path d="M 57 42 Q 59 40 62 41" stroke="#fff" strokeWidth={1.4} fill="none" opacity={0.6} />
      </g>
    );
  }

  if (glasses === "star") {
    const star = (cx: number) =>
      Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? 7.5 : 3.2;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${44.5 + r * Math.sin(angle)}`;
      }).join(" ");
    return (
      <g fill="#ffd43b" stroke={INK} strokeWidth={2} strokeLinejoin="round">
        <polygon points={star(38.5)} />
        <polygon points={star(61.5)} />
        <line x1={46} y1={44.5} x2={54} y2={44.5} stroke={INK} strokeWidth={2} />
      </g>
    );
  }

  const heart = (cx: number) =>
    `M ${cx} 40.5 C ${cx - 7.5} 33 ${cx - 13} 44 ${cx} 51.5 C ${cx + 13} 44 ${cx + 7.5} 33 ${cx} 40.5 Z`;
  return (
    <g fill="#ff6b8a" stroke={INK} strokeWidth={2} strokeLinejoin="round">
      <path d={heart(38.5)} />
      <path d={heart(61.5)} />
      <line x1={46} y1={44.5} x2={54} y2={44.5} stroke={INK} strokeWidth={2} />
    </g>
  );
}

function Hat({ hat }: { hat: HatOption }) {
  if (hat === "none") return null;

  if (hat === "cap") {
    return (
      <g>
        <path
          d="M 20 24 Q 50 -4 80 24 L 78 26 Q 50 4 22 26 Z"
          fill="#5fc4ff"
          stroke={INK}
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
        <path d="M 78 24 Q 93 24 95 31 Q 84 33 76 27 Z" fill="#3aa9f2" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
        <circle cx={50} cy={2} r={2.6} fill="#fff" stroke={INK} strokeWidth={1.6} />
      </g>
    );
  }

  if (hat === "tophat") {
    return (
      <g stroke={INK} strokeWidth={STROKE} strokeLinejoin="round">
        <rect x={21} y={16} width={58} height={7} rx={3.5} fill="#3d3a42" />
        <rect x={32} y={-11} width={36} height={29} rx={6} fill="#3d3a42" />
        <rect x={32} y={2} width={36} height={5.5} fill="#ff8fb3" stroke="none" />
        <circle cx={62} cy={4.5} r={2} fill="#fff" stroke="none" opacity={0.8} />
      </g>
    );
  }

  if (hat === "bandana") {
    return (
      <g fill="#ff7a7a" stroke={INK} strokeWidth={STROKE} strokeLinejoin="round">
        <path d="M 18 22 Q 50 -8 82 22 L 74 31 Q 50 9 26 31 Z" />
        <circle cx={35} cy={16} r={2.6} fill="#fff5f5" stroke="none" />
        <circle cx={50} cy={8} r={2.6} fill="#fff5f5" stroke="none" />
        <circle cx={65} cy={16} r={2.6} fill="#fff5f5" stroke="none" />
      </g>
    );
  }

  return (
    <g>
      <polygon
        points="50,-16 67,24 33,24"
        fill="#9b7bfa"
        stroke={INK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <circle cx={44} cy={2} r={2.4} fill="#ffd43b" stroke="none" />
      <circle cx={55} cy={11} r={2.4} fill="#63e6a0" stroke="none" />
      <circle cx={46} cy={18} r={2.4} fill="#ff8fa3" stroke="none" />
      <circle cx={50} cy={-16} r={5} fill="#fff" stroke={INK} strokeWidth={2.5} />
      <circle cx={48.5} cy={-17.5} r={1.4} fill="#ffe3f1" stroke="none" />
    </g>
  );
}

const SHIRT_STYLE: Record<ShirtOption, { base: string; pattern?: "stripes" | "hawaiian" }> = {
  none: { base: "#d8dee3" },
  red: { base: "#ff7a7a" },
  blue: { base: "#5fc4ff" },
  stripes: { base: "#ffe066" },
  hawaiian: { base: "#69db8f" },
};

function Shirt({ shirt }: { shirt: ShirtOption }) {
  const { base, pattern } = SHIRT_STYLE[shirt];
  const clipId = useId();
  const torsoPath = "M 21 108 L 25 75 Q 50 64 75 75 L 79 108 Z";
  return (
    <g>
      <path d={torsoPath} fill={base} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
      {pattern === "stripes" && (
        <g stroke="#f7b731" strokeWidth={4.5} clipPath={`url(#${clipId})`}>
          <line x1={23} y1={85} x2={77} y2={85} />
          <line x1={22} y1={95} x2={78} y2={95} />
          <line x1={21.5} y1={105} x2={78.5} y2={105} />
        </g>
      )}
      {pattern === "hawaiian" && (
        <g fill="#ffa94d" clipPath={`url(#${clipId})`}>
          <circle cx={35} cy={85} r={3.8} />
          <circle cx={57} cy={91} r={3.8} />
          <circle cx={42} cy={100} r={3.8} />
          <circle cx={65} cy={81} r={3.8} />
        </g>
      )}
      <clipPath id={clipId}>
        <path d={torsoPath} />
      </clipPath>
      <path d="M 37 75 Q 50 83 63 75 L 58 69 Q 50 75 42 69 Z" fill={INK} opacity={0.14} />
      <ellipse cx={33} cy={82} rx={4.5} ry={7} fill="#fff" opacity={0.18} clipPath={`url(#${clipId})`} />
    </g>
  );
}

export default function AvatarRenderer({ config, size = "full", className }: AvatarRendererProps) {
  const showBody = size === "full";

  return (
    <svg
      viewBox={showBody ? "0 -18 100 130" : "0 -18 100 92"}
      className={className}
      role="img"
      aria-label={`${config.animal} avatar`}
    >
      {showBody && <Shirt shirt={config.shirt} />}
      <AnimalHead animal={config.animal} />
      <Glasses glasses={config.glasses} />
      <Hat hat={config.hat} />
    </svg>
  );
}
