// Static jungle-floor set dressing for TableScreen: a warm dirt/plank ground
// fill plus a leaf-and-vine border framing the play area. No parallax or
// motion here per ui_ux.md's animation budget -- this is set dressing, not a
// scene. Pattern-tiled (rather than viewBox-stretched) so the vine motif
// never distorts at odd viewport widths.
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
