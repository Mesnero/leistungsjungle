"""Discovery: krankenkassen.de Satzungs-Index scrapen.

Holt die Übersichts-Seite und extrahiert pro Krankenkasse:
    - Name
    - URL zur Satzungs-PDF (absolut)
    - Stand-Datum der Satzung (best effort)

Slug wird aus dem Namen abgeleitet (Legacy-kompatibel zu den existierenden
JSON-Filenamen). KKs ohne PDF-Link werden übersprungen.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import date
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup


INDEX_URL = (
    "https://www.krankenkassen.de/gesetzliche-krankenkassen/"
    "system-gesetzliche-krankenversicherung/satzungen/"
)
BASE_URL = "https://www.krankenkassen.de"

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)

_DATE_RE = re.compile(r"(\d{1,2})\.(\d{1,2})\.(\d{2,4})")


@dataclass
class DiscoveredKK:
    name: str
    slug: str
    satzung_pdf_url: str
    satzung_date: date | None  # None wenn nicht parsbar


def slugify(name: str) -> str:
    """Slug aus KK-Name — Legacy-kompatibel.

    Lowercase, alles außer [a-z0-9] → Underscore, getrimmt.
    Umlaute werden NICHT in ae/oe/ue umgewandelt (würde existierende
    Filenames wie `aok_baden_w_rttemberg_data.json` brechen).
    """
    return re.sub(r"[^a-z0-9]+", "_", name.lower()).strip("_")


def _parse_stand_date(text: str) -> date | None:
    """Findet das erste DD.MM.YYYY (oder DD.MM.YY) in `text`, mit Sanity-Check.

    Quelle hat Tippfehler wie „25.07.0025" (gemeint: 2025) und „30.11.-0001"
    (Parser-Müll). 2-stellige Jahre werden zu 2000+, einstellige rausgeworfen.
    """
    if not text:
        return None
    m = _DATE_RE.search(text)
    if not m:
        return None
    day, month, year = map(int, m.groups())
    if year < 10:
        return None  # garbage (z.B. „0001")
    if year < 100:
        year += 2000  # 2-stellige Notation → 20YY
    if year < 1990 or year > 2100:
        return None
    try:
        return date(year, month, day)
    except ValueError:
        return None


def discover_krankenkassen(*, timeout: int = 60) -> list[DiscoveredKK]:
    """Scrapt die Satzungs-Übersicht und gibt alle KKs zurück.

    Idempotent — ein HTTP-Request, keine Side-Effects.
    Bei doppelten Slugs (defensive) wird nur das erste Vorkommen behalten.
    """
    headers = {"User-Agent": USER_AGENT}
    with httpx.Client(follow_redirects=True, timeout=timeout, headers=headers) as client:
        resp = client.get(INDEX_URL)
        resp.raise_for_status()
        html = resp.text

    soup = BeautifulSoup(html, "html.parser")
    results: list[DiscoveredKK] = []
    seen: set[str] = set()

    for row in soup.find_all("tr"):
        # Name-Link verweist auf KK-Detailseite
        name_link = row.find("a", href=re.compile(r"/krankenkassen-liste/"))
        if name_link is None:
            continue
        name = name_link.get_text(strip=True)
        if not name:
            continue

        # PDF-Link — alles was auf .pdf endet (manchmal Suffix wie .crdownload)
        pdf_link = row.find("a", href=re.compile(r"\.pdf(\.crdownload)?$"))
        if pdf_link is None:
            continue
        href = (pdf_link.get("href") or "").strip()
        if not href:
            continue
        pdf_url = urljoin(BASE_URL, href)

        # Stand-Datum steckt in der letzten Cell — wir parsen den ganzen Row-Text
        satzung_date = _parse_stand_date(row.get_text(" ", strip=True))

        slug = slugify(name)
        if slug in seen:
            continue
        seen.add(slug)

        results.append(DiscoveredKK(
            name=name,
            slug=slug,
            satzung_pdf_url=pdf_url,
            satzung_date=satzung_date,
        ))

    return results
