import Link from "next/link";
import { requestPasswordReset } from "@/lib/actions/auth";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string; message?: string };
}) {
  return (
    <Card>
      <CardContent className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Mot de passe oublié</h1>
          <p className="mt-1 text-sm text-slate-500">
            Recevez un lien pour réinitialiser votre mot de passe.
          </p>
        </div>

        {searchParams.error && (
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        )}
        {searchParams.message && (
          <Alert tone="success" title="Email envoyé" description={searchParams.message} />
        )}

        <form action={requestPasswordReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
            />
          </div>
          <Button type="submit" className="w-full">
            Envoyer le lien
          </Button>
        </form>

        <p className="text-center text-sm text-slate-500">
          <Link href="/login" className="font-medium text-brand-600 hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
