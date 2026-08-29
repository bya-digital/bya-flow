// Moteur de recommandations "Opportunités de croissance" : entièrement basé
// sur des règles appliquées aux données réelles de la boutique (aucun appel
// à un fournisseur IA, aucune donnée inventée). Voir lib/ai/index.ts pour
// l'architecture IA abstraite utilisée pour la génération de texte.

import { getCurrentStore } from "@/lib/data/store";
import { createClient } from "@/lib/supabase/server";

export interface GrowthOpportunity {
  id: string;
  category: string;
  title: string;
  description: string;
  href: string;
}

interface CartRow {
  id: string;
  status: string;
  customers: { full_name: string } | null;
}

interface SoldItemRow {
  product_id: string | null;
}

export async function getGrowthOpportunities(): Promise<GrowthOpportunity[]> {
  const store = await getCurrentStore();
  if (!store) return [];

  const supabase = createClient();
  const opportunities: GrowthOpportunity[] = [];

  const inactivityThreshold = new Date();
  inactivityThreshold.setDate(inactivityThreshold.getDate() - 60);
  const salesWindow = new Date();
  salesWindow.setDate(salesWindow.getDate() - 30);

  const [customersRes, ordersRes, cartsRes, productsRes, soldItemsRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, full_name, created_at")
      .eq("organization_id", store.organization_id),
    supabase.from("orders").select("customer_id, created_at").eq("store_id", store.id),
    supabase
      .from("carts")
      .select("id, status, customers(full_name)")
      .eq("store_id", store.id)
      .in("status", ["active", "abandoned"])
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("products")
      .select("id, name, stock")
      .eq("store_id", store.id)
      .eq("status", "active")
      .gt("stock", 0),
    supabase
      .from("order_items")
      .select("product_id, order:orders!inner(store_id, created_at)")
      .eq("order.store_id", store.id)
      .gte("order.created_at", salesWindow.toISOString()),
  ]);

  // 1. Clients à réactiver : pas de commande depuis 60 jours (ou jamais
  // commandé alors qu'ils sont enregistrés depuis plus de 60 jours).
  const lastOrderByCustomer = new Map<string, string>();
  for (const order of ordersRes.data ?? []) {
    if (!order.customer_id) continue;
    const current = lastOrderByCustomer.get(order.customer_id);
    if (!current || order.created_at > current) {
      lastOrderByCustomer.set(order.customer_id, order.created_at);
    }
  }

  const inactiveCustomers = (customersRes.data ?? [])
    .filter((customer) => {
      const referenceDate = lastOrderByCustomer.get(customer.id) ?? customer.created_at;
      return new Date(referenceDate) < inactivityThreshold;
    })
    .slice(0, 3);

  for (const customer of inactiveCustomers) {
    opportunities.push({
      id: `customer-${customer.id}`,
      category: "Client à réactiver",
      title: customer.full_name,
      description: lastOrderByCustomer.has(customer.id)
        ? "Aucune commande depuis plus de 60 jours."
        : "Enregistré depuis plus de 60 jours, sans avoir encore commandé.",
      href: `/clients/${customer.id}`,
    });
  }

  // 2. Paniers à récupérer : actifs ou abandonnés, pas encore convertis.
  for (const cart of (cartsRes.data ?? []) as unknown as CartRow[]) {
    opportunities.push({
      id: `cart-${cart.id}`,
      category: "Panier à récupérer",
      title: cart.customers?.full_name ?? "Client non renseigné",
      description:
        cart.status === "abandoned"
          ? "Panier marqué comme abandonné."
          : "Panier en cours, pas encore transformé en commande.",
      href: `/paniers-abandonnes/${cart.id}`,
    });
  }

  // 3. Produits à promouvoir : en stock, actifs, sans vente depuis 30 jours.
  const soldProductIds = new Set(
    ((soldItemsRes.data ?? []) as unknown as SoldItemRow[])
      .map((row) => row.product_id)
      .filter((id): id is string => Boolean(id))
  );

  const productsToPromote = (productsRes.data ?? [])
    .filter((product) => !soldProductIds.has(product.id))
    .slice(0, 3);

  for (const product of productsToPromote) {
    opportunities.push({
      id: `product-${product.id}`,
      category: "Produit à promouvoir",
      title: product.name,
      description: `En stock (${product.stock} unité(s)) mais aucune vente sur les 30 derniers jours.`,
      href: `/produits/${product.id}`,
    });
  }

  return opportunities;
}
