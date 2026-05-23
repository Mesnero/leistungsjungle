"""Download + Text-Extraktion mit Seiten-Markern fürs LLM.

Die `--- Seite N ---`-Marker im extrahierten Text sind essenziell:
Sowohl OpenAI als auch Gemini lesen sie um die `pdf_page` pro Leistung
zu bestimmen — siehe Schema-Feld `pdf_page` in backend/schema.json.
"""
from __future__ import annotations

from pathlib import Path

import fitz  # PyMuPDF
import httpx


def download_pdf(url: str, target: Path) -> None:
    """Lädt PDF mit Browser-User-Agent (manche Hoster blocken Default-httpx)."""
    target.parent.mkdir(parents=True, exist_ok=True)
    headers = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        ),
        "Accept": "application/pdf,*/*",
    }
    with httpx.Client(follow_redirects=True, timeout=90, headers=headers) as client:
        resp = client.get(url)
        resp.raise_for_status()
        target.write_bytes(resp.content)


def extract_text_with_pages(pdf_path: Path) -> str:
    """Extrahiert PDF-Text mit '--- Seite N ---'-Markern dazwischen.

    Das LLM nutzt diese Marker um die `pdf_page` pro Leistung zu bestimmen.
    """
    doc = fitz.open(pdf_path)
    parts: list[str] = []
    for i, page in enumerate(doc, start=1):
        text = page.get_text()
        parts.append(f"\n\n--- Seite {i} ---\n\n{text}")
    doc.close()
    return "".join(parts).strip()
