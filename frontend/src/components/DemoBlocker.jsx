// Lustiger „Diese Funktion ist nicht Teil der Demo"-Blocker.
// Stempel + Maskottchen + Countdown der dich automatisch rauswirft.

import { useEffect, useState } from 'react';
import { COLORS, MASCOT_CHAR } from '../lib/tokens';

const TOTAL_SECONDS = 4;

export function DemoBlocker({ open, onClose }) {
  const [countdown, setCountdown] = useState(TOTAL_SECONDS);

  useEffect(() => {
    if (!open) {
      setCountdown(TOTAL_SECONDS);
      return;
    }
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return c - 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, [open, onClose]);

  if (!open) return null;

  const buttonText = countdown > 1
    ? `Schnell wieder weg… ${countdown}`
    : 'Tschüssi! 👋';

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 90,
        background: 'rgba(20,30,40,0.48)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
        animation: 'demo-fade 0.2s ease-out',
      }}>
      <style>{`
        @keyframes demo-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes demo-card-pop {
          0%   { transform: scale(0.6) translateY(20px); opacity: 0; }
          100% { transform: scale(1)   translateY(0);    opacity: 1; }
        }
        @keyframes demo-stamp-slam {
          0%   { transform: rotate(-30deg) scale(2.8); opacity: 0; }
          55%  { transform: rotate(-10deg) scale(0.92); opacity: 1; }
          75%  { transform: rotate(-8deg)  scale(1.04); }
          100% { transform: rotate(-8deg)  scale(1);    opacity: 1; }
        }
        @keyframes demo-mascot-peek {
          0%   { transform: translateY(40px) rotate(-20deg); opacity: 0; }
          60%  { transform: translateY(-6px) rotate(8deg);   opacity: 1; }
          100% { transform: translateY(0)    rotate(0);      opacity: 1; }
        }
        @keyframes demo-shake {
          0%, 100% { transform: translateX(0); }
          25%      { transform: translateX(-3px); }
          75%      { transform: translateX(3px); }
        }
      `}</style>

      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 28,
          padding: '34px 26px 22px',
          textAlign: 'center',
          boxShadow: '0 24px 60px rgba(0,0,0,0.28)',
          animation: 'demo-card-pop 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
          maxWidth: 320, width: '100%',
          position: 'relative',
        }}>

        {/* Stempel — slams in mit Rotation */}
        <div style={{
          display: 'inline-block',
          border: '3px solid #E53E3E',
          color: '#E53E3E',
          padding: '8px 18px 6px',
          borderRadius: 8,
          fontSize: 18, fontWeight: 800, letterSpacing: 1.5,
          textTransform: 'uppercase',
          fontFamily: '"Courier New", "Courier", monospace',
          marginBottom: 22,
          animation: 'demo-stamp-slam 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          transformOrigin: 'center',
          textShadow: '1px 1px 0 rgba(229,62,62,0.20)',
          boxShadow: 'inset 0 0 0 1px rgba(229,62,62,0.18)',
        }}>
          Nicht in der Demo!
        </div>

        {/* Maskottchen */}
        <div style={{
          width: 88, height: 88, borderRadius: 44,
          background: COLORS.mintSoft, margin: '0 auto 14px',
          overflow: 'hidden',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          animation: 'demo-mascot-peek 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s both',
        }}>
          <img src={MASCOT_CHAR} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%',
          }} />
        </div>

        <h2 style={{
          margin: '0 0 8px', fontSize: 20, fontWeight: 700,
          color: COLORS.ink, letterSpacing: -0.3,
        }}>
          Pssst! 🤫
        </h2>
        <p style={{
          margin: '0 0 22px', fontSize: 14.5, lineHeight: 1.5,
          color: COLORS.text,
        }}>
          Die Community ist <b>kein Teil der Demo</b>.<br/>
          Hier gibt's nix zu sehen — schnell wieder weg!
        </p>

        <button onClick={onClose} style={{
          width: '100%', height: 46, borderRadius: 14, border: 0,
          background: COLORS.mint, color: '#fff',
          fontSize: 15, fontWeight: 600, fontFamily: 'inherit',
          cursor: 'pointer',
          letterSpacing: -0.1,
          fontVariantNumeric: 'tabular-nums',
          // shake wenn nur noch 1 Sek übrig → erzeugt Dringlichkeit
          animation: countdown === 1 ? 'demo-shake 0.25s ease-in-out infinite' : 'none',
        }}>
          {buttonText}
        </button>
      </div>
    </div>
  );
}
