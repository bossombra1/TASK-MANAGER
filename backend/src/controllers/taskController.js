import { isProjectMember } from '../services/authorization.js';
import db from '../config/db.js';
import { recalculateProjectStatus } from '../services/projectStatus.js';

export const getTasksByProject = async (req, res) => {
  const { projectId } = req.params;
  try {
    if (req.user.role !== 'admin') {
      const membership = await db.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, req.user.id]
      );
      if (membership.rows.length === 0) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de ce projet" });
      }
    }

    const result = await db.query(
      `SELECT t.*,
        COALESCE(
          json_agg(json_build_object('id', u.id, 'nom', u.nom, 'avatar_url', u.avatar_url)) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS assignees
       FROM tasks t
       LEFT JOIN task_assignments ta ON ta.task_id = t.id
       LEFT JOIN users u ON u.id = ta.user_id
       WHERE t.project_id = $1
       GROUP BY t.id
       ORDER BY t.created_at DESC`,
      [projectId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération tâches', error: error.message });
  }
};

export const getMyTasks = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, p.title AS project_title FROM tasks t
       JOIN task_assignments ta ON ta.task_id = t.id
       JOIN projects p ON p.id = t.project_id
       WHERE ta.user_id = $1
       ORDER BY t.due_date ASC NULLS LAST`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération de vos tâches', error: error.message });
  }
};

export const getTaskById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      `SELECT t.*, p.title AS project_title,
        COALESCE(
          json_agg(json_build_object('id', u.id, 'nom', u.nom, 'avatar_url', u.avatar_url)) FILTER (WHERE u.id IS NOT NULL),
          '[]'
        ) AS assignees
       FROM tasks t
       JOIN projects p ON p.id = t.project_id
       LEFT JOIN task_assignments ta ON ta.task_id = t.id
       LEFT JOIN users u ON u.id = ta.user_id
       WHERE t.id = $1
       GROUP BY t.id, p.title`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }

    const task = result.rows[0];

    if (req.user.role !== 'admin') {
      const authorized = await isProjectMember(db, task.project_id, req.user.id);
      if (!authorized) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette tâche" });
      }
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération tâche', error: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['todo', 'doing', 'done'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Statut invalide' });
  }

 try {
    const existing = await db.query('SELECT project_id FROM tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }

    if (req.user.role !== 'admin') {
      const authorized = await isProjectMember(db, existing.rows[0].project_id, req.user.id);
      if (!authorized) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette tâche" });
      }
    }

    const result = await db.query(
      'UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    const task = result.rows[0];
    const projectStatus = await recalculateProjectStatus(task.project_id, db);

    res.json({ message: 'Statut mis à jour', task, projectStatus });
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour statut', error: error.message });
  }
};

export const updateTask = async (req, res) => {
  const { id } = req.params;
  const { title, description, priority, due_date } = req.body;

  try {
    const existing = await db.query('SELECT project_id FROM tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }

    if (req.user.role !== 'admin') {
      const authorized = await isProjectMember(db, existing.rows[0].project_id, req.user.id);
      if (!authorized) {
        return res.status(403).json({ message: "Vous n'avez pas accès à cette tâche" });
      }

      // Un membre ne peut modifier ni la priorité ni la date d'échéance
      if (priority !== undefined || due_date !== undefined) {
        return res.status(403).json({
          message: "Seul l'administrateur peut modifier la priorité ou la date d'échéance",
        });
      }
    }

    const result = await db.query(
      `UPDATE tasks SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        priority = COALESCE($3, priority),
        due_date = COALESCE($4, due_date)
       WHERE id = $5 RETURNING *`,
      [title, description, priority, due_date, id]
    );
    res.json({ message: 'Tâche mise à jour', task: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour tâche', error: error.message });
  }
};