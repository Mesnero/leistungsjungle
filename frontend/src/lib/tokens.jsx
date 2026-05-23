// Design tokens + shared helpers — übernommen 1:1 aus app.jsx

export const COLORS = {
  mint: '#52BDB0',
  mintSoft: '#A8DDD5',
  mintPale: '#DBF0EC',
  mintDeep: '#3FA89B',
  ink: '#1F2937',
  text: '#374151',
  muted: '#9CA3AF',
  mutedSoft: '#C7CDD3',
  cardShadow: '0 2px 10px rgba(20,40,60,0.06), 0 1px 2px rgba(20,40,60,0.04)',
};

// ─── Phosphor icon helper (Iconify API as <img>) ──────────────
export const Ph = ({ name, size = 20, color = 'currentColor', weight = 'regular', style = {}, ...rest }) => {
  const suffix = weight === 'fill' ? '-fill' : weight === 'bold' ? '-bold' : '';
  const c = (color || '').replace('#', '%23');
  const url = `https://api.iconify.design/ph/${name}${suffix}.svg?color=${c}`;
  return (
    <img src={url} alt="" width={size} height={size}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      {...rest} />
  );
};

// ─── Photos (from Unsplash) ───────────────────────────────────
export const PHOTOS = {
  hero: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=900&q=80&auto=format&fit=crop',
  breathing: 'https://images.unsplash.com/photo-1545389336-cf090694435e?w=500&q=80&auto=format&fit=crop',
  meditation: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=500&q=80&auto=format&fit=crop',
  yoga: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=500&q=80&auto=format&fit=crop',
};

export const AVATAR = (seed) => `https://i.pravatar.cc/120?u=${encodeURIComponent(seed)}`;

export const MASCOT_CHAR = 'assets/mascot-character.png';
export const MASCOT_LOGO = 'assets/mascot-logo-2.png';
export const MASCOT_BUBBLE = 'assets/image.png';
