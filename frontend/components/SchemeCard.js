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

/* ─── How to Apply data ──────────────────────────────────────── */

/**
 * Returns scheme-aware portal info and steps.
 * NSP schemes → scholarships.gov.in
 * Private/other → their own portals
 */
function getHowToApply(scheme) {
  const name = String(scheme.scheme_name || "").toLowerCase();
  const provider = String(scheme.provider_name || "").toLowerCase();
  const providerType = String(scheme.provider_type || "").toLowerCase();
  const appUrl = scheme.application_url || "";

  // Detect NSP / Central Govt schemes
  const isNSP =
    providerType === "central govt" ||
    appUrl.includes("scholarships.gov.in") ||
    name.includes("post-matric") ||
    name.includes("pre-matric") ||
    name.includes("nsp") ||
    name.includes("central sector") ||
    name.includes("pm scholarship") ||
    name.includes("top class");

  // Detect Accenture
  const isAccenture =
    provider.includes("accenture") || name.includes("accenture");

  // Detect Reliance
  const isReliance =
    provider.includes("reliance") || name.includes("reliance");

  // Detect Tata / TATATRUSTIT
  const isTata =
    provider.includes("tata") || name.includes("tata");

  // Detect Aditya Birla / specific private
  const isBirla =
    provider.includes("birla") || name.includes("birla");

  if (isNSP) {
    return {
      portal: { label: "scholarships.gov.in", url: "https://scholarships.gov.in", display: "scholarships.gov.in → Open Portal" },
      isNSP: true,
      steps: [
        {
          title: "Register on NSP portal",
          desc: "Go to scholarships.gov.in → click 'New Registration'. Use your Aadhaar number and active mobile number to create an account.",
          tag: "Action",
        },
        {
          title: "Log in and select scheme",
          desc: "After OTP verification, log in. Under 'Student Login' → 'Application Form' → search for your scheme under the correct state ministry.",
          tag: "Info",
        },
        {
          title: "Fill the online application form",
          desc: "Enter personal, academic, bank, and income details. All fields must match your documents exactly — name spelling, Aadhaar, and bank account.",
          tag: "Warning",
        },
        {
          title: "Upload scanned documents",
          desc: "Upload each document in JPG/PDF format, under 200 KB each. Use CamScanner or Adobe Scan. Blurry uploads are rejected.",
          tag: "Warning",
        },
        {
          title: "Submit and note application ID",
          desc: "Click 'Final Submit'. You'll get an Application ID — save it. Your institution must verify it before the institute deadline.",
          tag: "Action",
        },
        {
          title: "Track status online",
          desc: "Log back in after 3–5 days. Status shows: Pending / Institute Verified / State Approved / Amount Disbursed.",
          tag: "Info",
        },
      ],
    };
  }

  if (isAccenture) {
    return {
      portal: { label: "accenture.com/india/skills", url: "https://www.accenture.com/in-en/about/corporate-citizenship/skills-to-succeed", display: "Accenture CSR Portal → Open Portal" },
      isNSP: false,
      steps: [
        {
          title: "Visit the Accenture CSR portal",
          desc: "Go to accenture.com/india and navigate to Corporate Citizenship → Skills to Succeed section.",
          tag: "Action",
        },
        {
          title: "Check eligibility and open application",
          desc: "Confirm you meet income and CS/engineering college criteria. Click 'Apply Now' during the open application window.",
          tag: "Info",
        },
        {
          title: "Fill the application form",
          desc: "Enter your personal details, family income, college name, CGPA/percentage, and a short motivation statement.",
          tag: "Action",
        },
        {
          title: "Attach required documents",
          desc: "Upload income certificate, college admission proof, Class 12 marksheet, and Aadhaar. Max file size 2 MB each.",
          tag: "Warning",
        },
        {
          title: "Submit and wait for shortlisting",
          desc: "After submission, shortlisted candidates are contacted within 4–6 weeks for an interview or verification call.",
          tag: "Info",
        },
      ],
    };
  }

  if (isReliance) {
    return {
      portal: { label: "ril.com/scholarship", url: "https://www.ril.com/OurCommitment/RelianceFoundation/Scholarships.aspx", display: "Reliance Foundation Portal → Open Portal" },
      isNSP: false,
      steps: [
        {
          title: "Visit Reliance Foundation scholarship portal",
          desc: "Navigate to ril.com → Our Commitment → Reliance Foundation → Scholarships. Click 'Apply' during the open cycle.",
          tag: "Action",
        },
        {
          title: "Register and verify your account",
          desc: "Create an account using your mobile/email. Verify with OTP before filling details.",
          tag: "Action",
        },
        {
          title: "Fill academic and income details",
          desc: "Enter CGPA, programme (STEM, Humanities, Business), college name, family income, and bank details accurately.",
          tag: "Warning",
        },
        {
          title: "Upload supporting documents",
          desc: "Required: income certificate, Aadhaar, institute bonafide letter, Class 12 and UG marksheets, bank passbook.",
          tag: "Action",
        },
        {
          title: "Submit and appear for selection",
          desc: "Finalists are selected via an online aptitude test and interview. Merit + financial need determines final award.",
          tag: "Info",
        },
      ],
    };
  }

  if (isTata) {
    return {
      portal: { label: "tatatrusts.org/scholarships", url: "https://www.tatatrusts.org/our-work/individual-grants/scholarships", display: "Tata Trusts Portal → Open Portal" },
      isNSP: false,
      steps: [
        {
          title: "Visit Tata Trusts scholarship page",
          desc: "Go to tatatrusts.org → Our Work → Individual Grants → Scholarships. Check if your programme is eligible.",
          tag: "Action",
        },
        {
          title: "Register or log in",
          desc: "Create a new applicant account or log in with existing credentials. Complete your profile before applying.",
          tag: "Action",
        },
        {
          title: "Select the correct scheme",
          desc: "Choose the right scheme for your level (UG/PG) and field of study. Each scheme has different eligibility.",
          tag: "Info",
        },
        {
          title: "Fill and review your application",
          desc: "Complete all fields including SOP, academic history, and family income. Review before submission — changes are not allowed after.",
          tag: "Warning",
        },
        {
          title: "Submit and track via dashboard",
          desc: "After submission you'll receive a confirmation email. Track status from your applicant dashboard.",
          tag: "Info",
        },
      ],
    };
  }

  // Generic private / state scheme fallback
  const portalUrl = appUrl || "#";
  const portalDomain = appUrl
    ? (() => { try { return new URL(appUrl).hostname.replace("www.", ""); } catch { return appUrl.slice(0, 30); } })()
    : "Official Portal";

  return {
    portal: { label: portalDomain, url: portalUrl, display: `${portalDomain} → Open Portal` },
    isNSP: false,
    steps: [
      {
        title: "Visit the official scholarship portal",
        desc: `Go to the provider's official portal (see link above) and navigate to the scholarship / financial aid section.`,
        tag: "Action",
      },
      {
        title: "Register and create an account",
        desc: "Sign up with your mobile number or email ID. Verify and complete your basic profile before starting the application.",
        tag: "Action",
      },
      {
        title: "Fill the application form",
        desc: "Enter personal details, academic records, family income, bank account details, and any additional information required.",
        tag: "Warning",
      },
      {
        title: "Attach required documents",
        desc: "Upload all necessary documents in the specified format and size. Ensure scans are clear and all text is legible.",
        tag: "Action",
      },
      {
        title: "Submit and save acknowledgement",
        desc: "Submit your form and save or print the acknowledgement receipt. Keep your application/reference number safe.",
        tag: "Info",
      },
    ],
  };
}

