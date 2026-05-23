import { useEffect, useRef, useState } from 'react';
import { COLORS, Ph, PHOTOS, AVATAR, MASCOT_CHAR } from '../lib/tokens';
import { TopBar } from '../components/TopBar';

function HeroBackground() {
  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: 460,
      overflow: 'hidden',
    }}>
      <img src={PHOTOS.hero} alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 110,
        background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,1) 100%)',
      }} />
    </div>
  );
}

function StepsRing({ value, goal }) {
  const target = Math.max(0, value);
  const targetPct = Math.min(1, target / goal);
  const R = 132;
  const C = 2 * Math.PI * R;

  // Animierte Anzeige-Werte — laufen beim Mount (und bei value/goal-Änderung) hoch.
  const [displayValue, setDisplayValue] = useState(0);
  const [displayPct, setDisplayPct] = useState(0);

  // Startwerte für Re-Animation merken (damit Updates von „current → neu" laufen, nicht von 0).
  const startValueRef = useRef(0);
  const startPctRef = useRef(0);

  useEffect(() => {
    const startVal = startValueRef.current;
    const startPct = startPctRef.current;
    const duration = 1400; // ms — fühlt sich „satt" an, ohne träge zu wirken
    const startTime = performance.now();
    // easeOutCubic — schnell rein, sanft einrasten
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    let raf = 0;
    const tick = (now) => {
      const t = Math.min(1, (now - startTime) / duration);
      const k = ease(t);
      const v = startVal + (target - startVal) * k;
      const p = startPct + (targetPct - startPct) * k;
      setDisplayValue(Math.round(v));
      setDisplayPct(p);
      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else {
        startValueRef.current = target;
        startPctRef.current = targetPct;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, targetPct]);

  return (
    <div style={{ position: 'relative', width: 290, height: 290, margin: '0 auto' }}>
      <svg width="290" height="290" viewBox="0 0 290 290"
        style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
        <circle cx="145" cy="145" r={R} stroke="#EEF7F5" strokeWidth="10" fill="#fff"/>
        <circle cx="145" cy="145" r={R} stroke={COLORS.mint} strokeWidth="10" fill="none"
          strokeLinecap="round"
          strokeDasharray={`${C * displayPct} ${C}`} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center',
      }}>
        <Ph name="person-simple-run" size={38} color={COLORS.ink} />
        <div style={{
          fontSize: 56, fontWeight: 400, color: COLORS.ink,
          letterSpacing: -1, lineHeight: 1, marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}>{displayValue}</div>
        <div style={{
          fontSize: 20, color: COLORS.muted, marginTop: 6, fontWeight: 300,
          fontVariantNumeric: 'tabular-nums',
        }}>
          /{goal}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 16, color: COLORS.muted, marginTop: 4,
        }}>
          Schritte <Ph name="arrow-counter-clockwise" size={14} color={COLORS.muted} />
        </div>
      </div>
    </div>
  );
}

// Mood-Id → Anzeige für die Stimmungs-Stat-Kachel.
const MOOD_META = {
  laugh:   { icon: 'smiley',        label: 'Glücklich' },
  smile:   { icon: 'smiley-wink',   label: 'Gut' },
  neutral: { icon: 'smiley-meh',    label: 'Okay' },
  sad:     { icon: 'smiley-sad',    label: 'Traurig' },
  cry:     { icon: 'smiley-x-eyes', label: 'Mies' },
};

function StatCircle({ icon, value, label, progress = 0 }) {
  const target = Math.min(1, Math.max(0, progress));
  const SIZE = 108;
  const STROKE = 3;
  const R = (SIZE / 2) - (STROKE / 2) - 1;
  const C = 2 * Math.PI * R;
  const active = target > 0;

  // Damit die CSS-Transition feuert, rendern wir initial bei 0 und schalten
  // im nächsten Frame auf den Zielwert.
  const [displayPct, setDisplayPct] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setDisplayPct(target));
    return () => cancelAnimationFrame(raf);
  }, [target]);

  return (
    <div style={{
      width: SIZE, height: SIZE, borderRadius: SIZE / 2,
      background: '#fff', boxShadow: COLORS.cardShadow,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', position: 'relative', gap: 4,
    }}>
      {/* progress ring */}
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
        style={{
          position: 'absolute', inset: 0,
          transform: 'rotate(-90deg)', pointerEvents: 'none',
        }}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R}
          stroke={COLORS.mintPale} strokeWidth={STROKE} fill="none" />
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R}
          stroke={COLORS.mint} strokeWidth={STROKE} fill="none"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - displayPct)}
          style={{ transition: 'stroke-dashoffset 1.2s ease-out' }} />
      </svg>
      <Ph name={icon} size={26} color={active ? COLORS.mint : COLORS.muted} />
      <div style={{
        // Lange Texte (z.B. „Keine Daten", „Glücklich") werden kleiner gerendert,
        // damit sie nicht über den Kreis-Rand drücken.
        fontSize: String(value).length > 5 ? 14 : 18,
        color: COLORS.text, fontWeight: 400, marginTop: 2,
      }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.muted }}>{label}</div>
    </div>
  );
}

