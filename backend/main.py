from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from models import (
    AdviceRequest,
    AdviceResponse,
    EligibilityRequest,
    EligibilityResponse,
    LetterRequest,
    LetterResponse,
)
from services.eligibility import check_eligibility, parse_benefit_amount
from services.groq_service import EMPTY_GUIDANCE, generate_advice, generate_letter

load_dotenv()

app = FastAPI(
    title="ScholarPath AI API",
    description="AI-powered scholarship eligibility and guidance system",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health check ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "ScholarPath AI API is running", "version": "1.0.0"}


# ── DEBUG: hardcoded guidance — use this to confirm frontend renders correctly
@app.get("/debug-guidance")
async def debug_guidance():
    """
    Call this from the browser: http://localhost:8000/debug-guidance
    If the frontend can render this, the issue is in Groq/parsing, not rendering.
    """
    return {
        "guidance": {
            "best_strategy": [
                "PM Scholarship Scheme - highest benefit of Rs 1.2L with broad eligibility",
                "State Merit Scholarship - fast processing, deadline in March",
                "NSP Central Sector Scholarship - reliable Central Govt disbursement",
            ],
            "why_you_qualify": [
                "Your OBC category is listed in eligible categories for all matched schemes.",
                "Family income of Rs 1,50,000 is well within the Rs 2,50,000 income ceiling.",
                "Undergraduate level matches the Class 12 to UG range supported by these schemes.",
                "Residents of Maharashtra are eligible for all state and central schemes shown.",
            ],
            "documents_to_prepare": [
                "Income Certificate issued by Tehsildar or SDM",
                "OBC / Caste Certificate from competent authority",
                "Latest marksheet or bonafide certificate from institution",
                "Aadhaar Card (self-attested copy)",
                "Bank passbook front page with IFSC code",
            ],
            "important_tips": [
                "Apply on scholarships.gov.in for all Central Government schemes before October.",
                "Renewal applications must be submitted every year — set a calendar reminder.",
                "Keep scanned documents under 200 KB each for smooth online portal submission.",
            ],
        },
        "raw_response": "DEBUG_MODE — hardcoded response, no Groq call made",
    }


# ── Eligibility ──────────────────────────────────────────────────────────────
@app.post("/check-eligibility", response_model=EligibilityResponse)
async def check_eligibility_endpoint(request: EligibilityRequest):
    try:
        eligible_schemes = check_eligibility(
            income=request.income,
            category=request.category,
            state=request.state,
            class_level=request.class_level,
            gender=request.gender,
            is_disabled=request.is_disabled,
        )
        total_benefit = sum(
            parse_benefit_amount(s.get("benefit_amount")) for s in eligible_schemes
        )
        return EligibilityResponse(
            eligible_schemes=eligible_schemes,
            total_count=len(eligible_schemes),
            total_estimated_benefit=total_benefit,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── AI Guidance ──────────────────────────────────────────────────────────────
@app.post("/generate-advice", response_model=AdviceResponse)
async def generate_advice_endpoint(request: AdviceRequest):
    print(f"\n[main] /generate-advice called — {len(request.eligible_schemes)} schemes")

    # Static fallback — always works, no Groq needed
    def _static_fallback(reason: str) -> AdviceResponse:
        schemes    = request.eligible_schemes
        profile    = request.user_profile
        s1 = schemes[0].get("scheme_name", "Top Scheme") if schemes else "Top Scheme"
        s2 = schemes[1].get("scheme_name", "Second Scheme") if len(schemes) > 1 else "Second Scheme"
        cat    = profile.get("category", "your category")
        income = profile.get("income", 0)
        state  = profile.get("state", "your state")
        print(f"[main] Using static fallback — reason: {reason}")
        return AdviceResponse(
            guidance={
                "best_strategy": [
                    f"{s1} — highest match score for your income and {cat} category",
                    f"{s2} — strong benefit with accessible eligibility criteria",
                ],
                "why_you_qualify": [
                    f"Your {cat} category is listed in eligible categories.",
                    f"Family income of Rs {int(income):,} is within the required ceiling.",
                    f"Your education level matches the supported range for these schemes.",
                    f"Residents of {state} are eligible for the matched schemes.",
                ],
                "documents_to_prepare": [
                    "Income Certificate issued by Tehsildar or SDM",
                    "Caste / Category Certificate from competent authority",
                    "Latest marksheet or bonafide certificate",
                    "Aadhaar Card (self-attested copy)",
                    "Bank passbook front page with IFSC code",
                ],
                "important_tips": [
                    "Apply on scholarships.gov.in for all Central Government schemes.",
                    "Check the deadline month — apply at least 2 weeks before closing.",
                    "Keep scanned documents under 200 KB for smooth online submission.",
                ],
            },
            raw_response=reason,
        )

    # No schemes — return minimal guidance immediately
    if not request.eligible_schemes:
        return AdviceResponse(
            guidance={
                **EMPTY_GUIDANCE,
                "why_you_qualify": ["No schemes matched your current profile."],
                "important_tips": ["Try adjusting income, category, or state to find more schemes."],
            },
            raw_response="no eligible schemes",
        )

    # Call Groq — generate_advice never raises, but wrap defensively anyway
    try:
        result = generate_advice(request.user_profile, request.eligible_schemes)

        # Validate result shape
        if not isinstance(result, dict) or "guidance" not in result:
            return _static_fallback("generate_advice returned wrong shape")

        guidance     = result["guidance"]
        raw_response = result.get("raw_response", "")

        if not isinstance(guidance, dict):
            return _static_fallback("guidance is not a dict")

        print(f"[main] Returning guidance with keys: {list(guidance.keys())}")
        for k, v in guidance.items():
            print(f"  {k}: {len(v) if isinstance(v, list) else '?'} items")

        return AdviceResponse(guidance=guidance, raw_response=raw_response)

    except Exception as e:
        print(f"[main] Unexpected exception: {e}")
        return _static_fallback(str(e))


# ── Letter generator ─────────────────────────────────────────────────────────
@app.post("/generate-letter", response_model=LetterResponse)
async def generate_letter_endpoint(request: LetterRequest):
    try:
        letter = generate_letter(request.user_profile, request.selected_scheme)
        return LetterResponse(letter=letter)
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
