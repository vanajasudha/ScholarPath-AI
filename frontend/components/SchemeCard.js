"use client";

import { useState } from "react";

/* ─── Provider pill colours ─────────────────────────────────── */
const PROVIDER_PILL = {
  "Central Govt": "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "State Govt":   "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
  "Private":      "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

/* ─── Score helpers ──────────────────────────────────────────── */
function scoreColor(score) {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10";
  if (score >= 45) return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10";
  return "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700";
}
function scoreBar(score) {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 45) return "bg-indigo-500";
  return "bg-slate-400";
}

/* ─── Amount formatter ───────────────────────────────────────── */
function parseBenefit(val) {
  if (!val || String(val).toLowerCase() === "null") return 0;
  return parseFloat(String(val).replace(/,/g, "")) || 0;
}
function formatAmount(val) {
  const n = parseBenefit(val);
  if (!n) return "Varies";
  if (n >= 100000) return `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`;
  if (n >= 1000)   return `₹${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return `₹${n.toLocaleString("en-IN")}`;
}

/* ─── Badge computation ──────────────────────────────────────── */
const MONTH_NUM = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
};

function computeBadges(scheme, rank, docCount) {
  const badges = [];
  if (rank === 0) {
    badges.push({ key:"best", icon:"⭐", label:"Best Match", cls:"bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25" });
  }
  if (parseBenefit(scheme.benefit_amount) >= 50000) {
    badges.push({ key:"benefit", icon:"💰", label:"High Benefit", cls:"bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25" });
  }
  const monthKey = String(scheme.deadline_month || "").toLowerCase().trim();
  const monthNum = MONTH_NUM[monthKey];
  if (monthNum) {
    const diff = (monthNum - (new Date().getMonth() + 1) + 12) % 12;
    if (diff === 0 || diff <= 2) {
      badges.push({ key:"urgent", icon:"⚡", label:"Urgent", cls:"bg-red-100 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/25" });
    }
  }
  if (docCount > 0 && docCount <= 3) {
    badges.push({ key:"easy", icon:"✓", label:"Easy Apply", cls:"bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/25" });
  }
  return badges;
}

/* ─── Eligibility explanation ────────────────────────────────── */
function levelLabel(l) {
  if (l === 13) return "Undergraduate";
  if (l === 14) return "Postgraduate";
  if (l === 15) return "PhD";
  return `Class ${l}`;
}

function buildEligibility(scheme, profile) {
  if (!profile) return [];
  const rows = [];

  // Income
  const maxIncome = parseFloat(String(scheme.max_annual_income || "0").replace(/,/g, "")) || 0;
  if (maxIncome > 0) {
    const headroom = maxIncome - profile.income;
    const pct = Math.round((headroom / maxIncome) * 100);
    rows.push({
      icon: "💰", label: "Income",
      ok: profile.income <= maxIncome,
      text: profile.income <= maxIncome
        ? `Your ₹${profile.income.toLocaleString("en-IN")} income is ${pct}% below the ₹${maxIncome.toLocaleString("en-IN")} limit`
        : `Your income exceeds the ₹${maxIncome.toLocaleString("en-IN")} ceiling`,
    });
  } else {
    rows.push({ icon:"💰", label:"Income", ok:true, text:"No income restriction — open to all income groups" });
  }

  // Category
  const rawCats = String(scheme.eligible_categories || "ALL").toUpperCase().replace(/\//g, ",");
  const catList = rawCats.split(",").map(c => c.trim()).filter(Boolean);
  const catAll  = catList.includes("ALL");
  const catOk   = catAll || catList.includes(profile.category.toUpperCase());
  rows.push({
    icon: "🏷️", label: "Category",
    ok: catOk,
    text: catAll
      ? "Open to all categories — no reservation required"
      : catOk
        ? `Your ${profile.category} category qualifies (eligible: ${catList.join(", ")})`
        : `Your ${profile.category} category is not in eligible list`,
  });

  // Education level
  const minClass = parseInt(scheme.min_class_level) || 1;
  const maxClass = parseInt(scheme.max_class_level) || 15;
  const levelOk  = profile.class_level >= minClass && profile.class_level <= maxClass;
  rows.push({
    icon: "🎓", label: "Education",
    ok: levelOk,
    text: levelOk
      ? `${levelLabel(profile.class_level)} is within the supported range (${levelLabel(minClass)} – ${levelLabel(maxClass)})`
      : `${levelLabel(profile.class_level)} is outside the supported range`,
  });

  // State
  const statesRaw = String(scheme.eligible_states || "ALL");
  const stateAll  = statesRaw.toUpperCase() === "ALL";
  const stateOk   = stateAll || statesRaw.toLowerCase().includes(profile.state.toLowerCase());
  rows.push({
    icon: "📍", label: "State",
    ok: stateOk,
    text: stateAll
      ? "Available across all states and union territories"
      : stateOk
        ? `${profile.state} is listed as an eligible state`
        : `${profile.state} is not in the eligible states list`,
  });

  return rows;
}

/* ─── Eligibility panel ──────────────────────────────────────── */
function EligibilityPanel({ rows }) {
  return (
    <div className="mt-3 rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 p-3 space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mb-2">
        Why you're eligible
      </p>
      {rows.map(({ icon, label, ok, text }) => (
        <div key={label} className="flex items-start gap-2.5">
          {/* Status dot */}
          <span className={`mt-0.5 shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold
            ${ok ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                 : "bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-300"}`}>
            {ok ? "✓" : "✗"}
          </span>
          <div className="min-w-0">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">{icon} {label} · </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function SchemeCard({ scheme, rank = 999, profile, onSelectForLetter }) {
  const [showDocs, setShowDocs]       = useState(false);
  const [showWhyEligible, setShowWhy] = useState(false);

  const providerPill = PROVIDER_PILL[scheme.provider_type] || "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300";
  const score = scheme.match_score ?? null;
  const desc  = scheme.description ? String(scheme.description).trim() : "";

  const docs = scheme.documents_required
    ? String(scheme.documents_required).split(",").map(d => d.trim()).filter(Boolean)
    : [];

  const badges      = computeBadges(scheme, rank, docs.length);
  const eligibility = buildEligibility(scheme, profile);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 to-violet-500 shrink-0" />

      <div className="p-5 flex flex-col gap-3 flex-1">

        {/* Row 1: Provider pill + score badge */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${providerPill}`}>
            {scheme.provider_type}
          </span>
          {score !== null && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${scoreColor(score)}`}>
              {score.toFixed(0)}% match
            </span>
          )}
        </div>

        {/* Row 2: Dynamic badges */}
        {badges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {badges.map(({ key, icon, label, cls }) => (
              <span key={key} className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>
                <span className="leading-none">{icon}</span>{label}
              </span>
            ))}
          </div>
        )}

        {/* Row 3: Scheme name + provider */}
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug line-clamp-2">
            {scheme.scheme_name?.trim() || "Unknown Scheme"}
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
            {scheme.provider_name}
          </p>
        </div>

        {/* Row 4: Match score progress bar */}
        {score !== null && (
          <div className="w-full h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${scoreBar(score)}`}
              style={{ width: `${Math.min(score, 100)}%` }}
            />
          </div>
        )}

        {/* Row 5: Key metrics chips */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            💰 {formatAmount(scheme.benefit_amount)}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            🗓 {scheme.deadline_month || "—"}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
            📚 {scheme.benefit_type || "Scholarship"}
          </span>
        </div>

        {/* Row 6: Description */}
        {desc && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
            {desc}
          </p>
        )}

        {/* Row 7: Why Eligible toggle + panel */}
        {eligibility.length > 0 && (
          <div>
            <button
              onClick={() => setShowWhy(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors w-full justify-center
                ${showWhyEligible
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {showWhyEligible ? "Hide Eligibility" : "Why Eligible?"}
              <svg className={`w-3 h-3 ml-auto transition-transform ${showWhyEligible ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showWhyEligible && <EligibilityPanel rows={eligibility} />}
          </div>
        )}

        {/* Row 8: Documents (collapsible) */}
        {docs.length > 0 && (
          <div>
            <button
              onClick={() => setShowDocs(v => !v)}
              className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <svg className={`w-3 h-3 transition-transform ${showDocs ? "rotate-90" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              {showDocs ? "Hide" : "Show"} {docs.length} document{docs.length > 1 ? "s" : ""} required
            </button>
            {showDocs && (
              <div className="mt-2 flex flex-wrap gap-1">
                {docs.map((doc, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {doc}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Row 9: Actions */}
        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
          {scheme.application_url ? (
            <a
              href={scheme.application_url}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-center text-xs font-bold py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Apply Now ↗
            </a>
          ) : (
            <div className="flex-1" />
          )}
          <button
            onClick={() => onSelectForLetter(scheme)}
            className="flex-1 text-center text-xs font-bold py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            ✉️ Get Letter
          </button>
        </div>

      </div>
    </div>
  );
}