function StatRow({ mood }) {
  const moodMeta = mood ? MOOD_META[mood] : null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-around', gap: 10,
      padding: '0 18px', marginTop: 18, position: 'relative', zIndex: 2,
    }}>
      <StatCircle icon="flower-lotus" value="0/1" label="Achtsamkeit" progress={0} />
      <StatCircle icon="book-open" value="1/1" label="Lernen" progress={1} />
      <StatCircle
        icon={moodMeta?.icon || 'smiley'}
        value={moodMeta?.label || 'Keine Daten'}
        label="Stimmung"
        progress={moodMeta ? 1 : 0}
      />
    </div>
  );
}

function BenefitCard({ onClick }) {
  return (
    <section style={{ padding: '11px 18px 0' }}>
      <style>{`
        @keyframes benefit-shimmer {
          0%   { transform: translateX(-130%) skewX(-12deg); }
          30%  { transform: translateX(230%)  skewX(-12deg); }
          100% { transform: translateX(230%)  skewX(-12deg); }
        }
        @keyframes benefit-glow {
          0%, 100% {
            box-shadow: 0 4px 14px rgba(82,189,176,0.30);
          }
          50% {
            box-shadow: 0 6px 22px rgba(82,189,176,0.48),
                        0 0 0 6px rgba(82,189,176,0.07);
          }
        }
      `}</style>

      <button onClick={onClick} style={{
        width: '100%', background: COLORS.mint, color: '#fff',
        border: 0, borderRadius: 14,
        padding: '16px 18px',
        display: 'flex', alignItems: 'center', gap: 14,
        cursor: 'pointer', position: 'relative',
        boxShadow: '0 4px 14px rgba(82,189,176,0.30)',
        textAlign: 'left', fontFamily: 'inherit',
        animation: 'benefit-glow 2.4s ease-in-out infinite',
      }}>
        {/* Shimmer overlay — eigener Clip, damit der Sweep am Rand sauber abgeschnitten wird */}
        <div style={{
          position: 'absolute', inset: 0,
          borderRadius: 14, overflow: 'hidden',
          pointerEvents: 'none',
        }}>
          <div style={{
            position: 'absolute', top: -10, bottom: -10, left: 0, width: '35%',
            background: 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 50%, rgba(255,255,255,0) 100%)',
            transform: 'translateX(-130%) skewX(-12deg)',
            animation: 'benefit-shimmer 3.5s ease-in-out infinite',
            willChange: 'transform',
          }} />
        </div>

        {/* NEU badge — außerhalb des Clip-Containers, damit er rausragen darf */}
        <div style={{
          position: 'absolute', top: -9, right: 14,
          background: '#fff', color: COLORS.mint,
          padding: '3px 9px', borderRadius: 8,
          fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
          boxShadow: '0 2px 6px rgba(0,0,0,0.14)',
        }}>NEU</div>

        {/* Icon */}
        <div style={{
          width: 48, height: 48, borderRadius: 12,
          background: 'rgba(255,255,255,0.20)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, position: 'relative', zIndex: 1,
        }}>
          <Ph name="shield-check" size={26} color="#fff" weight="fill" />
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
          <div style={{
            fontSize: 16, fontWeight: 600, letterSpacing: -0.1, lineHeight: 1.2,
          }}>Deine Kassenleistungen</div>
          <div style={{
            fontSize: 13, opacity: 0.92, marginTop: 3, lineHeight: 1.3,
          }}>Bonus &amp; Vorsorge — persönlich für dich</div>
        </div>

        <Ph
          name="caret-right" size={18} color="#fff" weight="bold"
          style={{ position: 'relative', zIndex: 1 }}
        />
      </button>
    </section>
  );
}

