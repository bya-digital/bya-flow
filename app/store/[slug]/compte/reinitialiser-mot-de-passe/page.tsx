import { notFound } from "next/navigation";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { updatePassword } from "@/lib/actions/auth";
import { getPublicStoreBySlug } from "@/lib/data/publicStore";

const inputClasses =
  "mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400";
const labelClasses = "text-sm font-medium text-slate-700";

export default async function StoreResetPasswordPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { error?: string };
}) {
  const store = await getPublicStoreBySlug(params.slug);
  if (!store) notFound();

  const errorRedirect = `/store/${store.slug}/compte/reinitialiser-mot-de-passe`;

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-900">Nouveau mot de passe</h1>
      <p className="mt-1 text-sm text-slate-500">Choisissez un nouveau mot de passe.</p>

      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {searchParams.error}
        </p>
      )}

      <form action={updatePassword} className="mt-6 space-y-4">
        <input type="hidden" name="redirect" value={`/store/${store.slug}/compte`} />
        <input type="hidden" name="errorRedirect" value={errorRedirect} />
        <div>
          <label htmlFor="password" className={labelClasses}>
            Nouveau mot de passe
          </label>
          <PasswordInput id="password" name="password" required minLength={6} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="confirmPassword" className={labelClasses}>
            Confirmer le mot de passe
          </label>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            required
            minLength={6}
            className={inputClasses}
          />
        </div>
        <SubmitButton pendingText="Mise à jour..." className="w-full">
          Mettre à jour le mot de passe
        </SubmitButton>
      </form>
    </div>
  );
}
