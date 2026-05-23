import { COLORS, Ph, MASCOT_CHAR } from '../lib/tokens';

const MENU_ITEMS = [
  { id: 'gesundheit', label: 'Gesundheitsdaten', icon: 'chart-bar' },
  { id: 'settings', label: 'Einstellungen', icon: 'faders-horizontal' },
  { id: 'privacy', label: 'Datenschutz & Teilen', icon: 'shield' },
  { id: 'feedback', label: 'Feedback geben', icon: 'chat-circle-dots' },
  { id: 'imprint', label: 'Impressum', icon: 'info' },
];

export function MenuSheet({ open, onClose, onLogout, onProfile, onDemoPage, profile }) {
  const nickname = profile?.nickname || 'Profil';
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60, pointerEvents: 'none',
    }}>
      {/* dim backdrop */}
      <div onClick={onClose} style={{
        position: 'absolute', inset: 0,
        background: open ? 'rgba(20,30,40,0.32)' : 'transparent',
        transition: 'background 0.25s ease',
        pointerEvents: open ? 'auto' : 'none',
      }} />
      {/* side drawer */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: '78%', maxWidth: 340,
        background: COLORS.mintPale,
        borderRadius: '0 28px 28px 0',
        padding: '56px 18px 28px',
        boxSizing: 'border-box',
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(-102%)',
        transition: 'transform 0.32s cubic-bezier(0.32, 0.72, 0.3, 1)',
        boxShadow: open ? '6px 0 24px rgba(20,40,60,0.12)' : 'none',
        pointerEvents: open ? 'auto' : 'none',
      }}>
        {/* close X */}
        <button onClick={onClose} style={{
          alignSelf: 'flex-start',
          background: 'transparent', border: 0, cursor: 'pointer',
          padding: 6, display: 'flex',
          marginBottom: 14,
        }}>
          <Ph name="x" size={24} color={COLORS.ink} weight="bold" />
        </button>

        {/* profile pill */}
        <div style={{
          background: COLORS.mint, borderRadius: 16,
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
          color: '#fff',
        }}>
          <button onClick={onProfile} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 12,
            flex: 1, minWidth: 0, textAlign: 'left', color: 'inherit',
            fontFamily: 'inherit',
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: 21, background: COLORS.mintSoft,
              display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
              overflow: 'hidden', flexShrink: 0,
            }}>
              <img src={MASCOT_CHAR} alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 17, fontWeight: 600, lineHeight: 1.15,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{nickname}</div>
              <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>Profil ansehen</div>
            </div>
          </button>
          <button onClick={onLogout} style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            padding: 6, display: 'flex', color: '#fff',
          }} aria-label="Logout">
            <Ph name="sign-out" size={22} color="#fff" weight="bold" />
          </button>
        </div>

        {/* items */}
        <div style={{ marginTop: 18, flex: 1 }}>
          {MENU_ITEMS.map(item => (
            <button key={item.id}
              onClick={() => onDemoPage?.(item.label)}
              style={{
                width: '100%', background: 'transparent', border: 0,
                display: 'flex', alignItems: 'center', gap: 18,
                padding: '14px 8px',
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: 12,
                fontFamily: 'inherit',
              }}>
              <div style={{
                width: 28, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ph name={item.icon} size={22} color={COLORS.mintDeep} />
              </div>
              <span style={{
                fontSize: 16, fontWeight: 500, color: COLORS.ink, letterSpacing: -0.1,
              }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
