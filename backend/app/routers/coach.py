"""Coach AURA — Chat-Endpoint mit OpenAI Tool-Calls.

Streng Topic-Locked auf Leistungen der gewählten Krankenkasse.
LLM kann via `show_leistung(index)` konkrete Leistungs-Cards
ins Chat-UI einbetten — Frontend rendert die als anklickbare
Mini-Cards die den Detail-Sheet öffnen.
"""
from __future__ import annotations

import json
import os
from typing import Any, Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.data import get_krankenkasse
from app.routers.benefits import _GENDER_MAP, _leistung_matches


router = APIRouter(prefix="/coach", tags=["coach"])


# ─── Request/Response Models ───────────────────────────────────────


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatContext(BaseModel):
    slug: str
    age: int
    gender: Literal["m", "f", "d"]
    pregnant: bool = False
    has_children: bool = False


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    context: ChatContext


class ChatResponse(BaseModel):
    reply: str
    leistungen: list[dict[str, Any]] = []


# ─── Prompt + Tool-Definition ──────────────────────────────────────


SYSTEM_PROMPT_TEMPLATE = """Du bist Coach AURA, ein freundlicher Berater für Krankenkassen-Leistungen.

WICHTIG — STRENG EINHALTEN:
- Antworte AUSSCHLIESSLICH zu Leistungen der Krankenkasse "{kk_name}".
- Bei Off-Topic-Fragen (Wetter, Politik, allgemeine Gesundheit, andere KKs etc.):
  freundlich aber bestimmt zurück zum Thema lenken.
- Sprich auf Deutsch, kurz und natürlich (1-2 Sätze pro Antwort).
- Empfehlungen IMMER konkret an dem Profil ausrichten: {profile_text}.

ANTWORT-STIL:
- IMMER zuerst 1-2 Sätze begleitenden Text schreiben (z.B. "Schau mal, das passt:" oder
  "Du hast Anspruch auf folgende Leistung:") und DANN das Tool aufrufen.
- NIEMALS nur Tool-Aufrufe ohne Text.

DEINE WISSENSBASIS — die für den User passenden Leistungen:

{leistungen_list}

NUTZUNG DES TOOLS `show_leistung`:
- Wähle die 1-3 BESTEN Treffer, NICHT alle möglichen. Lieber wenige, passende Cards
  als eine Card-Flut.
- Ruf das Tool mit dem index aus der Liste auf.
- Das UI rendert die Card im Chat — also keine Notwendigkeit, Name/Wert/Details im
  Text zu wiederholen. Der Text soll bloß einleiten oder erläutern, was die User
  davon haben.
"""


SHOW_LEISTUNG_TOOL = {
    "type": "function",
    "function": {
        "name": "show_leistung",
        "description": (
            "Zeigt eine konkrete Leistung als interaktive Card im Chat. "
            "Verwende das wenn du eine bestimmte Leistung empfiehlst oder erläuterst."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "index": {
                    "type": "integer",
                    "description": "0-basierter Index der Leistung aus der nummerierten Wissensbasis.",
                }
            },
            "required": ["index"],
        },
    },
}


# ─── Helpers ───────────────────────────────────────────────────────


_GENDER_DE = {"f": "weiblich", "m": "männlich", "d": "divers"}


def _filtered_leistungen(payload: dict[str, Any], ctx: ChatContext) -> list[dict[str, Any]]:
    """Reuse der Filter-Logik aus /benefits, plus benefit_type-Tagging."""
    filter_kwargs = {
        "age": ctx.age,
        "geschlecht": _GENDER_MAP[ctx.gender],
        "pregnant": ctx.pregnant,
        "has_children": ctx.has_children,
    }
    out: list[dict[str, Any]] = []
    for l in payload.get("satzungsleistungen") or []:
        if _leistung_matches(l, **filter_kwargs):
            out.append({**l, "benefit_type": "satzungsleistung"})
    for l in payload.get("bonus_massnahmen") or []:
        if _leistung_matches(l, **filter_kwargs):
            out.append({**l, "benefit_type": "bonus_massnahme"})
    return out


