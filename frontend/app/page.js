"use client";

import { useState, useRef } from "react";
import InputForm from "../components/InputForm";
import ProfileSummary from "../components/ProfileSummary";
import EligibilityInsights from "../components/EligibilityInsights";
import TopRecommendation from "../components/TopRecommendation";
import SchemesList from "../components/SchemesList";
import AIGuidance from "../components/AIGuidance";
import LetterGenerator from "../components/LetterGenerator";
import { checkEligibility } from "../lib/api";

const TRUST_STATS = [
  { value: "110+", label: "Schemes" },
  { value: "₹2.5L", label: "Max Benefit" },
  { value: "36", label: "States & UTs" },
  { value: "< 2s", label: "Result Time" },
];

const HOW_STEPS = [
  {
    step: "01",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
    title: "Fill Your Profile",
    desc: "Enter your income, category, state, education level, and gender. Takes under 30 seconds.",
    color: "indigo",
  },
  {
    step: "02",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Instant Match & Score",
    desc: "Our engine scans 110+ schemes and ranks every eligible one by benefit, urgency, and profile fit.",
    color: "violet",
  },
  {
    step: "03",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: "AI Guides & Writes",
    desc: "Groq LLaMA explains your eligibility, prioritises schemes, and generates a formal application letter.",
    color: "emerald",
  },
];

const COLOR = {
  indigo: { bg: "bg-indigo-50 dark:bg-indigo-500/10", icon: "bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400", step: "text-indigo-200 dark:text-indigo-800", border: "border-indigo-100 dark:border-indigo-500/20" },
  violet: { bg: "bg-violet-50 dark:bg-violet-500/10", icon: "bg-violet-100 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400", step: "text-violet-200 dark:text-violet-800", border: "border-violet-100 dark:border-violet-500/20" },
  emerald:{ bg: "bg-emerald-50 dark:bg-emerald-500/10", icon: "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400", step: "text-emerald-200 dark:text-emerald-800", border: "border-emerald-100 dark:border-emerald-500/20" },
};

export default function HomePage() {
  const [profile, setProfile]       = useState(null);
  const [results, setResults]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [letterScheme, setLetterScheme] = useState(null);
  const resultsRef = useRef(null);

  async function handleSubmit(formData) {
    setLoading(true);
    setError(null);
    setResults(null);
    setLetterScheme(null);
    setProfile(formData);
    try {
      const data = await checkEligibility(formData);
      setResults(data);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 150);
    } catch (err) {
      setError(err.message || "Failed to reach the backend. Make sure the Python server is running.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setProfile(null);
    setResults(null);
    setError(null);
    setLetterScheme(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleGenerateLetter(scheme) {
    setLetterScheme(scheme);
    setTimeout(() => {
      document.getElementById("letter-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  }

  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-violet-950">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-violet-600/25 blur-3xl" />
        {/* Dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }}
        />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left — headline */}
            <div className="text-white">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 rounded-full px-4 py-1.5 text-sm font-medium mb-7">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                AI-Powered · Updated 2025–26
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold leading-[1.1] tracking-tight mb-5">
                Find Every
                <br />
                <span className="bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 bg-clip-text text-transparent">
                  Scholarship
                </span>
                <br />
                You Deserve
              </h1>

              <p className="text-lg text-slate-300 leading-relaxed mb-8 max-w-lg">
                Instantly match with 110+ government &amp; private scholarship schemes across India —
                then let AI guide you through applying.
              </p>

              {/* Feature chips */}
              <div className="flex flex-wrap gap-3 mb-10">
                {[
                  { icon: "🏛️", text: "Central & State Govt" },
                  { icon: "🤖", text: "Groq LLaMA 3.3" },
                  { icon: "📄", text: "Auto Letter Writer" },
                ].map(({ icon, text }) => (
                  <span key={text} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/10 rounded-full px-3.5 py-1.5 text-sm text-slate-200">
                    <span>{icon}</span>{text}
                  </span>
                ))}
              </div>

              {/* Trust stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TRUST_STATS.map(({ value, label }) => (
                  <div key={label} className="bg-white/[0.07] border border-white/10 rounded-2xl px-4 py-3 text-center backdrop-blur-sm">
                    <p className="text-2xl font-extrabold text-white">{value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — form */}
            <div className="w-full">
              <InputForm onSubmit={handleSubmit} loading={loading} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Error ─── */}
      {error && (
        <div className="max-w-3xl mx-auto px-4 mt-8">
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-2xl p-4 text-red-700 dark:text-red-300 text-sm flex gap-3 items-start">
            <span className="text-lg shrink-0">⚠️</span>
            <div><strong>Error:</strong> {error}</div>
          </div>
        </div>
      )}

      {/* ─── Results ─── */}
      {results && profile && (
        <section ref={resultsRef} className="max-w-5xl mx-auto px-4 pb-20 pt-12 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Your Results</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                {results.total_count} scholarship{results.total_count !== 1 ? "s" : ""} matched your profile
              </p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Start Over
            </button>
          </div>

          {results.total_count > 0 && (
            <TopRecommendation schemes={results.eligible_schemes} profile={profile} onGenerateLetter={handleGenerateLetter} />
          )}
          <ProfileSummary profile={profile} />
          <EligibilityInsights totalCount={results.total_count} totalBenefit={results.total_estimated_benefit} />
          <SchemesList schemes={results.eligible_schemes} profile={profile} onSelectForLetter={handleGenerateLetter} />
          <AIGuidance profile={profile} schemes={results.eligible_schemes} />
          <LetterGenerator profile={profile} schemes={results.eligible_schemes} preSelectedScheme={letterScheme} />
        </section>
      )}

      {/* ─── How It Works (only before results) ─── */}
      {!results && !loading && (
        <section className="max-w-5xl mx-auto px-4 py-20">
          {/* Section label */}
          <div className="text-center mb-14">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-full px-4 py-1.5 mb-4">
              How It Works
            </span>
            <h2 className="text-3xl font-extrabold text-slate-800 dark:text-white">
              From profile to application
              <br />
              <span className="text-slate-400 dark:text-slate-500 font-medium text-2xl">in three simple steps</span>
            </h2>
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-6 relative">
            {/* Connecting line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+1rem)] right-[calc(16.66%+1rem)] h-px bg-gradient-to-r from-indigo-200 via-violet-200 to-emerald-200 dark:from-indigo-500/30 dark:via-violet-500/30 dark:to-emerald-500/30" />

            {HOW_STEPS.map(({ step, icon, title, desc, color }) => {
              const c = COLOR[color];
              return (
                <div key={step} className={`relative rounded-2xl p-6 border ${c.bg} ${c.border}`}>
                  {/* Step number (decorative) */}
                  <span className={`absolute top-4 right-5 text-5xl font-black select-none ${c.step}`}>
                    {step}
                  </span>
                  {/* Icon circle */}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${c.icon}`}>
                    {icon}
                  </div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base mb-2">{title}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
                </div>
              );
            })}
          </div>

          {/* Bottom CTA nudge */}
          <div className="mt-14 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">
              Ready? Fill your profile above and get your results instantly.
            </p>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
              </svg>
              Back to top
            </button>
          </div>
        </section>
      )}
    </>
  );
}
