"use client";

import { useState } from "react";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Andaman and Nicobar Islands","Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir",
  "Ladakh","Lakshadweep","Puducherry",
];

const EDUCATION_LEVELS = [
  { label: "Class 1",  value: 1 },  { label: "Class 2",  value: 2 },
  { label: "Class 3",  value: 3 },  { label: "Class 4",  value: 4 },
  { label: "Class 5",  value: 5 },  { label: "Class 6",  value: 6 },
  { label: "Class 7",  value: 7 },  { label: "Class 8",  value: 8 },
  { label: "Class 9",  value: 9 },  { label: "Class 10", value: 10 },
  { label: "Class 11", value: 11 }, { label: "Class 12", value: 12 },
  { label: "Undergraduate (UG)", value: 13 },
  { label: "Postgraduate (PG)",  value: 14 },
  { label: "PhD / Research",     value: 15 },
];

const CATEGORIES = ["General", "OBC", "EBC", "SC", "ST", "DNT", "Minority"];

const DEFAULT = { income: "", category: "OBC", state: "", class_level: "", gender: "Male", is_disabled: false };

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}

const SELECT_CLS = "w-full rounded-xl px-4 py-2.5 text-sm border bg-white border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-900 dark:border-slate-600 dark:text-white transition-all appearance-none";
const INPUT_CLS  = "w-full rounded-xl px-4 py-2.5 text-sm border bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent dark:bg-slate-900 dark:border-slate-600 dark:text-white dark:placeholder-slate-500 transition-all";

export default function InputForm({ onSubmit, loading }) {
  const [form, setForm] = useState(DEFAULT);

  function handle(e) {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  }

  function submit(e) {
    e.preventDefault();
    onSubmit({
      income:      Number(form.income),
      category:    form.category,
      state:       form.state,
      class_level: Number(form.class_level),
      gender:      form.gender,
      is_disabled: form.is_disabled,
    });
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700">
      {/* Card header */}
      <div className="px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-lg">📋</div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-white text-base">Student Profile</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Fill in your details to discover all eligible scholarships
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={submit} className="px-6 py-5 space-y-4">
        {/* Income */}
        <Field label="Annual Family Income (₹)">
          <input type="number" name="income" value={form.income} onChange={handle}
            required min="0" placeholder="e.g. 150000" className={INPUT_CLS} />
        </Field>

        {/* Category + Gender */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <select name="category" value={form.category} onChange={handle} className={SELECT_CLS}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Gender">
            <select name="gender" value={form.gender} onChange={handle} className={SELECT_CLS}>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </Field>
        </div>

        {/* State */}
        <Field label="State / UT">
          <select name="state" value={form.state} onChange={handle} required className={SELECT_CLS}>
            <option value="" disabled>Select your state</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>

        {/* Education level */}
        <Field label="Current Education Level">
          <select name="class_level" value={form.class_level} onChange={handle} required className={SELECT_CLS}>
            <option value="" disabled>Select your level</option>
            {EDUCATION_LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
          </select>
        </Field>

        {/* Disability toggle */}
        <label className={`flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all select-none ${
          form.is_disabled
            ? "bg-indigo-50 border-indigo-300 dark:bg-indigo-500/15 dark:border-indigo-500"
            : "bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-900/50 dark:border-slate-700"
        }`}>
          <input type="checkbox" name="is_disabled" checked={form.is_disabled} onChange={handle}
            className="w-4 h-4 accent-indigo-600 rounded shrink-0" />
          <div>
            <span className="block text-sm font-semibold text-slate-800 dark:text-white">
              Person with Disability (PwD)
            </span>
            <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Unlocks additional disability-specific schemes
            </span>
          </div>
        </label>

        {/* Submit */}
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all
            bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500
            shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Checking Eligibility…
            </span>
          ) : "Find My Scholarships →"}
        </button>
      </form>
    </div>
  );
}
