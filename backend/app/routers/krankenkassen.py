import re
from pathlib import Path

from fastapi import APIRouter

from app.data import all_krankenkassen
from app.schemas import KrankenkasseSummary


router = APIRouter(prefix="/krankenkassen", tags=["krankenkassen"])

# Logos liegen in backend/Logos/ als SVG. Filename leitet sich aus dem
# Display-Name nach exakt der Sanitization-Regel aus logos.py ab:
#   "/" → "_", "&" → "und", " " → "_", Windows-illegale Zeichen weg.
LOGOS_DIR = Path(__file__).resolve().parent.parent.parent / "Logos"
_ILLEGAL = re.compile(r'[\\/*?:"<>|]')


def _logo_filename(name: str) -> str:
    safe = name.replace("/", "_").replace("&", "und").replace(" ", "_")
    return _ILLEGAL.sub("", safe) + ".svg"


def _logo_url(name: str) -> str | None:
    """Gibt /logos/<file>.svg zurück wenn die SVG existiert, sonst None."""
    if not name:
        return None
    fname = _logo_filename(name)
    if (LOGOS_DIR / fname).exists():
        return f"/logos/{fname}"
    return None


@router.get("", response_model=list[KrankenkasseSummary])
def list_krankenkassen() -> list[KrankenkasseSummary]:
    out: list[KrankenkasseSummary] = []
    for payload in all_krankenkassen():
        kk = payload.get("krankenkasse") or {}
        name = kk.get("name", "")
        bonus_meta = payload.get("bonusprogramm_meta")
        out.append(
            KrankenkasseSummary(
                slug=kk.get("slug", ""),
                name=name,
                website=kk.get("website"),
                satzung_stand=kk.get("satzung_stand"),
                hat_bonusprogramm=bool(bonus_meta and bonus_meta.get("programm_name")),
                anzahl_satzungsleistungen=len(payload.get("satzungsleistungen", [])),
                anzahl_bonus_massnahmen=len(payload.get("bonus_massnahmen", [])),
                logo_url=_logo_url(name),
            )
        )
    out.sort(key=lambda x: x.name)
    return out
