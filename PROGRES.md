# Progrès — BYA Flow

## 2026-08-28 — Initialisation du projet

- Dossier de développement créé : Next.js 14 (App Router) + TypeScript + Tailwind.
- Client Supabase préparé (`lib/supabase/client.ts`), à connecter à un projet Supabase.
- Page d'accueil marketing (`app/page.tsx`) et squelette de tableau de bord (`app/dashboard/page.tsx`).
- Schéma SQL de base (`sql/phase1_base.sql`) : contacts, campaigns, campaign_events.
- Pas encore de dépendances installées (`npm install` à lancer), pas de projet Supabase/Vercel connecté.

## Prochaines étapes possibles

- [ ] `npm install` puis vérifier que `npm run dev` fonctionne.
- [ ] Créer le projet Supabase et renseigner `.env.local`.
- [ ] Définir précisément le périmètre fonctionnel (emailing ? réseaux sociaux ? landing pages ? CRM léger ?).
- [ ] Authentification (Supabase Auth) et espace utilisateur.
- [ ] Connecter un fournisseur d'envoi d'email (Resend, Postmark, etc.) si l'emailing est retenu.
- [ ] Déploiement Vercel.
