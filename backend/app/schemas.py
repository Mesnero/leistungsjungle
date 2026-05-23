"""Pydantic-Schemas für API-Responses.

Form spiegelt 1:1 die JSON-Struktur aus backend/scraped_krankenkassen/*.json
(siehe backend/schema.json).
"""
from typing import Literal

from pydantic import BaseModel

Geschlecht = Literal["ALL", "W", "M", "D"]


# ─── Krankenkassen-Liste (für Onboarding-Dropdown) ───────────────────


class KrankenkasseSummary(BaseModel):
    slug: str
    name: str
    website: str | None = None
    satzung_stand: str | None = None
    hat_bonusprogramm: bool
    anzahl_satzungsleistungen: int
    anzahl_bonus_massnahmen: int
    logo_url: str | None = None


# ─── Benefits-Response ───────────────────────────────────────────────


class ErstattungsLogik(BaseModel):
    typ: str
    wert: float | None = None
    waehrung: str | None = None
    turnus: str | None = None


class EligibilityRule(BaseModel):
    alter_min: int
    alter_max: int
    geschlecht: Geschlecht
    requires_pregnancy: bool = False
    requires_children: bool = False
    zusatz_voraussetzung: str | None = None


class Leistung(BaseModel):
    name: str
    kategorie: str | None = None
    beschreibung: str
    pdf_page: int | None = None
    erstattungs_logik: ErstattungsLogik | None = None
    eligibility_rules: list[EligibilityRule] = []


class KrankenkasseMeta(BaseModel):
    slug: str
    name: str
    website: str | None = None
    satzung_stand: str | None = None


class BonusprogrammMeta(BaseModel):
    programm_name: str | None = None
    beschreibung: str | None = None
    waehrung: str | None = None
    wechselkurs_cash: float | None = None
    wechselkurs_gesundheitskonto: float | None = None
    hinweis: str | None = None


class BenefitsResponse(BaseModel):
    """Komplettes Filter-Resultat für eine KK + Person-Kontext."""

    krankenkasse: KrankenkasseMeta
    satzungsleistungen: list[Leistung]
    bonus_massnahmen: list[Leistung]
    bonusprogramm_meta: BonusprogrammMeta | None = None
