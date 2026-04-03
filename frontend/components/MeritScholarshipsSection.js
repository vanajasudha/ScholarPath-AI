"use client";

import { useState, useMemo } from "react";
import MeritSchemeCard from "./MeritSchemeCard";
import { MERIT_SCHOLARSHIPS } from "../lib/meritScholarships";

/* ─── Filter/sort options ───────────────────────────────────── */
const CLASS_FILTERS = [
  { key: "all",   label: "All Levels" },
  { key: "8",     label: "Class 8" },
  { key: "10",    label: "Class 10" },
  { key: "11-12", label: "Class 11–12" },
  { key: "UG",    label: "UG / College" },
];

const TYPE_FILTERS = [
  { key: "all",                label: "All Types" },
  { key: "exam",               label: "Written Test" },
  { key: "merit_marks",        label: "Board Marks" },
  { key: "exam_plus_interview",  label: "Exam + Interview" },
  { key: "essay_plus_interview", label: "Essay + Interview" },
];

const DIFF_FILTERS = [
  { key: "all",          label: "Any Difficulty" },
  { key: "Low-Moderate", label: "Low / Moderate" },
  { key: "Moderate",     label: "Moderate" },
  { key: "High",         label: "High" },
  { key: "Very High",    label: "Very High" },
];

const SORT_OPTIONS = [
  { key: "default",    label: "Default order" },
  { key: "amount_desc", label: "Amount: High → Low" },
  { key: "reg_asc",    label: "Registration: Soonest first" },
];

/* ─── Pill button helper ────────────────────────────────────── */
function FilterPill({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-150
        ${active
          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-300 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400"
        }`}
    >
      {children}
    </button>
  );
}

/* ─── Select dropdown helper ─────────────────────────────────── */
function FilterSelect({ value, onChange, options, label }) {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
      >
        {options.map(o => (
          <option key={o.key} value={o.key}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ─── Current month helper for reg sort ─────────────────────── */
function nextRegMonth(month) {
  const now = new Date().getMonth() + 1; // 1-12
  return ((month - now + 12) % 12) || 12;
}

/* ─── Main section component ─────────────────────────────────── */
export default function MeritScholarshipsSection({ profile, needCombinedOnly = false }) {
  const [classFilter, setClassFilter] = useState("all");
  const [typeFilter,  setTypeFilter]  = useState("all");
  const [diffFilter,  setDiffFilter]  = useState("all");
  const [sortKey,     setSortKey]     = useState("default");

  const filtered = useMemo(() => {
    let list = needCombinedOnly
      ? MERIT_SCHOLARSHIPS.filter(s => s.income_limit !== null)
      : MERIT_SCHOLARSHIPS;

    if (classFilter !== "all") {
      list = list.filter(s => {
        const k = String(s.eligibility_class_key || "").toLowerCase();
        return k === classFilter.toLowerCase();
      });
    }

    if (typeFilter !== "all") {
      list = list.filter(s => s.type === typeFilter);
    }

    if (diffFilter !== "all") {
      list = list.filter(s => s.difficulty === diffFilter);
    }

    if (sortKey === "amount_desc") {
      list = [...list].sort((a, b) => (b.amount_numeric || 0) - (a.amount_numeric || 0));
    } else if (sortKey === "reg_asc") {
      list = [...list].sort((a, b) => nextRegMonth(a.reg_month_start) - nextRegMonth(b.reg_month_start));
    }

    return list;
  }, [classFilter, typeFilter, diffFilter, sortKey, needCombinedOnly]);

  const activeFilterCount = [classFilter, typeFilter, diffFilter]
    .filter(v => v !== "all").length;

  function resetFilters() {
    setClassFilter("all");
    setTypeFilter("all");
    setDiffFilter("all");
    setSortKey("default");
  }

  return (
    <div className="space-y-5">
      {/* ── Smart filter bar ── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center text-xs">🔍</div>
            <span className="text-sm font-bold text-slate-800 dark:text-white">Smart Filters</span>
            {activeFilterCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                {activeFilterCount}
              </span>
            )}
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="text-[11px] font-semibold text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              Clear all ×
            </button>
          )}
        </div>

        {/* Class level pills */}
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">Class Level</p>
          <div className="flex flex-wrap gap-1.5">
            {CLASS_FILTERS.map(f => (
              <FilterPill
                key={f.key}
                active={classFilter === f.key}
                onClick={() => setClassFilter(f.key)}
              >
                {f.label}
              </FilterPill>
            ))}
          </div>
        </div>

        {/* Type + Difficulty + Sort row */}
        <div className="flex flex-wrap gap-3 items-end pt-1">
          <FilterSelect
            label="Exam Type"
            value={typeFilter}
            onChange={setTypeFilter}
            options={TYPE_FILTERS}
          />
          <FilterSelect
            label="Difficulty"
            value={diffFilter}
            onChange={setDiffFilter}
            options={DIFF_FILTERS}
          />
          <FilterSelect
            label="Sort By"
            value={sortKey}
            onChange={setSortKey}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      {/* ── Results count ── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          <span className="font-bold text-slate-800 dark:text-white">{filtered.length}</span>
          {" "}scholarship{filtered.length !== 1 ? "s" : ""} found
        </p>
        {profile?.class_level && (
          <p className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
            ⭐ = matches your class
          </p>
        )}
      </div>

      {/* ── Cards grid ── */}
      {filtered.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 py-14 text-center">
          <div className="text-4xl mb-3">🎯</div>
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">No scholarships match your filters.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try clearing some filters above.</p>
          <button
            onClick={resetFilters}
            className="mt-4 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Reset all filters
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map(scheme => (
            <MeritSchemeCard
              key={scheme.id}
              scheme={scheme}
              profile={profile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
