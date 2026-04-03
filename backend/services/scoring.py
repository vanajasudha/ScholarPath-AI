"""
Scoring system for ScholarPath AI.

Each eligible scheme receives a composite score (0–100) made up of
four independently capped components:

  Component            Weight   What it rewards
  ─────────────────────────────────────────────────────────────────
  benefit_score          40     Higher financial benefit
  specificity_score      30     Targeted category / state / PwD match
  income_buffer_score    15     More headroom below the income limit
  urgency_score          15     Closer deadline (act soon)
  ─────────────────────────────────────────────────────────────────
  match_score           100     Total
"""

import math
from datetime import date
from typing import Any

# Month name → number lookup
_MONTH_MAP: dict[str, int] = {
    "january": 1, "february": 2, "march": 3,    "april": 4,
    "may": 5,     "june": 6,     "july": 7,     "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12,
}

# Benefit amount treated as 100 % for normalisation (log scale ceiling)
_BENEFIT_CEILING = 500_000  # ₹5 lakh


# ── individual component scorers ─────────────────────────────────────────────

def _benefit_score(benefit_amount: Any, weight: int = 40) -> float:
    """
    Log-scaled score so smaller amounts still earn meaningful points.

    ₹ 1 000  →  ~10 pts
    ₹ 30 000 →  ~24 pts
    ₹ 1 00 000 → ~30 pts
    ₹ 5 00 000 → 40 pts  (ceiling)
    """
    try:
        amount = float(str(benefit_amount).replace(",", "").strip())
    except (ValueError, TypeError):
        return 0.0

    if amount <= 0:
        return 0.0

    ratio = math.log10(amount + 1) / math.log10(_BENEFIT_CEILING + 1)
    return round(min(ratio * weight, weight), 2)


def _specificity_score(scheme: dict, profile: dict, weight: int = 30) -> float:
    """
    Rewards schemes that are specifically targeted at the student's
    category, state, or disability status.  A targeted scheme means
    less competition and a higher approval likelihood.

      Category-specific match   15 pts
      State-specific match      10 pts
      PwD-specific match         5 pts
    """
    score = 0.0

    # Category
    raw_cats = str(scheme.get("eligible_categories", "ALL")).replace("/", ",").upper()
    cat_list = [c.strip() for c in raw_cats.split(",") if c.strip()]
    if "ALL" not in cat_list and profile["category"].upper() in cat_list:
        score += 15

    # State
    raw_states = str(scheme.get("eligible_states", "ALL")).strip().upper()
    if raw_states not in ("ALL", "ALL INDIA", "NAN", ""):
        score += 10  # state-specific → fewer applicants

    # Disability
    disability_req = str(scheme.get("disability_required", "No")).strip().lower()
    if disability_req == "yes" and profile.get("is_disabled"):
        score += 5

    return round(min(score, weight), 2)


def _income_buffer_score(scheme: dict, profile: dict, weight: int = 15) -> float:
    """
    The further the student's income is below the scheme's limit,
    the safer the application — rewarded with a higher score.

    No income limit listed → neutral bonus (60 % of weight).
    """
    raw = str(scheme.get("max_annual_income", "")).replace(",", "").strip()

    if not raw or raw.upper() in ("NULL", "NAN", ""):
        return round(weight * 0.6, 2)  # no limit → neutral

    try:
        limit = float(raw)
    except ValueError:
        return round(weight * 0.6, 2)

    if limit <= 0:
        return 0.0

    income = float(profile.get("income", 0))
    headroom = max((limit - income) / limit, 0.0)  # clamp to [0, 1]
    return round(headroom * weight, 2)


def _urgency_score(scheme: dict, weight: int = 15) -> float:
    """
    Deadlines arriving sooner score higher so they surface first,
    reminding the student to act quickly.

    0 months away (this month) → full weight
    6 months away              → ~half weight
    11 months away             → near-zero
    Unknown deadline           → low neutral score
    """
    month_str = str(scheme.get("deadline_month", "")).strip().lower()
    month_num = _MONTH_MAP.get(month_str)

    if month_num is None:
        return round(weight * 0.3, 2)  # unknown → low neutral

    current_month = date.today().month
    months_away = (month_num - current_month) % 12  # 0..11

    # Linear decay: 0 away → 1.0, 11 away → ~0.08
    ratio = 1.0 - (months_away / 12)
    return round(max(ratio * weight, 1.0), 2)  # always at least 1 pt


# ── public API ───────────────────────────────────────────────────────────────

def score_scheme(scheme: dict, profile: dict) -> dict:
    """
    Return a score breakdown dict for one scheme.

    Keys
    ────
    benefit_score        float  0–40
    specificity_score    float  0–30
    income_buffer_score  float  0–15
    urgency_score        float  0–15
    match_score          float  0–100  (sum of above)
    """
    b = _benefit_score(scheme.get("benefit_amount"))
    s = _specificity_score(scheme, profile)
    i = _income_buffer_score(scheme, profile)
    u = _urgency_score(scheme)

    return {
        "benefit_score":       b,
        "specificity_score":   s,
        "income_buffer_score": i,
        "urgency_score":       u,
        "match_score":         round(b + s + i + u, 2),
    }