function WeekStreak({ doneCount = 0, weeks = 0 }) {
  const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  // burnId steigt mit jedem Klick — triggert via key={} die Re-Mount-Animation.
  // burning steuert kurz den intensivierten Glow.
  const [burnId, setBurnId] = useState(0);
  const [burning, setBurning] = useState(false);
  const burnTimer = useRef(null);

  const ignite = () => {
    setBurnId(b => b + 1);
    setBurning(true);
    if (burnTimer.current) clearTimeout(burnTimer.current);
    burnTimer.current = setTimeout(() => setBurning(false), 900);
  };

  useEffect(() => () => clearTimeout(burnTimer.current), []);

  const flames = [
    { x: -22, size: 18, delay: 0,   dur: 0.9 },
    { x: -8,  size: 22, delay: 60,  dur: 1.1 },
    { x: 6,   size: 19, delay: 120, dur: 1.0 },
    { x: 20,  size: 24, delay: 180, dur: 1.2 },
    { x: 30,  size: 16, delay: 240, dur: 0.9 },
  ];

  return (
    <section style={{ padding: '28px 22px 8px' }}>
      <style>{`
        @keyframes streak-burn {
          0%   { transform: scale(1)    rotate(0deg);  }
          15%  { transform: scale(1.18) rotate(-5deg); }
          30%  { transform: scale(1.10) rotate(4deg);  }
          50%  { transform: scale(1.20) rotate(-3deg); }
          70%  { transform: scale(1.08) rotate(2deg);  }
          100% { transform: scale(1)    rotate(0deg);  }
        }
        @keyframes flame-rise {
          0%   { transform: translateY(0)     scale(0.5) rotate(-10deg); opacity: 0; }
          20%  { opacity: 1; }
          100% { transform: translateY(-65px) scale(1.2) rotate(20deg);  opacity: 0; }
        }
      `}</style>

      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
      }}>
        <h2 style={{
          margin: 0, fontSize: 19, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.2,
        }}>Wochenserie</h2>

        {/* streak pill — orange fire badge, klickbar zum „Anzünden" */}
        <button
          onClick={ignite}
          style={{
            position: 'relative',
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'linear-gradient(135deg, #FF9A3C 0%, #FF6A2D 100%)',
            color: '#fff', borderRadius: 999,
            padding: '6px 13px 6px 11px',
            fontSize: 14, fontWeight: 700, letterSpacing: -0.1,
            boxShadow: burning
              ? '0 6px 24px rgba(255,80,20,0.65), 0 0 0 8px rgba(255,90,20,0.14)'
              : '0 3px 10px rgba(255,123,40,0.38)',
            transition: 'box-shadow 0.4s ease',
            border: 0, cursor: 'pointer', fontFamily: 'inherit',
            outline: 'none',
          }}>
          {/* Inner-Wrapper bekommt key={burnId} → re-mount = Animation läuft jedes Mal frisch */}
          <span key={burnId} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            animation: burnId > 0 ? 'streak-burn 0.7s ease-out' : 'none',
            transformOrigin: 'center',
          }}>
            <Ph name="fire" size={18} color="#fff" weight="fill" />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>{weeks} Wochen</span>
          </span>

          {/* Flammen-Partikel — nur sichtbar während/nach Klick */}
          {burnId > 0 && (
            <span key={`flames-${burnId}`} aria-hidden="true" style={{
              position: 'absolute', top: 0, left: '50%',
              width: 0, height: 0, pointerEvents: 'none',
            }}>
              {flames.map((f, i) => (
                <span key={i} style={{
                  position: 'absolute',
                  left: f.x - f.size / 2, top: -4,
                  fontSize: f.size, lineHeight: 1,
                  animation: `flame-rise ${f.dur}s ease-out ${f.delay}ms forwards`,
                  opacity: 0,
                }}>🔥</span>
              ))}
            </span>
          )}
        </button>
      </div>

      <div style={{
        fontSize: 13, color: COLORS.mintDeep, fontWeight: 600,
        marginBottom: 16, letterSpacing: -0.1,
      }}>
        Du bist on fire! Weiter so 💪
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
        {days.map((d, i) => {
          const done = i < doneCount;
          return (
            <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 17,
                background: done ? COLORS.mint : COLORS.mintSoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: done ? '0 3px 8px rgba(82,189,176,0.40)' : 'none',
              }}>
                {done && <Ph name="check" size={18} color="#fff" weight="bold" />}
              </div>
              <span style={{
                fontSize: 13,
                color: done ? COLORS.ink : COLORS.muted,
                fontWeight: done ? 600 : 400,
              }}>{d}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ExerciseCard({ image, title, sub, time, onPlay }) {
  return (
    <div style={{
      flex: '0 0 200px', background: '#F4F6F8', borderRadius: 14,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ position: 'relative', height: 130, background: '#E5E9EC' }}>
        <img src={image} alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.ink }}>{title}</div>
        <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>{sub}</div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginTop: 12,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: COLORS.text,
          }}>
            <Ph name="clock" size={14} color={COLORS.text} /> {time}
          </div>
          <button onClick={onPlay} style={{
            width: 30, height: 30, borderRadius: 15, border: 0,
            background: COLORS.mint, display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', padding: 0,
          }}>
            <Ph name="play" size={14} color="#fff" weight="fill" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ExercisesRow({ onDemoPage }) {
  return (
    <section style={{ padding: '22px 0 4px' }}>
      <h2 style={{
        margin: '0 0 14px 22px', fontSize: 18, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.2,
      }}>Empfohlene Übungen</h2>
      <div style={{
        display: 'flex', gap: 14, padding: '0 22px',
        overflowX: 'auto', scrollSnapType: 'x mandatory',
        WebkitOverflowScrolling: 'touch',
      }}>
        <ExerciseCard image={PHOTOS.breathing} title="Atemübung" sub="1-4-5" time="1-5 min"
          onPlay={() => onDemoPage?.('Atemübung')} />
        <ExerciseCard image={PHOTOS.meditation} title="Meditation" sub="Achtsamkeit" time="5 min"
          onPlay={() => onDemoPage?.('Meditation')} />
        <ExerciseCard image={PHOTOS.yoga} title="Yoga Flow" sub="Morgen" time="10 min"
          onPlay={() => onDemoPage?.('Yoga Flow')} />
      </div>
    </section>
  );
}

