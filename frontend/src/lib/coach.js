// API-Wrapper für /coach/chat.

const BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

/**
 * @param {object} args
 * @param {Array<{role: 'user'|'assistant', content: string}>} args.messages
 * @param {object} args.context
 * @returns {Promise<{ reply: string, leistungen: object[] }>}
 */
export async function chatCoach({ messages, context }) {
  const r = await fetch(`${BASE}/coach/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, context }),
  });
  if (!r.ok) {
    let detail = `HTTP ${r.status}`;
    try {
      const body = await r.json();
      if (body?.detail) detail = body.detail;
    } catch {}
    throw new Error(detail);
  }
  return r.json();
}
