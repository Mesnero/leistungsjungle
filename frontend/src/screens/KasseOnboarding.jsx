// Krankenkassen-Onboarding — Multi-Step.
//
// Steps (skipt automatisch wenn nicht relevant):
//   1. Versicherungsart    — GKV | PKV  (PKV = dead-end, „noch nicht supported")
//   2. Krankenkasse        — Dropdown vom Backend
//   3. Schwangerschaft     — nur wenn Profil-Gender = 'f'
//   4. Kinder              — hast du Kinder? (für Familien-Leistungen)
//   5. Fertig → setProfile + onDone

import React from 'react';
import { COLORS, Ph } from '../lib/tokens';
import { listKrankenkassen, backendUrl } from '../lib/api';
import { getProfile, updateProfile, KASSE_DEFAULTS } from '../lib/profile';

// ────────────────────────────────────────────────────────────
// Step-Definitionen
// ────────────────────────────────────────────────────────────

const ALL_STEPS = ['insurance', 'krankenkasse', 'pregnancy', 'children'];

function relevantSteps(profile) {
  return ALL_STEPS.filter(s => {
    if (s === 'pregnancy') return profile?.gender === 'f';
    return true;
  });
}

// ────────────────────────────────────────────────────────────
// Root component
// ────────────────────────────────────────────────────────────

