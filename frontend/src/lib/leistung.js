// Shared Helpers für Leistungs-Darstellung — nutzbar in Kasse.jsx,
// Coach.jsx, DetailSheet, MiniCard.

// ─── Kategorie → Icon ────────────────────────────────────────────

const CATEGORY_ICON = {
  schwangerschaft:        'baby',
  vorsorge:               'shield-check',
  bonus:                  'gift',
  zahn:                   'tooth',
  zahnvorsorge:           'tooth',
  impfung:                'syringe',
  'alternative medizin':  'leaf',
  bewegung:               'person-simple-run',
  kindergesundheit:       'baby',
  familie:                'users-three',
  krebsvorsorge:          'shield-check',
  praevention:            'shield-check',
  prävention:             'shield-check',
  reha:                   'first-aid-kit',
  hilfsmittel:            'first-aid-kit',
  sehhilfe:               'eye',
  ernaehrung:             'leaf',
  ernährung:              'leaf',
  stressmanagement:       'flower-lotus',
  vorsorgekur:            'shield-check',
};

export function categoryIconName(cat) {
  return CATEGORY_ICON[(cat || '').toLowerCase()] || 'sparkle';
}

// ─── Erstattungs-Logik formatieren ────────────────────────────────

const WAEHRUNG_ABBREV = {
  EUR:     '€',
  Prozent: '%',
};

export function formatErstattung(el) {
  if (!el) return null;
  const isVolleUebernahme = (el.typ || '').toLowerCase().includes('volle');
  if (el.wert === 0 && isVolleUebernahme) {
    return { value: '100 %', sub: el.turnus };
  }
  if (el.wert == null) {
    return { value: el.typ || '—', sub: el.turnus };
  }
  const curr = WAEHRUNG_ABBREV[el.waehrung] || el.waehrung;
  const formatted = `${Number(el.wert).toLocaleString('de-DE', { maximumFractionDigits: 2 })} ${curr}`;
  return { value: formatted, sub: el.turnus };
}

// ─── Zusatzvoraussetzungen sammeln (deduped) ──────────────────────

export function uniqueVoraussetzungen(leistung) {
  const set = new Set();
  for (const r of leistung?.eligibility_rules || []) {
    if (r.zusatz_voraussetzung) set.add(r.zusatz_voraussetzung);
  }
  return Array.from(set);
}

// ─── Eligibility-Rule menschenlesbar ──────────────────────────────

export function formatRule(r) {
  if (!r) return '';
  const parts = [];
  const min = r.alter_min ?? 0;
  const max = r.alter_max ?? 150;
  if (!(min === 0 && max === 150)) {
    if (min === 0) parts.push(`bis ${max} Jahre`);
    else if (max === 150) parts.push(`ab ${min} Jahre`);
    else parts.push(`${min}–${max} Jahre`);
  }
  if (r.geschlecht === 'W') parts.push('weiblich');
  if (r.geschlecht === 'M') parts.push('männlich');
  if (r.geschlecht === 'D') parts.push('divers');
  if (r.requires_pregnancy) parts.push('Schwangerschaft');
  if (r.requires_children) parts.push('familienversicherte Kinder');
  return parts.length ? parts.join(' · ') : 'Alle Versicherten';
}

// ─── PDF-Deep-Link ────────────────────────────────────────────────

export function buildPdfLink(pdfBaseUrl, pdfPage) {
  if (!pdfBaseUrl) return null;
  return pdfPage ? `${pdfBaseUrl}#page=${pdfPage}` : pdfBaseUrl;
}
