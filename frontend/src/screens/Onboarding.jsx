// Onboarding — wird beim allerersten Start angezeigt.
// Fragt Spitzname, Geburtsdatum, Geschlecht ab und speichert in localStorage.

import React from 'react';
import { COLORS, MASCOT_CHAR } from '../lib/tokens';
import { setProfile, PROFILE_DEFAULTS } from '../lib/profile';

const FIELD_STYLE = {
  width: '100%', boxSizing: 'border-box',
  height: 50, borderRadius: 14, border: 0,
  background: '#F1F3F5', padding: '0 16px',
  fontSize: 16, color: COLORS.ink, fontFamily: 'inherit',
  outline: 'none',
};

export function OnboardingScreen({ onDone }) {
  const [nickname, setNickname] = React.useState('');
  const [birthdate, setBirthdate] = React.useState('');
  const [gender, setGender] = React.useState('d');

  const valid = nickname.trim().length > 0 && birthdate;

  const submit = () => {
    if (!valid) return;
    setProfile({
      ...PROFILE_DEFAULTS,
      nickname: nickname.trim(),
      birthdate,
      gender,
    });
    onDone();
  };

  return (
    <div style={{
      position: 'absolute', inset: 0, background: '#fff',
      zIndex: 80, display: 'flex', flexDirection: 'column',
      padding: '70px 24px 40px',
      boxSizing: 'border-box',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{
          width: 96, height: 96, borderRadius: 48,
          background: COLORS.mintSoft, margin: '0 auto 16px',
          overflow: 'hidden',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <img src={MASCOT_CHAR} alt="" style={{
            width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%',
          }} />
        </div>
        <h1 style={{
          margin: 0, fontSize: 26, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.3,
        }}>Willkommen!</h1>
        <p style={{ margin: '8px 0 0', fontSize: 15, color: COLORS.muted }}>
          Erzähl uns kurz von dir.
        </p>
      </div>

      <Field label="Spitzname">
        <input
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          placeholder="Wie heißt du?"
          style={FIELD_STYLE}
          autoFocus
        />
      </Field>

      <Field label="Geburtsdatum">
        <input
          type="date"
          value={birthdate}
          onChange={e => setBirthdate(e.target.value)}
          style={FIELD_STYLE}
        />
      </Field>

      <Field label="Geschlecht">
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { id: 'f', label: 'Weiblich' },
            { id: 'm', label: 'Männlich' },
            { id: 'd', label: 'Divers' },
          ].map(g => {
            const active = gender === g.id;
            return (
              <button key={g.id} type="button" onClick={() => setGender(g.id)} style={{
                flex: 1, height: 50, borderRadius: 14, border: 0,
                background: active ? COLORS.mint : '#F1F3F5',
                color: active ? '#fff' : COLORS.text,
                fontSize: 15, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background 0.15s, color 0.15s',
              }}>{g.label}</button>
            );
          })}
        </div>
      </Field>

      <div style={{ flex: 1, minHeight: 12 }} />

      <button onClick={submit} disabled={!valid} style={{
        height: 56, borderRadius: 14, border: 0,
        background: valid ? COLORS.mint : COLORS.mintPale,
        color: valid ? '#fff' : COLORS.mint,
        fontSize: 17, fontWeight: 600, fontFamily: 'inherit',
        cursor: valid ? 'pointer' : 'default',
        transition: 'background 0.15s',
      }}>Los geht's</button>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        fontSize: 13, color: COLORS.text, fontWeight: 500,
        marginBottom: 8, paddingLeft: 4,
      }}>{label}</div>
      {children}
    </div>
  );
}