/* ─── Step tag badge ─────────────────────────────────────────── */
const TAG_STYLES = {
  Action:  "bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20",
  Warning: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
  Info:    "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
};

/* ─── HowToApply panel ───────────────────────────────────────── */
function HowToApplyPanel({ scheme }) {
  const [expandedSteps, setExpandedSteps] = useState({});
  const { portal, isNSP, steps } = getHowToApply(scheme);

  function toggleStep(i) {
    setExpandedSteps(prev => ({ ...prev, [i]: !prev[i] }));
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50 p-3">
      {/* Portal link chip */}
      <a
        href={portal.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 mb-3 px-3 py-1.5 rounded-lg text-[11px] font-semibold
          bg-indigo-50 text-indigo-700 border border-indigo-200
          dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/25
          hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
      >
        {/* External link icon */}
        <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
        </svg>
        {portal.display}
      </a>

      {/* Steps */}
      <ol className="space-y-0">
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const isExpanded = expandedSteps[i];
          return (
            <li key={i} className="flex gap-3">
              {/* Step number + connecting line */}
              <div className="flex flex-col items-center shrink-0">
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                  style={{ backgroundColor: "#3730a3" }}
                >
                  {i + 1}
                </span>
                {!isLast && (
                  <div className="w-px flex-1 my-1" style={{ backgroundColor: "#e0e0f0", minHeight: "12px" }} />
                )}
              </div>

              {/* Content */}
              <div className={`${isLast ? "pb-0" : "pb-3"} min-w-0 flex-1`}>
                <p className="text-[12px] font-bold text-slate-800 dark:text-slate-100 leading-snug">
                  {step.title}
                </p>

                {/* Description — mobile collapses to 1 line */}
                <div className="mt-0.5">
                  <p
                    className={`text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed
                      ${!isExpanded ? "sm:line-clamp-none line-clamp-1" : ""}`}
                  >
                    {step.desc}
                  </p>
                  {/* Read more toggle — only shown on mobile */}
                  <button
                    onClick={() => toggleStep(i)}
                    className="sm:hidden text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5"
                  >
                    {isExpanded ? "read less" : "read more"}
                  </button>
                </div>

                {/* Tag badge */}
                <span className={`mt-1.5 inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full ${TAG_STYLES[step.tag]}`}>
                  {step.tag}
                </span>
              </div>
            </li>
          );
        })}
      </ol>

      {/* NSP institute-verify warning */}
      {isNSP && (
        <div className="mt-3 flex items-start gap-1.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 px-3 py-2">
          <span className="text-amber-600 dark:text-amber-400 text-[12px] shrink-0 mt-px">⚠</span>
          <p className="text-[11px] text-amber-700 dark:text-amber-300 leading-snug font-medium">
            Institute must verify your application before the institute deadline — this is usually earlier than the NSP deadline. Contact your college scholarship cell immediately.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────── */
export default function SchemeCard({ scheme, rank = 999, profile, onSelectForLetter }) {
  const [showDocs, setShowDocs]       = useState(false);
  const [showWhyEligible, setShowWhy] = useState(false);
  const [showHowToApply, setShowHTA]  = useState(false);

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

        {/* ── Row 9: How to Apply — Step by Step (NEW) ─────────── */}
        <div>
          <button
            onClick={() => setShowHTA(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors w-full"
          >
            {/* Route / map icon */}
            <svg className="w-3.5 h-3.5 shrink-0 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="font-semibold text-slate-600 dark:text-slate-300">How to Apply — Step by Step</span>
            <svg
              className={`w-3 h-3 ml-auto transition-transform duration-200 ${showHowToApply ? "rotate-180" : ""}`}
              fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showHowToApply && <HowToApplyPanel scheme={scheme} />}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Row 10: Actions */}
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
