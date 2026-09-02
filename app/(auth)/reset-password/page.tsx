import { updatePassword } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/Alert";
import { Card, CardContent } from "@/components/ui/Card";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return (
    <Card>
      <CardContent className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nouveau mot de passe</h1>
          <p className="mt-1 text-sm text-slate-500">Choisissez un nouveau mot de passe.</p>
        </div>

        {searchParams.error && (
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        )}

        <form action={updatePassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="text-sm font-medium text-slate-700">
              Nouveau mot de passe
            </label>
            <PasswordInput
              id="password"
              name="password"
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <div>
            <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">
              Confirmer le mot de passe
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <SubmitButton pendingText="Mise à jour..." className="w-full">
            Mettre à jour le mot de passe
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
