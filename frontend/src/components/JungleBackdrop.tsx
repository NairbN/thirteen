// Shared static jungle set dressing for LobbyScreen and TableScreen: a warm
// dirt/plank ground fill, a leaf-and-vine border framing the play area, and a
// layered scene (corner trees, bushes tracing the top/bottom edges, scattered
// rocks, a stream winding through the bottom-left corner) so the screens read
// as a jungle clearing rather than a flat floor. Everything below the vine
// border is positioned toward the viewBox edges/corners on purpose -- Table's
// oval and Lobby's content column occupy the center, so scenery there would
// just get hidden behind foreground UI. No parallax or motion here per
// ui_ux.md's animation budget -- this is set dressing, not a scene.
// Pattern-tiled (rather than viewBox-stretched) for the vine border so the
// motif never distorts at odd viewport widths; the corner/edge props use a
// single 1600x900 viewBox with `slice` cropping instead, since each one is a
// one-off placement rather than a repeating tile.

function TreeCluster({ x, y, scale = 1, flip = false }: { x: number; y: number; scale?: number; flip?: boolean }) {
  const xScale = flip ? -scale : scale;
  return (
    <g transform={`translate(${x} ${y}) scale(${xScale} ${scale})`}>
      <rect x="-13" y="-78" width="26" height="82" rx="11" fill="#8a5f34" stroke="#2b1810" strokeWidth="4" />
      <ellipse cx="-52" cy="-118" rx="46" ry="42" fill="#2f9e44" stroke="#2b1810" strokeWidth="4" />
      <ellipse cx="50" cy="-112" rx="50" ry="46" fill="#37b24d" stroke="#2b1810" strokeWidth="4" />
      <ellipse cx="0" cy="-160" rx="62" ry="56" fill="#40c057" stroke="#2b1810" strokeWidth="4" />
      <ellipse cx="-24" cy="-182" rx="18" ry="11" fill="#fff" opacity="0.35" transform="rotate(-18 -24 -182)" />
      <circle cx="20" cy="-140" r="6" fill="#ffd43b" stroke="#2b1810" strokeWidth="1.5" />
      <circle cx="-40" cy="-100" r="6" fill="#ff6b6b" stroke="#2b1810" strokeWidth="1.5" />
    </g>
  );
}

function Bush({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="-28" cy="-14" rx="26" ry="22" fill="#51cf66" stroke="#2b1810" strokeWidth="3.5" />
      <ellipse cx="28" cy="-16" rx="28" ry="24" fill="#40c057" stroke="#2b1810" strokeWidth="3.5" />
      <ellipse cx="0" cy="-28" rx="34" ry="28" fill="#2f9e44" stroke="#2b1810" strokeWidth="3.5" />
      <ellipse cx="-10" cy="-40" rx="12" ry="7" fill="#fff" opacity="0.3" transform="rotate(-15 -10 -40)" />
    </g>
  );
}

function RockCluster({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <ellipse cx="18" cy="-6" rx="22" ry="15" fill="#ced4da" stroke="#2b1810" strokeWidth="3.5" />
      <ellipse cx="-20" cy="-4" rx="26" ry="17" fill="#adb5bd" stroke="#2b1810" strokeWidth="3.5" />
      <ellipse cx="-2" cy="-16" rx="30" ry="19" fill="#dee2e6" stroke="#2b1810" strokeWidth="3.5" />
      <ellipse cx="-14" cy="-24" rx="10" ry="6" fill="#fff" opacity="0.4" transform="rotate(-12 -14 -24)" />
    </g>
  );
}

function LilyPad({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path d="M0 0 A16 16 0 1 1 15.5 -8 L0 0 Z" fill="#37b24d" stroke="#2b1810" strokeWidth="2.5" />
      <circle cx="-6" cy="-4" r="3" fill="#ffa8c9" stroke="#2b1810" strokeWidth="1" />
    </g>
  );
}

const RIVER_PATH = "M -40 560 C 120 600, 60 700, 180 760 C 280 810, 260 860, 340 920";

