// Minimal fetch-Wrapper für das FastAPI-Backend.

// Render's fromService.host gibt nur den Hostname zurück, ohne Protocol-Prefix.
// Wir prependen https:// defensiv damit fetch() nicht abkackt.
function normalizeApiUrl(raw) {
  const fallback = 'http://localhost:8000';
  if (!raw) return fallback;
  const trimmed = String(raw).trim().replace(/\/+$/, '');
  if (!trimmed) return fallback;
  if (/^https?:\/\//.test(trimmed)) return trimmed;
  // Hostname-only → in Production immer HTTPS
  return `https://${trimmed}`;
}

export const API_BASE = normalizeApiUrl(import.meta.env.VITE_API_URL);

/** Macht aus „/logos/foo.svg" eine absolute URL aufs Backend. */
export function backendUrl(path) {
  if (!path) return null;
  if (/^https?:\/\//.test(path)) return path;
  return `${API_BASE}${path}`;
}

/**
 * @returns {Promise<Array<{
 *   slug: string, name: string, website: string|null,
 *   satzung_stand: string|null,
 *   hat_bonusprogramm: boolean,
 *   anzahl_satzungsleistungen: number,
 *   anzahl_bonus_massnahmen: number,
 *   logo_url: string|null,
 * }>>}
 */
export async function listKrankenkassen() {
  const r = await fetch(`${API_BASE}/krankenkassen`);
  if (!r.ok) throw new Error(`Krankenkassen laden fehlgeschlagen (HTTP ${r.status})`);
  return r.json();
}

/**
 * Liefert ein BenefitsResponse-Objekt:
 *   { krankenkasse, satzungsleistungen[], bonus_massnahmen[], bonusprogramm_meta }
 */
export async function listBenefits({ slug, age, gender, pregnant = false, hasChildren = false }) {
  const url = new URL(`${API_BASE}/benefits`);
  url.searchParams.set('slug', slug);
  url.searchParams.set('age', String(age));
  url.searchParams.set('gender', gender);
  url.searchParams.set('pregnant', String(pregnant));
  url.searchParams.set('has_children', String(hasChildren));
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Leistungen laden fehlgeschlagen (HTTP ${r.status})`);
  return r.json();
}
