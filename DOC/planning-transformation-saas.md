# Planning — Transformation Task Manager en SaaS multi-tenant

Planning étalé sur **4 semaines** (20 jours ouvrés), avec un rythme volontairement léger : une tâche technique principale par jour, complétée par de la documentation, des vérifications et des points de présentation. De quoi avancer visiblement chaque jour sans brûler les 8 étapes en une semaine.

---

## Semaine 1 — Modèle de données et fondations

**Jour 1**
- Lecture et annotation personnelle du document de démarche (relecture étape par étape, prise de notes)
- Préparer une sauvegarde complète de la base de données actuelle

**Jour 2**
- Étape 1 : créer la table `organizations` (migration 001)
- Vérifier la table en base (contenu, contraintes)

**Jour 3**
- Étape 2 (partie 1) : ajouter les colonnes `organization_id` sur `users` et `projects` (migration 002, partiel)
- Documenter le choix d'architecture (shared database / shared schema) dans le rapport de stage

**Jour 4**
- Étape 2 (partie 2) : ajouter `organization_id` sur `tasks`, `comments`, `notifications`
- Rédiger un schéma ERD à jour incluant `organizations`

**Jour 5**
- Étape 2 (partie 3) : migration des données existantes vers l'organisation par défaut (migration 003)
- Vérification manuelle : compter les lignes migrées par table, contrôler qu'aucune n'est restée `NULL`
- Petit point récapitulatif écrit (2-3 lignes) pour le suivi de stage

---

## Semaine 2 — Middleware et filtrage des requêtes

**Jour 6**
- Étape 3 : créer le middleware `tenantContext.js`
- Le brancher dans `app.js` et tester manuellement avec un utilisateur existant

**Jour 7**
- Étape 4 (partie 1) : adapter `taskService.js` (getTaskById, updateTaskStatus) avec le filtre `organization_id`
- Test manuel via Postman/Insomnia

**Jour 8**
- Étape 4 (partie 2) : adapter `getProjectById` et `getTasksByProject`
- Vérifier qu'aucune régression n'apparaît sur les fonctionnalités déjà en place (kanban, liste)

**Jour 9**
- Étape 4 (partie 3) : adapter `getCommentsByTask` et `addComment`
- Relecture de code : vérifier qu'aucune requête métier n'a été oubliée sans filtre

**Jour 10**
- Journée de vérification et de nettoyage : relire l'ensemble des services modifiés, corriger le style/les commentaires
- Mettre à jour la documentation technique interne avec les fonctions modifiées

---

## Semaine 3 — Authentification, inscription et sécurité

**Jour 11**
- Étape 5 (partie 1) : adapter `generateToken` dans `authService.js` pour inclure `organizationId`

**Jour 12**
- Étape 5 (partie 2) : adapter `authenticate.js` (rejet des tokens sans `organizationId`)
- Test manuel : connexion avec un ancien compte, vérifier la régénération de token

**Jour 13**
- Étape 6 (partie 1) : écrire le contrôleur `signupController.js` (création organisation + admin, transaction)
- Écrire la fonction `slugify`

**Jour 14**
- Étape 6 (partie 2) : brancher la route d'inscription libre côté backend
- Créer/adapter le formulaire d'inscription côté frontend (Vue) pour ce nouveau parcours

**Jour 15**
- Journée de test manuel complet du parcours d'inscription libre (créer 2 organisations de test à la main)
- Rédiger la section "points de sécurité" du rapport (defense in depth, 404 générique, etc.)

---

## Semaine 4 — Performance, tests automatisés et clôture

**Jour 16**
- Étape 7 : créer les index de performance (migration 004)
- Vérifier via `EXPLAIN ANALYZE` sur quelques requêtes clés que les index sont bien utilisés

**Jour 17**
- Étape 8 (partie 1) : mettre en place Jest + Supertest si pas déjà fait, écrire le test d'isolation sur les tâches

**Jour 18**
- Étape 8 (partie 2) : dupliquer les tests d'isolation pour les projets et les commentaires

**Jour 19**
- Étape 8 (partie 3) : dupliquer les tests d'isolation pour les notifications et les membres
- Lancer la suite complète, corriger les éventuels échecs

**Jour 20**
- Rédaction de la synthèse méthodologique finale (démarche générale, méthodes techniques, points de sécurité) à partir de la section 10 du document
- Préparation d'une courte présentation orale pour le superviseur (déroulé, exemples de code, démonstration des tests)

---

## Notes
- Chaque jour peut déborder légèrement sur le suivant si besoin — le planning n'est pas figé, il donne juste un rythme d'avancement visible.
- Les jours de "vérification/relecture" (5, 10, 15, 20) servent aussi de tampon naturel si une étape prend plus de temps que prévu.
