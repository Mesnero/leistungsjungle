// Kassenleistungen — zwei Modi:
//   1) Onboarding noch nicht gemacht → CTA, der das Onboarding startet
//   2) Onboarding fertig → Benefits-Liste für gewählte Person,
//      getrennt in Satzungsleistungen und Bonus-Maßnahmen.

import React from 'react';
import { COLORS, Ph } from '../lib/tokens';
import { listBenefits } from '../lib/api';
import {
  buildPdfLink, categoryIconName, formatErstattung,
} from '../lib/leistung';
import { DetailSheet } from '../components/DetailSheet';

// ─── „Erledigt"-State pro Leistung, persistent in localStorage ──────
const DONE_STORAGE_KEY = 'goecofit.doneBenefits';

function loadDoneBenefits() {
  try {
    const raw = localStorage.getItem(DONE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveDoneBenefits(data) {
  try { localStorage.setItem(DONE_STORAGE_KEY, JSON.stringify(data)); }
  catch {} /* private mode etc — Silent-Fail ist OK */
}

function benefitKey(leistung) {
  return `${leistung.name}|${leistung.pdf_page ?? ''}`;
}

// Kurz-Subtitle für die kompakte Card. Bevorzugt Turnus, dann Alter, dann Kategorie.
function compactSubtitle(leistung) {
  const el = leistung.erstattungs_logik || {};
  const rules = leistung.eligibility_rules || [];

  if (el.turnus && el.turnus !== 'Einmalig') return el.turnus;
  const f = formatErstattung(el);
  if (f?.value) return f.value;

  const rule = rules[0];
  if (rule) {
    const minA = rule.alter_min || 0;
    const maxA = rule.alter_max || 150;
    if (minA > 0 && maxA < 150) return `${minA}–${maxA} J.`;
    if (minA > 0) return `Ab ${minA} Jahren`;
    if (maxA < 150) return `Bis ${maxA} J.`;
  }
  return leistung.kategorie || '';
}

function calcAge(birthdate) {
  if (!birthdate) return 30;
  const b = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}

function profileToPerson(profile) {
  return {
    id: 'me',
    name: profile.nickname || 'Du',
    birthdate: profile.birthdate,
    gender: profile.gender,
    pregnant: profile.kasse.pregnant,
  };
}

// ────────────────────────────────────────────────────────────
// Root component
// ────────────────────────────────────────────────────────────

export function KasseScreen({ onMenu, profile, onStartOnboarding, onDetailOpenChange }) {
  const complete = Boolean(profile?.kasse?.complete);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 84,
      background: '#fff', zIndex: 35,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{
        padding: '56px 18px 8px',
        display: 'grid', gridTemplateColumns: '40px 1fr 40px',
        alignItems: 'center', flexShrink: 0,
      }}>
        <button onClick={onMenu} style={{
          background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        }}>
          <Ph name="list" size={28} color={COLORS.mint} weight="bold" />
        </button>
        <h1 style={{
          margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.mint,
          textAlign: 'center', letterSpacing: -0.3,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {profile?.kasse?.krankenkasseName || 'Leistungen'}
        </h1>
        <div />
      </div>

      {complete
        ? <BenefitsList profile={profile} onDetailOpenChange={onDetailOpenChange} />
        : <OnboardingCta onStart={onStartOnboarding} />
      }
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Mode A — kein Onboarding gemacht
// ────────────────────────────────────────────────────────────

function OnboardingCta({ onStart }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 32px', textAlign: 'center', gap: 16,
    }}>
      <div style={{
        width: 96, height: 96, borderRadius: 48,
        background: COLORS.mintPale,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Ph name="shield-check" size={48} color={COLORS.mint} weight="fill" />
      </div>
      <h2 style={{
        margin: 0, fontSize: 22, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.3,
      }}>Deine Kassenleistungen</h2>
      <p style={{
        margin: 0, fontSize: 15, color: COLORS.muted, lineHeight: 1.45,
      }}>
        Beantworte ein paar Fragen, dann zeigen wir dir Satzungs- und
        Bonusleistungen, die zu dir passen.
      </p>
      <button onClick={onStart} style={{
        marginTop: 8, padding: '14px 26px', borderRadius: 14, border: 0,
        background: COLORS.mint, color: '#fff',
        fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
      }}>
        Jetzt starten
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Mode B — Benefits-Liste
// ────────────────────────────────────────────────────────────

function BenefitsList({ profile, onDetailOpenChange }) {
  const person = profileToPerson(profile);
  const hasChildren = Boolean(profile.kasse?.hasChildren);
  const kasseSlug = profile.kasse.krankenkasseSlug;

  // Erledigt-State pro KK aus localStorage, lazy-initialized
  const [doneSet, setDoneSet] = React.useState(() => {
    const all = loadDoneBenefits();
    return new Set(all[kasseSlug] || []);
  });

  // Welche Sections sind expanded? Beide default offen.
  const [satzOpen, setSatzOpen] = React.useState(true);
  const [bonusOpen, setBonusOpen] = React.useState(true);

  // Bei KK-Wechsel: neuen Done-State laden
  React.useEffect(() => {
    const all = loadDoneBenefits();
    setDoneSet(new Set(all[kasseSlug] || []));
  }, [kasseSlug]);

  const toggleDone = (leistung) => {
    const key = benefitKey(leistung);
    setDoneSet(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      const all = loadDoneBenefits();
      all[kasseSlug] = [...next];
      saveDoneBenefits(all);
      return next;
    });
  };

  // Response vom Backend: { krankenkasse, satzungsleistungen, bonus_massnahmen, bonusprogramm_meta }
  const [response, setResponse] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [activeCategory, setActiveCategory] = React.useState('all');

  const age = calcAge(person.birthdate);

  // Benefits reload bei Profil-Änderung
  React.useEffect(() => {
    setLoading(true);
    setError(null);
    setActiveCategory('all');
    listBenefits({
      slug: profile.kasse.krankenkasseSlug,
      age,
      gender: person.gender,
      pregnant: person.pregnant === true,
      hasChildren,
    })
      .then(setResponse)
      .catch(e => setError(String(e.message || e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.kasse.krankenkasseSlug, person.birthdate, person.gender, person.pregnant, hasChildren]);

  const satz_all = response?.satzungsleistungen || [];
  const bonus_all = response?.bonus_massnahmen || [];
  const bonusMeta = response?.bonusprogramm_meta || null;

  // Donut-Statistik (ignoriert Kategorie-Filter — zählt alle Leistungen
  // die der User aktuell qualifizieren kann)
  const allBenefits = [...satz_all, ...bonus_all];
  const totalCount = allBenefits.length;
  const doneCount = allBenefits.filter(l => doneSet.has(benefitKey(l))).length;

  // Kategorien aus allen geladenen Leistungen (satz + bonus)
  const categories = React.useMemo(() => {
    const set = new Set();
    [...satz_all, ...bonus_all].forEach(l => l.kategorie && set.add(l.kategorie));
    return ['all', ...Array.from(set)];
  }, [satz_all, bonus_all]);

  // Filter nach Kategorie
  const satzung = activeCategory === 'all' ? satz_all : satz_all.filter(l => l.kategorie === activeCategory);
  const bonus = activeCategory === 'all' ? bonus_all : bonus_all.filter(l => l.kategorie === activeCategory);

  const [bonusInfoOpen, setBonusInfoOpen] = React.useState(false);

  // Detail-Sheet (Tap auf Card öffnet hier)
  const [selected, setSelected] = React.useState(null);
  // selected = { leistung, idx }  oder  null
  const pdfBase = response?.krankenkasse?.website;

  // Parent (App) informieren, damit der globale Coach-FAB hinter dem Sheet
  // weggeblendet werden kann (verschiedene Stacking-Contexte).
  React.useEffect(() => {
    onDetailOpenChange?.(Boolean(selected));
  }, [selected, onDetailOpenChange]);
  // Cleanup beim Unmount: wieder freigeben
  React.useEffect(() => {
    return () => onDetailOpenChange?.(false);
  }, [onDetailOpenChange]);

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0 24px' }}>
      {!loading && !error && totalCount > 0 && (
        <BenefitsUsageDonut done={doneCount} total={totalCount} />
      )}

      {categories.length > 2 && (
        <CategoryPills
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />
      )}

      {loading && (
        <div style={{ padding: '40px 22px', textAlign: 'center', color: COLORS.muted }}>
          Lade Leistungen…
        </div>
      )}
      {error && (
        <div style={{
          margin: '0 18px', padding: '14px 16px', borderRadius: 12,
          background: '#FEF2F2', color: '#B91C1C', fontSize: 13,
        }}>{error}</div>
      )}
      {!loading && !error && satzung.length === 0 && bonus.length === 0 && (
        <div style={{ padding: '40px 22px', textAlign: 'center', color: COLORS.muted, fontSize: 14 }}>
          Keine passenden Leistungen für diese Auswahl.
        </div>
      )}

      {/* Satzungsleistungen */}
      {satzung.length > 0 && (
        <Section
          title="Satzungsleistungen"
          subtitle="Was deine Kasse pflichtmäßig zahlt"
          count={satzung.length}
          open={satzOpen}
          onToggle={() => setSatzOpen(o => !o)}
        >
          {satzung.map((l, i) => (
            <BenefitCard
              key={`s-${i}`}
              leistung={l}
              pdfBaseUrl={pdfBase}
              done={doneSet.has(benefitKey(l))}
              onToggleDone={() => toggleDone(l)}
              onOpen={() => setSelected({ leistung: l, idx: i })}
            />
          ))}
        </Section>
      )}

      {/* Bonus-Maßnahmen */}
      {bonus.length > 0 && (
        <section style={{ padding: '2px 0 6px' }}>
          <div style={{
            padding: '6px 22px 8px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <button
              onClick={() => setBonusOpen(o => !o)}
              aria-label={bonusOpen ? 'Bonusprogramm einklappen' : 'Bonusprogramm aufklappen'}
              style={{
                flex: 1, minWidth: 0,
                background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                fontFamily: 'inherit', textAlign: 'left',
              }}>
              <Ph
                name="caret-down"
                size={18} color={COLORS.ink} weight="bold"
                style={{
                  transform: bonusOpen ? 'rotate(0)' : 'rotate(-90deg)',
                  transition: 'transform 0.18s ease',
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{
                  margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.3,
                }}>
                  Bonusprogramm
                  <span style={{
                    marginLeft: 6, fontSize: 13, fontWeight: 500, color: COLORS.muted,
                  }}>· {bonus.length}</span>
                </h2>
                {bonusMeta?.programm_name && (
                  <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>
                    {bonusMeta.programm_name}
                  </div>
                )}
              </div>
            </button>
            {bonusMeta?.beschreibung && (
              <button
                onClick={() => setBonusInfoOpen(o => !o)}
                aria-label={bonusInfoOpen ? 'Info schließen' : 'So funktioniert das Bonusprogramm'}
                style={{
                  background: bonusInfoOpen ? COLORS.mintPale : 'transparent',
                  border: 0, padding: 6, borderRadius: 8, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'background 0.15s',
                }}
              >
                <Ph
                  name="info"
                  size={20}
                  color={bonusInfoOpen ? COLORS.mintDeep : COLORS.muted}
                  weight={bonusInfoOpen ? 'fill' : 'regular'}
                />
              </button>
            )}
          </div>

          {bonusOpen && bonusInfoOpen && bonusMeta && (
            <div style={{ padding: '0 18px 12px' }}>
              <BonusMetaCard meta={bonusMeta} onClose={() => setBonusInfoOpen(false)} />
            </div>
          )}

          {bonusOpen && (
          <ul style={{
            listStyle: 'none', margin: 0, padding: '0 18px',
            display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            {bonus.map((l, i) => (
              <BenefitCard
                key={`b-${i}`}
                leistung={l}
                pdfBaseUrl={pdfBase}
                done={doneSet.has(benefitKey(l))}
                onToggleDone={() => toggleDone(l)}
                onOpen={() => setSelected({ leistung: l, idx: i })}
              />
            ))}
          </ul>
          )}
        </section>
      )}

      {selected && (
        <DetailSheet
          leistung={selected.leistung}
          idx={selected.idx}
          pdfBaseUrl={pdfBase}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Sub-Components
// ────────────────────────────────────────────────────────────

function CategoryPills({ categories, active, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 8, padding: '0 18px 14px',
      overflowX: 'auto', WebkitOverflowScrolling: 'touch',
    }}>
      {categories.map(cat => {
        const isAll = cat === 'all';
        const isActive = cat === active;
        return (
          <button key={cat} onClick={() => onChange(cat)} style={{
            flexShrink: 0,
            padding: '0 14px', height: 34, borderRadius: 17, border: 0,
            background: isActive ? COLORS.mint : '#F1F3F5',
            color: isActive ? '#fff' : COLORS.text,
            fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {isActive && <Ph name="check" size={12} color="#fff" weight="bold" />}
            {isAll ? 'Alle' : cat}
          </button>
        );
      })}
    </div>
  );
}

function Section({ title, subtitle, count, open = true, onToggle, children }) {
  return (
    <section style={{ padding: '2px 0 6px' }}>
      <button
        onClick={onToggle}
        aria-label={open ? `${title} einklappen` : `${title} aufklappen`}
        style={{
          width: '100%',
          padding: '6px 22px 8px',
          background: 'transparent', border: 0, cursor: onToggle ? 'pointer' : 'default',
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: 'inherit', textAlign: 'left',
        }}>
        <Ph
          name="caret-down"
          size={18} color={COLORS.ink} weight="bold"
          style={{
            transform: open ? 'rotate(0)' : 'rotate(-90deg)',
            transition: 'transform 0.18s ease',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <h2 style={{
            margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.3,
          }}>
            {title}
            {typeof count === 'number' && (
              <span style={{
                marginLeft: 6, fontSize: 13, fontWeight: 500, color: COLORS.muted,
              }}>· {count}</span>
            )}
          </h2>
          {subtitle && (
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
      </button>
      {open && (
        <ul style={{
          listStyle: 'none', margin: 0, padding: '0 18px',
          display: 'flex', flexDirection: 'column', gap: 8,
        }}>{children}</ul>
      )}
    </section>
  );
}

// Wechselkurs-Display:
//   - Nur wenn `waehrung` keine Geldwährung ist (z.B. „Punkte", „Sterne")
//     UND eine Conversion-Rate gesetzt ist UND nicht 1.0 (sonst nicht spannend).
//   - Basis wird so gewählt dass das Ergebnis zwischen 1 und 100 € liegt
//     (z.B. rate=0.01 → 100 Einheiten = 1 €;  rate=0.001 → 1000 Einheiten = 1 €).
const CASH_WAEHRUNGEN = new Set(['EUR', '€', 'USD', '$']);

function isMeaningfulConversion(waehrung, rate) {
  if (!waehrung || typeof rate !== 'number') return false;
  if (CASH_WAEHRUNGEN.has(waehrung.toUpperCase())) return false;
  if (rate === 1) return false;
  return true;
}

function pickBase(rate) {
  // Ziel: 1 ≤ base*rate ≤ 100
  if (rate >= 1) return 1;
  if (rate >= 0.1) return 10;
  if (rate >= 0.01) return 100;
  if (rate >= 0.001) return 1000;
  return 10000;
}

function formatRate(unit, rate, label) {
  const base = pickBase(rate);
  const eur = (base * rate).toFixed(2).replace('.', ',');
  return `${base} ${unit} = ${eur} € ${label}`;
}

function BonusMetaCard({ meta, onClose }) {
  const bl = meta.belohnungs_logik || {};
  const unit = bl.waehrung;
  const cashRate = bl.wechselkurs_cash;
  const healthRate = bl.wechselkurs_gesundheitskonto;

  const showCash = isMeaningfulConversion(unit, cashRate);
  const showHealth = isMeaningfulConversion(unit, healthRate);
  const showRates = showCash || showHealth;

  return (
    <div style={{
      background: COLORS.mintPale, border: `1.5px solid ${COLORS.mintSoft}`,
      borderRadius: 14, padding: '12px 14px', position: 'relative',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, marginBottom: 6,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Ph name="info" size={16} color={COLORS.mintDeep} weight="fill" />
          <strong style={{ fontSize: 13, color: COLORS.mintDeep }}>So funktioniert's</strong>
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: 'transparent', border: 0, cursor: 'pointer', padding: 2,
            display: 'flex',
          }} aria-label="Schließen">
            <Ph name="x" size={16} color={COLORS.mintDeep} weight="bold" />
          </button>
        )}
      </div>
      <p style={{ margin: 0, fontSize: 12.5, color: COLORS.ink, lineHeight: 1.4 }}>
        {meta.beschreibung}
      </p>
      {showRates && (
        <div style={{
          display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8,
        }}>
          {showCash && (
            <span style={{
              fontSize: 11.5, fontWeight: 600, color: COLORS.mintDeep,
              background: '#fff', border: `1px solid ${COLORS.mintSoft}`,
              padding: '3px 9px', borderRadius: 6,
            }}>{formatRate(unit, cashRate, 'Cash')}</span>
          )}
          {showHealth && (
            <span style={{
              fontSize: 11.5, fontWeight: 600, color: COLORS.mintDeep,
              background: '#fff', border: `1px solid ${COLORS.mintSoft}`,
              padding: '3px 9px', borderRadius: 6,
            }}>{formatRate(unit, healthRate, 'Gesundheitskonto')}</span>
          )}
        </div>
      )}
      {bl.hinweis && (
        <p style={{
          margin: '8px 0 0', fontSize: 11.5, color: COLORS.mintDeep, lineHeight: 1.35,
          fontStyle: 'italic',
        }}>
          {bl.hinweis}
        </p>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Benefits-Nutzung Donut
// ────────────────────────────────────────────────────────────

function BenefitsUsageDonut({ done, total }) {
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const remaining = Math.max(0, total - done);

  const SIZE = 108;
  const STROKE = 14;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const dashLen = total > 0 ? (C * done) / total : 0;

  return (
    <div style={{
      margin: '4px 18px 14px',
      background: '#fff', borderRadius: 18,
      padding: '16px 18px',
      boxShadow: COLORS.cardShadow,
      border: '1px solid #EEF2F4',
    }}>
      <div style={{
        fontSize: 15, fontWeight: 700, color: COLORS.ink,
        marginBottom: 12, letterSpacing: -0.2,
      }}>
        Deine Benefits-Nutzung
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
        {/* Donut */}
        <div style={{ position: 'relative', width: SIZE, height: SIZE, flexShrink: 0 }}>
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
            style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={SIZE/2} cy={SIZE/2} r={R}
              stroke="#EEF2F4" strokeWidth={STROKE} fill="none" />
            <circle cx={SIZE/2} cy={SIZE/2} r={R}
              stroke={COLORS.mint} strokeWidth={STROKE} fill="none"
              strokeLinecap="round"
              strokeDasharray={`${dashLen} ${C}`}
              style={{ transition: 'stroke-dasharray 0.5s ease' }} />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              fontSize: 22, fontWeight: 700, color: COLORS.ink,
              letterSpacing: -0.5, lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}>{pct}%</div>
            <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>
              genutzt
            </div>
          </div>
        </div>

        {/* Legende */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <LegendRow color={COLORS.mint} label="In Anspruch genommen" value={done} />
          <LegendRow color="#E5E9EC" label="Noch verfügbar" value={remaining} />
          <div style={{
            borderTop: '1px solid #EEF2F4',
            marginTop: 6, paddingTop: 8,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            fontSize: 13.5, color: COLORS.muted,
          }}>
            <span>Gesamt</span>
            <span style={{
              fontWeight: 600, color: COLORS.ink,
              fontVariantNumeric: 'tabular-nums',
            }}>{total}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function LegendRow({ color, label, value }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      paddingBottom: 5,
    }}>
      <div style={{
        width: 9, height: 9, borderRadius: 5, background: color, flexShrink: 0,
      }} />
      <span style={{
        flex: 1, fontSize: 12.5, color: COLORS.text, lineHeight: 1.25,
        overflow: 'hidden', textOverflow: 'ellipsis',
      }}>
        {label}
      </span>
      <span style={{
        fontWeight: 600, fontSize: 13.5, color: COLORS.ink,
        fontVariantNumeric: 'tabular-nums',
      }}>{value}</span>
    </div>
  );
}

function BenefitCard({ leistung, pdfBaseUrl, done, onToggleDone, onOpen }) {
  const iconName = categoryIconName(leistung.kategorie);
  const subtitle = compactSubtitle(leistung);
  const page = leistung.pdf_page;
  const pdfLink = buildPdfLink(pdfBaseUrl, page);

  return (
    <li
      onClick={onOpen}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px 10px 10px',
        background: done ? COLORS.mintPale : '#fff',
        borderRadius: 14,
        border: `1.5px solid ${done ? COLORS.mint : '#EEF2F4'}`,
        boxShadow: done
          ? 'none'
          : '0 1px 3px rgba(20,40,60,0.04), 0 1px 2px rgba(20,40,60,0.04)',
        cursor: 'pointer',
        transition: 'background 0.15s, border-color 0.15s',
      }}>
      {/* Kategorie-Icon links — mint disc wenn erledigt, sonst grau-pastell */}
      <div style={{
        width: 42, height: 42, borderRadius: 21,
        background: done ? COLORS.mint : '#F1F3F5',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
        transition: 'background 0.15s',
      }}>
        <Ph
          name={iconName}
          size={20}
          color={done ? '#fff' : COLORS.muted}
          weight={done ? 'fill' : 'regular'}
        />
      </div>

      {/* Titel + Subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontWeight: 600, color: COLORS.ink,
          lineHeight: 1.25, letterSpacing: -0.1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {leistung.name}
        </div>
        {subtitle && (
          <div style={{
            fontSize: 12.5, color: COLORS.muted, marginTop: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {subtitle}
          </div>
        )}
      </div>

      {/* PDF-Deep-Link zur Satzungs-Seite (kompakt) */}
      {pdfLink && (
        <a
          href={pdfLink}
          target="_blank"
          rel="noreferrer"
          onClick={e => e.stopPropagation()}
          aria-label={`Satzung Seite ${page} öffnen`}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 3,
            color: COLORS.mint, textDecoration: 'none',
            fontSize: 11, fontWeight: 700,
            flexShrink: 0, padding: '3px 4px',
          }}
        >
          <Ph name="file-pdf" size={14} color={COLORS.mint} weight="fill" />
          {page && <span>S.&nbsp;{page}</span>}
        </a>
      )}

      {/* Check-Toggle rechts */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggleDone(); }}
        aria-label={done ? 'Als nicht erledigt markieren' : 'Als erledigt markieren'}
        style={{
          width: 24, height: 24, borderRadius: 12,
          background: done ? COLORS.mint : 'transparent',
          border: done ? 'none' : `2px solid ${COLORS.mutedSoft}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, cursor: 'pointer', padding: 0,
          transition: 'background 0.15s, border-color 0.15s',
        }}>
        {done && <Ph name="check" size={14} color="#fff" weight="bold" />}
      </button>
    </li>
  );
}


