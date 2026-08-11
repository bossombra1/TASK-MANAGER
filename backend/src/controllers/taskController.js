import { isProjectMember } from '../services/authorization.js';
// Importe une fonction utilitaire qui vérifie si un utilisateur est membre d'un projet donné
import db from '../config/db.js';
// Importe la connexion/pool à la base de données PostgreSQL configurée dans config/db.js
import { recalculateProjectStatus } from '../services/projectStatus.js';
// Importe une fonction qui recalcule le statut global d'un projet (probablement en fonction du statut de ses tâches)

export const getTasksByProject = async (req, res) => {
  // Fonction contrôleur : récupère toutes les tâches d'un projet donné
  const { projectId } = req.params;
  // Extrait l'id du projet depuis les paramètres de l'URL (ex: /projects/:projectId/tasks)
  try {
    const projectExists = await db.query('SELECT id FROM projects WHERE id = $1 AND organization_id = $2', [projectId, req.user.organizationId]);
    if (projectExists.rows.length === 0) {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }

    if (req.user.role !== 'admin') {
      // Si l'utilisateur connecté n'est pas admin, on vérifie ses droits d'accès au projet
      const membership = await db.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2 AND organization_id = $3',
        // SELECT 1 : teste simplement l'existence d'une ligne d'appartenance
        // WHERE project_id = $1 AND user_id = $2 : filtre sur le projet et l'utilisateur courant
        [projectId, req.user.id, req.user.organizationId]
        // Paramètres liés : $1 = id du projet, $2 = id de l'utilisateur connecté
      );
      if (membership.rows.length === 0) {
        // Si aucune ligne trouvée, l'utilisateur n'est pas membre du projet
        return res.status(403).json({ message: "Vous n'êtes pas membre de ce projet" });
        // Renvoie une erreur 403 et arrête l'exécution de la fonction
      }
    }

    const result = await db.query(
      `SELECT t.*,
        COALESCE(
          json_agg(json_build_object('id', u.id, 'nom', u.nom, 'avatar_url', u.avatar_url)) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS assignees
       FROM tasks t
       LEFT JOIN task_assignments ta ON ta.task_id = t.id AND ta.organization_id = $2
       LEFT JOIN users u ON u.id = ta.user_id AND u.organization_id = $2
       WHERE t.project_id = $1 AND t.organization_id = $2
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      // SELECT t.* : toutes les colonnes de la tâche
      // json_agg(json_build_object(...)) FILTER (WHERE u.id IS NOT NULL) : agrège les utilisateurs assignés
      //   en un tableau JSON d'objets {id, nom, avatar_url}, en excluant les lignes sans utilisateur (jointure vide)
      // COALESCE(..., '[]') : si aucun assigné, renvoie un tableau JSON vide plutôt que NULL
      // AS assignees : nomme cette colonne calculée "assignees"
      // FROM tasks t : table principale, alias "t"
      // LEFT JOIN task_assignments ta ON ta.task_id = t.id : jointure externe vers les assignations de tâches
      // LEFT JOIN users u ON u.id = ta.user_id : jointure externe vers les utilisateurs assignés
      // WHERE t.project_id = $1 : filtre les tâches du projet demandé
      // GROUP BY t.id : regroupe par tâche (nécessaire pour l'agrégation json_agg)
      // ORDER BY t.created_at DESC : trie de la tâche la plus récente à la plus ancienne
      [projectId, req.user.organizationId]
      // Paramètre lié : $1 = id du projet demandé
    );
    res.json(result.rows);
    // Renvoie au client la liste des tâches, chacune enrichie de son tableau d'assignés
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération tâches', error: error.message });
    // En cas d'erreur SQL ou d'exécution, renvoie un statut 500 avec le détail de l'exception
  }
};

export const getMyTasks = async (req, res) => {
  // Fonction contrôleur : récupère les tâches assignées à l'utilisateur connecté
  try {
    const result = await db.query(
      `SELECT t.*, p.title AS project_title FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id AND ta.organization_id = $2
       JOIN projects p ON p.id = t.project_id AND p.organization_id = $2
       WHERE ta.user_id = $1 AND ta.organization_id = $2 AND t.organization_id = $2
       ORDER BY t.due_date ASC NULLS LAST`,
      // SELECT t.*, p.title AS project_title : toutes les colonnes de la tâche + le titre du projet associé
      // JOIN task_assignments ta ON ta.task_id = t.id : jointure interne pour ne garder que les tâches assignées
      // JOIN projects p ON p.id = t.project_id : jointure interne pour récupérer le projet de chaque tâche
      // WHERE ta.user_id = $1 : filtre sur les assignations de l'utilisateur connecté
      // ORDER BY t.due_date ASC NULLS LAST : trie par date d'échéance croissante,
      //   les tâches sans échéance (NULL) sont placées en dernier
      [req.user.id, req.user.organizationId]
      // Paramètre lié : $1 = id de l'utilisateur connecté
    );
    res.json(result.rows);
    // Renvoie au client la liste des tâches assignées, triées par échéance
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération de vos tâches', error: error.message });
    // En cas d'erreur SQL ou d'exécution, renvoie un statut 500 avec le détail de l'exception
  }
};

export const getTaskById = async (req, res) => {
  // Fonction contrôleur : récupère une tâche précise avec ses assignés, en vérifiant les droits d'accès
  const { id } = req.params;
  // Extrait l'id de la tâche depuis les paramètres de l'URL (ex: /tasks/:id)
  try {
    const result = await db.query(
      `SELECT t.*, p.title AS project_title,
        COALESCE(
          json_agg(json_build_object('id', u.id, 'nom', u.nom, 'avatar_url', u.avatar_url)) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS assignees
       FROM tasks t
       JOIN projects p ON p.id = t.project_id AND p.organization_id = $2
       LEFT JOIN task_assignments ta ON ta.task_id = t.id AND ta.organization_id = $2
       LEFT JOIN users u ON u.id = ta.user_id AND u.organization_id = $2
       WHERE t.id = $1 AND t.organization_id = $2
       GROUP BY t.id, p.title`,
      // SELECT t.*, p.title AS project_title : toutes les colonnes de la tâche + le titre du projet
      // json_agg(...) FILTER (WHERE u.id IS NOT NULL) : agrège les assignés en tableau JSON, exclut les lignes vides
      // COALESCE(..., '[]') : renvoie un tableau JSON vide si aucun assigné
      // FROM tasks t : table principale, alias "t"
      // JOIN projects p ON p.id = t.project_id : jointure interne obligatoire vers le projet parent
      // LEFT JOIN task_assignments ta ON ta.task_id = t.id : jointure externe vers les assignations
      // LEFT JOIN users u ON u.id = ta.user_id : jointure externe vers les utilisateurs assignés
      // WHERE t.id = $1 : filtre sur la tâche demandée
      // GROUP BY t.id, p.title : regroupe par tâche et titre du projet (nécessaire pour json_agg)
      [id, req.user.organizationId]
      // Paramètre lié : $1 = id de la tâche demandée
    );
    if (result.rows.length === 0) {
      // Si aucune ligne retournée, la tâche n'existe pas
      return res.status(404).json({ error: 'Ressource introuvable' });
      // Renvoie une erreur 404 et arrête l'exécution de la fonction
    }

    const task = result.rows[0];
    // Récupère la tâche unique trouvée (premier et seul élément du tableau de résultats)

    if (req.user.role !== 'admin') {
      // Si l'utilisateur connecté n'est pas admin, on vérifie qu'il a accès au projet de cette tâche
      const authorized = await isProjectMember(db, task.project_id, req.user.id, req.user.organizationId);
      // Appelle le service d'autorisation avec la connexion db, l'id du projet de la tâche et l'id de l'utilisateur
      if (!authorized) {
        // Si le service renvoie false, l'utilisateur n'est pas membre du projet
        return res.status(403).json({ message: "Vous n'avez pas accès à cette tâche" });
        // Renvoie une erreur 403 et arrête l'exécution de la fonction
      }
    }

    res.json(task);
    // Renvoie au client la tâche trouvée (avec titre du projet et liste des assignés)
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération tâche', error: error.message });
    // En cas d'erreur SQL ou d'exécution, renvoie un statut 500 avec le détail de l'exception
  }
};

export const updateTaskStatus = async (req, res) => {
  // Fonction contrôleur : met à jour uniquement le statut d'une tâche (todo / doing / done)
  const { id } = req.params;
  // Extrait l'id de la tâche depuis les paramètres de l'URL
  const { status } = req.body;
  // Extrait le nouveau statut depuis le corps de la requête

  const validStatuses = ['todo', 'doing', 'done'];
  // Liste blanche des statuts autorisés
  if (!validStatuses.includes(status)) {
    // Si le statut fourni ne fait pas partie de la liste autorisée
    return res.status(400).json({ message: 'Statut invalide' });
    // Renvoie une erreur 400 (requête invalide) et arrête l'exécution de la fonction
  }

 try {
    const existing = await db.query('SELECT project_id FROM tasks WHERE id = $1 AND organization_id = $2', [id, req.user.organizationId]);
    // Récupère l'id du projet parent de la tâche, pour vérifier ensuite les droits d'accès ; $1 = id de la tâche
    if (existing.rows.length === 0) {
      // Si aucune ligne retournée, la tâche n'existe pas
      return res.status(404).json({ message: 'Tâche introuvable' });
      // Renvoie une erreur 404 et arrête l'exécution de la fonction
    }

    if (req.user.role !== 'admin') {
      // Si l'utilisateur connecté n'est pas admin, on vérifie ses droits sur le projet de cette tâche
      const authorized = await isProjectMember(db, existing.rows[0].project_id, req.user.id, req.user.organizationId);
      // Appelle le service d'autorisation avec le project_id trouvé et l'id de l'utilisateur connecté
      if (!authorized) {
        // Si non autorisé
        return res.status(403).json({ message: "Vous n'avez pas accès à cette tâche" });
        // Renvoie une erreur 403 et arrête l'exécution de la fonction
      }
    }

    const result = await db.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 AND organization_id = $3 RETURNING *',
      // UPDATE : modifie uniquement la colonne status ($1 = nouveau statut) pour la tâche dont l'id = $2
      // RETURNING * : renvoie la ligne complète de la tâche après mise à jour
      [status, id, req.user.organizationId]
      // Paramètres liés : $1 = nouveau statut (validé plus haut), $2 = id de la tâche
    );

    const task = result.rows[0];
    // Récupère la tâche mise à jour (premier et unique résultat)
    const projectStatus = await recalculateProjectStatus(task.project_id, db);
    // Recalcule le statut global du projet parent, probablement en fonction du statut de toutes ses tâches

    res.json({ message: 'Statut mis à jour', task, projectStatus });
    // Renvoie au client un message de confirmation, la tâche mise à jour et le nouveau statut du projet
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour statut', error: error.message });
    // En cas d'erreur SQL ou d'exécution, renvoie un statut 500 avec le détail de l'exception
  }
};

export const updateTask = async (req, res) => {
  // Fonction contrôleur : met à jour les champs modifiables d'une tâche (hors statut)
  const { id } = req.params;
  // Extrait l'id de la tâche depuis les paramètres de l'URL
  const { title, description, priority, due_date } = req.body;
  // Extrait les champs potentiellement fournis dans le corps de la requête

  try {
    const existing = await db.query('SELECT project_id FROM tasks WHERE id = $1 AND organization_id = $2', [id, req.user.organizationId]);
    // Récupère l'id du projet parent de la tâche, pour vérifier ensuite les droits d'accès ; $1 = id de la tâche
    if (existing.rows.length === 0) {
      // Si aucune ligne retournée, la tâche n'existe pas
      return res.status(404).json({ message: 'Tâche introuvable' });
      // Renvoie une erreur 404 et arrête l'exécution de la fonction
    }

    if (req.user.role !== 'admin') {
      // Si l'utilisateur connecté n'est pas admin, on vérifie ses droits sur le projet de cette tâche
      const authorized = await isProjectMember(db, existing.rows[0].project_id, req.user.id, req.user.organizationId);
      // Appelle le service d'autorisation avec le project_id trouvé et l'id de l'utilisateur connecté
      if (!authorized) {
        // Si non autorisé
        return res.status(403).json({ message: "Vous n'avez pas accès à cette tâche" });
        // Renvoie une erreur 403 et arrête l'exécution de la fonction
      }

      // Un membre ne peut modifier ni la priorité ni la date d'échéance
      if (priority !== undefined || due_date !== undefined) {
        // Si l'utilisateur non-admin tente de fournir une priorité ou une date d'échéance dans sa requête
        return res.status(403).json({
          message: "Seul l'administrateur peut modifier la priorité ou la date d'échéance",
        });
        // Renvoie une erreur 403 et arrête l'exécution de la fonction
      }
    }

    const result = await db.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        due_date = COALESCE($4, due_date)
       WHERE id = $5 AND organization_id = $6 RETURNING *`,
      // UPDATE : met à jour chaque champ uniquement si une nouvelle valeur est fournie
      // COALESCE($1, title) : garde le titre existant si $1 est NULL/undefined, sinon applique la nouvelle valeur
      // (même logique pour description, priority, due_date)
      // WHERE id = $5 : cible la tâche par son id
      // RETURNING * : renvoie la ligne complète après mise à jour
      [title, description, priority, due_date, id, req.user.organizationId]
      // Paramètres liés dans l'ordre : $1 = title, $2 = description, $3 = priority, $4 = due_date, $5 = id
    );
    res.json({ message: 'Tâche mise à jour', task: result.rows[0] });
    // Renvoie au client un message de confirmation et la tâche mise à jour
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour tâche', error: error.message });
    // En cas d'erreur SQL ou d'exécution, renvoie un statut 500 avec le détail de l'exception
  }
};