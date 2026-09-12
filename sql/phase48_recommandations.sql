-- BYA Flow — Phase 48 : Recommandations produits
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase47_affiliation.sql.
--
-- Directive Section 22 : recommandations basées sur les VRAIES commandes
-- passées (produits réellement achetés ensemble), jamais un algorithme
-- inventé ou un tri aléatoire présenté comme une recommandation.
--
-- SECURITY DEFINER car appelée depuis la boutique publique (visiteur
-- anonyme) : orders/order_items ne sont normalement lisibles que par
-- leur propriétaire, mais cette fonction ne renvoie jamais rien
-- d'individuel — seulement des paires (produit, nombre de commandes
-- où les deux apparaissent ensemble), une agrégation qui ne permet
-- de remonter à aucune commande ou client précis.
create or replace function get_related_products(p_product_id uuid, p_limit integer default 4)
returns table (
  product_id uuid,
  co_purchase_count bigint
)
language sql
security definer
set search_path = public
stable
as $$
  select oi2.product_id, count(distinct oi1.order_id) as co_purchase_count
  from order_items oi1
  join order_items oi2 on oi2.order_id = oi1.order_id and oi2.product_id <> oi1.product_id
  join products p2 on p2.id = oi2.product_id and p2.status = 'active'
  where oi1.product_id = p_product_id
  group by oi2.product_id
  order by co_purchase_count desc, oi2.product_id
  limit p_limit;
$$;
