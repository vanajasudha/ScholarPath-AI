"use client";

function parseBenefit(val) {
  if (!val || String(val).toLowerCase() === "null") return 0;
  return parseFloat(String(val).replace(/,/g, "")) || 0;
}

function formatAmount(val) {
  const n = parseBenefit(val);
  if (!n) return "Varies";
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/** Generates 2–3 concise reasons why this scheme is the best match. */
function buildReasons(scheme, profile) {
  const reasons = [];

  const amount = parseBenefit(scheme.benefit_amount);
  if (amount >= 100000)
    reasons.push(`Offers one of the highest benefits (${formatAmount(scheme.benefit_amount)}/year) among your eligible schemes`);
  else if (amount >= 30000)
    reasons.push(`Provides strong financial support of ${formatAmount(scheme.benefit_amount)}/year`);

  const cats = String(scheme.eligible_categories || "ALL").toUpperCase().replace(/\//g, ",");
  const catList = cats.split(",").map((c) => c.trim());
  if (!catList.includes("ALL") && catList.includes(profile.category.toUpperCase()))
    reasons.push(`Specifically designed for ${profile.category} category students, directly matching your profile`);

  const states = String(scheme.eligible_states || "ALL");
  if (states.toUpperCase() !== "ALL" && states.toLowerCase().includes(profile.state.toLowerCase()))
    reasons.push(`Reserved for ${profile.state} residents, giving you a location advantage`);

  const maxIncome = parseFloat(String(scheme.max_annual_income || "0").replace(/,/g, "")) || 0;
  if (maxIncome > 0 && profile.income <= maxIncome * 0.6)
    reasons.push(`Your family income is well within the ₹${(maxIncome / 1000).toFixed(0)}K limit, improving approval chances`);

  if (scheme.provider_type === "Central Govt")
    reasons.push("Backed by the Central Government — reliable, consistent disbursement via NSP");
  else if (scheme.provider_type === "State Govt")
    reasons.push(`Funded by your state government, with faster local processing`);

  if (scheme.disability_required === "Yes" && profile.is_disabled)
    reasons.push("One of very few schemes exclusively supporting PwD students");

  if (reasons.length === 0)
    reasons.push("Matches all your profile criteria — category, income, state, and education level");

  return reasons.slice(0, 3);
}

/** Pick top 1–2 schemes by match_score (backend-ranked), fall back to benefit amount. */
function selectTopSchemes(schemes) {
  return [...schemes]
    .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
    .slice(0, 2);
}

const RANK_LABEL = ["Best Match", "Runner-up"];
const RANK_BADGE = [
  "bg-amber-400 text-amber-900",
  "bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200",
];

function RecommendationCard({ scheme, rank, profile, onGenerateLetter }) {
  const reasons = buildReasons(scheme, profile);
  const isTop = rank === 0;

  return (
    <div className={`relative rounded-2xl overflow-hidden border-2 transition-shadow hover:shadow-xl
      ${isTop
        ? "border-amber-300 dark:border-amber-500/50 shadow-lg shadow-amber-100 dark:shadow-amber-900/20"
        : "border-slate-200 dark:border-slate-600 shadow-sm"
      }`}
    >
      {/* Gradient header band */}
      <div className={`h-1.5 w-full ${isTop
        ? "bg-gradient-to-r from-amber-400 via-yellow-400 to-orange-400"
        : "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500"
      }`} />

      <div className={`p-6 ${isTop
        ? "bg-gradient-to-br from-amber-50 via-yellow-50 to-white dark:from-amber-900/15 dark:via-amber-900/10 dark:to-slate-800"
        : "bg-white dark:bg-slate-800"
      }`}>

        {/* Top row: badge + provider type */}
        <div className="flex items-center justify-between mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${RANK_BADGE[rank]}`}>
            {isTop && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            )}
            {RANK_LABEL[rank]}
          </span>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full
            ${scheme.provider_type === "Central Govt"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
              : scheme.provider_type === "State Govt"
              ? "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300"
              : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300"
            }`}
          >
            {scheme.provider_type}
          </span>
        </div>

        {/* Scheme name + provider */}
        <h4 className={`font-extrabold leading-snug mb-1 ${isTop ? "text-xl text-slate-800 dark:text-white" : "text-lg text-slate-800 dark:text-white"}`}>
          {scheme.scheme_name?.trim()}
        </h4>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{scheme.provider_name}</p>

        {/* Key stats — always 3 equal columns */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "per year",    value: formatAmount(scheme.benefit_amount), color: isTop ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400" },
            { label: "deadline",    value: scheme.deadline_month || "—",         color: "text-slate-700 dark:text-slate-200" },
            { label: "application", value: scheme.application_mode || "Online",  color: "text-emerald-600 dark:text-emerald-400" },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-3 text-center ${isTop ? "bg-white/80 dark:bg-slate-800/60 border border-amber-200/60 dark:border-amber-500/20" : "bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600"}`}>
              <div className={`text-base font-black leading-tight truncate ${color}`}>{value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Why this is best for you */}
        <div className={`rounded-xl p-4 mb-5 ${isTop
          ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/50"
          : "bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
        }`}>
          <p className={`text-xs font-bold uppercase tracking-wider mb-2 ${isTop ? "text-emerald-700 dark:text-emerald-400" : "text-slate-600 dark:text-slate-400"}`}>
            ✦ Why this is best for you
          </p>
          <ul className="space-y-1.5">
            {reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300 leading-snug">
                <span className={`mt-0.5 shrink-0 text-xs ${isTop ? "text-emerald-500" : "text-slate-400"}`}>✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {scheme.application_url && (
            <a
              href={scheme.application_url}
              target="_blank"
              rel="noreferrer"
              className={`flex-1 text-center text-sm font-bold py-2.5 rounded-xl transition-all
                ${isTop
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-md shadow-amber-200 dark:shadow-amber-900/30"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white"
                }`}
            >
              Apply Now ↗
            </a>
          )}
          <button
            onClick={() => onGenerateLetter(scheme)}
            className={`flex-1 text-center text-sm font-bold py-2.5 rounded-xl transition-all border
              ${isTop
                ? "border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                : "border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
              }`}
          >
            ✉️ Generate Letter
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TopRecommendation({ schemes, profile, onGenerateLetter }) {
  if (!schemes || schemes.length === 0) return null;
  const top = selectTopSchemes(schemes);

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-800 dark:text-white">Top Recommendation</h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          — ranked by benefit &amp; eligibility strength
        </span>
      </div>

      <div className={`grid gap-5 ${top.length > 1 ? "md:grid-cols-2" : "max-w-2xl"}`}>
        {top.map((scheme, i) => (
          <RecommendationCard
            key={scheme.scheme_id || i}
            scheme={scheme}
            rank={i}
            profile={profile}
            onGenerateLetter={onGenerateLetter}
          />
        ))}
      </div>
    </div>
  );
}
