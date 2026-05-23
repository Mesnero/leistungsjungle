"""Filtered Benefits-Endpoint.

Match-Logik:
- Eine Leistung ohne `eligibility_rules` matcht alle (Fallback).
- Mit Rules: mindestens eine Rule muss matchen (OR-Verknüpfung).
- Pro Rule müssen ALLE Constraints gleichzeitig erfüllt sein.
"""
from typing import Any, Literal

from fastapi import APIRouter, HTTPException, Query

from app.data import get_krankenkasse
from app.schemas import BenefitsResponse


router = APIRouter(prefix="/benefits", tags=["benefits"])

# Frontend nutzt 'f/m/d' — JSON nutzt 'ALL/W/M/D' (siehe schema.json).
_GENDER_MAP: dict[str, str] = {"f": "W", "m": "M", "d": "D"}


def _rule_matches(
    rule: dict[str, Any],
    *,
    age: int,
    geschlecht: str,
    pregnant: bool,
    has_children: bool,
) -> bool:
    if not (rule.get("alter_min", 0) <= age <= rule.get("alter_max", 150)):
        return False
    rg = rule.get("geschlecht", "ALL")
    if rg != "ALL" and rg != geschlecht:
        return False
    if rule.get("requires_pregnancy") and not pregnant:
        return False
    if rule.get("requires_children") and not has_children:
        return False
    return True


def _leistung_matches(
    leistung: dict[str, Any],
    *,
    age: int,
    geschlecht: str,
    pregnant: bool,
    has_children: bool,
) -> bool:
    rules = leistung.get("eligibility_rules") or []
    if not rules:
        return True  # ohne Regeln → matcht alle
    return any(
        _rule_matches(r, age=age, geschlecht=geschlecht, pregnant=pregnant, has_children=has_children)
        for r in rules
    )


@router.get("", response_model=BenefitsResponse)
def list_benefits(
    slug: str = Query(..., description="Krankenkassen-Slug (siehe /krankenkassen)"),
    age: int = Query(..., ge=0, le=150),
    gender: Literal["m", "f", "d"] = Query(...),
    pregnant: bool = Query(False),
    has_children: bool = Query(False),
):
    payload = get_krankenkasse(slug)
    if not payload:
        raise HTTPException(status_code=404, detail=f"Krankenkasse '{slug}' nicht gefunden")

    filter_kwargs = {
        "age": age,
        "geschlecht": _GENDER_MAP[gender],
        "pregnant": pregnant,
        "has_children": has_children,
    }

    satz = [l for l in payload.get("satzungsleistungen") or [] if _leistung_matches(l, **filter_kwargs)]
    bonus = [l for l in payload.get("bonus_massnahmen") or [] if _leistung_matches(l, **filter_kwargs)]

    kk = payload.get("krankenkasse") or {}
    return BenefitsResponse(
        krankenkasse={
            "slug": kk.get("slug", slug),
            "name": kk.get("name", ""),
            "website": kk.get("website"),
            "satzung_stand": kk.get("satzung_stand"),
        },
        satzungsleistungen=satz,
        bonus_massnahmen=bonus,
        bonusprogramm_meta=payload.get("bonusprogramm_meta"),
    )
