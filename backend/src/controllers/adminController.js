// Importation de bcrypt pour hacher (crypter) les mots de passe avant de les stocker.
import bcrypt from 'bcrypt';
// Importation de l'instance de connexion à la base de données (le fameux "pool" vu précédemment).
import db from '../config/db.js';
import { checkPlanLimit } from '../services/planLimits.js';

// --- CRÉATION D'UTILISATEUR ---
export const createUser = async (req, res) => {
  const { nom, email, password, role } = req.body;

  try {
    const userExists = await db.query('SELECT * FROM users WHERE email = $1 AND organization_id = $2', [email, req.user.organizationId]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const limitCheck = await checkPlanLimit(req.user.organizationId, 'members', async () => {
      const { rows } = await db.query('SELECT COUNT(*) FROM users WHERE organization_id = $1', [req.user.organizationId]);
      return Number(rows[0].count);
    });

    if (limitCheck.blocked) {
      return res.status(403).json({ message: limitCheck.message, planLimitReached: true });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await db.query(
      'INSERT INTO users (nom, email, password_hash, role, organization_id) VALUES ($1, $2, $3, $4, $5) RETURNING id, nom, email, role, created_at',
      [nom, email, passwordHash, role || 'user', req.user.organizationId]
    );

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: newUser.rows[0],
      planWarning: limitCheck.warning || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur lors de la création du compte', error: error.message });
  }
};
// --- CRÉATION DE PROJET AVEC MEMBRES ---
export const createProjectAndAssign = async (req, res) => {
  const { title, description, color, member_ids } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Le nom du projet est requis' });
  }

  try {
    const limitCheck = await checkPlanLimit(req.user.organizationId, 'projects', async () => {
      const { rows } = await db.query('SELECT COUNT(*) FROM projects WHERE organization_id = $1', [req.user.organizationId]);
      return Number(rows[0].count);
    });

    if (limitCheck.blocked) {
      return res.status(403).json({ message: limitCheck.message, planLimitReached: true });
    }

    const projectRes = await db.query(
      'INSERT INTO projects (title, description, color, created_by, organization_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title.trim(), description || null, color || '#E8523F', req.user.id, req.user.organizationId]
    );
    const project = projectRes.rows[0];

    if (member_ids && member_ids.length > 0) {
      for (const userId of member_ids) {
        await db.query(
          'INSERT INTO project_members (project_id, user_id, organization_id) VALUES ($1, $2, $3)',
          [project.id, userId, req.user.organizationId]
        );
      }
    }

    res.status(201).json({
      message: 'Projet créé et membres assignés avec succès',
      project,
      planWarning: limitCheck.warning || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur création projet', error: error.message });
  }
};

// --- AJOUT D'UN MEMBRE À UN PROJET ---
export const addProjectMember = async (req, res) => {
  const { projectId } = req.params;
  const { user_id } = req.body;

  try {
    const project = await db.query('SELECT id FROM projects WHERE id = $1 AND organization_id = $2', [projectId, req.user.organizationId]);
    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }

    const user = await db.query('SELECT id, nom, email, avatar_url FROM users WHERE id = $1 AND organization_id = $2', [user_id, req.user.organizationId]);
    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }

    await db.query(
      'INSERT INTO project_members (project_id, user_id, organization_id) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [projectId, user_id, req.user.organizationId]
    );

    res.status(201).json({ message: 'Membre ajouté avec succès', member: user.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur ajout du membre', error: error.message });
  }
};

// --- MISE À JOUR D'UN PROJET ---
export const updateProject = async (req, res) => {
  const { id } = req.params;
  const { title, description, color } = req.body;

  try {
    // COALESCE($1, title) est une astuce SQL géniale : 
    // Si $1 (le nouveau titre) est fourni, il met à jour. S'il est NULL, il garde l'ancien titre en base.
    // Cela permet de faire des mises à jour partielles (PATCH) très facilement.
    const result = await db.query(
      `UPDATE projects SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        color = COALESCE($3, color)
       WHERE id = $4 AND organization_id = $5 RETURNING *`,
      [title, description, color, id, req.user.organizationId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }
    res.json({ message: 'Projet mis à jour', project: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour projet', error: error.message });
  }
};

// --- ASSIGNER UNE TÂCHE À UN UTILISATEUR ---
export const addTaskAssignee = async (req, res) => {
  const { id } = req.params; // L'ID de la tâche
  const { user_id } = req.body;

  try {
    // 1. Récupère l'ID du projet auquel appartient cette tâche, en restant borné à l'organisation courante.
    const taskResult = await db.query('SELECT project_id FROM tasks WHERE id = $1 AND organization_id = $2', [id, req.user.organizationId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ message: 'Tâche introuvable' });
    }
    const projectId = taskResult.rows[0].project_id;

    // 2. SÉCURITÉ : Vérifie que l'utilisateur qu'on veut assigner fait bien partie du projet !
    const membership = await db.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2 AND organization_id = $3',
      [projectId, user_id, req.user.organizationId]
    );
    if (membership.rows.length === 0) {
      return res.status(400).json({ message: "Cet utilisateur n'est pas membre de ce projet" });
    }
      
    // 3. Vérifie que l'utilisateur n'est pas déjà assigné à cette tâche spécifique.
    const already = await db.query(
      'SELECT 1 FROM task_assignments WHERE task_id = $1 AND user_id = $2 AND organization_id = $3',
      [id, user_id, req.user.organizationId]
    );
    if (already.rows.length > 0) {
      return res.status(400).json({ message: 'Cet utilisateur est déjà assigné à cette tâche' });
    }

    // 4. Tout est bon, on crée l'assignation.
    await db.query('INSERT INTO task_assignments (task_id, user_id, organization_id) VALUES ($1, $2, $3)', [id, user_id, req.user.organizationId]);

    // 5. Récupère les infos de l'utilisateur pour les renvoyer au frontend (utile pour afficher son avatar).
    const userResult = await db.query(
      'SELECT id, nom, email, avatar_url FROM users WHERE id = $1 AND organization_id = $2',
      [user_id, req.user.organizationId]
    );

    res.json({ message: 'Membre assigné à la tâche', assignee: userResult.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur assignation tâche', error: error.message });
  }
};

// --- SUPPRESSIONS ---
export const deleteProject = async (req, res) => {
  const { id } = req.params;
  try {
    // Supprime le projet. Si tes clés étrangères en BDD ont "ON DELETE CASCADE", 
    // ça supprimera aussi automatiquement les tâches et les membres associés.
    const result = await db.query('DELETE FROM projects WHERE id = $1 AND organization_id = $2 RETURNING id', [id, req.user.organizationId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }
    res.json({ message: 'Projet supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression projet', error: error.message });
  }
};

export const deleteTask = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query('DELETE FROM tasks WHERE id = $1 AND organization_id = $2 RETURNING id', [id, req.user.organizationId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ressource introuvable' });
    }
    res.json({ message: 'Tâche supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression tâche', error: error.message });
  }
};

// --- CRÉER UNE TÂCHE ET L'ASSIGNER DÈS LE DÉPART ---
export const createTaskAndAssign = async (req, res) => {
  const { project_id, title, description, priority, due_date, start_date, assigned_user_ids } = req.body;

  if (!project_id || !title || !title.trim()) {
    return res.status(400).json({ message: 'project_id et title sont requis' });
  }

  try {
    if (assigned_user_ids && assigned_user_ids.length > 0) {
      // ... vérification membres inchangée ...
    }

    const limitCheck = await checkPlanLimit(req.user.organizationId, 'tasksPerProject', async () => {
      const { rows } = await db.query('SELECT COUNT(*) FROM tasks WHERE project_id = $1', [project_id]);
      return Number(rows[0].count);
    });

    if (limitCheck.blocked) {
      return res.status(403).json({ message: limitCheck.message, planLimitReached: true });
    }

    const taskRes = await db.query(
      'INSERT INTO tasks (project_id, title, description, status, priority, due_date, start_date, organization_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [project_id, title.trim(), description || null, 'todo', priority || 'medium', due_date || null, start_date || null, req.user.organizationId]
    );
    const task = taskRes.rows[0];

    if (assigned_user_ids && assigned_user_ids.length > 0) {
      // ... inchangé ...
    }

    res.status(201).json({ message: 'Tâche créée et assignée', task, planWarning: limitCheck.warning || null });
  } catch (error) {
    res.status(500).json({ message: 'Erreur création tâche', error: error.message });
  }
};

// --- RÉCUPÉRER TOUS LES UTILISATEURS ---
export const getAllUsers = async (req, res) => {
  try {
    // Simple requête SELECT. On exclut volontairement "password_hash" par sécurité,
    // on ne renvoie jamais les mots de passe vers le frontend.
    const result = await db.query(
      'SELECT id, nom, email, role, is_active, avatar_url, created_at FROM users WHERE organization_id = $1 ORDER BY created_at DESC',
      [req.user.organizationId]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération utilisateurs', error: error.message });
  }
};