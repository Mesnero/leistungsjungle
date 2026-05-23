import { COLORS, Ph } from '../lib/tokens';

export function MetricPill({ icon, value, weight = 'regular' }) {
  return (
    <div style={{
      height: 32, padding: '0 14px 0 11px', borderRadius: 20,
      background: '#fff', boxShadow: COLORS.cardShadow,
      display: 'flex', alignItems: 'center', gap: 7,
      fontSize: 14, fontWeight: 500, color: COLORS.text,
    }}>
      <Ph name={icon} size={16} color={COLORS.text} weight={weight} />
      <span>{value}</span>
    </div>
  );
}
