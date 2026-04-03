"use client";

import { useState } from "react";

/* ─── Type badge config ──────────────────────────────────────── */
const TYPE_CONFIG = {
  exam: {
    label: "Entrance Exam",
    cls: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/25",
    dot: "bg-blue-500",
  },
  merit_marks: {
    label: "Board Merit",
    cls: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/25",
    dot: "bg-emerald-500",
  },
  exam_plus_interview: {
    label: "Exam + Interview",
    cls: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/25",
    dot: "bg-violet-500",
  },
  essay_plus_interview: {
    label: "Essay + Interview",
    cls: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25",
    dot: "bg-amber-500",
  },
};

/* ─── Difficulty pill ────────────────────────────────────────── */
const DIFF_CONFIG = {
  "Moderate":     "bg-sky-100     text-sky-700     dark:bg-sky-500/15     dark:text-sky-300",
  "Low-Moderate": "bg-teal-100    text-teal-700    dark:bg-teal-500/15    dark:text-teal-300",
  "High":         "bg-orange-100  text-orange-700  dark:bg-orange-500/15  dark:text-orange-300",
  "Very High":    "bg-red-100     text-red-700     dark:bg-red-500/15     dark:text-red-300",
  "N/A":          "bg-slate-100   text-slate-500   dark:bg-slate-700      dark:text-slate-400",
};

/* ─── Preparation guide tip tag styles ──────────────────────── */
const TIP_ICON = ["💡", "📖", "📝", "⏱️", "🎯", "🔑"];

