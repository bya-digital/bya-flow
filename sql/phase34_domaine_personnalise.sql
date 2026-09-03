-- BYA Flow — Phase 34 : domaine personnalisé (v1)
-- À exécuter dans l'éditeur SQL du projet Supabase "BYA FLOW", après phase33_pos.sql.
--
-- Modèle "domaine propre du marchand" (pas de sous-domaine bya-flow.xxx —
-- aucun domaine racine BYA Digital n'est encore disponible pour ça).
-- Volontairement pas d'appel à l'API Domaines de Vercel dans cette
-- première tranche (nécessiterait un jeton Vercel non encore fourni) :
-- le marchand soumet son domaine dans l'app, BYA Digital l'ajoute
-- manuellement au projet Vercel puis le marque vérifié — l'app fait déjà
-- tout le travail de routage, seul le rattachement Vercel est manuel.

alter table stores add column if not exists custom_domain text unique;
alter table stores add column if not exists custom_domain_verified_at timestamptz;

-- Le custom_domain d'une boutique doit être lisible publiquement au même
-- titre que son slug (le middleware en a besoin, sans session, pour
-- savoir vers quelle boutique réécrire une requête arrivée sur ce nom
-- d'hôte) — déjà couvert par la policy publique existante sur stores
-- (stores_select_public, Phase 16 : n'importe quelle colonne d'une
-- boutique active est déjà lisible sans authentification), donc aucune
-- nouvelle policy de lecture n'est nécessaire ici.

-- BYA Digital doit pouvoir marquer un domaine vérifié après l'avoir
-- rattaché manuellement au projet Vercel (aucune policy d'update sur
-- stores n'existait encore pour les admins plateforme, seulement pour
-- les membres de l'organisation — même principe que
-- subscriptions_update_platform_admin, Phase 15).
create policy "stores_update_platform_admin" on stores
  for update using (is_platform_admin());
