const modules = [
  { name: "Campagnes", count: 0, hint: "aucune campagne pour le moment" },
  { name: "Contacts", count: 0, hint: "importez votre première liste" },
  { name: "Automations", count: 0, hint: "aucune automation active" },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
      <p className="mt-1 text-sm text-slate-600">
        Vue d&apos;ensemble de votre activité marketing.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {modules.map((mod) => (
          <div key={mod.name} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{mod.name}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{mod.count}</p>
            <p className="mt-1 text-xs text-slate-400">{mod.hint}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
