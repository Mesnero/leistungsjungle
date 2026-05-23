import { COLORS, Ph, MASCOT_LOGO } from '../lib/tokens';
import { MetricPill } from './MetricPill';

export function TopBar({ onMenu }) {
  return (
    <div style={{
      position: 'sticky', top: 0, zIndex: 5,
      paddingTop: 48, paddingBottom: 10,
      background: 'rgba(255,255,255,0.45)',
      backdropFilter: 'blur(16px) saturate(160%)',
      WebkitBackdropFilter: 'blur(16px) saturate(160%)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 18px',
      }}>
        <button onClick={onMenu} style={{
          width: 40, height: 40, border: 0, background: 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0,
        }}>
          <Ph name="list" size={28} color={COLORS.text} weight="bold" />
        </button>
        <div style={{ display: 'flex', gap: 8 }}>
          <MetricPill icon="yin-yang" value="0" />
          <MetricPill icon="leaf" value="0" />
          <MetricPill icon="cloud" value="0" />
        </div>
        <div style={{
          width: 48, height: 48, borderRadius: 24, background: '#fff',
          boxShadow: COLORS.cardShadow, display: 'flex', alignItems: 'center',
          justifyContent: 'center', overflow: 'hidden',
        }}>
          <img src={MASCOT_LOGO} alt="" style={{ width: '78%', height: '78%', objectFit: 'contain' }} />
        </div>
      </div>
    </div>
  );
}
