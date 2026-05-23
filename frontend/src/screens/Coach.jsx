// Coach AURA — Dynamischer Chat mit OpenAI Tool-Calls.
//
// Streng on-Topic: redet nur über Leistungen der gewählten Krankenkasse.
// Wenn der LLM-Coach eine Leistung empfiehlt, ruft er das `show_leistung`-Tool
// auf und das Backend liefert die volle Leistungs-Struktur mit zurück.
// Frontend rendert die als anklickbare LeistungMiniCard die den DetailSheet öffnet.

import React from 'react';
import { COLORS, Ph, MASCOT_CHAR } from '../lib/tokens';
import { chatCoach } from '../lib/coach';
import { DetailSheet } from '../components/DetailSheet';
import { LeistungMiniCard } from '../components/LeistungMiniCard';


const WELCOME = 'Hallo! Ich bin AURA, dein Coach für Krankenkassen-Leistungen. Frag mich was zu deinen Bonus-Maßnahmen oder Satzungsleistungen — z.B. „Was bekomme ich fürs Sportabzeichen?".';


function calcAge(birthdate) {
  if (!birthdate) return 30;
  const b = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
}


export function CoachScreen({ onBack, profile, onStartKasseOnboarding }) {
  // Pre-Check: KK-Onboarding muss durch sein, sonst kein Coach
  const kasseReady = Boolean(profile?.kasse?.complete && profile?.kasse?.krankenkasseSlug);

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 84,
      background: '#fff',
      display: 'flex', flexDirection: 'column', zIndex: 35,
    }}>
      {/* Header */}
      <div style={{
        padding: '56px 18px 14px',
        display: 'grid', gridTemplateColumns: '40px 1fr 40px',
        alignItems: 'center', borderBottom: '1px solid #EEF2F4',
        flexShrink: 0,
      }}>
        <button onClick={onBack} style={{
          background: 'transparent', border: 0, cursor: 'pointer', padding: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        }}>
          <Ph name="arrow-left" size={26} color={COLORS.mint} weight="bold" />
        </button>
        <h1 style={{
          margin: 0, fontSize: 24, fontWeight: 700, color: COLORS.mint,
          textAlign: 'center', letterSpacing: -0.3,
        }}>Coach AURA</h1>
        <div />
      </div>

      {kasseReady
        ? <ChatThread profile={profile} />
        : <NoKasseEmpty onStart={onStartKasseOnboarding} />
      }
    </div>
  );
}


// ─── Empty State ────────────────────────────────────────────────────


function NoKasseEmpty({ onStart }) {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 32px', textAlign: 'center', gap: 16,
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 16,
        background: COLORS.mintPale, overflow: 'hidden',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}>
        <img src={MASCOT_CHAR} alt="" style={{
          width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%',
        }} />
      </div>
      <div>
        <h2 style={{
          margin: 0, fontSize: 19, fontWeight: 700, color: COLORS.ink, letterSpacing: -0.3,
        }}>Erst Krankenkasse auswählen</h2>
        <p style={{
          margin: '6px 0 0', fontSize: 14, color: COLORS.muted, lineHeight: 1.45, maxWidth: 280,
        }}>
          Damit ich dir konkrete Leistungen empfehlen kann, brauche ich erst dein KK-Profil.
          Dauert eine Minute.
        </p>
      </div>
      {onStart && (
        <button onClick={onStart} style={{
          marginTop: 4, padding: '12px 22px', borderRadius: 14, border: 0,
          background: COLORS.mint, color: '#fff',
          fontSize: 15, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
        }}>
          Jetzt starten
        </button>
      )}
    </div>
  );
}


// ─── Thread (echter Chat) ───────────────────────────────────────────


