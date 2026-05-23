import { COLORS } from '../lib/tokens';

export function LotusCoin({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id="coin-g" cx="40%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFE89B" />
          <stop offset="60%" stopColor="#F7B83A" />
          <stop offset="100%" stopColor="#C97A12" />
        </radialGradient>
      </defs>
      <circle cx="16" cy="16" r="14" fill="url(#coin-g)" stroke="#9E5B0A" strokeWidth="0.6" />
      {/* lotus glyph (simple, original) */}
      <g fill={COLORS.mintDeep}>
        <path d="M16 9c1.6 2.2 1.6 4.4 0 7.4-1.6-3-1.6-5.2 0-7.4z" />
        <path d="M16 11.4c2.7-0.8 4.9 0.6 5.6 3.4-2.8 0.7-5-0.6-5.6-3.4z" />
        <path d="M16 11.4c-2.7-0.8-4.9 0.6-5.6 3.4 2.8 0.7 5-0.6 5.6-3.4z" />
        <path d="M9 18c1.6-0.5 3.6-0.4 7 0.3-2.5 1.2-5.1 0.9-7-0.3z" />
        <path d="M23 18c-1.6-0.5-3.6-0.4-7 0.3 2.5 1.2 5.1 0.9 7-0.3z" />
      </g>
    </svg>
  );
}
