export default function EligibilityInsights({ totalCount, totalBenefit }) {
  const formattedBenefit = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(totalBenefit);

  const stats = [
    {
      icon: "🎯",
      label: "Eligible Schemes",
      value: String(totalCount),
      sub: totalCount === 1 ? "scheme found" : "schemes found",
      accent: "indigo",
    },
    {
      icon: "💰",
      label: "Total Estimated Benefit",
      value: formattedBenefit,
      sub: "combined per year",
      accent: "emerald",
    },
    {
      icon: "⚡",
      label: "Eligibility Strength",
      value: totalCount >= 10 ? "Strong" : totalCount >= 4 ? "Good" : totalCount > 0 ? "Moderate" : "None",
      sub: "based on your profile",
      accent: totalCount >= 4 ? "violet" : totalCount > 0 ? "amber" : "slate",
    },
  ];

  const ACCENT = {
    indigo: { bar: "bg-indigo-500", text: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-100 dark:border-indigo-500/20" },
    emerald:{ bar: "bg-emerald-500",text: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-50 dark:bg-emerald-500/10",border: "border-emerald-100 dark:border-emerald-500/20"},
    violet: { bar: "bg-violet-500", text: "text-violet-600 dark:text-violet-400", bg: "bg-violet-50 dark:bg-violet-500/10", border: "border-violet-100 dark:border-violet-500/20" },
    amber:  { bar: "bg-amber-500",  text: "text-amber-600 dark:text-amber-400",  bg: "bg-amber-50 dark:bg-amber-500/10",  border: "border-amber-100 dark:border-amber-500/20"  },
    slate:  { bar: "bg-slate-400",  text: "text-slate-600 dark:text-slate-400",  bg: "bg-slate-50 dark:bg-slate-800",     border: "border-slate-200 dark:border-slate-700"      },
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm shrink-0">📊</div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Eligibility Insights</h3>
      </div>

      <div className="grid sm:grid-cols-3 gap-px bg-slate-100 dark:bg-slate-700">
        {stats.map(({ icon, label, value, sub, accent }) => {
          const a = ACCENT[accent];
          return (
            <div key={label} className="bg-white dark:bg-slate-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{icon}</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{label}</span>
              </div>
              <p className={`text-2xl font-extrabold tracking-tight ${a.text}`}>{value}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{sub}</p>
            </div>
          );
        })}
      </div>

      {totalCount === 0 && (
        <div className="mx-6 mb-6 mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/50 rounded-xl text-sm text-amber-700 dark:text-amber-300">
          No schemes matched your profile. Try adjusting your income, category, or state — many schemes have broad eligibility.
        </div>
      )}
    </div>
  );
}