function ChatThread({ profile }) {
  const [messages, setMessages] = React.useState(() => [
    { from: 'bot', text: WELCOME, leistungen: [] },
  ]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [selected, setSelected] = React.useState(null); // { leistung } | null
  const scrollRef = React.useRef(null);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy]);

  const context = React.useMemo(() => ({
    slug: profile.kasse.krankenkasseSlug,
    age: calcAge(profile.birthdate),
    gender: profile.gender || 'd',
    pregnant: profile.kasse.pregnant === true,
    has_children: Boolean(profile.kasse?.hasChildren),
  }), [profile]);

  const send = async (text) => {
    const userMsg = { from: 'user', text };
    const nextMsgs = [...messages, userMsg];
    setMessages(nextMsgs);
    setBusy(true);
    setError(null);

    // Verlauf für Backend: nur user/assistant-Texte (kein Welcome)
    const history = nextMsgs
      .filter(m => m.from !== 'bot' || m.text !== WELCOME)
      .map(m => ({
        role: m.from === 'user' ? 'user' : 'assistant',
        content: m.text,
      }));

    try {
      const resp = await chatCoach({ messages: history, context });
      setMessages(m => [...m, {
        from: 'bot',
        text: resp.reply,
        leistungen: resp.leistungen || [],
      }]);
    } catch (e) {
      setError(String(e.message || e));
      setMessages(m => [...m, {
        from: 'bot',
        text: '(Verbindung zum Coach klappt grad nicht — versuch nochmal.)',
        leistungen: [],
      }]);
    } finally {
      setBusy(false);
    }
  };

  // Wo das DetailSheet die PDF-URL herkriegt (= kk.website aus dem geladenen Leistungs-Objekt).
  // Hinten am Leistung-Objekt selber hängt nicht direkt website — die müsste man via
  // /krankenkassen lookup holen. Lazy lösung: aus profile.kasse.krankenkasseSlug + cache.
  // Hier first cut: DetailSheet kriegt undefined → öffnet PDF ohne Anchor wenn pdf_page fehlt.
  // (Falls wir's brauchen, baue ich pdfBaseUrl-State noch dazu.)
  const pdfBase = null;

  return (
    <>
      {/* Messages */}
      <div ref={scrollRef} style={{
        flex: 1, overflowY: 'auto', padding: '16px 14px 8px',
      }}>
        {messages.map((m, i) => (
          <Message key={i} msg={m} onOpenLeistung={l => setSelected({ leistung: l })} />
        ))}
        {busy && <TypingIndicator />}
        {error && (
          <div style={{
            margin: '8px 0', padding: '8px 12px', borderRadius: 10,
            background: '#FEF2F2', color: '#B91C1C', fontSize: 12,
          }}>{error}</div>
        )}
      </div>

      <ChatInput onSend={send} disabled={busy} />

      {selected && (
        <DetailSheet
          leistung={selected.leistung}
          pdfBaseUrl={pdfBase}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  );
}


// ─── Sub-Components ──────────────────────────────────────────────────


function Message({ msg, onOpenLeistung }) {
  const isUser = msg.from === 'user';
  return (
    <div style={{
      display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start',
      gap: 8, alignItems: 'flex-end', marginBottom: 10,
    }}>
      {!isUser && <CoachAvatar size={32} />}
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 6,
        maxWidth: isUser ? '74%' : '85%',
      }}>
        {msg.text && (
          <div style={{
            background: isUser ? COLORS.mint : '#F1F3F5',
            color: isUser ? '#fff' : COLORS.ink,
            padding: '10px 14px',
            borderRadius: 18,
            borderBottomRightRadius: isUser ? 4 : 18,
            borderBottomLeftRadius: isUser ? 18 : 4,
            fontSize: 15, lineHeight: 1.4,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            alignSelf: isUser ? 'flex-end' : 'flex-start',
          }}>{msg.text}</div>
        )}
        {!isUser && msg.leistungen?.map((l, i) => (
          <LeistungMiniCard key={i} leistung={l} onOpen={() => onOpenLeistung(l)} />
        ))}
      </div>
    </div>
  );
}


function CoachAvatar({ size = 36 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: COLORS.mintPale, overflow: 'hidden', flexShrink: 0,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      <img src={MASCOT_CHAR} alt=""
        style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }} />
    </div>
  );
}


function TypingIndicator() {
  const dot = (delay) => ({
    width: 6, height: 6, borderRadius: 3, background: COLORS.muted,
    animation: `coach-bounce 1s ${delay}s infinite ease-in-out`,
  });
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', gap: 8, marginBottom: 10,
    }}>
      <style>{`
        @keyframes coach-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
      <CoachAvatar size={32} />
      <div style={{
        background: '#F1F3F5', borderRadius: 18, borderBottomLeftRadius: 4,
        display: 'inline-flex', gap: 4, alignItems: 'center',
        padding: '12px 16px',
      }}>
        <span style={dot(0)} />
        <span style={dot(0.15)} />
        <span style={dot(0.3)} />
      </div>
    </div>
  );
}


function ChatInput({ onSend, disabled }) {
  const [text, setText] = React.useState('');
  const submit = () => {
    const t = text.trim();
    if (!t || disabled) return;
    onSend(t);
    setText('');
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px 40px',
      borderTop: '1px solid #EEF2F4', background: '#fff',
      flexShrink: 0,
    }}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center',
        background: '#F1F3F5', borderRadius: 22, height: 44,
        padding: '0 16px',
      }}>
        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') submit(); }}
          placeholder="Nachricht an AURA…"
          disabled={disabled}
          style={{
            flex: 1, background: 'transparent', border: 0, outline: 'none',
            fontSize: 15, color: COLORS.ink, fontFamily: 'inherit', padding: 0,
          }}
        />
      </div>
      <button onClick={submit} disabled={!text.trim() || disabled} style={{
        width: 44, height: 44, borderRadius: 22, border: 0,
        background: text.trim() && !disabled ? COLORS.mint : COLORS.mutedSoft,
        cursor: text.trim() && !disabled ? 'pointer' : 'default',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0, transition: 'background 0.15s',
      }}>
        <Ph name="paper-plane-tilt" size={20} color="#fff" weight="fill" />
      </button>
    </div>
  );
}
