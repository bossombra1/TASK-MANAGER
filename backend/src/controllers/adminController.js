import bcrypt from 'bcrypt';
import db from '../config/db.js';

export const createUser = async (req, res) => {
  const { nom, email, password, role } = req.body;

  try {
    const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO users (nom, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, nom, email, role, created_at',
      [nom, email, passwordHash, role || 'user']
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: newUser.rows[0]
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du compte', error: error.message });
  }
};

export const createProjectAndAssign = async (req, res) => {
  const { title, description, color, member_ids } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Le nom du projet est requis' });
  }

  try {
    const projectRes = await db.query(
      'INSERT INTO projects (title, description, color, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [title.trim(), description || null, color || '#E8523F', req.user.id]
    );
    const project = projectRes.rows[0];

    if (member_ids && member_ids.length > 0) {
      for (const userId of member_ids) {
        await db.query(
          'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2)',
          [project.id, userId]
        );
      }
    }

    res.status(201).json({ message: 'Projet créé et membres assignés avec succès', project });
  } catch (error) {
    res.status(500).json({ message: 'Erreur création projet', error: error.message });
  }
};

export const addProjectMember = async (req, res) => {
  const { projectId } = req.params;
  const { user_id } = req.body;

  try {
    const project = await db.query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Projet introuvable' });
    }

    const user = await db.query('SELECT id, nom, email, avatar_url FROM users WHERE id = $1', [user_id]);
    if (user.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur introuvable' });
    }

    await db.query(
      'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [projectId, user_id]
    );

    res.status(201).json({ message: 'Membre ajouté avec succès', member: user.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur ajout du membre', error: error.message });
  }
};

// Modifier un projet existant
export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { title, description, color } = req.body;

  try {
    const result = await db.query(
      `UPDATE projects SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        color = COALESCE($3, color)
       WHERE id = $4 RETURNING *`,
      [title, description, color, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Projet introuvable' });
    }
    res.json({ message: 'Projet mis à jour', project: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour projet', error: error.message });
  }
};

export const addTaskAssignee = async (req, res) => {
  const { id } = req.params; // id de la tâche
  const { user_id } = req.body;

  try {
    const taskResult = await db.query('SELECT project_id FROM tasks WHERE id = $1', [id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }
    const projectId = taskResult.rows[0].project_id;

    const membership = await db.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, user_id]
    );
    if (membership.rows.length === 0) {
      return res.status(400).json({ message: "Cet utilisateur n'est pas membre de ce projet" });
    }

    const already = await db.query(
      'SELECT 1 FROM task_assignments WHERE task_id = $1 AND user_id = $2',
      [id, user_id]
    );
    if (already.rows.length > 0) {
      return res.status(400).json({ message: 'Cet utilisateur est déjà assigné à cette tâche' });
    }

    await db.query('INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)', [id, user_id]);

    const userResult = await db.query(
      'SELECT id, nom, email, avatar_url FROM users WHERE id = $1',
      [user_id]
    );

    res.json({ message: 'Membre assigné à la tâche', assignee: userResult.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur assignation tâche', error: error.message });
  }
};





// Supprimer un projet (et tout son contenu, via cascade en base)
export const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM projects WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Projet introuvable' });
    }
    res.json({ message: 'Projet supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression projet', error: error.message });
  }
};

// Supprimer une tâche
export const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM tasks WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }
    res.json({ message: 'Tâche supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression tâche', error: error.message });
  }
};

export const createTaskAndAssign = async (req, res) => {
  const { project_id, title, description, priority, due_date, assigned_user_ids } = req.body;

  if (!project_id || !title || !title.trim()) {
    return res.status(400).json({ message: 'project_id et title sont requis' });
  }

  try {
    if (assigned_user_ids && assigned_user_ids.length > 0) {
      const { rows: memberRows } = await db.query(
        'SELECT user_id FROM project_members WHERE project_id = $1',
        [project_id]
      );
      const memberIds = new Set(memberRows.map((m) => m.user_id));
      const invalid = assigned_user_ids.filter((id) => !memberIds.has(id));
      if (invalid.length > 0) {
        return res.status(400).json({ message: 'Certains utilisateurs assignés ne sont pas membres de ce projet' });
      }
    }

    const taskRes = await db.query(
      'INSERT INTO tasks (project_id, title, description, status, priority, due_date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [project_id, title.trim(), description || null, 'todo', priority || 'medium', due_date || null]
    );
    const task = taskRes.rows[0];

    if (assigned_user_ids && assigned_user_ids.length > 0) {
      for (const userId of assigned_user_ids) {
        await db.query(
          'INSERT INTO task_assignments (task_id, user_id) VALUES ($1, $2)',
          [task.id, userId]
        );
      }
    }

    res.status(201).json({ message: 'Tâche créée et assignée', task });
  } catch (error) {
    res.status(500).json({ message: 'Erreur création tâche', error: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, nom, email, role, is_active, avatar_url, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération utilisateurs', error: error.message });
  }
};