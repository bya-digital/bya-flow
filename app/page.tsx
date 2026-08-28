import Link from "next/link";

const features = [
  {
    title: "Campagnes",
    description: "Créez et planifiez vos campagnes email et réseaux sociaux depuis un seul endroit.",
  },
  {
    title: "Contacts & segments",
    description: "Centralisez vos contacts et segmentez votre audience pour des messages ciblés.",
  },
  {
    title: "Automations",
    description: "Déclenchez des séquences marketing automatiques selon le comportement des contacts.",
  },
  {
    title: "Analytics",
    description: "Suivez ouvertures, clics et conversions pour piloter vos décisions.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-brand-600">BYA Flow</span>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="#features">Fonctionnalités</Link>
            <Link href="/dashboard">Tableau de bord</Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Le marketing en ligne, simplifié.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          BYA Flow réunit campagnes, contacts, automations et analytics dans une
          seule plateforme, pensée pour lancer et suivre vos actions marketing rapidement.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/dashboard"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-brand-700"
          >
            Accéder au tableau de bord
          </Link>
          <Link
            href="#features"
            className="rounded-lg border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Voir les fonctionnalités
          </Link>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
