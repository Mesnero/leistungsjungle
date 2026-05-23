// Sprechblasen die vom Coach-FAB ausgehen (Pfeil zeigt nach rechts auf den FAB).
// Zwei Varianten: Quote (Inspiration) + Mood (Stimmungs-Tracker).

import { COLORS, Ph } from '../lib/tokens';

// Bubble-Position so dass der Pfeil auf der Mitte des FABs landet.
// FAB sitzt bei right:10, bottom:116, width:92, height:92 → Mitte bei ≈162px vom unteren Rand.
const FAB_GAP = 110;  // Freihalte-Bereich rechts für den FAB

function Shell({ children, onClose }) {
  return (
    <div style={{
      position: 'absolute',
      left: 18, right: FAB_GAP, bottom: 138, zIndex: 50,
      background: COLORS.mint, borderRadius: 18,
      padding: '14px 36px 14px 18px',
      color: '#fff',
      boxShadow: '0 8px 22px rgba(20,40,60,0.16)',
    }}>
      {/* Tail nach rechts zum FAB */}
      <svg width="14" height="22" viewBox="0 0 14 22" style={{
        position: 'absolute', right: -13, top: '50%',
        transform: 'translateY(-50%)', display: 'block',
        filter: 'drop-shadow(2px 0 2px rgba(20,40,60,0.06))',
      }}>
        <path d="M0 0 L14 11 L0 22 Z" fill={COLORS.mint} />
      </svg>

      {/* X close button */}
      <button onClick={onClose} aria-label="Schließen" style={{
        position: 'absolute', top: 8, right: 10,
        background: COLORS.mintDeep, border: 0, borderRadius: 11,
        width: 22, height: 22, cursor: 'pointer', padding: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Ph name="x" size={12} color="#fff" weight="bold" />
      </button>

      {children}
    </div>
  );
}

export function QuoteBubble({ onClose }) {
  return (
    <Shell onClose={onClose}>
      <div style={{
        fontSize: 16, fontStyle: 'italic', lineHeight: 1.35,
        fontWeight: 400, paddingRight: 8,
      }}>
        „Ein ruhiger Geist bringt innere Stärke."
      </div>
      <div style={{
        textAlign: 'right', fontSize: 13, marginTop: 6, opacity: 0.95,
      }}>
        — Dalai Lama XIV
      </div>
    </Shell>
  );
}

const MOODS = [
  { id: 'laugh',   icon: 'smiley' },
  { id: 'smile',   icon: 'smiley-wink' },
  { id: 'neutral', icon: 'smiley-meh' },
  { id: 'sad',     icon: 'smiley-sad' },
  { id: 'cry',     icon: 'smiley-x-eyes' },
];

export function MoodBubble({ value, onPick, onClose }) {
  return (
    <Shell onClose={onClose}>
      <div style={{ fontSize: 14.5, fontWeight: 500, paddingRight: 8 }}>
        Wie fühlst du dich gerade?
      </div>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginTop: 10, padding: '0 4px',
      }}>
        {MOODS.map(m => (
          <button key={m.id} onClick={() => onPick(m.id)} style={{
            background: 'transparent', border: 0, cursor: 'pointer', padding: 4,
            opacity: value && value !== m.id ? 0.55 : 1,
            transform: value === m.id ? 'scale(1.12)' : 'scale(1)',
            transition: 'transform 0.18s, opacity 0.18s',
          }}>
            <Ph name={m.icon} size={28} color="#fff" />
          </button>
        ))}
      </div>
    </Shell>
  );
}
