import { Key, Trash2, Webhook } from "lucide-react";
import { notFound } from "next/navigation";
import { CreateApiKeyForm } from "@/components/developpeurs/CreateApiKeyForm";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { revokeApiKey } from "@/lib/actions/apiKeys";
import { createWebhook, deleteWebhook, toggleWebhook } from "@/lib/actions/webhooks";
import { getApiKeys } from "@/lib/data/apiKeys";
import { getCurrentMembership } from "@/lib/data/team";
import { getWebhooks } from "@/lib/data/webhooks";

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function DeveloppeursPage({
  searchParams,
}: {
  searchParams: { error?: string; success?: string };
}) {
  const membership = await getCurrentMembership();
  if (!membership) notFound();
  if (membership.role === "member") notFound();

  const [apiKeys, webhooks] = await Promise.all([
    getApiKeys(membership.organizationId),
    getWebhooks(membership.organizationId),
  ]);

  const activeKeys = apiKeys.filter((key) => !key.revokedAt);

  return (
    <>
      <PageHeader
        title="Développeurs"
        description="Clés API et webhooks pour connecter BYA Flow à vos propres outils."
      />

      {searchParams.error && (
        <Alert tone="danger" title="Erreur" description={searchParams.error} className="mb-6" />
      )}
      {searchParams.success === "webhook" && (
        <Alert tone="success" title="Webhook créé" className="mb-6" />
      )}

      <Alert
        tone="info"
        className="mb-6"
        title="API en lecture seule (v1)"
        description="Produits et commandes uniquement pour l'instant, avec un seul événement de webhook (nouvelle commande). Base URL : https://bya-flow.vercel.app/api/v1 — en-tête Authorization: Bearer <clé API>."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardContent className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Key className="h-4 w-4" /> Clés API
            </h2>

            {activeKeys.length === 0 ? (
              <EmptyState
                icon={Key}
                title="Aucune clé"
                description="Créez une clé pour appeler l'API depuis vos propres outils."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {activeKeys.map((key) => (
                  <li key={key.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{key.name}</p>
                      <p className="text-xs text-slate-500">
                        {key.keyPrefix}… · {key.scopes.join(", ")}
                      </p>
                      <p className="text-xs text-slate-400">
                        Créée le {dateFormatter.format(new Date(key.createdAt))}
                        {key.lastUsedAt &&
                          ` · dernière utilisation le ${dateFormatter.format(new Date(key.lastUsedAt))}`}
                      </p>
                    </div>
                    <form action={revokeApiKey}>
                      <input type="hidden" name="keyId" value={key.id} />
                      <button
                        type="submit"
                        className="shrink-0 text-slate-400 hover:text-red-600"
                        aria-label="Révoquer la clé"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-900">Nouvelle clé</p>
              <div className="mt-3">
                <CreateApiKeyForm />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Webhook className="h-4 w-4" /> Webhooks
            </h2>

            {webhooks.length === 0 ? (
              <EmptyState
                icon={Webhook}
                title="Aucun webhook"
                description="Recevez une notification sur votre URL à chaque nouvelle commande."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {webhooks.map((webhook) => (
                  <li key={webhook.id} className="space-y-2 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-slate-900">{webhook.url}</p>
                      <Badge tone={webhook.isActive ? "success" : "neutral"}>
                        {webhook.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500">
                      Événement : {webhook.event} · Signature : <code>{webhook.secret}</code>
                    </p>
                    <div className="flex gap-3">
                      <form action={toggleWebhook}>
                        <input type="hidden" name="webhookId" value={webhook.id} />
                        <input type="hidden" name="isActive" value={String(webhook.isActive)} />
                        <button type="submit" className="text-xs font-medium text-brand-600 hover:underline">
                          {webhook.isActive ? "Désactiver" : "Activer"}
                        </button>
                      </form>
                      <form action={deleteWebhook}>
                        <input type="hidden" name="webhookId" value={webhook.id} />
                        <button type="submit" className="text-xs font-medium text-red-600 hover:underline">
                          Supprimer
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <form action={createWebhook} className="space-y-3 border-t border-slate-100 pt-4">
              <p className="text-sm font-medium text-slate-900">Nouveau webhook</p>
              <div>
                <label htmlFor="url" className="text-sm font-medium text-slate-700">
                  URL (déclenchée à chaque nouvelle commande)
                </label>
                <input
                  id="url"
                  name="url"
                  type="url"
                  required
                  placeholder="https://..."
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
                />
              </div>
              <Button type="submit">Ajouter</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