/* ─── Small timeline widget ─────────────────────────────────── */
function PrepTimeline({ steps }) {
  if (!steps || steps.length === 0) return null;
  return (
    <div className="flex items-start gap-0 overflow-x-auto pb-1 -mx-0.5 mt-1">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center min-w-0 shrink-0">
          {/* Node */}
          <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm border-2 border-white dark:border-slate-800 shadow-sm"
              style={{ backgroundColor: "#3730a3", color: "white", fontSize: "14px" }}
            >
              {step.icon}
            </div>
            <p className="text-[9px] font-bold text-slate-700 dark:text-slate-200 text-center leading-tight whitespace-nowrap px-0.5">
              {step.label}
            </p>
            <p className="text-[8px] text-slate-400 dark:text-slate-500 text-center whitespace-nowrap">
              {step.month}
            </p>
          </div>
          {/* Connector */}
          {i < steps.length - 1 && (
            <div className="h-px w-6 bg-gradient-to-r from-indigo-300 to-violet-300 dark:from-indigo-600 dark:to-violet-600 shrink-0 -mt-6" />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── Collapsible exam details panel ─────────────────────────── */
function ExamDetailsPanel({ scheme }) {
  const stages = [];
  if (scheme.stage1) stages.push({ n: 1, text: scheme.stage1 });
  if (scheme.stage2) stages.push({ n: 2, text: scheme.stage2 });

  return (
    <div className="mt-2 rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-500/5 p-3 space-y-3">
      {/* Stages */}
      {stages.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mb-1.5">
            {scheme.exam_stages === 1 ? "Exam Stage" : "Exam Stages"}
          </p>
          <div className="space-y-1.5">
            {stages.map(({ n, text }) => (
              <div key={n} className="flex items-start gap-2">
                <span
                  className="shrink-0 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center text-white mt-0.5"
                  style={{ backgroundColor: "#3730a3" }}
                >
                  {n}
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subjects */}
      {scheme.exam_subjects && scheme.exam_subjects.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mb-1.5">
            Subjects Tested
          </p>
          <div className="flex flex-wrap gap-1">
            {scheme.exam_subjects.map((subj, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 border border-indigo-100 dark:border-indigo-500/20 text-slate-600 dark:text-slate-300"
              >
                {subj}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline inside exam details */}
      {scheme.prepare_guide?.timeline && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 mb-1.5">
            Preparation Timeline
          </p>
          <PrepTimeline steps={scheme.prepare_guide.timeline} />
        </div>
      )}
    </div>
  );
}

/* ─── Preparation guide panel ───────────────────────────────── */
function PrepGuidePanel({ guide }) {
  if (!guide) return null;
  return (
    <div className="mt-2 rounded-xl border border-violet-100 dark:border-violet-500/20 bg-violet-50/50 dark:bg-violet-500/5 p-3 space-y-2.5">
      {/* Overview */}
      <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">{guide.overview}</p>

      {/* Tips */}
      {guide.tips && guide.tips.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wide text-violet-600 dark:text-violet-400 mb-1.5">
            Preparation Tips
          </p>
          <ul className="space-y-1">
            {guide.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[11px] shrink-0 mt-0.5">{TIP_ICON[i % TIP_ICON.length]}</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{tip}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─── Class match badge helper ───────────────────────────────── */
function classMatchesBadge(schemeKey, profileClass) {
  if (!profileClass || !schemeKey) return false;
  const pc = String(profileClass);
  const sk = String(schemeKey).toLowerCase();

  if (sk === "8" && pc === "8") return true;
  if (sk === "10" && pc === "10") return true;
  if (sk === "11-12" && (pc === "11" || pc === "12")) return true;
  if (sk === "ug" && (parseInt(pc) >= 13)) return true;
  return false;
}

/* ─── Main merit card component ─────────────────────────────── */
export default function MeritSchemeCard({ scheme, profile }) {
  const [showExam, setShowExam]   = useState(false);
  const [showPrep, setShowPrep]   = useState(false);

  const typeConf = TYPE_CONFIG[scheme.type] || TYPE_CONFIG["exam"];
  const diffCls  = DIFF_CONFIG[scheme.difficulty] || DIFF_CONFIG["N/A"];
  const isMatch  = classMatchesBadge(scheme.eligibility_class_key, profile?.class_level);

  const hasExamDetails =
    scheme.exam_stages > 0 || (scheme.exam_subjects && scheme.exam_subjects.length > 0);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group">

      {/* Top accent gradient bar */}
      <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500 shrink-0" />

      <div className="p-5 flex flex-col gap-3 flex-1">

        {/* ── Row 1: Type badge + difficulty pill + match badge ── */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${typeConf.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${typeConf.dot}`} />
            {typeConf.label}
          </span>
          {scheme.difficulty !== "N/A" && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diffCls}`}>
              {scheme.difficulty}
            </span>
          )}
          {isMatch && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/25">
              ⭐ Your Exam Match
            </span>
          )}
        </div>

        {/* ── Row 2: Scheme name + provider ── */}
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">
            {scheme.name}
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{scheme.provider}</p>
        </div>

        {/* ── Row 3: Amount + coverage chips ── */}
        <div className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
            💰 {scheme.amount}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
            🎓 {scheme.coverage}
          </span>
        </div>

        {/* ── Row 4: Eligibility details ── */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-700 p-2.5 grid grid-cols-2 gap-y-1.5 gap-x-3">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Level</p>
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{scheme.eligibility_class}</p>
          </div>
          <div>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Min Marks</p>
            <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{scheme.min_marks}</p>
          </div>
          {scheme.income_limit && (
            <div className="col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Income Limit</p>
              <p className="text-[11px] font-semibold text-orange-600 dark:text-orange-400 mt-0.5">Max {scheme.income_limit}</p>
            </div>
          )}
          {scheme.age_limit && (
            <div className="col-span-2">
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Age Limit</p>
              <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-0.5">{scheme.age_limit}</p>
            </div>
          )}
        </div>

        {/* ── Row 5: Seats + Reg window ── */}
        <div className="flex items-center gap-3 flex-wrap">
          {scheme.seats && (
            <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <strong className="font-semibold text-slate-700 dark:text-slate-200">{scheme.seats.toLocaleString("en-IN")}</strong> seats
            </span>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Register: <strong className="font-semibold text-slate-700 dark:text-slate-200 ml-0.5">{scheme.reg_window}</strong>
          </span>
        </div>

        {/* ── Row 6: Exam details (collapsible) ── */}
        {hasExamDetails && (
          <div>
            <button
              onClick={() => setShowExam(v => !v)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors w-full justify-center
                ${showExam
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-indigo-200 dark:border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
                }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {showExam ? "Hide Exam Details" : "Exam Details + Timeline"}
              <svg className={`w-3 h-3 ml-auto transition-transform ${showExam ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showExam && <ExamDetailsPanel scheme={scheme} />}
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Row 7: Action buttons ── */}
        <div className="flex gap-2 pt-3 border-t border-slate-100 dark:border-slate-700">
          {/* How to prepare button */}
          <button
            onClick={() => setShowPrep(v => !v)}
            className={`flex-1 text-center text-xs font-bold py-2 rounded-lg border transition-colors flex items-center justify-center gap-1
              ${showPrep
                ? "bg-violet-600 text-white border-violet-600"
                : "border-violet-200 dark:border-violet-500/30 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-500/10"
              }`}
          >
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            {showPrep ? "Hide Guide" : "How to Prepare ↗"}
          </button>

          {/* Apply now button */}
          <a
            href={scheme.portal}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center text-xs font-bold py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Apply Now ↗
          </a>
        </div>

        {/* Prep guide (shown below buttons if toggled) */}
        {showPrep && <PrepGuidePanel guide={scheme.prepare_guide} />}

      </div>
    </div>
  );
}
