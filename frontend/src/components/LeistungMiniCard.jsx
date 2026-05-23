// Kompakte Leistungs-Card im Coach-Chat. Tap → DetailSheet öffnen.

import { COLORS, Ph } from '../lib/tokens';
import { categoryIconName, formatErstattung } from '../lib/leistung';


export function LeistungMiniCard({ leistung, onOpen }) {
  const iconName = categoryIconName(leistung.kategorie);
  const erstattung = formatErstattung(leistung.erstattungs_logik);
  const isBonus = leistung.benefit_type === 'bonus_massnahme';

  return (
    <button
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', border: `1px solid ${COLORS.mintPale}`,
        borderRadius: 12, padding: '8px 10px',
        textAlign: 'left', cursor: 'pointer',
        fontFamily: 'inherit',
        boxShadow: '0 1px 3px rgba(20,40,60,0.04), 0 2px 8px rgba(82,189,176,0.05)',
        maxWidth: '85%',
      }}
    >
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: COLORS.mintPale, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Ph name={iconName} size={16} color={COLORS.mintDeep} weight="regular" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: COLORS.ink,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          lineHeight: 1.25,
        }}>{leistung.name}</div>
        {erstattung && (
          <div style={{
            fontSize: 11, color: COLORS.mintDeep, marginTop: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {erstattung.value}
            {erstattung.sub && (
              <span style={{ color: COLORS.muted }}> · {erstattung.sub}</span>
            )}
          </div>
        )}
      </div>

      <span style={{
        fontSize: 9.5, fontWeight: 700,
        color: isBonus ? '#92400E' : COLORS.mintDeep,
        background: isBonus ? '#FEF3C7' : COLORS.mintPale,
        padding: '2px 6px', borderRadius: 5, letterSpacing: 0.3,
        textTransform: 'uppercase', flexShrink: 0,
      }}>{isBonus ? 'Bonus' : 'Satzung'}</span>

      <Ph name="caret-right" size={14} color={COLORS.muted} weight="bold" style={{ flexShrink: 0 }} />
    </button>
  );
}
