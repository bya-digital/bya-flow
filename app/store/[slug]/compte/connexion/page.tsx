import Link from "next/link";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { loginCustomer } from "@/lib/actions/customerAuth";
import { getPublicCart } from "@/lib/data/publicCart";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export default async function StoreLoginPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) return null;

  // Panier anonyme éventuel avant la connexion : transmis pour être
  // fusionné avec celui du compte (le changement de session lui ferait
  // sinon perdre son panier en cours).
  const cart = await getPublicCart(store.id);

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Connexion</h1>
      <p className="mt-1 text-sm text-slate-500">Accédez à votre espace {store.name}.</p>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <form action={loginCustomer} className="mt-6 space-y-4">
        <input type="hidden" name="storeSlug" value={store.slug} />
        <input type="hidden" name="storeId" value={store.id} />
        <input type="hidden" name="previousCartId" value={cart.id ?? ""} />

        <div>
          <label htmlFor="email" className={labelClasses}>
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClasses} />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="password" className={labelClasses}>
              Mot de passe
            </label>
            <Link
              href={`/store/${store.slug}/compte/mot-de-passe-oublie`}
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              Mot de passe oublié ?
            </Link>
          </div>
          <PasswordInput id="password" name="password" required className={inputClasses} />
        </div>

        <SubmitButton pendingText="Connexion..." className="w-full">
          Se connecter
        </SubmitButton>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        Pas encore de compte ?{" "}
        <Link
          href={`/store/${store.slug}/compte/inscription`}
          className="font-medium text-brand-600 hover:underline"
        >
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
