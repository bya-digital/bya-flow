import Link from "next/link";
import { signupCustomer } from "@/lib/actions/customerAuth";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export default async function StoreSignupPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string; message?: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Créer un compte</h1>
      <p className="mt-1 text-sm text-slate-500">Suivez vos commandes chez {store.name}.</p>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}
      {searchParams.message && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {searchParams.message}
        </p>
      )}

      <form action={signupCustomer} className="mt-6 space-y-4">
        <input type="hidden" name="storeSlug" value={store.slug} />

        <div>
          <label htmlFor="fullName" className={labelClasses}>
            Nom complet
          </label>
          <input id="fullName" name="fullName" required className={inputClasses} />
        </div>
        <div>
          <label htmlFor="email" className={labelClasses}>
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClasses} />
        </div>
        <div>
          <label htmlFor="password" className={labelClasses}>
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="confirmPassword" className={labelClasses}>
            Confirmer le mot de passe
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            className={inputClasses}
          />
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
        >
          Créer mon compte
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Déjà un compte ?{" "}
        <Link
          href={`/store/${store.slug}/compte/connexion`}
          className="font-medium text-brand-600 hover:underline"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
