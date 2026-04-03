"""
groq_service.py — ScholarPath AI
Always returns {"guidance": {...}, "raw_response": "..."}
Never raises. Falls back to hard-coded data if Groq fails for any reason.
"""

import json
import os
import re

from dotenv import load_dotenv
from groq import Groq

load_dotenv()

_client: Groq | None = None

# ── Canonical empty structure ────────────────────────────────────────────────
EMPTY_GUIDANCE: dict = {
    "best_strategy":      [],
    "why_you_qualify":    [],
    "documents_to_prepare": [],
    "important_tips":     [],
}


# ── Groq client ──────────────────────────────────────────────────────────────
def get_client() -> Groq:
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY", "").strip()
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set in the environment.")
        _client = Groq(api_key=api_key)
    return _client


# ── Helpers ──────────────────────────────────────────────────────────────────
def _class_label(level: int) -> str:
    labels = {13: "Undergraduate", 14: "Postgraduate", 15: "PhD"}
    return labels.get(level, f"Class {level}")


def _strip_fences(text: str) -> str:
    """Strip markdown code fences (```json … ```)."""
    text = re.sub(r"```(?:json|JSON)?\s*", "", text)
    text = re.sub(r"```", "", text)
    return text.strip()


def _find_json_object(text: str) -> str | None:
    """
    Use balanced-brace counting to extract the first complete {...} object.
    More reliable than a greedy regex when there is trailing text.
    """
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    for i, ch in enumerate(text[start:], start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start : i + 1]
    return None


def _extract_json(text: str) -> dict | None:
    """
    Try every possible strategy to get a dict out of whatever Groq returned.
    Returns None only if nothing works.
    """
    candidates = [
        text,                  # Strategy 1: raw text
        _strip_fences(text),   # Strategy 2: strip markdown fences
    ]

    for candidate in candidates:
        # Direct parse
        try:
            obj = json.loads(candidate)
            if isinstance(obj, dict):
                print(f"[groq_service]   JSON extracted via direct parse")
                return obj
        except json.JSONDecodeError:
            pass

        # Balanced-brace extraction
        fragment = _find_json_object(candidate)
        if fragment:
            try:
                obj = json.loads(fragment)
                if isinstance(obj, dict):
                    print(f"[groq_service]   JSON extracted via brace-counting")
                    return obj
            except json.JSONDecodeError:
                pass

        # Greedy regex fallback
        m = re.search(r"\{[\s\S]*\}", candidate)
        if m:
            try:
                obj = json.loads(m.group())
                if isinstance(obj, dict):
                    print(f"[groq_service]   JSON extracted via greedy regex")
                    return obj
            except json.JSONDecodeError:
                pass

    print(f"[groq_service]   All JSON extraction strategies failed")
    return None


def _unwrap(d: dict) -> dict:
    """
    If the model returned {"guidance": {...actual data...}} or similar
    single-key wrapper, unwrap it.
    """
    WRAPPERS = {"guidance", "response", "result", "data", "output", "answer", "advice"}
    if len(d) == 1:
        key = next(iter(d))
        if key in WRAPPERS and isinstance(d[key], dict):
            print(f"[groq_service]   Unwrapped single-key wrapper: '{key}'")
            return d[key]
    return d


def _to_str_list(val) -> list:
    """Convert any value to a list of non-empty strings."""
    if isinstance(val, list):
        return [str(x).strip() for x in val if x and str(x).strip()]
    if isinstance(val, str) and val.strip():
        return [val.strip()]
    if isinstance(val, dict):
        # Some models return {"1": "...", "2": "..."} instead of an array
        return [str(v).strip() for v in val.values() if v and str(v).strip()]
    return []