export function KasseOnboardingScreen({ onDone, onClose }) {
  const profile = getProfile();
  const steps = relevantSteps(profile);

  const [idx, setIdx] = React.useState(0);

  // working copy — wird beim Speichern in localStorage geschrieben
  const initialKasse = profile?.kasse?.complete ? profile.kasse : KASSE_DEFAULTS;

  const [kasse, setKasse] = React.useState(initialKasse);

  // PKV → Dead-End-Modus
  const pkvBlock = kasse.insuranceType === 'pkv';

  const current = steps[idx];
  const isLast = idx === steps.length - 1;

  const next = () => {
    if (idx < steps.length - 1) setIdx(idx + 1);
    else finish();
  };

  const back = () => {
    if (idx > 0) setIdx(idx - 1);
    else onClose?.();
  };

  const finish = () => {
    updateProfile({
      kasse: { ...kasse, complete: true },
    });
    onDone();
  };

  // Validierung pro Step — Weiter-Button enabled/disabled
  const canProceed = (() => {
    switch (current) {
      case 'krankenkasse': return Boolean(kasse.krankenkasseSlug);
      case 'insurance':    return kasse.insuranceType === 'gkv';
      case 'pregnancy':    return true;
      case 'children':     return true;
      default:             return false;
    }
  })();

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#fff',
      zIndex: 78, display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        padding: '56px 18px 8px',
        display: 'grid', gridTemplateColumns: '40px 1fr 40px',
        alignItems: 'center', flexShrink: 0,
      }}>
        <button onClick={back} style={iconBtnStyle()}>
          <Ph name="arrow-left" size={26} color={COLORS.mint} weight="bold" />
        </button>
        <div style={{
          textAlign: 'center', fontSize: 13, color: COLORS.muted, fontWeight: 500,
        }}>{idx + 1} / {steps.length}</div>
        <button onClick={onClose} style={iconBtnStyle('flex-end')} aria-label="Schließen">
          <Ph name="x" size={22} color={COLORS.muted} weight="bold" />
        </button>
      </div>

      {/* Progress bar */}
      <div style={{
        margin: '0 22px 18px', height: 4, borderRadius: 2,
        background: '#EEF2F4', overflow: 'hidden', flexShrink: 0,
      }}>
        <div style={{
          height: '100%', width: `${((idx + 1) / steps.length) * 100}%`,
          background: COLORS.mint, transition: 'width 0.25s ease',
        }} />
      </div>

      {/* Step body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 22px 16px' }}>
        {current === 'krankenkasse' && (
          <StepKrankenkasse kasse={kasse} setKasse={setKasse} />
        )}
        {current === 'insurance' && (
          <StepInsurance kasse={kasse} setKasse={setKasse} pkvBlock={pkvBlock} />
        )}
        {current === 'pregnancy' && (
          <StepPregnancy kasse={kasse} setKasse={setKasse} />
        )}
        {current === 'children' && (
          <StepChildren kasse={kasse} setKasse={setKasse} />
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ padding: '12px 22px 30px', flexShrink: 0 }}>
        <button onClick={next} disabled={!canProceed} style={{
          width: '100%', height: 54, borderRadius: 14, border: 0,
          background: canProceed ? COLORS.mint : COLORS.mintPale,
          color: canProceed ? '#fff' : COLORS.mint,
          fontSize: 17, fontWeight: 600, fontFamily: 'inherit',
          cursor: canProceed ? 'pointer' : 'default',
          transition: 'background 0.15s',
        }}>
          {isLast ? 'Fertig' : 'Weiter'}
        </button>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Step 1 — Krankenkasse
// ────────────────────────────────────────────────────────────

function StepKrankenkasse({ kasse, setKasse }) {
  const [kks, setKks] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    listKrankenkassen()
      .then(setKks)
      .catch(e => setError(String(e.message || e)))
      .finally(() => setLoading(false));
  }, []);

  const pick = (kk) => {
    setKasse(k => ({
      ...k,
      krankenkasseSlug: kk.slug,
      krankenkasseName: kk.name,
    }));
  };

  // Substring-Match (case-insensitive). Bei leerer Suche: alle zeigen.
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return kks;
    return kks.filter(kk => kk.name.toLowerCase().includes(q));
  }, [kks, query]);

  // Wenn die ausgewählte KK durch den Filter rausfällt: oben anpinnen
  // damit der User immer sieht was gerade gewählt ist.
  const selectedKk = kks.find(k => k.slug === kasse.krankenkasseSlug);
  const list = (selectedKk && !filtered.some(k => k.slug === selectedKk.slug))
    ? [selectedKk, ...filtered]
    : filtered;

  return (
    <>
      <StepTitle>Bei welcher Krankenkasse bist du?</StepTitle>
      <StepSub>Wir zeigen dir danach nur die Leistungen, die zu deiner Kasse passen.</StepSub>

      {/* Suchfeld */}
      <div style={{ position: 'relative', marginTop: 16 }}>
        <div style={{
          position: 'absolute', left: 14, top: '50%',
          transform: 'translateY(-50%)', display: 'flex',
          pointerEvents: 'none',
        }}>
          <Ph name="magnifying-glass" size={18} color={COLORS.muted} />
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Krankenkasse suchen..."
          style={{
            width: '100%', boxSizing: 'border-box',
            height: 46, borderRadius: 14, border: 0,
            background: '#F1F3F5',
            padding: '0 40px 0 42px',
            fontSize: 15, color: COLORS.ink, fontFamily: 'inherit',
            outline: 'none',
          }}
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Suche zurücksetzen" style={{
            position: 'absolute', right: 10, top: '50%',
            transform: 'translateY(-50%)',
            background: 'transparent', border: 0, cursor: 'pointer',
            padding: 4, display: 'flex',
          }}>
            <Ph name="x-circle" size={20} color={COLORS.muted} weight="fill" />
          </button>
        )}
      </div>

      {/* Treffer-Counter */}
      {!loading && !error && query && (
        <div style={{
          fontSize: 12, color: COLORS.muted,
          marginTop: 8, paddingLeft: 4,
        }}>
          {filtered.length === 1 ? '1 Treffer' : `${filtered.length} Treffer`}
        </div>
      )}

      {loading && <Hint>Lade Krankenkassen…</Hint>}
      {error && (
        <Hint danger>
          {error}<br />
          Backend läuft? <code>uvicorn app.main:app --reload</code>
        </Hint>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div style={{
          padding: '24px 16px', marginTop: 14, textAlign: 'center',
          background: '#F8F9FA', borderRadius: 14,
          color: COLORS.muted, fontSize: 14,
        }}>
          Keine Krankenkasse gefunden für „{query}".
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
        {list.map(kk => {
          const active = kasse.krankenkasseSlug === kk.slug;
          const logo = backendUrl(kk.logo_url);
          return (
            <button key={kk.slug} onClick={() => pick(kk)} style={{
              padding: '12px 16px', borderRadius: 14, cursor: 'pointer',
              border: active ? `2px solid ${COLORS.mint}` : '2px solid transparent',
              background: active ? COLORS.mintPale : '#F1F3F5',
              fontFamily: 'inherit', textAlign: 'left',
              display: 'flex', alignItems: 'center', gap: 12,
              transition: 'all 0.15s',
            }}>
              {/* Logo-Box */}
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, padding: 4, boxSizing: 'border-box',
                border: '1px solid #EEF2F4',
              }}>
                {logo
                  ? <img src={logo} alt=""
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  : <Ph name="shield-check" size={22} color={COLORS.muted} />
                }
              </div>
              <span style={{
                flex: 1, minWidth: 0,
                fontSize: 15, fontWeight: 500, color: COLORS.ink,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{kk.name}</span>
              {/* Check-Indikator rechts */}
              <div style={{
                width: 22, height: 22, borderRadius: 11,
                border: `2px solid ${active ? COLORS.mint : COLORS.mutedSoft}`,
                background: active ? COLORS.mint : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {active && <Ph name="check" size={12} color="#fff" weight="bold" />}
              </div>
            </button>
          );
        })}
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Step 2 — Insurance Type (GKV | PKV)
// ────────────────────────────────────────────────────────────

function StepInsurance({ kasse, setKasse, pkvBlock }) {
  const pick = (type) => setKasse(k => ({ ...k, insuranceType: type }));

  if (pkvBlock) {
    return (
      <>
        <StepTitle>Privatversichert?</StepTitle>
        <div style={{
          marginTop: 30, padding: '24px 22px', borderRadius: 16,
          background: COLORS.mintPale, textAlign: 'center',
        }}>
          <Ph name="info" size={32} color={COLORS.mint} weight="fill" />
          <h3 style={{
            margin: '12px 0 6px', fontSize: 18, fontWeight: 700, color: COLORS.ink,
          }}>PKV unterstützen wir noch nicht</h3>
          <p style={{ margin: 0, fontSize: 14, color: COLORS.text, lineHeight: 1.4 }}>
            Privatverträge sind individuell und brauchen eigene Daten je Tarif.
            Wähle gerne GKV oder schau später wieder vorbei.
          </p>
          <button onClick={() => setKasse(k => ({ ...k, insuranceType: null }))} style={{
            marginTop: 16, padding: '10px 18px', borderRadius: 12, border: 0,
            background: COLORS.mint, color: '#fff', cursor: 'pointer',
            fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
          }}>
            Auswahl ändern
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <StepTitle>Wie bist du versichert?</StepTitle>
      <StepSub>Wir unterstützen aktuell nur gesetzlich Versicherte.</StepSub>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
        <ChoiceCard
          active={kasse.insuranceType === 'gkv'}
          onClick={() => pick('gkv')}
          icon="shield-check" iconColor={COLORS.mint}
          title="Gesetzlich (GKV)"
          subtitle="Du bist Mitglied einer gesetzlichen Krankenkasse"
        />
        <ChoiceCard
          active={kasse.insuranceType === 'pkv'}
          onClick={() => pick('pkv')}
          icon="briefcase" iconColor={COLORS.muted}
          title="Privat (PKV)"
          subtitle="Privatkrankenversicherung"
        />
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Step 3 — Schwangerschaft (nur wenn weiblich)
// ────────────────────────────────────────────────────────────

function StepPregnancy({ kasse, setKasse }) {
  const set = (v) => setKasse(k => ({ ...k, pregnant: v }));
  return (
    <>
      <StepTitle>Bist du gerade schwanger?</StepTitle>
      <StepSub>
        Schwangerschaft schaltet zusätzliche Leistungen frei
        (Hebamme, Vorsorge, Geburtsvorbereitung).
      </StepSub>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
        <ChoiceCard
          active={kasse.pregnant === true}
          onClick={() => set(true)}
          icon="baby" iconColor={COLORS.mint}
          title="Ja"
        />
        <ChoiceCard
          active={kasse.pregnant === false}
          onClick={() => set(false)}
          icon="x-circle" iconColor={COLORS.muted}
          title="Nein"
        />
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Step 4 — Kinder?
// ────────────────────────────────────────────────────────────

function StepChildren({ kasse, setKasse }) {
  const set = (v) => setKasse(k => ({ ...k, hasChildren: v }));
  return (
    <>
      <StepTitle>Hast du Kinder?</StepTitle>
      <StepSub>
        Familienversicherte Kinder schalten zusätzliche Leistungen frei
        (U-Untersuchungen, Impfungen, Kinderbonus).
      </StepSub>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 22 }}>
        <ChoiceCard
          active={kasse.hasChildren === true}
          onClick={() => set(true)}
          icon="baby" iconColor={COLORS.mint}
          title="Ja"
        />
        <ChoiceCard
          active={kasse.hasChildren === false}
          onClick={() => set(false)}
          icon="x-circle" iconColor={COLORS.muted}
          title="Nein"
        />
      </div>
    </>
  );
}

// ────────────────────────────────────────────────────────────
// Shared helpers
// ────────────────────────────────────────────────────────────

function StepTitle({ children }) {
  return (
    <h1 style={{
      margin: '8px 0 8px', fontSize: 26, fontWeight: 700,
      color: COLORS.ink, letterSpacing: -0.3, lineHeight: 1.2,
    }}>{children}</h1>
  );
}

function StepSub({ children }) {
  return (
    <p style={{
      margin: '0 0 4px', fontSize: 15, color: COLORS.muted, lineHeight: 1.4,
    }}>{children}</p>
  );
}

function Hint({ children, danger }) {
  return (
    <div style={{
      marginTop: 16, padding: '12px 14px', borderRadius: 12,
      background: danger ? '#FEF2F2' : '#F1F3F5',
      color: danger ? '#B91C1C' : COLORS.text,
      fontSize: 13, lineHeight: 1.4,
    }}>{children}</div>
  );
}

function ChoiceCard({ active, onClick, icon, iconColor, title, subtitle }) {
  return (
    <button onClick={onClick} style={{
      padding: '14px 18px', borderRadius: 14, cursor: 'pointer',
      border: active ? `2px solid ${COLORS.mint}` : '2px solid transparent',
      background: active ? COLORS.mintPale : '#F1F3F5',
      fontFamily: 'inherit', textAlign: 'left',
      display: 'flex', alignItems: 'center', gap: 14,
      transition: 'all 0.15s',
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10,
        background: active ? '#fff' : COLORS.mintPale,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Ph name={icon} size={22} color={iconColor} weight={active ? 'fill' : 'regular'} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.ink }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
    </button>
  );
}

function iconBtnStyle(justify = 'flex-start') {
  return {
    background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
    display: 'flex', alignItems: 'center', justifyContent: justify,
  };
}

