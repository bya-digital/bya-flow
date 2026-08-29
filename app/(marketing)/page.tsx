import Image from "next/image";
import Link from "next/link";

const features = [
  {
    title: "Boutique & produits",
    description: "Gérez votre catalogue, vos stocks et vos prix depuis un seul endroit.",
  },
  {
    title: "Clients & CRM",
    description: "Centralisez prospects et clients, suivez leur historique et segmentez-les.",
  },
  {
    title: "Marketing & automatisations",
    description: "Lancez des campagnes, récupérez vos paniers abandonnés, automatisez vos relances.",
  },
  {
    title: "Analytics & IA",
    description: "Suivez vos performances et recevez des recommandations de croissance.",
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <span className="flex items-center gap-2 text-xl font-bold text-brand-600">
            <Image
              src="/logo-mark.png"
              alt=""
              width={32}
              height={32}
              unoptimized
              className="rounded-lg"
            />
            BYA Flow
          </span>
          <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="#features" className="hidden sm:inline">
              Fonctionnalités
            </Link>
            <Link href="/login">Connexion</Link>
            <Link
              href="/signup"
              className="rounded-lg bg-brand-600 px-4 py-2 text-white hover:bg-brand-700"
            >
              Commencer
            </Link>
          </nav>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto mb-10 w-48 overflow-hidden rounded-2xl shadow-lg sm:w-56">
          <Image
            src="/logo-full.png"
            alt="BYA Flow — AI Commerce Growth OS"
            width={1000}
            height={900}
            priority
            unoptimized
            className="h-auto w-full"
          />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Le système de pilotage de votre croissance commerciale.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          BYA Flow réunit boutique, produits, commandes, clients, marketing et
          analytics dans un seul espace pour piloter et accélérer votre activité.
        </p>
        <div className="mt-10 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-brand-700"
          >
            Créer mon compte
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
