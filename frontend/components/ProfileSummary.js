function classLabel(level) {
  if (level === 13) return "Undergraduate (UG)";
  if (level === 14) return "Postgraduate (PG)";
  if (level === 15) return "PhD / Research";
  return `Class ${level}`;
}

export default function ProfileSummary({ profile }) {
  const fields = [
    { icon: "💰", label: "Income",     value: `₹${Number(profile.income).toLocaleString("en-IN")} / yr` },
    { icon: "🏷️", label: "Category",   value: profile.category },
    { icon: "📍", label: "State",       value: profile.state },
    { icon: "🎓", label: "Level",       value: classLabel(profile.class_level) },
    { icon: "👤", label: "Gender",      value: profile.gender },
    { icon: "♿", label: "PwD Status", value: profile.is_disabled ? "Yes — PwD" : "No" },
  ];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-sm shrink-0">
          👤
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Profile Summary</h3>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-px bg-slate-100 dark:bg-slate-700">
        {fields.map(({ icon, label, value }) => (
          <div key={label} className="bg-white dark:bg-slate-800 px-5 py-4">
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">{icon} {label}</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white truncate" title={value}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
