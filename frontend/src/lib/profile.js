// Profil im localStorage — alles in einem Objekt.

const KEY = 'goecofit.profile';

export const KASSE_DEFAULTS = {
  complete: false,
  krankenkasseSlug: null,     // statt UUID — kommt aus dem JSON
  krankenkasseName: null,
  insuranceType: null,        // 'gkv' | 'pkv'
  pregnant: false,
  hasChildren: false,         // Familienversicherte Kinder ja/nein
};

export const PROFILE_DEFAULTS = {
  nickname: '',
  birthdate: '',
  gender: 'd',
  goals: { steps: 10000 },
  personal: { sleep: '7h 30m', weight: 75, height: 175 },
  kasse: KASSE_DEFAULTS,
};

export function getProfile() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const stored = JSON.parse(raw);
    const profile = {
      ...PROFILE_DEFAULTS,
      ...stored,
      kasse: { ...KASSE_DEFAULTS, ...(stored.kasse || {}) },
    };
    // Backwards-Compat: alte Profile mit krankenkasseId (UUID) statt krankenkasseSlug
    // werden zu Re-Onboarding gezwungen, sonst kracht das Backend mit 404.
    if (profile.kasse.complete && !profile.kasse.krankenkasseSlug) {
      profile.kasse = { ...KASSE_DEFAULTS };
    }
    return profile;
  } catch {
    return null;
  }
}

export function setProfile(profile) {
  localStorage.setItem(KEY, JSON.stringify(profile));
}

export function updateProfile(patch) {
  const current = getProfile() || PROFILE_DEFAULTS;
  const next = { ...current, ...patch };
  setProfile(next);
  return next;
}

export function clearProfile() {
  localStorage.removeItem(KEY);
}

export function hasProfile() {
  return getProfile() !== null;
}
