"use client";

import { useState, useEffect } from "react";
import { generateLetter } from "../lib/api";

export default function LetterGenerator({ profile, schemes, preSelectedScheme }) {
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // When the Top Recommendation card triggers "Generate Letter", pre-fill the selector
  useEffect(() => {
    if (preSelectedScheme) {
      setSelectedScheme(preSelectedScheme);
      setLetter(null);
    }
  }, [preSelectedScheme]);

  async function handleGenerate() {
    if (!selectedScheme) return;
    setLoading(true);
    setError(null);
    setLetter(null);
    try {
      const data = await generateLetter(profile, selectedScheme);
      setLetter(data.letter);
    } catch (err) {
      setError(err.message || "Failed to generate letter. Check your GROQ_API_KEY.");
    } finally {
      setLoading(false);
    }
  }

  function handleCopy() {
    if (!letter) return;
    navigator.clipboard.writeText(letter).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    if (!letter) return;
    const blob = new Blob([letter], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ScholarPath_Application_Letter_${selectedScheme?.scheme_id || "letter"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!schemes || schemes.length === 0) return null;

  return (
    <div id="letter-section" className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center text-sm shrink-0">✉️</div>
        <div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-white">Application Letter Generator</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Let AI write a formal application letter for you</p>
        </div>
      </div>

      <div className="p-6">
      {/* Scheme selector */}
      <div className="mb-4">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
          Select Scholarship
        </label>
        <select
          value={selectedScheme ? JSON.stringify(selectedScheme) : ""}
          onChange={(e) => {
            setSelectedScheme(e.target.value ? JSON.parse(e.target.value) : null);
            setLetter(null);
          }}
          className="w-full rounded-xl px-4 py-3 text-sm border bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-900 dark:border-slate-600 dark:text-white transition-all"
        >
          <option value="">— Choose a scheme —</option>
          {schemes.map((s, i) => (
            <option key={s.scheme_id || i} value={JSON.stringify(s)}>
              {s.scheme_name?.trim() || `Scheme ${i + 1}`}
            </option>
          ))}
        </select>
      </div>

      {/* Selected scheme preview */}
      {selectedScheme && (
        <div className="mb-4 p-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl border border-indigo-100 dark:border-indigo-500/20">
          <div className="flex items-start gap-2">
            <span className="text-indigo-500 mt-0.5">✓</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 truncate">
                {selectedScheme.scheme_name?.trim()}
              </p>
              <p className="text-xs text-indigo-500 dark:text-indigo-400">
                {selectedScheme.provider_name} · {selectedScheme.benefit_type} · ₹{selectedScheme.benefit_amount || "Varies"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Generate button */}
      {!letter && (
        <button
          onClick={handleGenerate}
          disabled={!selectedScheme || loading}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Writing Letter…
            </span>
          ) : (
            "✉️ Generate Application Letter"
          )}
        </button>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 text-sm text-red-600 dark:text-red-300">
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Letter output */}
      {letter && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Letter Ready
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {copied ? "✓ Copied!" : "📋 Copy"}
              </button>
              <button
                onClick={handleDownload}
                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
              >
                ⬇ Download
              </button>
              <button
                onClick={() => setLetter(null)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 underline"
              >
                Regenerate
              </button>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 p-5 overflow-auto max-h-[500px]">
            <pre className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed font-serif">
              {letter}
            </pre>
          </div>

          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            * Replace placeholders like [Student Name], [Institution Name], and [Date] before submitting.
          </p>
        </div>
      )}
      </div>
    </div>
  );
}
