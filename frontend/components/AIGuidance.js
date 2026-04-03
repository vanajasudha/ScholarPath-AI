"use client";

import { useState } from "react";
import { generateAdvice } from "../lib/api";

// ── Section config ────────────────────────────────────────────────────────────
const SECTIONS = [
  {
    key: "best_strategy",
    icon: "🎯",
    title: "Best Strategy",
    subtitle: "Apply in this order",
    numbered: true,
    accent: {
      card:   "bg-indigo-50 dark:bg-indigo-500/10 border-indigo-100 dark:border-indigo-500/20",
      num:    "bg-indigo-600 text-white",
      dot:    "bg-indigo-600",
      header: "text-indigo-600 dark:text-indigo-400",
    },
  },
  {
    key: "why_you_qualify",
    icon: "✅",
    title: "Why You Qualify",
    subtitle: "Profile strengths",
    numbered: false,
    accent: {
      card:   "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20",
      dot:    "bg-emerald-500",
      header: "text-emerald-600 dark:text-emerald-400",
    },
  },
  {
    key: "documents_to_prepare",
    icon: "📄",
    title: "Documents to Prepare",
    subtitle: "Gather these now",
    numbered: false,
    accent: {
      card:   "bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20",
      dot:    "bg-amber-500",
      header: "text-amber-600 dark:text-amber-400",
    },
  },
  {
    key: "important_tips",
    icon: "💡",
    title: "Important Tips",
    subtitle: "Deadlines & suggestions",
    numbered: false,
    accent: {
      card:   "bg-violet-50 dark:bg-violet-500/10 border-violet-100 dark:border-violet-500/20",
      dot:    "bg-violet-500",
      header: "text-violet-600 dark:text-violet-400",
    },
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function ItemList({ items, accent, numbered }) {
  // Defensive: ensure items is truly a non-empty array of strings
  const safe = Array.isArray(items)
    ? items.filter((x) => x && typeof x === "string" && x.trim().length > 0)
    : [];

  if (safe.length === 0) {
    return (
      <p className="text-xs text-slate-400 dark:text-slate-500 italic">
        No data available for this section.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {safe.map((item, i) => (
        <li key={i} className="flex gap-2.5 items-start">
          {numbered ? (
            <span
              className={`shrink-0 w-4 h-4 rounded-full text-[10px] font-black flex items-center justify-center mt-0.5 ${accent.num}`}
            >
              {i + 1}
            </span>
          ) : (
            <span className={`shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${accent.dot}`} />
          )}
          <span className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SectionCard({ section, data }) {
  const { icon, title, subtitle, accent, numbered } = section;
  return (
    <div className={`rounded-xl border p-4 ${accent.card}`}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base leading-none">{icon}</span>
        <div>
          <p className={`text-xs font-bold uppercase tracking-wide ${accent.header}`}>
            {title}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">{subtitle}</p>
        </div>
      </div>
      <ItemList items={data} accent={accent} numbered={numbered} />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function AIGuidance({ profile, schemes }) {
  const [guidance, setGuidance]     = useState(null);
  const [rawResponse, setRawResponse] = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setGuidance(null);
    setRawResponse("");

    try {
      console.log("[AIGuidance] → Calling /generate-advice");
      console.log("[AIGuidance]   profile:", profile);
      console.log("[AIGuidance]   schemes count:", schemes?.length);

      const data = await generateAdvice(profile, schemes);
      console.log("[AIGuidance] ← Raw API response:", JSON.stringify(data, null, 2));

      if (!data || typeof data !== "object") {
        throw new Error("API returned a non-object response.");
      }

      // Support both new {guidance:{...}} and old {advice:{...}} shapes
      let g = data.guidance ?? data.advice ?? null;
      console.log("[AIGuidance]   resolved guidance object:", g);

      // If the old backend returned advice as a plain string, wrap it
      if (typeof g === "string") {
        console.warn("[AIGuidance]   guidance is a string — wrapping in fallback structure");
        g = {
          best_strategy: ["See AI advice below for recommended schemes."],
          why_you_qualify: [g],
          documents_to_prepare: [],
          important_tips: [],
        };
      }

      if (!g || typeof g !== "object") {
        console.error("[AIGuidance]   guidance is missing/invalid:", g);
        throw new Error("Backend returned no guidance. Please restart the backend server.");
      }

      console.log("[AIGuidance]   best_strategy       :", g.best_strategy);
      console.log("[AIGuidance]   why_you_qualify      :", g.why_you_qualify);
      console.log("[AIGuidance]   documents_to_prepare :", g.documents_to_prepare);
      console.log("[AIGuidance]   important_tips       :", g.important_tips);

      setGuidance(g);
      setRawResponse(data.raw_response ?? "");
    } catch (err) {
      console.error("[AIGuidance] Error:", err);
      setError(err.message || "Failed to generate advice. Check your GROQ_API_KEY.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setGuidance(null);
    setRawResponse("");
    setError(null);
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-sm shrink-0">
            🤖
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">AI Guidance</h3>
            <p className="text-[11px] text-slate-400 dark:text-slate-500">
              Powered by Groq LLaMA 3.3-70B
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!guidance && !loading && (
            <button
              onClick={handleGenerate}
              disabled={!schemes || schemes.length === 0}
              className="shrink-0 text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              ✨ Get AI Advice
            </button>
          )}
          {guidance && (
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium"
            >
              ↺ Regenerate
            </button>
          )}
          {error && (
            <button
              onClick={handleGenerate}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>

      <div className="p-6">

        {/* Idle */}
        {!guidance && !loading && !error && (
          <div className="rounded-xl border border-indigo-100 dark:border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-500/10 dark:to-violet-500/10 p-6 text-center">
            <div className="text-3xl mb-3">✨</div>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Get your personalised action plan
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              AI will tell you which schemes to apply first, why you qualify,
              which documents to prepare, and key deadline tips.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["🎯 Best Strategy", "✅ Why You Qualify", "📄 Documents", "💡 Tips"].map(
                (label) => (
                  <span
                    key={label}
                    className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/20 text-slate-500 dark:text-slate-400"
                  >
                    {label}
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100 dark:border-indigo-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin" />
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Groq AI is building your action plan…
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4">
            <p className="text-sm text-red-600 dark:text-red-300">
              <strong>Error:</strong> {error}
            </p>
            <p className="text-xs text-red-400 dark:text-red-500 mt-1">
              Open browser DevTools → Console for details. Check the backend terminal for Groq logs.
            </p>
          </div>
        )}

        {/* Result */}
        {guidance && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Generated by Groq LLaMA 3.3-70B
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {SECTIONS.map((section) => (
                <SectionCard
                  key={section.key}
                  section={section}
                  data={guidance[section.key]}
                />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