def _format_erstattung_brief(el: dict[str, Any] | None) -> str:
    if not el:
        return "—"
    wert = el.get("wert")
    waehrung = el.get("waehrung", "")
    typ = el.get("typ", "")
    if wert == 0 and "volle" in typ.lower():
        return f"100 %"
    if wert is None:
        return typ or "—"
    return f"{wert} {waehrung}"


def _build_system_prompt(
    kk_name: str, ctx: ChatContext, leistungen: list[dict[str, Any]]
) -> str:
    lines: list[str] = []
    for i, l in enumerate(leistungen):
        bt = "Bonus" if l.get("benefit_type") == "bonus_massnahme" else "Satzung"
        desc = (l.get("beschreibung") or "").replace("\n", " ")[:120]
        erst = _format_erstattung_brief(l.get("erstattungs_logik"))
        lines.append(f"[{i}] {l['name']} | {bt} · {l.get('kategorie','-')} · {erst} — {desc}")

    profile_parts = [f"{ctx.age} Jahre", _GENDER_DE.get(ctx.gender, ctx.gender)]
    if ctx.pregnant:
        profile_parts.append("schwanger")
    if ctx.has_children:
        profile_parts.append("hat Kinder")
    profile_text = ", ".join(profile_parts)

    return SYSTEM_PROMPT_TEMPLATE.format(
        kk_name=kk_name,
        profile_text=profile_text,
        leistungen_list="\n".join(lines) or "(keine passenden Leistungen für dieses Profil)",
    )


# ─── Endpoint ──────────────────────────────────────────────────────


@router.post("/chat", response_model=ChatResponse)
def chat(req: ChatRequest) -> ChatResponse:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY fehlt in backend/.env")

    payload = get_krankenkasse(req.context.slug)
    if not payload:
        raise HTTPException(
            status_code=404, detail=f"Krankenkasse '{req.context.slug}' nicht gefunden"
        )

    kk_name = (payload.get("krankenkasse") or {}).get("name", req.context.slug)
    available = _filtered_leistungen(payload, req.context)
    system_prompt = _build_system_prompt(kk_name, req.context, available)

    # OpenAI-Call (lazy import, max_retries=0 — Endpoint selbst retried bei Bedarf später)
    from openai import APIError, OpenAI, RateLimitError

    client = OpenAI(api_key=api_key, max_retries=1)
    api_messages: list[dict[str, str]] = [{"role": "system", "content": system_prompt}]
    for m in req.messages:
        api_messages.append({"role": m.role, "content": m.content})

    try:
        response = client.chat.completions.create(
            model="gpt-5.4-mini",
            messages=api_messages,
            tools=[SHOW_LEISTUNG_TOOL],
            tool_choice="auto",
            temperature=0.3,
        )
    except RateLimitError as e:
        raise HTTPException(status_code=429, detail=f"OpenAI Rate-Limit: {e}") from e
    except APIError as e:
        raise HTTPException(status_code=502, detail=f"OpenAI-Fehler: {e}") from e

    msg = response.choices[0].message
    reply = (msg.content or "").strip()

    # Hardcap: maximal 3 Cards pro Antwort, sonst überschwemmt es das Chat-UI.
    MAX_CARDS = 3
    shown: list[dict[str, Any]] = []
    seen_idx: set[int] = set()
    for tc in msg.tool_calls or []:
        if tc.function.name != "show_leistung":
            continue
        if len(shown) >= MAX_CARDS:
            break
        try:
            args = json.loads(tc.function.arguments)
            idx = args.get("index")
            if isinstance(idx, int) and 0 <= idx < len(available) and idx not in seen_idx:
                seen_idx.add(idx)
                shown.append(available[idx])
        except (json.JSONDecodeError, KeyError, TypeError):
            continue

    # Fallback wenn LLM nur Tool-Calls + leeren Content schickt
    if not reply:
        reply = "Hier passt das gut zu dir:" if shown else "Ich bin kurz sprachlos. Frag nochmal?"

    return ChatResponse(reply=reply, leistungen=shown)