function LeaderRow({ rank, name, points, seed, avatar, you, onClick }) {
  const src = avatar || AVATAR(seed);
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '12px 22px', background: you ? '#F1FAF8' : 'transparent',
      border: 0, cursor: onClick ? 'pointer' : 'default',
      fontFamily: 'inherit',
    }}>
      <div style={{ width: 18, fontSize: 14, color: COLORS.muted, fontVariantNumeric: 'tabular-nums' }}>
        {rank}
      </div>
      <div style={{
        width: 36, height: 36, borderRadius: 18, flexShrink: 0,
        overflow: 'hidden',
        // Bei „you" passt der Mascot-Hintergrund visuell zum Profil-Avatar
        background: you ? COLORS.mintSoft : 'transparent',
        display: 'flex', alignItems: you ? 'flex-end' : 'stretch', justifyContent: 'center',
      }}>
        <img src={src} alt="" style={{
          width: '100%', height: '100%',
          objectFit: 'cover',
          objectPosition: you ? 'center 25%' : 'center',
          display: 'block',
        }} />
      </div>
      <div style={{ flex: 1, fontSize: 15, color: COLORS.ink, fontWeight: 500 }}>{name}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 14, color: COLORS.text,
      }}>
        <Ph name="star" size={14} color="#FFB800" weight="fill" /> {points}
      </div>
    </button>
  );
}

function Leaderboard({ onOpenChat, userName, onDemoPage }) {
  const youName = userName?.trim() || 'Du';
  return (
    <section style={{ padding: '22px 0 4px' }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 22px', marginBottom: 6,
      }}>
        <h2 style={{
          margin: 0, fontSize: 18, fontWeight: 600, color: COLORS.ink, letterSpacing: -0.2,
        }}>Monatliche Rangliste</h2>
        <button onClick={onOpenChat} style={{
          background: 'transparent', border: 0, cursor: 'pointer',
          padding: '4px 4px 4px 8px',
          display: 'flex', alignItems: 'center', gap: 6,
          color: COLORS.mint, fontFamily: 'inherit',
          fontSize: 15, fontWeight: 500, letterSpacing: -0.1,
        }}
        aria-label="Community öffnen">
          <Ph name="chat-teardrop-dots" size={20} color={COLORS.mint} weight="regular" />
          <span>Community</span>
        </button>
      </div>
      <LeaderRow rank="1" name="Paul K." points="20" seed="paul"
        onClick={() => onDemoPage?.('Paul K.')} />
      <LeaderRow rank="2" name="Lena M." points="18" seed="lena"
        onClick={() => onDemoPage?.('Lena M.')} />
      <LeaderRow rank="3" name={youName} points="16" avatar={MASCOT_CHAR} you
        onClick={() => onDemoPage?.(youName)} />
      <LeaderRow rank="4" name="Marco B." points="14" seed="marco"
        onClick={() => onDemoPage?.('Marco B.')} />
      <LeaderRow rank="5" name="Yael R." points="11" seed="yael"
        onClick={() => onDemoPage?.('Yael R.')} />
    </section>
  );
}

export function HomeScreen({ onMenu, onBenefitClick, onOpenChat, showBenefitCard = true, profile, mood, onDemoPage }) {
  return (
    <div style={{
      position: 'relative', minHeight: '100%', background: '#fff',
      paddingBottom: 100,
    }}>
      <HeroBackground />
      <TopBar onMenu={onMenu} />
      <div style={{ position: 'relative', zIndex: 2, marginTop: 30 }}>
        <StepsRing value={6900} goal={8000} />
        <StatRow mood={mood} />
      </div>

      <div style={{ position: 'relative', zIndex: 3, marginTop: 26 }}>
        {showBenefitCard && <BenefitCard onClick={onBenefitClick} />}
        <WeekStreak doneCount={5} weeks={4} />
        <ExercisesRow onDemoPage={onDemoPage} />
        <Leaderboard onOpenChat={onOpenChat} userName={profile?.nickname} onDemoPage={onDemoPage} />
      </div>
    </div>
  );
}
