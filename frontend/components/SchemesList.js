"use client";

import { useState } from "react";
import SchemeCard from "./SchemeCard";

const PAGE_SIZE = 6;

export default function SchemesList({ schemes, profile, onSelectForLetter }) {
  const [showAll, setShowAll] = useState(false);

  if (!schemes || schemes.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm shrink-0">🎓</div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Eligible Schemes</h3>
        </div>
        <div className="py-14 text-center">
          <div className="text-4xl mb-3">🔍</div>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No eligible schemes found. Try adjusting your profile details.
          </p>
        </div>
      </div>
    );
  }

  const visible = showAll ? schemes : schemes.slice(0, PAGE_SIZE);
  const hidden = schemes.length - PAGE_SIZE;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm shrink-0">🎓</div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Eligible Schemes</h3>
          <span className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white">
            {schemes.length}
          </span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500">Sorted by match score</p>
      </div>

      {/* Cards grid */}
      <div className="p-5">
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

        {/* Show more / less */}
        {schemes.length > PAGE_SIZE && (
          <button
            onClick={() => setShowAll(v => !v)}
            className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
          >
            {showAll ? "Show less ↑" : `Show ${hidden} more scheme${hidden > 1 ? "s" : ""} ↓`}
          </button>
        )}
      </div>
    </div>
  );
}
