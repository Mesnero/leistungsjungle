// Floating Action Button für den KI-Coach.
// Das PNG bringt seinen eigenen Mint-Kreis + Sprechblase mit —
// wir rendern es direkt ohne extra Background/Border.

import { MASCOT_BUBBLE } from '../lib/tokens';

export function CoachFAB({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="KI-Coach öffnen"
      style={{
        position: 'absolute', bottom: 116, right: 10, zIndex: 45,
        width: 92, height: 92,
        background: 'transparent', border: 0, cursor: 'pointer',
        padding: 0,
        // Subtiler Drop-Shadow direkt am PNG — das Bild hat schon einen eigenen
        // weichen Schatten, hier nur Tiefe gegen den Page-Hintergrund.
        filter: 'drop-shadow(0 6px 14px rgba(20,40,60,0.18))',
      }}>
      <img src={MASCOT_BUBBLE} alt=""
        style={{
          width: '100%', height: '100%',
          objectFit: 'contain', display: 'block',
        }} />
    </button>
  );
}
