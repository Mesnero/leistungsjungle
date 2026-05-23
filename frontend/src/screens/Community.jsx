// Chat — wird als Modal über alles gelegt, geöffnet vom Chat-Icon
// neben „Monatliche Rangliste" auf der Startseite.

import React from 'react';
import { COLORS, Ph } from '../lib/tokens';

export function CommunityScreen({ onBack }) {
  const [query, setQuery] = React.useState('');
  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#fff',
      display: 'flex', flexDirection: 'column', zIndex: 70,
    }}>
      {/* header */}
      <div style={{
        padding: '56px 18px 14px',
        display: 'grid', gridTemplateColumns: '40px 1fr 40px',
        alignItems: 'center',
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        }}>
          <Ph name="arrow-left" size={26} color={COLORS.mint} weight="bold" />
        </button>
        <h1 style={{
          margin: 0, fontSize: 24, fontWeight: 700, color: COLORS.mint,
          textAlign: 'center', letterSpacing: -0.3,
        }}>Chat</h1>
        <button style={{
          background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        }}>
          <Ph name="plus-circle" size={30} color={COLORS.mint} />
        </button>
      </div>

      {/* search bar */}
      <div style={{ padding: '8px 18px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'center',
          background: '#F1F3F5', borderRadius: 30,
          height: 52, padding: '4px 4px 4px 22px',
        }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Suchen..."
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 'none',
              fontSize: 18, color: COLORS.text, fontFamily: 'inherit',
              padding: 0,
            }}
          />
          <button style={{
            width: 44, height: 44, borderRadius: 22, border: 0,
            background: COLORS.mint, cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ph name="magnifying-glass" size={20} color="#fff" weight="bold" />
          </button>
        </div>
      </div>

      {/* empty body */}
      <div style={{ flex: 1 }} />
    </div>
  );
}
