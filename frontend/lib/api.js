const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function request(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }

  return res.json();
}

/**
 * POST /check-eligibility
 * @param {{ income, category, state, class_level, gender, is_disabled }} profile
 */
export function checkEligibility(profile) {
  return request("/check-eligibility", profile);
}

/**
 * POST /generate-advice
 * @param {object} userProfile
 * @param {object[]} eligibleSchemes
 */
export function generateAdvice(userProfile, eligibleSchemes) {
  return request("/generate-advice", {
    user_profile: userProfile,
    eligible_schemes: eligibleSchemes,
  });
}

/**
 * POST /generate-letter
 * @param {object} userProfile
 * @param {object} selectedScheme
 */
export function generateLetter(userProfile, selectedScheme) {
  return request("/generate-letter", {
    user_profile: userProfile,
    selected_scheme: selectedScheme,
  });
}