def _normalise_guidance(d: dict) -> dict:
    """
    Map every plausible alias key to the canonical 4-key structure.
    Returns a dict with 4 keys, each value a list[str] (may be empty).
    """
    def pick(*aliases):
        for a in aliases:
            v = d.get(a)
            if v is not None:
                return v
            # case-insensitive fallback
            for k in d:
                if k.lower() == a.lower():
                    return d[k]
        return []

    return {
        "best_strategy": _to_str_list(pick(
            "best_strategy", "bestStrategy", "strategy",
            "apply_order", "applyOrder", "schemes_to_apply",
            "top_schemes", "recommended_schemes",
        )),
        "why_you_qualify": _to_str_list(pick(
            "why_you_qualify", "whyYouQualify", "why_qualify",
            "eligibility_reasons", "eligibility", "qualify",
            "reasons", "qualification_reasons",
        )),
        "documents_to_prepare": _to_str_list(pick(
            "documents_to_prepare", "documentsToPrepare",
            "documents", "docs", "document_checklist",
            "required_documents", "documents_required",
        )),
        "important_tips": _to_str_list(pick(
            "important_tips", "importantTips", "tips",
            "suggestions", "advice", "key_tips", "pro_tips",
        )),
    }


def _has_content(g: dict) -> bool:
    """True only if at least one canonical key has a non-empty list."""
    return any(isinstance(g.get(k), list) and len(g[k]) > 0 for k in EMPTY_GUIDANCE)


def _hard_fallback(user_profile: dict, top_schemes: list, level_label: str) -> dict:
    """
    Always-populated fallback based on the user's own profile data.
    This is returned whenever Groq fails or returns unusable output.
    """
    s1 = top_schemes[0].get("scheme_name", "Top Matched Scheme") if top_schemes else "Top Matched Scheme"
    s2 = top_schemes[1].get("scheme_name", "Second Matched Scheme") if len(top_schemes) > 1 else "Second Matched Scheme"
    cat    = user_profile.get("category", "your category")
    income = user_profile.get("income", 0)
    state  = user_profile.get("state", "your state")

    return {
        "best_strategy": [
            f"{s1} — highest match score for your income and {cat} category",
            f"{s2} — strong benefit with accessible eligibility criteria",
        ],
        "why_you_qualify": [
            f"Your {cat} category is listed in eligible categories for these schemes.",
            f"Family income of Rs {int(income):,} is within the required ceiling.",
            f"Your {level_label} education level matches the supported range.",
            f"Residents of {state} are eligible for these schemes.",
        ],
        "documents_to_prepare": [
            "Income Certificate issued by Tehsildar or SDM",
            "Caste / Category Certificate from competent authority",
            "Latest academic marksheet or bonafide certificate",
            "Aadhaar Card (self-attested copy)",
            "Bank passbook front page with IFSC code",
        ],
        "important_tips": [
            "Apply on scholarships.gov.in for all Central Government schemes.",
            "Check the deadline month carefully — apply at least 2 weeks early.",
            "Keep scanned documents under 200 KB each for smooth submission.",
        ],
    }