export default function JungleBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 25%, #caa06c 0%, #a97c46 55%, #8a5f34 100%)",
        }}
      />
      <div
        className="absolute inset-0 opacity-25"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, transparent 0 76px, rgba(43,24,16,0.4) 76px 80px)",
        }}
      />

      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <g>
          <path d={RIVER_PATH} fill="none" stroke="#1c7ed6" strokeWidth="92" strokeLinecap="round" />
          <path d={RIVER_PATH} fill="none" stroke="#4dabf7" strokeWidth="48" strokeLinecap="round" opacity="0.85" />
          <path d={RIVER_PATH} fill="none" stroke="#a5d8ff" strokeWidth="14" strokeLinecap="round" opacity="0.7" />
          <ellipse cx="110" cy="640" rx="10" ry="5" fill="#fff" opacity="0.6" />
          <ellipse cx="220" cy="790" rx="12" ry="6" fill="#fff" opacity="0.55" />
          <ellipse cx="60" cy="700" rx="8" ry="4" fill="#fff" opacity="0.5" />
        </g>
        <LilyPad x={230} y={720} scale={1.1} />
        <LilyPad x={150} y={670} scale={0.85} />

        <RockCluster x={210} y={870} scale={1.1} />
        <RockCluster x={980} y={880} scale={0.9} />
        <RockCluster x={1360} y={860} scale={1} />
        <Bush x={520} y={860} scale={1.1} />
        <Bush x={720} y={875} scale={0.9} />
        <Bush x={1180} y={865} scale={1} />

        <Bush x={340} y={55} scale={0.9} />
        <Bush x={150} y={90} scale={0.75} />
        <Bush x={1260} y={55} scale={0.95} />
        <Bush x={1460} y={95} scale={0.8} />

        <TreeCluster x={100} y={840} scale={1.15} />
        <TreeCluster x={70} y={470} scale={0.8} />
        <TreeCluster x={1500} y={840} scale={1.15} flip />
        <TreeCluster x={1530} y={420} scale={0.75} flip />
      </svg>

      <svg className="absolute inset-0 h-full w-full">
        <defs>
          <pattern id="jungle-vine-h" width="80" height="28" patternUnits="userSpaceOnUse">
            <path d="M0 14 Q 20 4 40 14 T 80 14" stroke="#2f9e44" strokeWidth="3" fill="none" />
            <g fill="#51cf66" stroke="#2b1810" strokeWidth="1.5">
              <ellipse cx="14" cy="8" rx="7" ry="4" transform="rotate(-20 14 8)" />
              <ellipse cx="40" cy="22" rx="7" ry="4" transform="rotate(20 40 22)" />
              <ellipse cx="66" cy="8" rx="7" ry="4" transform="rotate(-20 66 8)" />
            </g>
            <circle cx="27" cy="14" r="2.4" fill="#ffd43b" stroke="#2b1810" strokeWidth="1" />
            <circle cx="53" cy="14" r="2.4" fill="#ff6b6b" stroke="#2b1810" strokeWidth="1" />
          </pattern>
          <pattern id="jungle-vine-v" width="28" height="80" patternUnits="userSpaceOnUse">
            <path d="M14 0 Q 4 20 14 40 T 14 80" stroke="#2f9e44" strokeWidth="3" fill="none" />
            <g fill="#51cf66" stroke="#2b1810" strokeWidth="1.5">
              <ellipse cx="8" cy="14" rx="4" ry="7" transform="rotate(20 8 14)" />
              <ellipse cx="22" cy="40" rx="4" ry="7" transform="rotate(-20 22 40)" />
              <ellipse cx="8" cy="66" rx="4" ry="7" transform="rotate(20 8 66)" />
            </g>
            <circle cx="14" cy="27" r="2.4" fill="#ffd43b" stroke="#2b1810" strokeWidth="1" />
            <circle cx="14" cy="53" r="2.4" fill="#ff6b6b" stroke="#2b1810" strokeWidth="1" />
          </pattern>
        </defs>
        <rect x="0" y="0" width="100%" height="18" fill="url(#jungle-vine-h)" />
        <rect x="0" y="calc(100% - 18px)" width="100%" height="18" fill="url(#jungle-vine-h)" />
        <rect x="0" y="0" width="18" height="100%" fill="url(#jungle-vine-v)" />
        <rect x="calc(100% - 18px)" y="0" width="18" height="100%" fill="url(#jungle-vine-v)" />
      </svg>
    </div>
  );
}
