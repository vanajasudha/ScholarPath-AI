# ScholarPath AI

Unified root README for the ScholarPath AI full-stack project.

## Project purpose

ScholarPath AI helps Indian students discover, prioritize, and apply for scholarships. It includes:
- Personal profile-based eligibility filtering (income, caste/category, state, class level, gender, disability status)
- Ranked scholarship scoring (benefit + specificity + income buffer + deadline urgency)
- AI-driven guidance summary (top strategies, qualification reasons, documents list, tips)
- AI scholarship application letter generation (schema-driven prompt to Groq)

## Monorepo structure

- `backend/` - Python FastAPI backend
- `frontend/` - Next.js UI and interactions

## Backend details

### Key files
- `backend/main.py` - API routes, CORS policies, endpoint wiring
- `backend/models.py` - Pydantic models: `EligibilityRequest`, `EligibilityResponse`, `AdviceRequest`, `AdviceResponse`, `LetterRequest`, `LetterResponse`
- `backend/services/eligibility.py` - CSV ingestion + eligibility filters + `score_scheme` attach + sort
- `backend/services/scoring.py` - component-based scoring logic, 0-100
- `backend/services/groq_service.py` - prompts, Groq API call, response normalization, AI fallback path
- `backend/data/Scholarship_data.csv` - main dataset for scheme rules
- `backend/requirements.txt` - Python dependencies

### Eligibility flow

1. `check_eligibility` loads `Scholarship_data.csv` via pandas.
2. Each scheme checks:
   - `max_annual_income` vs user income
   - `eligible_categories` includes user category
   - `eligible_states` includes user state
   - `class_min` / `class_max` includes class_level
   - `gender` rule
   - `disability_required` vs user disabled status
3. Each matched scheme is normalized (NaN → None), scored and sorted descending by `match_score`.
4. Response includes `eligible_schemes`, `total_count`, `total_estimated_benefit`.

### Scoring components

- `benefit_score` (40 points): log-scale normalization of benefit amount, cap at 500k.
- `specificity_score` (30 points): category bonus, state-specific bonus, disability match.
- `income_buffer_score` (15 points): relative gap from limit (or neutral when no limit).
- `urgency_score` (15 points): deadline month decay (0 months → full, 11 months ~1).

## Groq AI service details

### Behavior
- Uses `GROQ_API_KEY` from environment (`.env`).
- `generate_advice`:
  - Constructs a prompt with user profile and top eligible schemes.
  - Calls Groq via `Groq().chat.completions.create`.
  - Parses JSON using `json.loads`, fence stripping, brace search.
  - Normalize keys to canonical guidance fields.
  - Fallback to deterministic guidance if parsing fails or content empty.
- `generate_letter`:
  - Builds formal letter prompt with placeholders and scheme details.
  - Calls Groq and returns raw message content.

### Failures
- Missing `GROQ_API_KEY` raises `ValueError` in `get_client`.
- Groq errors become fallback guidance; this service guaranteed to return usable data.

## Frontend details

### Key components
- `frontend/app/page.js` - orchestrates user inputs, API calls, UI sections.
- `frontend/components/InputForm.js` - profile form fields, submit state.
- `frontend/components/SchemesList.js` - renders eligibility results with sorting.
- `frontend/components/AIGuidance.js` - shows AI-generated guidance sections.
- `frontend/components/LetterGenerator.js` - request selected scheme letter and displays response.
- `frontend/lib/api.js` - HTTP wrappers for backend endpoints.

### API contract

#### `/check-eligibility` (POST)

Request body:
```json
{
  "income": 150000,
  "category": "OBC",
  "state": "Maharashtra",
  "class_level": 13,
  "gender": "Male",
  "is_disabled": false
}
```

Response:
```json
{
  "eligible_schemes": [{"scheme_name": "...", "match_score": 78.5, ...}],
  "total_count": 5,
  "total_estimated_benefit": 360000.0
}
```

#### `/generate-advice` (POST)

Request body:
```json
{
  "user_profile": {"income": 150000, "category": "OBC", ...},
  "eligible_schemes": [{"scheme_name": "...", ...}]
}
```

Response:
```json
{
  "guidance": {
    "best_strategy": ["..."],
    "why_you_qualify": ["..."],
    "documents_to_prepare": ["..."],
    "important_tips": ["..."]
  },
  "raw_response": "..."
}
```

#### `/generate-letter` (POST)

Request body:
```json
{
  "user_profile": {"income": 150000, "category": "OBC", ...},
  "selected_scheme": {"scheme_name": "...", ...}
}
```

Response:
```json
{ "letter": "..." }
```

## Environment config

### Backend
- `.env` in `backend/`:
  - `GROQ_API_KEY=...`
- Optional: `NEXT_PUBLIC_API_URL=http://localhost:8000` for frontend override.

### Frontend
- Default `NEXT_PUBLIC_API_URL` is `http://localhost:8000`.

## Local setup

### Backend
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
```

## Run

- Backend: `uvicorn main:app --reload --port 8000`
- Frontend: `npm run dev` (Next.js default port 3000)

## Health checks

- `GET http://localhost:8000/`
- `GET http://localhost:8000/debug-guidance`

## Extra details

### Data maintenance
- CSV columns should include:
  - `scheme_name`, `provider_name`, `benefit_amount`, `max_annual_income`, `eligible_categories`, `eligible_states`, `class_min`, `class_max`, `gender`, `disability_required`, `deadline_month`, etc.
- Keep the path exactly `backend/data/Scholarship_data.csv`.

### Debugging strategy
- Step 1: Backend health + debug-guidance.
- Step 2: `/check-eligibility` w/ sample payload; verify JSON and match_score outputs.
- Step 3: `/generate-advice` w/ eligible list; verify structured guidance.
- Step 4: `/generate-letter` w/ selected scheme.

### Production recommendations
- Add request schema validation / stricter values.
- Use `uvicorn --workers` and `gunicorn` for production deployment.
- Use secrets manager for Groq key.
- Add structured logging and monitoring (e.g., Sentry).

## Troubleshooting

- `AttributeError` or `pandas` issues: check pip install and Python version.
- If front-end cannot connect: verify CORS origin in `main.py`, ensure backend is running.
- If Groq 401/403: rotate API key and confirm network access.