# ── Public API ────────────────────────────────────────────────────────────────
def generate_advice(user_profile: dict, eligible_schemes: list) -> dict:
    """
    Returns:
        {
            "guidance": {
                "best_strategy":       [...],
                "why_you_qualify":     [...],
                "documents_to_prepare":[...],
                "important_tips":      [...],
            },
            "raw_response": "<raw Groq text or error string>",
        }

    Never raises — always returns usable data.
    """
    level_label = _class_label(user_profile.get("class_level", 0))
    top_schemes  = eligible_schemes[:8]

    schemes_text = "\n".join(
        f"  {i+1}. {s.get('scheme_name', 'Unknown')} | "
        f"benefit Rs {s.get('benefit_amount', 'N/A')} | "
        f"deadline {s.get('deadline_month', 'N/A')}"
        for i, s in enumerate(top_schemes)
    )

    user_data = (
        f"Income: Rs {int(user_profile.get('income', 0)):,}/year | "
        f"Category: {user_profile.get('category', 'N/A')} | "
        f"State: {user_profile.get('state', 'N/A')} | "
        f"Level: {level_label} | "
        f"Gender: {user_profile.get('gender', 'N/A')} | "
        f"PwD: {'Yes' if user_profile.get('is_disabled') else 'No'}"
    )

    prompt = f"""You are an AI financial advisor helping Indian students find scholarships.

Return ONLY a valid JSON object. No markdown. No code fences. No text before or after the JSON.

The JSON must have exactly these 4 keys with non-empty string arrays:

{{
  "best_strategy": [
    "Scheme Name 1 - one sentence reason why to apply first",
    "Scheme Name 2 - one sentence reason why to apply second",
    "Scheme Name 3 - one sentence reason why to apply third"
  ],
  "why_you_qualify": [
    "Reason 1 referencing income or category",
    "Reason 2 referencing state or education level",
    "Reason 3 referencing another eligibility factor"
  ],
  "documents_to_prepare": [
    "Income Certificate issued by Tehsildar",
    "Caste Certificate from competent authority",
    "Latest marksheet or bonafide certificate",
    "Aadhaar Card self-attested copy",
    "Bank passbook front page with IFSC"
  ],
  "important_tips": [
    "Actionable tip about deadlines or portal",
    "Actionable tip about application process",
    "Actionable tip about documents or approval"
  ]
}}

User Profile: {user_data}

Eligible Schemes (use real names in best_strategy):
{schemes_text}

IMPORTANT: Output raw JSON only. Every array must have at least 2 items. Strings must be under 20 words."""

    raw = ""
    try:
        print(f"\n[groq_service] Calling Groq API...")
        client = get_client()
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=900,
            temperature=0.2,
            response_format={"type": "json_object"},
        )
        raw = (response.choices[0].message.content or "").strip()
        print(f"[groq_service] RAW RESPONSE ({len(raw)} chars):\n{raw[:500]}")
        print("=" * 60)
        print(f"[groq_service] First 50 chars repr: {repr(raw[:50])}")

        # ── Parse the response ──────────────────────────────────────
        parsed = _extract_json(raw)
        if parsed is None:
            print(f"[groq_service] Could not extract JSON → using hard fallback")
        else:
            unwrapped = _unwrap(parsed)
            guidance  = _normalise_guidance(unwrapped)
            print(f"[groq_service] Normalised guidance:")
            for k, v in guidance.items():
                print(f"  {k}: {len(v)} items → {v[:1]}")

            if _has_content(guidance):
                print(f"[groq_service] ✓ Guidance has content — returning to caller")
                return {"guidance": guidance, "raw_response": raw}
            else:
                print(f"[groq_service] All arrays empty after normalisation → using hard fallback")

    except Exception as exc:
        raw = str(exc)
        print(f"[groq_service] ✗ Exception during Groq call: {exc}")

    # ── Hard fallback ────────────────────────────────────────────────
    fallback = _hard_fallback(user_profile, top_schemes, level_label)
    print(f"[groq_service] Returning HARD FALLBACK guidance")
    for k, v in fallback.items():
        print(f"  {k}: {len(v)} items")
    return {"guidance": fallback, "raw_response": raw}


def generate_letter(user_profile: dict, selected_scheme: dict) -> str:
    client = get_client()
    level_label = _class_label(user_profile.get("class_level", 0))

    prompt = f"""You are ScholarPath AI. Write a formal scholarship application letter.

Student Details:
  Annual Family Income : Rs {int(user_profile.get('income', 0)):,}
  Category            : {user_profile.get('category', 'N/A')}
  State               : {user_profile.get('state', 'N/A')}
  Current Level       : {level_label}
  Gender              : {user_profile.get('gender', 'N/A')}
  Has Disability      : {'Yes' if user_profile.get('is_disabled') else 'No'}

Scholarship Details:
  Scheme Name    : {selected_scheme.get('scheme_name', 'N/A')}
  Provider       : {selected_scheme.get('provider_name', 'N/A')}
  Benefit Type   : {selected_scheme.get('benefit_type', 'N/A')}
  Benefit Amount : Rs {selected_scheme.get('benefit_amount', 'N/A')}
  Description    : {selected_scheme.get('description', 'N/A')}

Write a professional formal application letter (300-400 words) with:
1. Date, Address, Subject line
2. Introduction of the student and academic level
3. Purpose — applying for this specific scholarship
4. Eligibility highlights based on profile
5. Financial need explanation
6. Polite closing request

Use placeholders [Student Name], [Institution Name], [Date] for personal details."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1000,
        temperature=0.6,
    )
    return response.choices[0].message.content
