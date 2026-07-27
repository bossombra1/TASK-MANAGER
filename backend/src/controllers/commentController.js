import { isProjectMember } from '../services/authorization.js';
import db from '../config/db.js';
import crypto from 'crypto';

export const getCommentsByTask = async (req, res) => {
  const { taskId } = req.params;
  try {
    const task = await db.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
    if (task.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }

    if (req.user.role !== 'admin') {
      const authorized = await isProjectMember(db, task.rows[0].project_id, req.user.id);
      if (!authorized) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette tâche" });
      }
    }

    const result = await db.query(
      `SELECT c.id, c.content, c.created_at, u.id AS author_id, u.nom AS author_nom, u.avatar_url AS author_avatar
       FROM comments c
       JOIN users u ON u.id = c.author_id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération commentaires', error: error.message });
  }
};

export const addComment = async (req, res) => {
  const { taskId } = req.params;
  const { content } = req.body;
  const authorId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Le commentaire ne peut pas être vide' });
  }

  try {
    const task = await db.query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
    if (task.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }

    if (req.user.role !== 'admin') {
      const authorized = await isProjectMember(db, task.rows[0].project_id, authorId);
      if (!authorized) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette tâche" });
      }
    }

    const commentId = crypto.randomUUID();
    await db.query(
      `INSERT INTO comments (id, task_id, author_id, content) VALUES ($1, $2, $3, $4)`,
      [commentId, taskId, authorId, content.trim()]
    );

    const { rows: assigneeRows } = await db.query(
      'SELECT user_id FROM task_assignments WHERE task_id = $1',
      [taskId]
    );

    const { rows: projectRows } = await db.query(
      `SELECT p.created_by FROM tasks t JOIN projects p ON p.id = t.project_id WHERE t.id = $1`,
      [taskId]
    );

    const recipientIds = new Set(assigneeRows.map((a) => a.user_id));
    if (projectRows.length > 0 && projectRows[0].created_by) {
      recipientIds.add(projectRows[0].created_by);
    }
    recipientIds.delete(authorId);

    for (const userId of recipientIds) {
      await db.query(
        `INSERT INTO notifications (id, user_id, type, task_id, comment_id) VALUES ($1, $2, 'new_comment', $3, $4)`,
        [crypto.randomUUID(), userId, taskId, commentId]
      );
    }

    const { rows } = await db.query(
      `SELECT c.id, c.content, c.created_at, u.id AS author_id, u.nom AS author_nom, u.avatar_url AS author_avatar
       FROM comments c JOIN users u ON u.id = c.author_id WHERE c.id = $1`,
      [commentId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur ajout commentaire', error: error.message });
  }
};

export const deleteComment = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    const { rows } = await db.query('SELECT author_id FROM comments WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Commentaire introuvable' });
    }

    const isAuthor = rows[0].author_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer ce commentaire" });
    }

    await db.query('DELETE FROM comments WHERE id = $1', [id]);
    res.json({ message: 'Commentaire supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression commentaire', error: error.message });
  }
};