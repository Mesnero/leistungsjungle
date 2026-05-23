// Profil-Screen — zeigt + bearbeitet die localStorage-Daten.
// Vom Hamburger-Menü („Profil ansehen") aufgerufen.

import React from 'react';
import { COLORS, Ph, MASCOT_CHAR } from '../lib/tokens';
import { getProfile, setProfile, PROFILE_DEFAULTS } from '../lib/profile';

export function ProfileScreen({ onClose, onDemoPage }) {
  const initial = getProfile() || PROFILE_DEFAULTS;

  const [nickname, setNickname] = React.useState(initial.nickname);
  const [birthdate, setBirthdate] = React.useState(initial.birthdate);
  const [gender, setGender] = React.useState(initial.gender);
  const [steps, setSteps] = React.useState(initial.goals?.steps ?? 10000);
  const [sleep, setSleep] = React.useState(initial.personal?.sleep ?? '7h 30m');
  const [weight, setWeight] = React.useState(initial.personal?.weight ?? 75);
  const [height, setHeight] = React.useState(initial.personal?.height ?? 175);

  const save = () => {
    setProfile({
      nickname: nickname.trim() || initial.nickname,
      birthdate,
      gender,
      goals: { steps: Number(steps) || 0 },
      personal: {
        sleep,
        weight: Number(weight) || 0,
        height: Number(height) || 0,
      },
    });
    onClose();
  };

  // Geburtsdatum als deutsches Format für die Anzeige
  const birthdateDisplay = birthdate
    ? new Date(birthdate).toLocaleDateString('de-DE')
    : '';

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      background: '#fff', zIndex: 75,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* header */}
      <div style={{
        padding: '56px 18px 8px',
        display: 'grid', gridTemplateColumns: '40px 1fr 40px',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
          background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        }}>
          <Ph name="arrow-left" size={26} color={COLORS.mint} weight="bold" />
        </button>
        <h1 style={{
          margin: 0, fontSize: 24, fontWeight: 700, color: COLORS.mint,
          textAlign: 'center', letterSpacing: -0.3,
        }}>Dein Profil</h1>
        <div />
      </div>

      {/* scroll body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0 24px' }}>
        {/* avatar */}
        <div style={{ textAlign: 'center', padding: '12px 0 18px' }}>
          <div style={{
            width: 92, height: 92, borderRadius: 46,
            background: COLORS.mintSoft, margin: '0 auto 8px',
            overflow: 'hidden',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}>
            <img src={MASCOT_CHAR} alt="" style={{
              width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%',
            }} />
          </div>
          <button onClick={() => onDemoPage?.('Foto ändern')} style={{
            background: 'transparent', border: 0, padding: 0, cursor: 'pointer',
            color: COLORS.mint, fontSize: 14, fontWeight: 500, fontFamily: 'inherit',
          }}>Foto ändern</button>
        </div>

        {/* Spitzname */}
        <div style={{ padding: '0 22px', marginBottom: 18 }}>
          <FieldLabel>Spitzname</FieldLabel>
          <input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="Spitzname"
            style={pillInputStyle()}
          />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            marginTop: 8, paddingLeft: 4,
            fontSize: 13, color: COLORS.muted,
          }}>
            <Ph name="question" size={14} color={COLORS.mint} />
            <span>Suche dir einen Spitznamen aus.</span>
          </div>
        </div>

        {/* Geburtsdatum + Geschlecht */}
        <div style={{
          padding: '0 22px', marginBottom: 26,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
        }}>
          <div>
            <FieldLabel>Geburtsdatum</FieldLabel>
            <input
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              style={{
                ...pillInputStyle(),
                color: birthdate ? COLORS.ink : COLORS.muted,
              }}
              title={birthdateDisplay}
            />
          </div>
          <div>
            <FieldLabel>Geschlecht</FieldLabel>
            <div style={{ position: 'relative' }}>
              <select
                value={gender}
                onChange={e => setGender(e.target.value)}
                style={{
                  ...pillInputStyle(),
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  paddingRight: 40,
                  cursor: 'pointer',
                }}
              >
                <option value="f">Weiblich</option>
                <option value="m">Männlich</option>
                <option value="d">Divers</option>
              </select>
              <div style={{
                position: 'absolute', right: 16, top: '50%',
                transform: 'translateY(-50%)', pointerEvents: 'none',
                display: 'flex',
              }}>
                <Ph name="caret-down" size={16} color={COLORS.mint} weight="bold" />
              </div>
            </div>
          </div>
        </div>

        {/* Aktivitätsziele */}
        <SectionHeader>Aktivitätsziele</SectionHeader>
        <Row
          icon="person-simple-run"
          label="Schritte"
          value={steps}
          onChange={setSteps}
          type="number"
        />

        {/* Persönliche Angaben */}
        <SectionHeader>Persönliche Angaben</SectionHeader>
        <Row
          icon="moon"
          label="Schlaf"
          value={sleep}
          onChange={setSleep}
          placeholder="z.B. 7h 30m"
        />
        <Row
          icon="scales"
          label="Gewicht"
          value={weight}
          onChange={setWeight}
          suffix="kg"
          type="number"
          step="0.1"
        />
        <Row
          icon="ruler"
          label="Größe"
          value={height}
          onChange={setHeight}
          suffix="cm"
          type="number"
        />
      </div>

      {/* save button */}
      <div style={{ padding: '12px 22px 30px', flexShrink: 0 }}>
        <button onClick={save} style={{
          width: '100%', height: 52, borderRadius: 14, border: 0,
          background: COLORS.mintPale, color: COLORS.mint,
          fontSize: 17, fontWeight: 600, fontFamily: 'inherit',
          cursor: 'pointer',
          transition: 'background 0.15s',
        }}
        onMouseDown={e => e.currentTarget.style.background = COLORS.mintSoft}
        onMouseUp={e => e.currentTarget.style.background = COLORS.mintPale}
        onMouseLeave={e => e.currentTarget.style.background = COLORS.mintPale}
        >Speichern</button>
      </div>
    </div>
  );
}

