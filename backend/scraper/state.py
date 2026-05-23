"""State-File: was wurde wann gescrapet mit welchem Datum.

Pro Slug speichern wir Satzungs-Datum + URL + Scrape-Timestamp.
Bei der nächsten Discovery prüft `needs_refresh`, ob neu extrahiert werden muss.

State liegt unter `backend/scraped_krankenkassen/_state.json` (führendes `_`
damit `data.py` ihn beim Glob skippt). Wird mit ins Repo committet, damit
CI/Cron weiß was schon erledigt ist.
"""
from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

HERE = Path(__file__).resolve().parent.parent  # backend/
STATE_FILE = HERE / "scraped_krankenkassen" / "_state.json"


def load_state() -> dict[str, dict[str, Any]]:
    """Liest das State-File. Bei Fehler oder fehlend: leeres Dict."""
    if not STATE_FILE.exists():
        return {}
    try:
        with STATE_FILE.open(encoding="utf-8") as f:
            data = json.load(f)
        kks = data.get("krankenkassen")
        return kks if isinstance(kks, dict) else {}
    except Exception as e:
        print(f"[WARN] _state.json korrupt, starte neu: {e}")
        return {}


def save_state(state: dict[str, dict[str, Any]]) -> None:
    STATE_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "version": 1,
        "updated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "krankenkassen": state,
    }
    with STATE_FILE.open("w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2, sort_keys=True)


def needs_refresh(
    state: dict[str, dict[str, Any]],
    slug: str,
    discovered_date: date | None,
    discovered_url: str,
) -> bool:
    """Soll diese KK neu gescrapet werden?

    Regeln (kurzgeschlossen in dieser Reihenfolge):
        1. Keine Entry im State → ja (Erst-Scrape)
        2. PDF-URL hat sich geändert → ja (definitiv neues PDF)
        3. Stand-Datum ist neuer als gespeichert → ja
        4. Sonst nein
    """
    entry = state.get(slug)
    if not entry:
        return True
    if entry.get("satzung_pdf_url") != discovered_url:
        return True
    if discovered_date is None:
        # Datum unbekannt → wir trauen der URL-Gleichheit, kein Refresh
        return False
    last_str = entry.get("satzung_date")
    if not last_str:
        return True
    return discovered_date.isoformat() > last_str


def record_scrape(
    state: dict[str, dict[str, Any]],
    *,
    slug: str,
    name: str,
    satzung_date: date | None,
    satzung_pdf_url: str,
    provider: str,
    model: str | None,
) -> None:
    """State in-place updaten nach erfolgreichem Scrape."""
    state[slug] = {
        "name": name,
        "satzung_date": satzung_date.isoformat() if satzung_date else None,
        "satzung_pdf_url": satzung_pdf_url,
        "last_scraped": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "provider": provider,
        "model": model,
    }
