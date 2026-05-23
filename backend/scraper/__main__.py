"""CLI fürs Scraping.

Flow:
    1. Discovery: krankenkassen.de Satzungs-Index scrapen
    2. Diff gegen _state.json (welche Satzungen sind neuer als zuletzt?)
    3. LLM-Extraktion nur für Änderungen (oder alle bei --force)
    4. State updaten nach jedem erfolgreichen Scrape

Default-Provider: OpenAI gpt-5.4-mini. Override mit --provider / --model.

Beispiele:
    python -m scraper                               # discover + nur Änderungen
    python -m scraper --force                       # alle re-extrahieren
    python -m scraper --slug barmer                 # nur BARMER (immer scrapen)
    python -m scraper --discover-only               # Discovery anzeigen, sonst nichts
    python -m scraper --limit 5                     # ersten 5 (Test/Kosten-Cap)
    python -m scraper --provider gemini             # Gemini statt OpenAI
    python -m scraper --skip-fetch                  # gecachtes PDF nutzen
    python -m scraper --dry-run                     # ohne LLM-Call
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from pathlib import Path

from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent.parent   # backend/
load_dotenv(HERE / ".env")

OUTPUT_DIR = HERE / "scraped_krankenkassen"
CACHE_DIR = HERE / "scraper" / "cache"


def scrape_one(
    *,
    name: str,
    slug: str,
    pdf_url: str,
    api_key: str,
    provider: str,
    model: str | None,
    skip_fetch: bool,
    dry_run: bool,
) -> bool:
    """Lädt PDF + LLM-Extrakt + schreibt JSON. Return: True bei Erfolg."""
    # Imports lazy damit `--help` schnell bleibt
    from scraper.fetch import download_pdf, extract_text_with_pages

    print(f"\n=== {name} ({slug}) ===")

    pdf_path = CACHE_DIR / f"{slug}.pdf"
    if skip_fetch and pdf_path.exists():
        print(f"  [cache] {pdf_path.name}")
    else:
        print(f"  [fetch] {pdf_url}")
        try:
            download_pdf(pdf_url, pdf_path)
        except Exception as e:
            print(f"  [FAIL] PDF-Download: {e}")
            return False

    try:
        text = extract_text_with_pages(pdf_path)
    except Exception as e:
        print(f"  [FAIL] PDF-Text-Extraktion: {e}")
        return False
    print(f"  [pdf ] {len(text):,} chars in {text.count('--- Seite ')} Seiten")

    if dry_run:
        print("  [skip] dry-run, kein LLM-Call")
        return True

    print(f"  [LLM ] {provider} ({model or 'default'})")
    from scraper.extract import scrape_pdf_to_json

    source = {"name": name, "slug": slug, "satzung_pdf_url": pdf_url}
    try:
        data = scrape_pdf_to_json(
            source=source,
            text=text,
            api_key=api_key,
            provider=provider,
            model=model,
        )
    except Exception as e:
        print(f"  [FAIL] {provider}: {e}")
        return False

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / f"{slug}_data.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

    n_satz = len(data.get("satzungsleistungen") or [])
    n_bonus = len(data.get("bonus_massnahmen") or [])
    has_meta = "ja" if data.get("bonusprogramm_meta") else "nein"
    print(f"  [save] {out_path.name} ({n_satz} Satzung + {n_bonus} Bonus, Programm-Meta: {has_meta})")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Krankenkassen-Scraper — Discovery -> Diff -> LLM-Extraktion.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument("--slug", help="Nur diese KK scrapen (überschreibt Diff)")
    parser.add_argument("--force", action="store_true",
                        help="Alle re-extrahieren, State ignorieren")
    parser.add_argument("--discover-only", action="store_true",
                        help="Nur Discovery anzeigen, kein PDF/LLM")
    parser.add_argument("--limit", type=int, default=0,
                        help="Maximal N KKs scrapen (Test/Kosten-Cap)")
    parser.add_argument("--provider", choices=["gemini", "openai"], default="openai",
                        help="LLM-Provider (default: openai)")
    parser.add_argument("--model", default=None,
                        help="Override Modell. Default: gpt-5.4-mini bzw. gemini-2.5-flash")
    parser.add_argument("--skip-fetch", action="store_true",
                        help="Cachertes PDF nutzen statt neu downloaden")
    parser.add_argument("--dry-run", action="store_true",
                        help="Nur Download + Text-Extract, kein LLM-Call")
    parser.add_argument("--delay", type=int, default=3,
                        help="Sekunden Pause zwischen KKs (default: 3, gegen Rate-Limits)")
    args = parser.parse_args()

    # ─── Discovery ──────────────────────────────────────────────────
    from scraper.discover import discover_krankenkassen

    print("[discover] krankenkassen.de Satzungs-Index laden ...")
    try:
        discovered = discover_krankenkassen()
    except Exception as e:
        sys.exit(f"[FAIL] Discovery: {e}")
    print(f"[discover] {len(discovered)} Krankenkassen gefunden")

    if args.discover_only:
        for kk in discovered:
            date_str = kk.satzung_date.isoformat() if kk.satzung_date else "—"
            print(f"  {kk.slug:42s}  {date_str}  {kk.satzung_pdf_url}")
        return

    # ─── Filter via --slug ──────────────────────────────────────────
    if args.slug:
        match = [kk for kk in discovered if kk.slug == args.slug]
        if not match:
            available = ", ".join(kk.slug for kk in discovered[:20])
            sys.exit(
                f"Slug '{args.slug}' nicht in Discovery.\n"
                f"Beispiele: {available}...\n"
                f"Tipp: `python -m scraper --discover-only` für volle Liste."
            )
        discovered = match
        force = True   # explizit gewählter Slug -> immer scrapen
    else:
        force = args.force

    # ─── State-Diff ─────────────────────────────────────────────────
    from scraper.state import load_state, save_state, needs_refresh, record_scrape

    state = load_state()
    if force:
        to_scrape = list(discovered)
        skipped: list = []
    else:
        to_scrape = []
        skipped = []
        for kk in discovered:
            if needs_refresh(state, kk.slug, kk.satzung_date, kk.satzung_pdf_url):
                to_scrape.append(kk)
            else:
                skipped.append(kk)

    print(f"[diff] {len(to_scrape)} zu scrapen, {len(skipped)} unverändert")

    if args.limit > 0 and len(to_scrape) > args.limit:
        print(f"[diff] limit={args.limit} -> {len(to_scrape) - args.limit} verschoben")
        to_scrape = to_scrape[: args.limit]

    if not to_scrape:
        print("[done] Nichts zu tun. State ist aktuell.")
        return

    # ─── API-Key prüfen ─────────────────────────────────────────────
    if args.provider == "gemini":
        api_key = os.environ.get("GEMINI_API_KEY")
        key_name = "GEMINI_API_KEY"
    else:
        api_key = os.environ.get("OPENAI_API_KEY")
        key_name = "OPENAI_API_KEY"
    if not api_key and not args.dry_run:
        sys.exit(f"{key_name} fehlt in backend/.env (oder --dry-run nutzen)")

    print(
        f"[run ] provider={args.provider}, modell={args.model or 'default'}, "
        f"dry-run={args.dry_run}, delay={args.delay}s"
    )

    # ─── Scrape Loop ────────────────────────────────────────────────
    ok = 0
    fail = 0
    for i, kk in enumerate(to_scrape):
        success = scrape_one(
            name=kk.name,
            slug=kk.slug,
            pdf_url=kk.satzung_pdf_url,
            api_key=api_key or "",
            provider=args.provider,
            model=args.model,
            skip_fetch=args.skip_fetch,
            dry_run=args.dry_run,
        )
        if success:
            ok += 1
            if not args.dry_run:
                # State erst nach echtem Scrape mitschreiben.
                record_scrape(
                    state,
                    slug=kk.slug,
                    name=kk.name,
                    satzung_date=kk.satzung_date,
                    satzung_pdf_url=kk.satzung_pdf_url,
                    provider=args.provider,
                    model=args.model,
                )
                save_state(state)   # incremental -> Crash-safe
        else:
            fail += 1
        if i < len(to_scrape) - 1 and args.delay > 0:
            time.sleep(args.delay)

    print(f"\nFertig: {ok} ok, {fail} fail (von {len(to_scrape)} versucht)")
    sys.exit(0 if fail == 0 else 1)


if __name__ == "__main__":
    main()
