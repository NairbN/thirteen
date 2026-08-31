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
  bear: { fur: "#a9713f", accent: "#7a4d27", muzzle: "#f1d7ab" },
  cat: { fur: "#f4a94f", accent: "#d9822c", muzzle: "#fff1de" },
  fox: { fur: "#ef7d3b", accent: "#c85a25", muzzle: "#fff6ec" },
  panda: { fur: "#fbfbf8", accent: "#2b2b2b", muzzle: "#ffffff" },
  tiger: { fur: "#f4972b", accent: "#2b2b2b", muzzle: "#fff3e0" },
  bunny: { fur: "#f6cfe0", accent: "#e79cc0", muzzle: "#fff5fa" },
};

// Head circle is centered at (50, 46) with r=28 for every animal so ear/hat
// placement lines up regardless of which animal is selected.
const HEAD_CX = 50;
const HEAD_CY = 46;
const HEAD_R = 28;

function Face() {
  return (
    <g>
      <circle cx={40} cy={45} r={3.4} fill={INK} />
      <circle cx={60} cy={45} r={3.4} fill={INK} />
      <circle cx={41.2} cy={43.7} r={1} fill="#fff" />
      <circle cx={61.2} cy={43.7} r={1} fill="#fff" />
    </g>
  );
}

function Muzzle({ color }: { color: string }) {
  return (
    <g>
      <ellipse cx={50} cy={57} rx={13} ry={9} fill={color} stroke={INK} strokeWidth={STROKE - 0.5} />
      <path d="M 46 58 Q 50 62 54 58" fill="none" stroke={INK} strokeWidth={2} strokeLinecap="round" />
      <circle cx={50} cy={52.5} r={2.6} fill={INK} />
    </g>
  );
}

function AnimalHead({ animal }: { animal: AnimalOption }) {
  const { fur, accent, muzzle } = ANIMAL_PALETTE[animal];

  const ears: Record<AnimalOption, ReactNode> = {
    bear: (
      <g>
        <circle cx={23} cy={24} r={11} fill={fur} stroke={INK} strokeWidth={STROKE} />
        <circle cx={77} cy={24} r={11} fill={fur} stroke={INK} strokeWidth={STROKE} />
        <circle cx={23} cy={24} r={5} fill={accent} />
        <circle cx={77} cy={24} r={5} fill={accent} />
      </g>
    ),
    cat: (
      <g>
        <polygon points="16,28 26,4 36,26" fill={fur} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
        <polygon points="64,28 74,4 84,26" fill={fur} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
        <polygon points="21,24 26,12 31,23" fill={accent} />
        <polygon points="69,24 74,12 79,23" fill={accent} />
      </g>
    ),
    fox: (
      <g>
        <polygon points="14,30 22,2 34,27" fill={fur} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
        <polygon points="66,27 78,2 86,30" fill={fur} stroke={INK} strokeWidth={STROKE} strokeLinejoin="round" />
        <polygon points="19,25 23,10 29,24" fill="#fff6ec" />
        <polygon points="71,24 77,10 81,25" fill="#fff6ec" />
      </g>
    ),
    panda: (
      <g>
        <circle cx={22} cy={22} r={12} fill={accent} stroke={INK} strokeWidth={STROKE} />
        <circle cx={78} cy={22} r={12} fill={accent} stroke={INK} strokeWidth={STROKE} />
        <ellipse cx={39} cy={44} rx={8} ry={10} fill={accent} opacity={0.9} />
        <ellipse cx={61} cy={44} rx={8} ry={10} fill={accent} opacity={0.9} />
      </g>
    ),
    tiger: (
      <g>
        <circle cx={23} cy={23} r={11} fill={fur} stroke={INK} strokeWidth={STROKE} />
        <circle cx={77} cy={23} r={11} fill={fur} stroke={INK} strokeWidth={STROKE} />
        <circle cx={23} cy={24} r={5} fill="#fff3e0" />
        <circle cx={77} cy={24} r={5} fill="#fff3e0" />
      </g>
    ),
    bunny: (
      <g>
        <ellipse
          cx={32}
          cy={4}
          rx={7}
          ry={20}
          fill={fur}
          stroke={INK}
          strokeWidth={STROKE}
          transform="rotate(-12 32 4)"
        />
        <ellipse
          cx={68}
          cy={4}
          rx={7}
          ry={20}
          fill={fur}
          stroke={INK}
          strokeWidth={STROKE}
          transform="rotate(12 68 4)"
        />
        <ellipse
          cx={32}
          cy={4}
          rx={3.2}
          ry={14}
          fill={accent}
          transform="rotate(-12 32 4)"
        />
        <ellipse cx={68} cy={4} rx={3.2} ry={14} fill={accent} transform="rotate(12 68 4)" />
      </g>
    ),
  };

  return (
    <g>
      {ears[animal]}
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
          <ellipse cx={39} cy={44} rx={7} ry={9} fill={accent} />
          <ellipse cx={61} cy={44} rx={7} ry={9} fill={accent} />
        </>
      )}
      <Face />
      <Muzzle color={muzzle} />
    </g>
  );
}

