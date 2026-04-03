"use client";

import { useState } from "react";
import SchemeCard from "./SchemeCard";
import MeritScholarshipsSection from "./MeritScholarshipsSection";

const PAGE_SIZE = 6;

/* ─── Tab definitions ───────────────────────────────────────── */
const TABS = [
  {
    key: "need",
    label: "Financial Need",
    icon: "💰",
    description: "Income-based government & private scholarships",
    badgeColor: "bg-emerald-600",
  },
  {
    key: "merit",
    label: "Merit & Exam-Based",
    icon: "🏆",
    description: "Entrance exams, board toppers & aptitude-based awards",
    badgeColor: "bg-blue-600",
  },
  {
    key: "combined",
    label: "Merit + Need",
    icon: "🎯",
    description: "Scholarships requiring both good marks AND low income",
    badgeColor: "bg-violet-600",
  },
];

/* ─── Tab button ─────────────────────────────────────────────── */
function TabButton({ tab, active, onClick, count }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
        ${active
          ? "border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400"
          : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600"
        }`}
    >
      <span>{tab.icon}</span>
      <span>{tab.label}</span>
      {count != null && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white ${active ? "bg-indigo-600" : "bg-slate-300 dark:bg-slate-600"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ─── Financial Need tab content ────────────────────────────── */
function FinancialNeedTab({ schemes, profile, onSelectForLetter }) {
  const [showAll, setShowAll] = useState(false);

  if (!schemes || schemes.length === 0) {
    return (
      <div className="py-14 text-center">
        <div className="text-4xl mb-3">🔍</div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No eligible schemes found. Try adjusting your profile details.
        </p>
      </div>
    );
  }

  const visible = showAll ? schemes : schemes.slice(0, PAGE_SIZE);
  const hidden  = schemes.length - PAGE_SIZE;

  return (
    <div>
      <div className="grid sm:grid-cols-2 gap-4">
        {visible.map((scheme, i) => (
          <SchemeCard
            key={scheme.scheme_id || i}
            scheme={scheme}
            rank={i}
            profile={profile}
            onSelectForLetter={onSelectForLetter}
          />
        ))}
      </div>
      {schemes.length > PAGE_SIZE && (
        <button
          onClick={() => setShowAll(v => !v)}
          className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
        >
          {showAll ? "Show less ↑" : `Show ${hidden} more scheme${hidden > 1 ? "s" : ""} ↓`}
        </button>
      )}
    </div>
  );
}

/* ─── Main SchemesList component ─────────────────────────────── */
export default function SchemesList({ schemes, profile, onSelectForLetter }) {
  const [activeTab, setActiveTab] = useState("need");

  // Count badge for the need tab
  const needCount = schemes?.length || 0;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">

      {/* ── Section header ── */}
      <div className="px-6 pt-5 pb-0 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center text-sm shrink-0">🎓</div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Scholarships</h3>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-0 overflow-x-auto -mb-px scrollbar-none">
          {TABS.map(tab => (
            <TabButton
              key={tab.key}
              tab={tab}
              active={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              count={tab.key === "need" ? needCount : null}
            />
          ))}
        </div>
      </div>

      {/* ── Tab description strip ── */}
      {(() => {
        const t = TABS.find(t => t.key === activeTab);
        return (
          <div className="px-6 py-2.5 bg-slate-50/70 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{t?.description}</p>
          </div>
        );
      })()}

      {/* ── Tab content ── */}
      <div className="p-5">
        {activeTab === "need" && (
          <FinancialNeedTab
            schemes={schemes}
            profile={profile}
            onSelectForLetter={onSelectForLetter}
          />
        )}

        {activeTab === "merit" && (
          <MeritScholarshipsSection
            profile={profile}
            needCombinedOnly={false}
          />
        )}

        {activeTab === "combined" && (
          <div className="space-y-4">
            {/* Info banner */}
            <div className="flex items-start gap-2.5 rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 px-4 py-3">
              <span className="text-violet-500 text-base shrink-0 mt-0.5">🎯</span>
              <p className="text-[11px] text-violet-700 dark:text-violet-300 leading-relaxed">
                These scholarships require <strong>both</strong> good academic marks AND a family income below a specified limit — making them especially competitive. Apply if you qualify.
              </p>
            </div>
            <MeritScholarshipsSection
              profile={profile}
              needCombinedOnly={true}
            />
          </div>
        )}
      </div>

    </div>
  );
}
