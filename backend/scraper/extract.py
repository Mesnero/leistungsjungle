"""LLM-Call mit strukturierter Output-Validierung gegen schema.json.

Unterstützt zwei Provider: OpenAI (default) und Gemini.
Beide kriegen dasselbe Schema + denselben Prompt — Provider-Switch
ist eine Zeile (`provider="gemini"`).

Schema wird aus backend/schema.json gelesen. `$comment`-Keys werden
gestrippt weil weder OpenAI noch Gemini sie akzeptieren (nicht OpenAPI-konform).
"""
from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any, Callable


HERE = Path(__file__).resolve().parent.parent
SCHEMA_FILE = HERE / "schema.json"

DEFAULT_MODELS = {
    "openai": "gpt-5.4-mini",
    "gemini": "gemini-2.5-flash",
}

# Exponential backoff bei 429 / 503 / Server-Überlast
RETRY_DELAYS_SECONDS = [5, 15, 45]


PROMPT_TEMPLATE = """Du bist Extraktions-Experte für deutsche Krankenkassen-Satzungen.

Aufgabe: Aus dem unten stehenden Text der Satzung von "{name}" alle relevanten Leistungen extrahieren und im vorgegebenen JSON-Schema zurückgeben.

REGELN:
1. Trenne **Satzungsleistungen** (pflichtmäßige Leistungen aus der Satzung) von **Bonus-Maßnahmen** (Punkte/Geld für gesundheitsbewusstes Verhalten).
2. `erstattungs_logik` IMMER strukturiert ausfüllen mit `typ`, `wert`, `waehrung`, `turnus`. Keine Erstattungsangaben in `beschreibung`.
3. `pdf_page` MUSS die Seitenzahl aus dem "--- Seite N ---"-Marker sein, auf der die Leistung hauptsächlich beschrieben ist.
4. `eligibility_rules`: mindestens eine Regel. Default: `alter_min=0, alter_max=150, geschlecht="ALL", requires_pregnancy=false, requires_children=false`.
5. `requires_pregnancy=true` NUR wenn Schwangerschaft Voraussetzung ist.
6. `requires_children=true` NUR wenn familienversicherte Kinder Voraussetzung sind.
7. KEINE "Bonus:"-Präfixe im `name` von bonus_massnahmen.
8. Wenn die KK kein Bonusprogramm hat: `bonusprogramm_meta` weglassen, `bonus_massnahmen` als leere Liste.
9. Bei `name` und `slug` der Krankenkasse exakt diese Werte verwenden: name="{name}", slug="{slug}".

INPUT:
- Krankenkasse: {name}
- Slug: {slug}
- Satzungs-PDF: {url}

--- BEGINN SATZUNGSTEXT ---
{text}
--- ENDE SATZUNGSTEXT ---
"""


class ProviderOverloadError(RuntimeError):
    """LLM-Provider hat nach allen Retries weiter transiente Fehler (429/503)."""


# ─── Public API ─────────────────────────────────────────────────────


def scrape_pdf_to_json(
    *,
    source: dict[str, str],
    text: str,
    api_key: str,
    provider: str = "openai",
    model: str | None = None,
    temperature: float = 0.1,
    max_retries: int = 3,
) -> dict[str, Any]:
    """Provider-agnostischer Entry-Point.

    Args:
        source: dict mit `name`, `slug`, `satzung_pdf_url` (aus sources.json).
        text: PDF-Text mit `--- Seite N ---`-Markern.
        api_key: API-Key des gewählten Providers.
        provider: 'openai' (default) | 'gemini'.
        model: konkretes Modell, None → Default je Provider.
        temperature: 0.1 für deterministische Extraktion.
        max_retries: bei transienten 429/503-Fehlern.

    Returns:
        Parsed JSON-Dict gemäß backend/schema.json.

    Raises:
        ProviderOverloadError: nach Erschöpfung der Retries.
        ValueError: bei unbekanntem Provider.
    """
    schema = _load_schema()
    prompt = PROMPT_TEMPLATE.format(
        name=source["name"],
        slug=source["slug"],
        url=source["satzung_pdf_url"],
        text=text,
    )
    chosen_model = model or DEFAULT_MODELS[provider]

    if provider == "openai":
        data = _call_openai(schema, prompt, api_key, chosen_model, temperature, max_retries)
    elif provider == "gemini":
        data = _call_gemini(schema, prompt, api_key, chosen_model, temperature, max_retries)
    else:
        raise ValueError(f"Unbekannter Provider: {provider!r}. Erlaubt: openai, gemini")

    # Krankenkasse-Block fixen, damit das LLM Name/Slug nicht überschreibt
    data.setdefault("krankenkasse", {})
    data["krankenkasse"]["name"] = source["name"]
    data["krankenkasse"]["slug"] = source["slug"]
    data["krankenkasse"]["website"] = source["satzung_pdf_url"]
    return data