function Glasses({ glasses }: { glasses: GlassesOption }) {
  if (glasses === "none") return null;

  if (glasses === "round") {
    return (
      <g fill="#cdeeff" stroke={INK} strokeWidth={2.5}>
        <circle cx={40} cy={45} r={7} />
        <circle cx={60} cy={45} r={7} />
        <line x1={47} y1={45} x2={53} y2={45} />
      </g>
    );
  }

  if (glasses === "cool") {
    return (
      <g fill={INK} stroke={INK} strokeWidth={2}>
        <rect x={32} y={40} width={16} height={10} rx={4} />
        <rect x={52} y={40} width={16} height={10} rx={4} />
        <line x1={48} y1={44} x2={52} y2={44} stroke={INK} strokeWidth={2.5} />
      </g>
    );
  }

  if (glasses === "star") {
    const star = (cx: number) =>
      Array.from({ length: 10 }, (_, i) => {
        const r = i % 2 === 0 ? 7 : 3;
        const angle = (Math.PI / 5) * i - Math.PI / 2;
        return `${cx + r * Math.cos(angle)},${45 + r * Math.sin(angle)}`;
      }).join(" ");
    return (
      <g fill="#ffd43b" stroke={INK} strokeWidth={2} strokeLinejoin="round">
        <polygon points={star(40)} />
        <polygon points={star(60)} />
        <line x1={47} y1={45} x2={53} y2={45} stroke={INK} strokeWidth={2} />
      </g>
    );
  }

  const heart = (cx: number) =>
    `M ${cx} 41 C ${cx - 7} 34 ${cx - 12} 44 ${cx} 51 C ${cx + 12} 44 ${cx + 7} 34 ${cx} 41 Z`;
  return (
    <g fill="#ff6b8a" stroke={INK} strokeWidth={2} strokeLinejoin="round">
      <path d={heart(40)} />
      <path d={heart(60)} />
      <line x1={47} y1={45} x2={53} y2={45} stroke={INK} strokeWidth={2} />
    </g>
  );
}

function Hat({ hat }: { hat: HatOption }) {
  if (hat === "none") return null;

  if (hat === "cap") {
    return (
      <g>
        <path
          d="M 20 24 Q 50 -2 80 24 L 78 26 Q 50 6 22 26 Z"
          fill="#4dabf7"
          stroke={INK}
          strokeWidth={STROKE}
          strokeLinejoin="round"
        />
        <path d="M 78 24 Q 92 24 94 30 Q 84 32 76 27 Z" fill="#339af0" stroke={INK} strokeWidth={2.5} strokeLinejoin="round" />
      </g>
    );
  }

  if (hat === "tophat") {
    return (
      <g fill="#343a40" stroke={INK} strokeWidth={STROKE} strokeLinejoin="round">
        <rect x={22} y={16} width={56} height={7} rx={2} />
        <rect x={33} y={-10} width={34} height={28} rx={2} />
        <rect x={33} y={2} width={34} height={5} fill="#ffd43b" stroke="none" />
      </g>
    );
  }

  if (hat === "bandana") {
    return (
      <g fill="#ff6b6b" stroke={INK} strokeWidth={STROKE} strokeLinejoin="round">
        <path d="M 19 22 Q 50 -6 81 22 L 74 30 Q 50 8 26 30 Z" />
        <circle cx={35} cy={16} r={2.4} fill="#fff5f5" stroke="none" />
        <circle cx={50} cy={9} r={2.4} fill="#fff5f5" stroke="none" />
        <circle cx={65} cy={16} r={2.4} fill="#fff5f5" stroke="none" />
      </g>
    );
  }

  return (
    <g>
      <polygon
        points="50,-14 66,24 34,24"
        fill="#845ef7"
        stroke={INK}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
      <circle cx={45} cy={2} r={2.2} fill="#ffd43b" stroke="none" />
      <circle cx={54} cy={10} r={2.2} fill="#51cf66" stroke="none" />
      <circle cx={47} cy={17} r={2.2} fill="#ff6b6b" stroke="none" />
      <circle cx={50} cy={-14} r={4.5} fill="#fff" stroke={INK} strokeWidth={2.5} />
    </g>
  );
}

const SHIRT_STYLE: Record<ShirtOption, { base: string; pattern?: "stripes" | "hawaiian" }> = {
  none: { base: "#ced4da" },
  red: { base: "#ff5c5c" },
  blue: { base: "#4dabf7" },
  stripes: { base: "#ffd43b", pattern: "stripes" },
  hawaiian: { base: "#51cf66", pattern: "hawaiian" },
};

function Shirt({ shirt }: { shirt: ShirtOption }) {
  const { base, pattern } = SHIRT_STYLE[shirt];
  const clipId = useId();
  const torsoPath = "M 22 108 L 26 76 Q 50 66 74 76 L 78 108 Z";
  return (
    <g>
      <path d={torsoPath} fill={base} stroke={INK} strokeWidth={STROKE} />
      {pattern === "stripes" && (
        <g stroke="#f08c00" strokeWidth={4} clipPath={`url(#${clipId})`}>
          <line x1={24} y1={86} x2={77} y2={86} />
          <line x1={23} y1={96} x2={78} y2={96} />
          <line x1={22.5} y1={106} x2={78.5} y2={106} />
        </g>
      )}
      {pattern === "hawaiian" && (
        <g fill="#ff922b" clipPath={`url(#${clipId})`}>
          <circle cx={36} cy={86} r={3.5} />
          <circle cx={56} cy={92} r={3.5} />
          <circle cx={42} cy={100} r={3.5} />
          <circle cx={64} cy={82} r={3.5} />
        </g>
      )}
      <clipPath id={clipId}>
        <path d={torsoPath} />
      </clipPath>
      <path d="M 38 76 Q 50 84 62 76 L 58 70 Q 50 76 42 70 Z" fill={INK} opacity={0.15} />
    </g>
  );
}

export default function AvatarRenderer({ config, size = "full", className }: AvatarRendererProps) {
  const showBody = size === "full";

  return (
    <svg
      viewBox={showBody ? "0 -16 100 128" : "0 -16 100 92"}
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
