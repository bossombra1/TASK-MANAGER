// Importe ton service d'autorisation pour vérifier si un utilisateur appartient à un projet.
import { isProjectMember } from '../services/authorization.js';
import db from '../config/db.js';
// Module natif de Node.js pour générer des identifiants uniques (UUID).
import crypto from 'crypto';

// --- RÉCUPÉRER LES COMMENTAIRES D'UNE TÂCHE ---
export const getCommentsByTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    // 1. Vérifie que la tâche existe et récupère l'ID du projet associé.
    const task = await db.query('SELECT project_id FROM tasks WHERE id = $1 AND organization_id = $2', [taskId, req.user.organizationId]);
    if (task.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }

    // 2. SÉCURITÉ : Contrôle d'accès (RBAC - Role Based Access Control)
    // Si l'utilisateur n'est pas "admin", il DOIT être membre du projet pour voir les commentaires.
    if (req.user.role !== 'admin') {
      const authorized = await isProjectMember(db, task.rows[0].project_id, req.user.id, req.user.organizationId);
      if (!authorized) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette tâche" });
      }
    }

    // 3. Récupère les commentaires avec un JOIN SQL très optimisé.
    // Cela permet de ramener le texte du commentaire (c.*) ET les infos de son auteur (u.*) en une seule requête.
    const result = await db.query(
      `SELECT c.id, c.content, c.created_at, u.id AS author_id, u.nom AS author_nom, u.avatar_url AS author_avatar
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.task_id = $1 AND c.organization_id = $2
       ORDER BY c.created_at ASC`, // ASC = du plus ancien au plus récent (comme un chat)
      [taskId, req.user.organizationId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération commentaires', error: error.message });
  }
};

// --- AJOUTER UN COMMENTAIRE ET NOTIFIER ---
export const addComment = async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;
  const authorId = req.user.id;

  // Empêche l'envoi de commentaires vides ou contenant juste des espaces.
  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Le commentaire ne peut pas être vide' });
  }

  try {
    // 1. Vérifie l'existence de la tâche et récupère le projet.
    const task = await db.query('SELECT project_id FROM tasks WHERE id = $1 AND organization_id = $2', [taskId, req.user.organizationId]);
    if (task.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }

    // 2. Même contrôle d'accès que pour la lecture.
    if (req.user.role !== 'admin') {
      const authorized = await isProjectMember(db, task.rows[0].project_id, authorId, req.user.organizationId);
      if (!authorized) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette tâche" });
      }
    }

    // 3. Génère un UUID (format standardisé de 36 caractères) pour le commentaire.
    const commentId = crypto.randomUUID();
    // Insère le commentaire en BDD.
    await db.query(
      `INSERT INTO comments (id, task_id, author_id, content, organization_id) VALUES ($1, $2, $3, $4, $5)`,
      [commentId, taskId, authorId, content.trim(), req.user.organizationId]
    );

    // --- DÉBUT DU SYSTÈME DE NOTIFICATIONS ---
    
    // 4a. Trouve tous les utilisateurs assignés à cette tâche.
    const { rows: assigneeRows } = await db.query(
      'SELECT user_id FROM task_assignments WHERE task_id = $1 AND organization_id = $2',
      [taskId, req.user.organizationId]
    );

    // 4b. Trouve le créateur du projet qui contient cette tâche.
    const { rows: projectRows } = await db.query(
      `SELECT p.created_by FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = $1 AND t.organization_id = $2 AND p.organization_id = $3`,
      [taskId, req.user.organizationId, req.user.organizationId]
    );

    // 5. Utilisation d'un "Set" pour éviter les doublons. 
    // Si une personne a créé le projet ET est assignée à la tâche, elle n'aura qu'une seule notification.
    const recipientIds = new Set(assigneeRows.map((a) => a.user_id));
    if (projectRows.length > 0 && projectRows[0].created_by) {
      recipientIds.add(projectRows[0].created_by);
    }
    // On retire l'auteur du commentaire (pas besoin de se notifier soi-même !).
    recipientIds.delete(authorId);

    // 6. Crée une notification en base pour chaque destinataire concerné.
    for (const userId of recipientIds) {
      await db.query(
        `INSERT INTO notifications (id, user_id, type, task_id, comment_id, organization_id) VALUES ($1, $2, 'new_comment', $3, $4, $5)`,
        [crypto.randomUUID(), userId, taskId, commentId, req.user.organizationId]
      );
    }

    // --- FIN DU SYSTÈME DE NOTIFICATIONS ---

    // 7. Récupère le commentaire fraîchement créé avec les infos de l'auteur pour l'afficher instantanément côté frontend.
    const { rows } = await db.query(
      `SELECT c.id, c.content, c.created_at, u.id AS author_id, u.nom AS author_nom, u.avatar_url AS author_avatar
       FROM comments c JOIN users u ON u.id = c.author_id WHERE c.id = $1 AND c.organization_id = $2`,
      [commentId, req.user.organizationId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur ajout commentaire', error: error.message });
  }
};

// --- SUPPRIMER UN COMMENTAIRE ---
export const deleteComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // 1. Cherche qui a écrit ce commentaire.
    const { rows } = await db.query('SELECT author_id FROM comments WHERE id = $1 AND organization_id = $2', [id, req.user.organizationId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }

    // 2. SÉCURITÉ : Vérifie les droits de suppression.
    const isAuthor = rows[0].author_id === userId; // Est-ce que c'est mon commentaire ?
    const isAdmin = userRole === 'admin'; // Est-ce que je suis un administrateur global ?

    // Si on n'est ni l'auteur, ni admin, on bloque.
    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer ce commentaire" });
    }

    // 3. Suppression.
    await db.query('DELETE FROM comments WHERE id = $1 AND organization_id = $2', [id, req.user.organizationId]);
    res.json({ message: 'Commentaire supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression commentaire', error: error.message });
  }
};