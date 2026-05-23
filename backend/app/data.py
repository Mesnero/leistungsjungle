"""In-Memory-Loader für die gescrapten KK-JSONs.

Es gibt keine Datenbank — die ~17 JSONs werden beim FastAPI-Startup
in ein Dict geladen und in den Endpoints direkt gefiltert.

JSON-Format folgt backend/schema.json (LLM-Scraper-Output).
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

DATA_DIR = Path(__file__).resolve().parent.parent / "scraped_krankenkassen"

# Slug → komplettes JSON (parsed dict)
_DATA: dict[str, dict[str, Any]] = {}


def _dedup_key(leistung: dict[str, Any]) -> tuple:
    """Identitäts-Tupel für Dedup.

    Identisch heißt: gleicher Name, gleiche Seite, gleiche Erstattungs-Logik.
    Damit bleiben legitime Varianten (z.B. „Sportveranstaltung" für Kinder
    vs. Erwachsene auf verschiedenen Seiten/Wert-Tiers) erhalten,
    während exakt verdoppelte Einträge gefiltert werden.
    """
    el = leistung.get("erstattungs_logik") or {}
    return (
        leistung.get("name", ""),
        leistung.get("pdf_page"),
        el.get("typ"),
        el.get("wert"),
        el.get("waehrung"),
        el.get("turnus"),
    )


def _dedup_leistungen(items: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    """Filter exakte Duplikate, hält die erste Occurrence. Returnt (gefiltert, anzahl_dropped)."""
    seen: set[tuple] = set()
    out: list[dict[str, Any]] = []
    for l in items:
        k = _dedup_key(l)
        if k in seen:
            continue
        seen.add(k)
        out.append(l)
    return out, len(items) - len(out)


def load_all() -> None:
    """Liest alle *.json Files in scraped_krankenkassen/ ein.
    Filtert dabei exakte Leistungs-Duplikate (Scraper-Artefakt).
    Idempotent — kann mehrfach aufgerufen werden zum Reloaden.
    """
    global _DATA
    _DATA = {}
    if not DATA_DIR.exists():
        print(f"[WARN] Datenordner fehlt: {DATA_DIR}")
        return

    total_dropped = 0
    for path in sorted(DATA_DIR.glob("*.json")):
        # Internes State-File des Scrapers überspringen
        if path.name.startswith(("_", ".")):
            continue
        try:
            with path.open(encoding="utf-8") as f:
                payload = json.load(f)
        except Exception as e:
            print(f"[WARN] Skip {path.name}: {e}")
            continue

        kk = payload.get("krankenkasse") or {}
        slug = kk.get("slug")
        if not slug:
            print(f"[WARN] Skip {path.name}: kein slug in krankenkasse-Block")
            continue

        # Dedup beider Listen
        payload["satzungsleistungen"], dropped_s = _dedup_leistungen(
            payload.get("satzungsleistungen") or []
        )
        payload["bonus_massnahmen"], dropped_b = _dedup_leistungen(
            payload.get("bonus_massnahmen") or []
        )
        dropped = dropped_s + dropped_b
        if dropped:
            print(f"[INFO] {slug}: {dropped} Duplikat(e) gefiltert "
                  f"({dropped_s} Satzung, {dropped_b} Bonus)")
        total_dropped += dropped

        _DATA[slug] = payload

    summary = f"[OK] {len(_DATA)} Krankenkassen geladen aus {DATA_DIR}"
    if total_dropped:
        summary += f" — {total_dropped} Duplikate gefiltert"
    print(summary)


def all_krankenkassen() -> list[dict[str, Any]]:
    """Alle KK-Daten (komplettes JSON) als Liste."""
    return list(_DATA.values())


def get_krankenkasse(slug: str) -> dict[str, Any] | None:
    """Komplette KK-Daten für einen slug, oder None."""
    return _DATA.get(slug)
