import Link from "next/link";
import { notFound } from "next/navigation";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requestCustomerPasswordReset } from "@/lib/actions/customerAuth";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export default async function StoreForgotPasswordPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string; message?: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) notFound();

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Mot de passe oublié</h1>
      <p className="mt-1 text-sm text-slate-500">
        Recevez un lien pour réinitialiser votre mot de passe {store.name}.
      </p>

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

      <form action={requestCustomerPasswordReset} className="mt-6 space-y-4">
        <input type="hidden" name="storeSlug" value={store.slug} />
        <div>
          <label htmlFor="email" className={labelClasses}>
            Email
          </label>
          <input id="email" name="email" type="email" required className={inputClasses} />
        </div>
        <SubmitButton pendingText="Envoi..." className="w-full">
          Envoyer le lien
        </SubmitButton>
      </form>

      <p className="mt-4 text-center text-sm text-slate-500">
        <Link
          href={`/store/${store.slug}/compte/connexion`}
          className="font-medium text-brand-600 hover:underline"
        >
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
