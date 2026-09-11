import { PaymentProviderCard } from "@/components/paiements/PaymentProviderCard";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { CreditCard } from "lucide-react";
import { getCurrentMembership } from "@/lib/data/team";
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
  const membership = await getCurrentMembership();
  const canManage = membership?.role !== "member";

  // Depuis Phase 35B, payment_providers (avec les clés API) n'est plus
  // lisible que par les admin/propriétaire (RLS) — un simple membre
  // passe par get_store_active_payment_providers(), qui ne renvoie
  // jamais la config, seulement actif/inactif.
  let rows: PaymentProviderRow[] = [];
  const activeByProvider = new Map<PaymentProviderId, boolean>();
  if (store) {
    const supabase = createClient();
    if (canManage) {
      const { data } = await supabase
        .from("payment_providers")
        .select("provider, is_active, config")
        .eq("store_id", store.id);
      rows = data ?? [];
    } else {
      const { data } = await supabase.rpc("get_store_active_payment_providers", {
        p_store_id: store.id,
      });
      for (const row of (data ?? []) as { provider: PaymentProviderId; is_active: boolean }[]) {
        activeByProvider.set(row.provider, row.is_active);
      }
    }
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
            title="Kkiapay est réellement connecté"
            description="Une fois activé ci-dessous, vos clients paient réellement via Kkiapay au checkout et la commande passe à « Payé » automatiquement après vérification serveur. Les autres fournisseurs restent une architecture prête, pas encore branchée : leurs commandes continuent d'être enregistrées en attente de paiement."
            className="mb-6"
          />

          <div className="grid gap-4 sm:grid-cols-2">
            {providers.map((provider) => {
              const row = rowByProvider.get(provider.id);
              const nonSecretConfig = Object.fromEntries(
                provider.fields
                  .filter((field) => field.type === "checkbox")
                  .map((field) => [field.key, row?.config[field.key] ?? "false"])
              );
              return (
                <PaymentProviderCard
                  key={provider.id}
                  provider={provider}
                  isConfigured={row ? provider.isConfigured(row.config) : false}
                  isActive={canManage ? (row?.is_active ?? false) : (activeByProvider.get(provider.id) ?? false)}
                  nonSecretConfig={nonSecretConfig}
                  canManage={canManage}
                />
              );
            })}
          </div>
        </>
      )}
    </>
  );
}
