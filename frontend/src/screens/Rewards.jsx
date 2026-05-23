// Rewards screen — Prämien (rewards) screen
// Edit REWARDS to change the cards.
// Übernommen 1:1 aus rewards.jsx

import { COLORS, Ph } from '../lib/tokens';
import { LotusCoin } from '../components/LotusCoin';

const REWARDS = [
  {
    id: 'tree', title: 'Pflanze einen\nBaum', cost: 300, available: true,
    image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&q=80&auto=format&fit=crop',
  },
  {
    id: 'ocean', title: 'Säubere\nOzeane', available: false,
    image: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=600&q=80&auto=format&fit=crop',
  },
  {
    id: 'river', title: 'Säubere\nFlüsse', available: false,
    image: 'https://images.unsplash.com/photo-1611273426858-450d8e3c9fce?w=600&q=80&auto=format&fit=crop',
  },
  {
    id: 'textile', title: 'Textil-\nrecycling', available: false,
    image: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?w=600&q=80&auto=format&fit=crop',
  },
  {
    id: 'urban', title: 'Urban\nGardening', available: false,
    image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=600&q=80&auto=format&fit=crop',
  },
  {
    id: 'bees', title: 'Bienen\nschützen', available: false,
    image: 'https://images.unsplash.com/photo-1471943311424-646960669fbc?w=600&q=80&auto=format&fit=crop',
  },
];

function BalanceHero({ balance }) {
  return (
    <div style={{
      margin: '4px 18px 18px',
      borderRadius: 18, overflow: 'hidden', position: 'relative',
      height: 200,
    }}>
      <img
        src="https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=900&q=80&auto=format&fit=crop"
        alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(15,40,30,0.25) 0%, rgba(15,40,30,0.45) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        color: '#fff', textAlign: 'center', gap: 10,
      }}>
        <div style={{
          fontSize: 20, fontWeight: 500, letterSpacing: -0.2,
          textShadow: '0 1px 6px rgba(0,0,0,0.35)',
        }}>Aktueller Kontostand</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LotusCoin size={34} />
          <span style={{
            fontSize: 42, fontWeight: 400, lineHeight: 1, letterSpacing: -1,
            textShadow: '0 1px 6px rgba(0,0,0,0.35)',
          }}>{balance}</span>
        </div>
      </div>
    </div>
  );
}

function RewardCard({ reward }) {
  const { title, image, cost, available } = reward;
  return (
    <div style={{
      background: '#F4F6F8', borderRadius: 16, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      boxShadow: '0 1px 3px rgba(20,40,60,0.04)',
    }}>
      <div style={{ position: 'relative', aspectRatio: '1 / 1', background: '#E5E9EC' }}>
        <img src={image} alt=""
          style={{
            width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            filter: available ? 'none' : 'brightness(0.65)',
          }} />
        {available && cost != null && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 16, padding: '4px 10px 4px 6px',
            display: 'flex', alignItems: 'center', gap: 5,
            boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
            fontSize: 14, fontWeight: 700, color: COLORS.ink,
          }}>
            <LotusCoin size={18} />
            <span>{cost}</span>
          </div>
        )}
        {!available && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontSize: 16, fontWeight: 600, textAlign: 'center',
            textShadow: '0 1px 4px rgba(0,0,0,0.5)',
            padding: '0 12px',
          }}>Demnächst verfügbar</div>
        )}
      </div>
      <div style={{
        padding: '12px 8px 16px', textAlign: 'center',
        fontSize: 18, fontWeight: 600, color: COLORS.ink,
        lineHeight: 1.2, whiteSpace: 'pre-line', letterSpacing: -0.3,
      }}>{title}</div>
    </div>
  );
}

export function RewardsScreen({ onMenu }) {
  // Balance reads localStorage so it could be wired up later
  const balance = 0;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 84,
      background: '#fff', zIndex: 35,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* header */}
      <div style={{
        padding: '56px 18px 14px',
        display: 'grid', gridTemplateColumns: '40px 1fr 40px',
        alignItems: 'center',
      }}>
        <button onClick={onMenu} style={{
          background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        }}>
          <Ph name="list" size={28} color={COLORS.mint} weight="bold" />
        </button>
        <h1 style={{
          margin: 0, fontSize: 24, fontWeight: 700, color: COLORS.mint,
          textAlign: 'center', letterSpacing: -0.3,
        }}>Prämien</h1>
        <button style={{
          background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        }}>
          <Ph name="info" size={28} color={COLORS.mint} />
        </button>
      </div>

      {/* scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        <BalanceHero balance={balance} />
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
          padding: '0 18px',
        }}>
          {REWARDS.map(r => <RewardCard key={r.id} reward={r} />)}
        </div>
      </div>
    </div>
  );
}
