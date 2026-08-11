# Guide de démarrage d'un SaaS — De l'idée au déploiement

Ce guide couvre les étapes structurantes pour lancer un nouveau projet SaaS, avec des recommandations adaptées à une stack **React/TypeScript, Vue.js, Node.js/Express, Laravel, Supabase, Figma (Atomic Design)**.

---

## 1. Cadrage du projet (avant d'écrire une ligne de code)

### 1.1 Définir le problème et les utilisateurs
- Qui sont les utilisateurs (personas) ? Ex : administrateur d'école, parent, enseignant...
- Quel problème concret résout le SaaS ?
- Modèle mono-tenant ou multi-tenant (plusieurs organisations/écoles/boutiques sur une même instance) ?
  
### 1.2 Cartographier les rôles et permissions
- Lister les rôles (super-admin, admin, gestionnaire, utilisateur final...)
- Définir une matrice de permissions par rôle (CRUD par ressource)
- Cette matrice guide directement le modèle de données et les middlewares d'autorisation

### 1.3 Choisir le modèle de tenancy (si multi-organisation)
| Stratégie | Description | Quand l'utiliser |
|---|---|---|
| Shared DB, `tenant_id` sur chaque table | Une seule base, filtrage par colonne | Simplicité, coûts réduits, la majorité des cas |
| Schema-per-tenant | Un schéma PostgreSQL par client | Isolation renforcée, peu de tenants |
| Database-per-tenant | Une base par client | Isolation maximale, gros clients, contraintes réglementaires |

### 1.4 Définir le modèle économique
- Freemium, abonnement par palier, par utilisateur, par usage ?
- Impacte le modèle de données (limites, quotas, facturation) dès le départ

---

## 2. Architecture technique

### 2.1 Choix de stack (selon le contexte du projet)

**Option A — Node.js/Express + React/TypeScript**
- API REST ou GraphQL avec Express
- ORM : Prisma ou Sequelize (MySQL2 déjà utilisé dans certains de tes projets)
- Frontend React + TypeScript + Vite
- Bon choix pour du temps réel, écosystème JS unifié

**Option B — Laravel + Vue.js**
- Laravel pour l'API (Eloquent ORM, migrations, queues natives)
- Vue.js en frontend, ou Inertia.js pour éviter une API séparée
- Bon choix si tu veux un backend "batteries included" (auth, mailing, jobs, notifications)

**Option C — Supabase (BaaS)**
- Postgres + Auth + Storage + Realtime managés
- Row Level Security (RLS) pour l'isolation multi-tenant directement en base
- Idéal pour aller vite sur un MVP sans maintenir un backend custom

### 2.2 Structure de dossiers recommandée (monorepo simple)
```
mon-saas/
├── apps/
│   ├── api/              # Backend (Express ou Laravel)
│   └── web/              # Frontend (React/Vue)
├── packages/
│   └── shared/           # Types partagés, constantes, validation (zod)
├── docs/
│   └── ARCHITECTURE.md
└── README.md
```

### 2.3 Modèle de données de base (point de départ multi-tenant)
```
organizations (id, name, plan, created_at)
users (id, organization_id, email, password_hash, role)
roles (id, name, permissions_json)
sessions / tokens
audit_logs (id, organization_id, user_id, action, entity, timestamp)
```

---

## 3. Authentification & sécurité

- **Auth** : JWT (access + refresh token) ou sessions Supabase/Laravel Sanctum
- **Isolation des données** : middleware qui injecte systématiquement `organization_id` dans chaque requête (jamais de confiance au frontend pour ce champ)
- **RLS (Supabase/Postgres)** : policies au niveau base, en complément du contrôle applicatif
- **Validation des entrées** : zod (Node/TS) ou Form Requests (Laravel) — jamais de confiance brute sur le payload
- **Secrets** : variables d'environnement (.env), jamais commit dans le repo
- **Rate limiting** : sur les routes sensibles (login, reset password, API publique)

---

## 4. Design system & frontend (Atomic Design)

Puisque tu travailles déjà en Atomic Design sur Figma :

1. **Tokens** : couleurs, typographies, espacements → variables CSS ou Tailwind config
2. **Atoms** : boutons, inputs, badges, icônes
3. **Molecules** : champ de formulaire (label + input + erreur), carte statistique
4. **Organisms** : formulaire complet, tableau de données, barre de navigation
5. **Templates/Pages** : assemblage final par écran

Recommandation : construire le design system dans Figma **avant** le développement, puis le traduire en composants réutilisables (React ou Vue) — cohérent avec ta méthode habituelle HTML-comme-intermédiaire pour les design systems.

---

## 5. Étapes de mise en œuvre (ordre recommandé)

1. **Cadrage** — personas, rôles, modèle de données, maquettes basse fidélité
2. **Design** — maquettes Figma haute fidélité + design system (Atomic Design)
3. **Setup technique** — repo, CI basique, environnements (dev/staging/prod)
4. **Auth & multi-tenance** — avant toute autre fonctionnalité métier
5. **CRUD des entités principales** — une ressource à la fois, avec tests
6. **Facturation** (si SaaS payant) — Stripe ou équivalent, dès que le modèle de base est stable
7. **Notifications** (email/push) — souvent sous-estimé, à prévoir tôt dans l'architecture
8. **Déploiement** — voir section 6
9. **Observabilité** — logs, monitoring d'erreurs (Sentry ou équivalent)
10. **Onboarding utilisateur** — flux d'inscription, invitation d'équipe, tutoriel initial

---

## 6. Déploiement & infrastructure

| Composant | Options courantes |
|---|---|
| Frontend | Vercel, Netlify, Cloudflare Pages |
| Backend Node/Express | Railway, Render, Fly.io, VPS |
| Backend Laravel | Forge + VPS, Render |
| Base de données | Supabase, Neon, PlanetScale, RDS |
| Stockage fichiers | Supabase Storage, S3, Cloudinary |
| Domaine & sous-domaines | Un sous-domaine par tenant si besoin (`client.monsaas.com`) |

---

## 7. Checklist de démarrage rapide

- [ ] Personas et rôles définis
- [ ] Modèle multi-tenant choisi (et justifié)
- [ ] Modèle économique esquissé
- [ ] Maquettes Figma (au moins les écrans clés)
- [ ] Design system (tokens + atoms) posé
- [ ] Repo initialisé avec structure de dossiers
- [ ] Auth + isolation des données fonctionnelles
- [ ] Premier CRUD bout en bout (DB → API → UI)
- [ ] Environnement de staging accessible
- [ ] Plan de facturation (si applicable)

---

## 8. Points de vigilance fréquents

- Ne pas reporter la question du multi-tenant après coup — c'est structurant dès le schéma de données
- Éviter de coder les permissions "en dur" dans le frontend : toujours vérifier côté backend
- Prévoir les migrations de schéma dès le début (pas de modifications manuelles en prod)
- Documenter les décisions d'architecture au fil de l'eau (fichier `ARCHITECTURE.md`), pas à la fin
