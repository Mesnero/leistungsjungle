import { COLORS, Ph } from '../lib/tokens';

export function BottomNav({ tab, onChange }) {
  // 4 Tabs — Coach läuft separat als floating FAB rechts.
  const items = [
    { id: 'home',     label: 'Startseite', icon: 'house' },
    { id: 'kasse',    label: 'Leistungen', icon: 'check-circle' },
    { id: 'rewards',  label: 'Prämien',    icon: 'lock' },
    { id: 'discover', label: 'Entdecken',  icon: 'magnifying-glass' },
  ];
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 40,
      height: 84, background: '#fff', borderTop: '1px solid #EEF2F4',
      display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
      paddingTop: 12, paddingBottom: 12,
    }}>
      {items.map(item => {
        const active = tab === item.id;
        const color = active ? COLORS.mint : COLORS.mutedSoft;
        return (
          <button key={item.id} onClick={() => onChange(item.id)} style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'flex-start', gap: 6, padding: 0,
            fontFamily: 'inherit',
          }}>
            <Ph
              name={item.icon}
              size={26}
              color={color}
              weight={active ? 'fill' : 'regular'}
            />
            <span style={{
              fontSize: 12, color,
              fontWeight: active ? 600 : 500, letterSpacing: -0.1,
            }}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
