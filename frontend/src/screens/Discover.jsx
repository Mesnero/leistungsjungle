// Discover screen — Entdecken
// Edit ARTICLES to change the list.
// Übernommen 1:1 aus discover.jsx

import React from 'react';
import { COLORS, Ph } from '../lib/tokens';
import { LotusCoin } from '../components/LotusCoin';

const HERO_ARTICLE = {
  tag: 'Aufgabe des Tages',
  title: 'Meditation: Ein einfacher, schneller Weg, Stress abzuba…',
  date: '2025 Okt',
  reward: 2,
  image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=900&q=80&auto=format&fit=crop',
};

const ARTICLES = [
  {
    id: 'water', title: 'Wie viel Wasser brauchen Sie tatsächlich?',
    category: 'Gesundheit', date: '20.05.20…', reward: 2,
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&q=80&auto=format&fit=crop',
  },
  {
    id: 'dehydration', title: 'Wie Dehydration Gehirnnebel nachahmt',
    category: 'Gesundheit', date: '20.05.20…', reward: 2,
    image: 'https://images.unsplash.com/photo-1523362628745-0c100150b504?w=400&q=80&auto=format&fit=crop',
  },
  {
    id: 'coffee', title: 'Wie Kaffee die Nährstoffaufnahme beeinf…',
    category: 'Gesundheit', date: '20.05.20…', reward: 2,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400&q=80&auto=format&fit=crop',
  },
  {
    id: 'sleep', title: 'Warum guter Schlaf alles verändert',
    category: 'Lernen', date: '18.05.20…', reward: 2,
    image: 'https://images.unsplash.com/photo-1455642305367-68834a1da7ab?w=400&q=80&auto=format&fit=crop',
  },
];

const FILTERS = ['Alle', 'Lernen', 'Umwelt', 'Gesundheit'];

function HeroArticle() {
  const a = HERO_ARTICLE;
  return (
    <div style={{
      margin: '4px 18px 22px',
      borderRadius: 18, overflow: 'hidden', position: 'relative',
      aspectRatio: '1 / 1', maxHeight: 440,
    }}>
      <img src={a.image} alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          filter: 'brightness(0.78)' }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(80,140,160,0.15) 0%, rgba(20,40,55,0.55) 100%)',
      }} />
      {/* tag */}
      <div style={{
        position: 'absolute', top: 24, left: 22,
        fontSize: 16, fontWeight: 500, color: COLORS.mint,
      }}>{a.tag}</div>
      {/* title */}
      <div style={{
        position: 'absolute', top: 60, left: 22, right: 22,
        fontSize: 32, fontWeight: 700, color: '#fff', lineHeight: 1.1,
        letterSpacing: -0.4,
        textShadow: '0 1px 6px rgba(0,0,0,0.3)',
      }}>{a.title}</div>
      {/* date */}
      <div style={{
        position: 'absolute', bottom: 22, left: 22,
        fontSize: 16, fontWeight: 500, color: '#fff',
        textShadow: '0 1px 4px rgba(0,0,0,0.4)',
      }}>{a.date}</div>
      {/* reward pill */}
      <div style={{
        position: 'absolute', bottom: 18, right: 18,
        background: '#fff', borderRadius: 16, padding: '4px 8px 4px 12px',
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 15, fontWeight: 600, color: COLORS.ink,
        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
      }}>
        +{a.reward}
        <LotusCoin size={22} />
      </div>
    </div>
  );
}

function FilterPills({ active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 10, padding: '0 18px',
      overflow: 'hidden', whiteSpace: 'nowrap',
    }}>
      {FILTERS.map(f => {
        const isActive = f === active;
        return (
          <button key={f} onClick={() => onChange(f)} style={{
            background: isActive ? COLORS.mint : '#F1F3F5',
            color: isActive ? '#fff' : COLORS.muted,
            border: 0, cursor: 'pointer',
            height: 38, borderRadius: 19, padding: '0 18px',
            fontSize: 15, fontWeight: 500, fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}>
            {isActive && <Ph name="check" size={14} color="#fff" weight="bold" />}
            {f}
          </button>
        );
      })}
    </div>
  );
}

function ArticleRow({ article }) {
  return (
    <div style={{
      display: 'flex', gap: 14, alignItems: 'stretch',
      background: '#F4F6F8', borderRadius: 16, padding: 10,
    }}>
      <img src={article.image} alt=""
        style={{
          width: 90, height: 90, borderRadius: 12, objectFit: 'cover',
          flexShrink: 0, display: 'block',
        }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{
          fontSize: 15.5, fontWeight: 600, color: COLORS.ink,
          lineHeight: 1.25, letterSpacing: -0.2,
        }}>{article.title}</div>
        <div style={{ flex: 1 }} />
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontSize: 13, color: COLORS.muted,
        }}>
          <span style={{ color: COLORS.mint, fontWeight: 500 }}>{article.category}</span>
          <span>{article.date}</span>
          <div style={{ flex: 1 }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 13, fontWeight: 600, color: COLORS.text,
          }}>+{article.reward} <LotusCoin size={18} /></div>
        </div>
      </div>
    </div>
  );
}

export function DiscoverScreen({ onMenu }) {
  const [filter, setFilter] = React.useState('Alle');

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
        }}>Entdecken</h1>
        <button style={{
          background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        }}>
          <Ph name="magnifying-glass" size={26} color={COLORS.mint} weight="bold" />
        </button>
      </div>

      {/* body */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 24 }}>
        <HeroArticle />

        <h2 style={{
          margin: '0 0 14px 18px', fontSize: 20, fontWeight: 700,
          color: COLORS.ink, letterSpacing: -0.3,
        }}>Schnellzugriff</h2>

        <FilterPills active={filter} onChange={setFilter} />

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: '18px 18px 0',
        }}>
          {ARTICLES.map(a => <ArticleRow key={a.id} article={a} />)}
        </div>
      </div>
    </div>
  );
}