# ─── Helpers ────────────────────────────────────────────────────────


def _strip_comments(obj: Any) -> Any:
    """Entfernt `$comment`-Keys rekursiv. Wird zur API-Compat-Anpassung benötigt
    (weder OpenAI noch Gemini akzeptieren $comment), erlaubt uns aber, das
    Schema-File mit Kommentaren für Menschen anzureichern."""
    if isinstance(obj, dict):
        return {k: _strip_comments(v) for k, v in obj.items() if k != "$comment"}
    if isinstance(obj, list):
        return [_strip_comments(x) for x in obj]
    return obj


def _load_schema() -> dict[str, Any]:
    with SCHEMA_FILE.open(encoding="utf-8") as f:
        return _strip_comments(json.load(f))


def _retry_loop(
    *,
    provider_label: str,
    call_once: Callable[[], dict[str, Any]],
    is_transient: Callable[[Exception], tuple[bool, str]],
    max_retries: int,
) -> dict[str, Any]:
    """Generische Retry-Schleife.

    `call_once`: führt einen API-Call durch und returnt das geparste JSON.
    `is_transient`: classifies an exception → (transient?, label) for retry decision.
    """
    total_attempts = max_retries + 1
    for attempt in range(total_attempts):
        try:
            return call_once()
        except Exception as e:
            transient, label = is_transient(e)
            if not transient:
                raise
            if attempt == max_retries:
                total_wait = sum(RETRY_DELAYS_SECONDS[:max_retries])
                raise ProviderOverloadError(
                    f"{provider_label} hat {total_attempts}× {label} geantwortet "
                    f"(insg. {total_wait}s gewartet). "
                    f"Tipp: später nochmal probieren oder anderen Provider/Modell wählen."
                ) from e
            wait = RETRY_DELAYS_SECONDS[attempt]
            print(f"  [retry] {provider_label} {label} — warte {wait}s (Versuch {attempt + 2}/{total_attempts})")
            time.sleep(wait)
    raise RuntimeError("unreachable")  # Type-checker satt machen


# ─── OpenAI ─────────────────────────────────────────────────────────


def _call_openai(
    schema: dict[str, Any],
    prompt: str,
    api_key: str,
    model: str,
    temperature: float,
    max_retries: int,
) -> dict[str, Any]:
    from openai import (
        APIError as OpenAIAPIError,
        InternalServerError,
        OpenAI,
        RateLimitError,
    )

    # `max_retries=0` damit unsere Retry-Loop authoritativ ist
    # (OpenAI-SDK retried sonst intern noch 2x).
    client = OpenAI(api_key=api_key, max_retries=0)

    def call_once() -> dict[str, Any]:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "krankenkasse_data",
                    "schema": schema,
                    "strict": False,
                },
            },
            temperature=temperature,
        )
        content = response.choices[0].message.content
        if not content:
            raise RuntimeError("OpenAI hat leere Response geliefert")
        return json.loads(content)

    def is_transient(e: Exception) -> tuple[bool, str]:
        if isinstance(e, RateLimitError):
            return True, "Rate-Limit (429)"
        if isinstance(e, InternalServerError):
            return True, "Server-5xx"
        # 4xx (Auth, Bad Request, Model not found) — permanent
        if isinstance(e, OpenAIAPIError):
            return False, ""
        # Sonstiges (Netzwerk, JSON-Decode) — nicht retryen
        return False, ""

    return _retry_loop(
        provider_label="OpenAI",
        call_once=call_once,
        is_transient=is_transient,
        max_retries=max_retries,
    )


# ─── Gemini ─────────────────────────────────────────────────────────


def _call_gemini(
    schema: dict[str, Any],
    prompt: str,
    api_key: str,
    model: str,
    temperature: float,
    max_retries: int,
) -> dict[str, Any]:
    from google import genai
    from google.genai import types
    from google.genai.errors import APIError

    client = genai.Client(api_key=api_key)

    def call_once() -> dict[str, Any]:
        response = client.models.generate_content(
            model=model,
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=schema,
                temperature=temperature,
            ),
        )
        return json.loads(response.text)

    def is_transient(e: Exception) -> tuple[bool, str]:
        if not isinstance(e, APIError):
            return False, ""
        status = getattr(e, "code", None)
        if status == 429:
            return True, "Rate-Limit (429)"
        if status == 503 or (status is None and "503" in str(e)):
            return True, "Server-Überlast (503)"
        return False, ""

    return _retry_loop(
        provider_label="Gemini",
        call_once=call_once,
        is_transient=is_transient,
        max_retries=max_retries,
    )