// ─── Pieces ──────────────────────────────────────────────

function FieldLabel({ children }) {
  return (
    <div style={{
      fontSize: 13, color: COLORS.text, fontWeight: 500,
      marginBottom: 6, paddingLeft: 4,
    }}>{children}</div>
  );
}

function SectionHeader({ children }) {
  return (
    <h2 style={{
      margin: '6px 0 10px 22px', fontSize: 18, fontWeight: 700,
      color: COLORS.ink, letterSpacing: -0.2,
    }}>{children}</h2>
  );
}

function Row({ icon, label, value, onChange, suffix, type = 'text', placeholder, step }) {
  return (
    <div style={{
      margin: '0 18px 10px', padding: '0 16px',
      background: '#F1F3F5', borderRadius: 14, height: 52,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <Ph name={icon} size={22} color={COLORS.mint} />
      <span style={{ flex: 1, fontSize: 16, color: COLORS.ink }}>{label}</span>
      <input
        type={type}
        step={step}
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'transparent', border: 0, outline: 'none',
          fontSize: 16, fontWeight: 500, color: COLORS.mint,
          textAlign: 'right', width: type === 'number' ? 80 : 110,
          fontFamily: 'inherit', padding: 0,
        }}
      />
      {suffix && (
        <span style={{ fontSize: 16, fontWeight: 500, color: COLORS.mint, marginLeft: -4 }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function pillInputStyle() {
  return {
    width: '100%', boxSizing: 'border-box',
    height: 50, borderRadius: 14, border: 0,
    background: '#F1F3F5', padding: '0 16px',
    fontSize: 16, color: COLORS.ink, fontFamily: 'inherit',
    outline: 'none',
  };
}
