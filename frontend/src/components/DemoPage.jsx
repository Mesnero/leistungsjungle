// Generische „Fake-Seite" — zeigt nur Header + Skeleton-Liste.
// Erscheint kurz, dann ploppt der DemoBlocker drüber.

import { COLORS, Ph } from '../lib/tokens';

export function DemoPage({ title, onBack }) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#fff', zIndex: 70,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* header */}
      <div style={{
        padding: '56px 18px 14px',
        display: 'grid', gridTemplateColumns: '40px 1fr 40px',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        }}>
          <Ph name="arrow-left" size={26} color={COLORS.mint} weight="bold" />
        </button>
        <h1 style={{
          margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.mint,
          textAlign: 'center', letterSpacing: -0.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</h1>
        <div />
      </div>

      {/* skeleton list — sieht aus wie eine lädt-noch Seite */}
      <div style={{ padding: '8px 18px', flex: 1, overflowY: 'auto' }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: 16, marginBottom: 12,
            background: '#F8F9FA', borderRadius: 14,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 22, background: '#E6E9EB',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                height: 12, background: '#E6E9EB', borderRadius: 6,
                width: `${55 + (i * 7) % 30}%`, marginBottom: 8,
              }} />
              <div style={{
                height: 10, background: '#E6E9EB', borderRadius: 5,
                width: `${35 + (i * 11) % 25}%`,
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
