-- BYA Flow — Phase 36 : supprimer une boutique
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase35_paiement_kkiapay.sql.
--
-- Aucune policy de suppression n'existait encore sur stores (seulement
-- select/insert/update pour les membres, Phase 2) — réservée aux
-- admins/propriétaires (jamais un simple membre), contrairement à la
-- création qui reste ouverte à tous les membres.
--
-- Les garde-fous réels (jamais la dernière boutique, jamais une boutique
-- qui a déjà des commandes — pour ne jamais perdre un historique financier
-- réel) sont appliqués côté application (lib/actions/store.ts), pas ici :
-- la RLS ne fait que dire QUI peut essayer, pas si c'est prudent de le
-- faire.

create policy "stores_delete_admin" on stores
  for delete using (is_org_admin(organization_id));
