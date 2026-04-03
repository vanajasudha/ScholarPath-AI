from pydantic import BaseModel
from typing import Any, Dict, List, Optional


class EligibilityRequest(BaseModel):
    income: float
    category: str
    state: str
    class_level: int  # 1-12 for school, 13=UG, 14=PG
    gender: str
    is_disabled: bool


class EligibilityResponse(BaseModel):
    eligible_schemes: List[Dict[str, Any]]
    total_count: int
    total_estimated_benefit: float


class AdviceRequest(BaseModel):
    user_profile: Dict[str, Any]
    eligible_schemes: List[Dict[str, Any]]


class AdviceResponse(BaseModel):
    guidance: Dict[str, Any]   # always has the 4 structured keys
    raw_response: str          # the raw Groq output for debugging


class LetterRequest(BaseModel):
    user_profile: Dict[str, Any]
    selected_scheme: Dict[str, Any]


class LetterResponse(BaseModel):
    letter: str
