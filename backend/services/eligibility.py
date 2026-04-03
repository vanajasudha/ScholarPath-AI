import pandas as pd
from pathlib import Path
from typing import Any, Dict, List

from services.scoring import score_scheme

DATA_PATH = Path(__file__).parent.parent / "data" / "Scholarship_data.csv"

# Text → integer class-level mapping
CLASS_TEXT_MAP: dict[str, int] = {
    "undergraduate": 13,
    "under graduate": 13,
    "ug": 13,
    "graduate": 13,
    "postgraduate": 14,
    "post graduate": 14,
    "pg": 14,
    "under and post graduate": 14,
    "under graduate and post graduate": 14,
    "phd": 15,
    "ph.d": 15,
    "doctorate": 15,
}


# ── helpers ──────────────────────────────────────────────────────────────────

def parse_class_level(val: Any) -> int | None:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None
    text = str(val).strip().lower()
    if text in ("", "nan"):
        return None
    if text in CLASS_TEXT_MAP:
        return CLASS_TEXT_MAP[text]
    try:
        return int(float(text))
    except (ValueError, TypeError):
        return None


def parse_benefit_amount(val: Any) -> float:
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return 0.0
    try:
        return float(str(val).replace(",", "").strip())
    except (ValueError, TypeError):
        return 0.0


def _category_matches(user_cat: str, scheme_cats: str) -> bool:
    if not scheme_cats or str(scheme_cats).strip().upper() in ("ALL", "NAN", ""):
        return True
    normalised = str(scheme_cats).replace("/", ",")
    cats = [c.strip().upper() for c in normalised.split(",") if c.strip()]
    return user_cat.strip().upper() in cats


def _state_matches(user_state: str, scheme_states: str) -> bool:
    if not scheme_states or str(scheme_states).strip().upper() in ("ALL", "ALL INDIA", "NAN", ""):
        return True
    states = [s.strip().lower() for s in str(scheme_states).split(",")]
    return user_state.strip().lower() in states


def _gender_matches(user_gender: str, scheme_gender: str) -> bool:
    if not scheme_gender or str(scheme_gender).strip().upper() in ("ALL", "ANY", "NAN", ""):
        return True
    return user_gender.strip().upper() == str(scheme_gender).strip().upper()


def _clean(scheme: dict) -> dict:
    """Replace NaN floats with None so the dict is JSON-serialisable."""
    return {
        k: (None if isinstance(v, float) and pd.isna(v) else v)
        for k, v in scheme.items()
    }


# ── main function ─────────────────────────────────────────────────────────────

def check_eligibility(
    income: float,
    category: str,
    state: str,
    class_level: int,
    gender: str,
    is_disabled: bool,
) -> List[Dict[str, Any]]:
    """
    Filter the CSV down to schemes the student is eligible for,
    score each one, attach the breakdown, and return sorted by
    match_score descending.
    """
    df = pd.read_csv(DATA_PATH, encoding="utf-8-sig")

    profile = {
        "income": income,
        "category": category,
        "state": state,
        "class_level": class_level,
        "gender": gender,
        "is_disabled": is_disabled,
    }

    eligible: List[Dict[str, Any]] = []

    for _, row in df.iterrows():
        scheme = row.to_dict()

        # ── Income ───────────────────────────────────────────────
        raw_income = scheme.get("max_annual_income", "")
        if raw_income and str(raw_income).strip() not in ("", "nan", "NaN", "NULL"):
            try:
                if income > float(str(raw_income).replace(",", "")):
                    continue
            except (ValueError, TypeError):
                pass

        # ── Category ─────────────────────────────────────────────
        if not _category_matches(category, scheme.get("eligible_categories", "ALL")):
            continue

        # ── State ─────────────────────────────────────────────────
        if not _state_matches(state, scheme.get("eligible_states", "ALL")):
            continue

        # ── Class level ───────────────────────────────────────────
        class_min = parse_class_level(scheme.get("class_min"))
        class_max = parse_class_level(scheme.get("class_max"))
        if class_min is not None and class_level < class_min:
            continue
        if class_max is not None and class_level > class_max:
            continue

        # ── Gender ────────────────────────────────────────────────
        if not _gender_matches(gender, scheme.get("gender", "ALL")):
            continue

        # ── Disability ────────────────────────────────────────────
        if str(scheme.get("disability_required", "No")).strip().lower() == "yes" and not is_disabled:
            continue

        # ── Score & attach ────────────────────────────────────────
        clean = _clean(scheme)
        clean.update(score_scheme(clean, profile))   # adds match_score + breakdown
        eligible.append(clean)

    # Sort best match first
    eligible.sort(key=lambda s: s["match_score"], reverse=True)
    return eligible
