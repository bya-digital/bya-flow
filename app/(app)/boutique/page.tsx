import { ExternalLink, HelpCircle, MessageSquareQuote, Palette, Store } from "lucide-react";
import Link from "next/link";
import { StoreForm } from "@/components/boutique/StoreForm";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentStore } from "@/lib/data/store";

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();

  return (
    <>
      <PageHeader
        title="Boutique"
        description="Configuration et personnalisation de votre boutique en ligne."
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Boutique mise à jour" />
        </div>
      )}

      {store ? (
        <div className="max-w-2xl space-y-4">
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Badge tone={store.is_active ? "success" : "neutral"}>
                  {store.is_active ? "Boutique publiée" : "Boutique non publiée"}
                </Badge>
                <span className="text-sm text-slate-500">/store/{store.slug}</span>
              </div>
              {store.is_active && (
                <Link
                  href={`/store/${store.slug}`}
                  target="_blank"
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  Voir ma boutique publique
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <p className="mb-3 text-sm font-semibold text-slate-900">Personnalisation</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  href="/boutique/apparence"
                  className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:border-brand-300 hover:bg-brand-50"
                >
                  <Palette className="h-4 w-4 text-brand-600" />
                  <span className="font-medium text-slate-900">Apparence</span>
                  <span className="text-xs text-slate-500">Bannière, couleur, réseaux sociaux</span>
                </Link>
                <Link
                  href="/boutique/temoignages"
                  className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:border-brand-300 hover:bg-brand-50"
                >
                  <MessageSquareQuote className="h-4 w-4 text-brand-600" />
                  <span className="font-medium text-slate-900">Témoignages</span>
                  <span className="text-xs text-slate-500">Avis affichés sur la boutique</span>
                </Link>
                <Link
                  href="/boutique/faq"
                  className="flex flex-col items-start gap-2 rounded-lg border border-slate-200 p-3 text-sm hover:border-brand-300 hover:bg-brand-50"
                >
                  <HelpCircle className="h-4 w-4 text-brand-600" />
                  <span className="font-medium text-slate-900">FAQ</span>
                  <span className="text-xs text-slate-500">Questions fréquentes</span>
                </Link>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <StoreForm store={store} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <EmptyState
          icon={Store}
          title="Aucune boutique trouvée"
          description="Reprenez l'onboarding pour créer votre première boutique."
        />
      )}
    </>
  );
}
