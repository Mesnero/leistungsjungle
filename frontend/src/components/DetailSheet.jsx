// Bottom-Sheet (iOS-Pattern) mit voller Leistungs-Info.
// Geöffnet von BenefitCard (Kasse-Tab) und LeistungMiniCard (Coach-Chat).

import { COLORS, Ph } from '../lib/tokens';
import {
  buildPdfLink, categoryIconName, formatErstattung, formatRule,
  uniqueVoraussetzungen,
} from '../lib/leistung';


export function DetailSheet({ leistung, pdfBaseUrl, onClose }) {
  if (!leistung) return null;
  const iconName = categoryIconName(leistung.kategorie);
  const erstattung = formatErstattung(leistung.erstattungs_logik);
  const voraus = uniqueVoraussetzungen(leistung);
  const page = leistung.pdf_page;
  const pdfLink = buildPdfLink(pdfBaseUrl, page);

  return (
    <>
      <style>{`
        @keyframes detailsheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes detailsheet-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(20,30,40,0.45)',
          zIndex: 70,
          animation: 'detailsheet-fade 0.2s ease-out',
        }}
      />

      {/* Sheet */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0,
        maxHeight: '88%', overflowY: 'auto',
        background: '#fff',
        borderRadius: '20px 20px 0 0',
        padding: '14px 18px 28px',
        zIndex: 71,
        animation: 'detailsheet-up 0.28s cubic-bezier(0.32, 0.72, 0.3, 1)',
        boxShadow: '0 -8px 24px rgba(20,30,40,0.18)',
      }}>
        {/* Drag-Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: '#D0D5DB', margin: '0 auto 14px',
        }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 11,
            background: COLORS.mintPale, flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Ph name={iconName} size={22} color={COLORS.mintDeep} weight="regular" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {leistung.kategorie && (
              <div style={{
                fontSize: 11, fontWeight: 600, color: COLORS.mint,
                textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2,
              }}>{leistung.kategorie}</div>
            )}
            <h2 style={{
              margin: 0, fontSize: 17, fontWeight: 700, color: COLORS.ink,
              lineHeight: 1.25, letterSpacing: -0.2,
            }}>{leistung.name}</h2>
          </div>
          <button onClick={onClose} style={{
            background: '#F1F3F5', border: 0, cursor: 'pointer',
            width: 32, height: 32, borderRadius: 16, padding: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }} aria-label="Schließen">
            <Ph name="x" size={16} color={COLORS.text} weight="bold" />
          </button>
        </div>

        {/* Erstattung — volle Anzeige */}
        {erstattung && (
          <div style={{
            padding: '10px 14px', borderRadius: 10,
            background: COLORS.mintPale,
            color: COLORS.mintDeep, fontSize: 14, fontWeight: 600,
            marginBottom: 14, lineHeight: 1.35,
          }}>
            {erstattung.value}
            {erstattung.sub && (
              <span style={{ color: COLORS.muted, fontWeight: 400 }}> · {erstattung.sub}</span>
            )}
          </div>
        )}

        {/* Volle Beschreibung */}
        <p style={{
          margin: 0, fontSize: 14, color: COLORS.text, lineHeight: 1.5,
          marginBottom: 16,
        }}>{leistung.beschreibung}</p>

        {/* Voraussetzungen */}
        {voraus.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Voraussetzungen</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {voraus.map((v, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '8px 10px', borderRadius: 8,
                  background: '#F4F6F8',
                  fontSize: 13, color: COLORS.text, lineHeight: 1.4,
                }}>
                  <Ph name="info" size={13} color={COLORS.muted} style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Anspruchsberechtigte */}
        {leistung.eligibility_rules?.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <SectionLabel>Wer hat Anspruch</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {leistung.eligibility_rules.map((r, i) => (
                <div key={i} style={{
                  fontSize: 13, color: COLORS.text, lineHeight: 1.4,
                  display: 'flex', alignItems: 'flex-start', gap: 6,
                }}>
                  <span style={{ color: COLORS.mint }}>•</span>
                  <span>{formatRule(r)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PDF-Button */}
        {pdfLink && (
          <a
            href={pdfLink}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: COLORS.mint, color: '#fff',
              padding: '14px 16px', borderRadius: 14,
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
            }}
          >
            <Ph name="file-pdf" size={16} color="#fff" weight="fill" />
            In Satzung nachlesen
            {page && (
              <span style={{ opacity: 0.85, fontWeight: 400 }}>· Seite {page}</span>
            )}
            <Ph name="arrow-up-right" size={14} color="#fff" weight="bold" />
          </a>
        )}
      </div>
    </>
  );
}


function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: COLORS.muted,
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
    }}>{children}</div>
  );
}
