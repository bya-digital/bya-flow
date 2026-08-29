import { PaymentProviderCard } from "@/components/paiements/PaymentProviderCard";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreditCard } from "lucide-react";
import { getCurrentStore } from "@/lib/data/store";
import { listPaymentProviders } from "@/lib/payments";
import type { PaymentConfig, PaymentProviderId } from "@/lib/payments/types";
import { createClient } from "@/lib/supabase/server";

interface PaymentProviderRow {
  provider: PaymentProviderId;
  is_active: boolean;
  config: PaymentConfig;
}

export default async function PaiementsPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const store = await getCurrentStore();

  let rows: PaymentProviderRow[] = [];
  if (store) {
    const supabase = createClient();
    const { data } = await supabase
      .from("payment_providers")
      .select("provider, is_active, config")
      .eq("store_id", store.id);
    rows = data ?? [];
  }

  const rowByProvider = new Map(rows.map((row) => [row.provider, row]));
  const providers = listPaymentProviders();

  return (
    <>
      <PageHeader
        title="Paiements"
        description="Fournisseurs de paiement disponibles pour encaisser vos clients."
      />

      {searchParams.error && (
        <div className="mb-4">
          <Alert tone="danger" title="Une erreur est survenue" description={searchParams.error} />
        </div>
      )}
      {searchParams.success && (
        <div className="mb-4">
          <Alert tone="success" title="Fournisseur mis à jour" />
        </div>
      )}

      {!store ? (
        <EmptyState
          icon={CreditCard}
          title="Aucune boutique trouvée"
          description="Reprenez l'onboarding pour créer votre première boutique."
        />
      ) : (
        <>
          <Alert
            tone="info"
            title="Aucun paiement en ligne n'est encore traité"
            description="Cet espace prépare la connexion à un vrai fournisseur (identifiants, activation). Tant qu'aucune intégration réelle n'est branchée, les commandes restent enregistrées en attente de paiement — jamais marquées payées automatiquement."
            className="mb-6"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {providers.map((provider) => {
              const row = rowByProvider.get(provider.id);
              return (
                <PaymentProviderCard
                  key={provider.id}
                  provider={provider}
                  isConfigured={row ? provider.isConfigured(row.config) : false}
                  isActive={row?.is_active ?? false}
                />
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
