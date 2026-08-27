import db from '../config/db.js';
import bcrypt from 'bcrypt';

// --- LOG D'ACTIVITÉ (helper interne) ---
const logAction = async (superAdminId, action, targetType = null, targetId = null, details = null) => {
  await db.query(
    'INSERT INTO super_admin_logs (super_admin_id, action, target_type, target_id, details) VALUES ($1, $2, $3, $4, $5)',
    [superAdminId, action, targetType, targetId, details ? JSON.stringify(details) : null]
  );
};

// --- CRÉER UNE ENTREPRISE + SON ADMIN (par le super admin) ---
export const createOrganizationBySuperAdmin = async (req, res) => {
  const { organizationName, nom, email, password } = req.body;

  if (!organizationName || !nom || !email || !password) {
    return res.status(400).json({ message: 'Tous les champs sont requis' });
  }

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Cet email est déjà utilisé' });
    }

    const slug = organizationName.trim().toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const orgRes = await client.query(
      `INSERT INTO organizations (name, slug, plan, status)
       VALUES ($1, $2, 'free', 'active') RETURNING *`,
      [organizationName.trim(), slug]
    );
    const organization = orgRes.rows[0];

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userRes = await client.query(
      `INSERT INTO users (nom, email, password_hash, role, organization_id)
       VALUES ($1, $2, $3, 'admin', $4)
       RETURNING id, nom, email, role, created_at`,
      [nom, email, passwordHash, organization.id]
    );

    await client.query('COMMIT');

    await logAction(req.user.id, 'create_organization', 'organization', organization.id, { organizationName: organization.name, adminEmail: email });

    res.status(201).json({
      message: 'Entreprise et compte administrateur créés avec succès',
      organization,
      user: userRes.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ message: 'Erreur lors de la création', error: error.message });
  } finally {
    client.release();
  }
};

// --- TABLEAU DE BORD GLOBAL ---
export const getDashboard = async (req, res) => {
  try {
    const [orgsCount, activeOrgsCount, projectsCount, tasksCount, usersCount, tasksByStatus, projectsByStatus] = await Promise.all([
      db.query('SELECT COUNT(*) FROM organizations'),
      db.query("SELECT COUNT(*) FROM organizations WHERE status = 'active'"),
      db.query('SELECT COUNT(*) FROM projects'),
      db.query('SELECT COUNT(*) FROM tasks'),
      db.query("SELECT COUNT(*) FROM users WHERE role != 'super_admin'"),
      db.query('SELECT status, COUNT(*) FROM tasks GROUP BY status'),
      db.query(`
        SELECT
          CASE WHEN EXISTS (SELECT 1 FROM tasks t WHERE t.project_id = p.id AND t.status != 'done')
            THEN 'en_cours' ELSE 'termine' END AS derived_status,
          COUNT(*)
        FROM projects p GROUP BY derived_status
      `),
    ]);

    // Évolution des inscriptions d'entreprises par mois (12 derniers mois)
    const signupsByMonth = await db.query(`
      SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS month, COUNT(*)
      FROM organizations
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY month ORDER BY month
    `);

    res.json({
      totals: {
        organizations: Number(orgsCount.rows[0].count),
        activeOrganizations: Number(activeOrgsCount.rows[0].count),
        projects: Number(projectsCount.rows[0].count),
        tasks: Number(tasksCount.rows[0].count),
        users: Number(usersCount.rows[0].count),
      },
      tasksByStatus: tasksByStatus.rows,
      projectsByStatus: projectsByStatus.rows,
      signupsByMonth: signupsByMonth.rows,
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération dashboard', error: error.message });
  }
};

// --- LISTE DES ENTREPRISES (avec compteurs) ---
export const getAllOrganizations = async (req, res) => {
  const { search, plan, status } = req.query;
  try {
    const conditions = [];
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(o.name ILIKE $${params.length} OR o.slug ILIKE $${params.length})`);
    }
    if (plan) {
      params.push(plan);
      conditions.push(`o.plan = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`o.status = $${params.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT o.*,
        (SELECT COUNT(*) FROM users u WHERE u.organization_id = o.id) AS users_count,
        (SELECT COUNT(*) FROM projects p WHERE p.organization_id = o.id) AS projects_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.organization_id = o.id) AS tasks_count
       FROM organizations o
       ${whereClause}
       ORDER BY o.created_at DESC`,
      params
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération entreprises', error: error.message });
  }
};

// --- DÉTAIL D'UNE ENTREPRISE ---
export const getOrganizationById = async (req, res) => {
  const { id } = req.params;
  try {
    const org = await db.query('SELECT * FROM organizations WHERE id = $1', [id]);
    if (org.rows.length === 0) {
      return res.status(404).json({ message: 'Entreprise introuvable' });
    }

    const [members, projects] = await Promise.all([
  db.query('SELECT id, nom, email, role, is_active, created_at, avatar_url FROM users WHERE organization_id = $1 ORDER BY role, nom', [id]),
      db.query(`
        SELECT p.*,
          (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) AS tasks_count
        FROM projects p WHERE p.organization_id = $1 ORDER BY p.created_at DESC
      `, [id]),
    ]);

    res.json({ organization: org.rows[0], members: members.rows, projects: projects.rows });
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération détail entreprise', error: error.message });
  }
};

// --- ACTIVER / DÉSACTIVER UNE ENTREPRISE ---
export const toggleOrganizationStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const current = await db.query('SELECT status FROM organizations WHERE id = $1', [id]);
    if (current.rows.length === 0) {
      return res.status(404).json({ message: 'Entreprise introuvable' });
    }
    const newStatus = current.rows[0].status === 'active' ? 'suspended' : 'active';

    const result = await db.query(
      'UPDATE organizations SET status = $1 WHERE id = $2 RETURNING *',
      [newStatus, id]
    );

    await logAction(req.user.id, 'toggle_organization_status', 'organization', id, { newStatus });

    res.json({ message: `Entreprise ${newStatus === 'active' ? 'activée' : 'suspendue'}`, organization: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur changement statut', error: error.message });
  }
};

// --- CHANGER LE PLAN D'UNE ENTREPRISE ---
export const updateOrganizationPlan = async (req, res) => {
  const { id } = req.params;
  const { plan } = req.body;
  const validPlans = ['free', 'pro', 'enterprise'];

  if (!validPlans.includes(plan)) {
    return res.status(400).json({ message: 'Plan invalide' });
  }

  try {
    const result = await db.query(
      'UPDATE organizations SET plan = $1 WHERE id = $2 RETURNING *',
      [plan, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Entreprise introuvable' });
    }

    await logAction(req.user.id, 'update_organization_plan', 'organization', id, { newPlan: plan });

    res.json({ message: 'Plan mis à jour', organization: result.rows[0] });
  } catch (error) {
    res.status(500).json({ message: 'Erreur changement de plan', error: error.message });
  }
};

// --- SUPPRIMER UNE ENTREPRISE ---
export const deleteOrganization = async (req, res) => {
  const { id } = req.params;
  try {
    const org = await db.query('SELECT name FROM organizations WHERE id = $1', [id]);
    if (org.rows.length === 0) {
      return res.status(404).json({ message: 'Entreprise introuvable' });
    }

    // Suppose ON DELETE CASCADE en place sur users/projects/tasks.organization_id -> organizations.id
    await db.query('DELETE FROM organizations WHERE id = $1', [id]);

    await logAction(req.user.id, 'delete_organization', 'organization', id, { name: org.rows[0].name });

    res.json({ message: 'Entreprise supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur suppression entreprise', error: error.message });
  }
};

// --- ENTREPRISES INACTIVES DEPUIS X JOURS ---
export const getInactiveOrganizations = async (req, res) => {
  const days = Number(req.query.days) || 30;
  try {
    const result = await db.query(`
      SELECT o.*, GREATEST(MAX(p.created_at), MAX(t.created_at)) AS last_activity
      FROM organizations o
      LEFT JOIN projects p ON p.organization_id = o.id
      LEFT JOIN tasks t ON t.organization_id = o.id
      GROUP BY o.id
      HAVING GREATEST(MAX(p.created_at), MAX(t.created_at)) < NOW() - ($1 || ' days')::interval
         OR GREATEST(MAX(p.created_at), MAX(t.created_at)) IS NULL
      ORDER BY last_activity ASC NULLS FIRST
    `, [days]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération entreprises inactives', error: error.message });
  }
};


// --- TOP ENTREPRISES PAR ACTIVITÉ RÉCENTE ---
export const getTopActiveOrganizations = async (req, res) => {
  const days = Number(req.query.days) || 30;
  try {
    const result = await db.query(`
      SELECT o.id, o.name, o.slug, o.plan, o.status,
        COUNT(t.id) FILTER (WHERE t.created_at >= NOW() - ($1 || ' days')::interval) AS recent_tasks_count
      FROM organizations o
      LEFT JOIN tasks t ON t.organization_id = o.id
      GROUP BY o.id
      ORDER BY recent_tasks_count DESC
      LIMIT 10
    `, [days]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération top entreprises', error: error.message });
  }
};

// --- JOURNAL D'ACTIVITÉ DU SUPER ADMIN ---
export const getAuditLogs = async (req, res) => {
  try {
    const result = await db.query(`
      SELECT l.*, u.nom AS super_admin_nom
      FROM super_admin_logs l
      JOIN users u ON u.id = l.super_admin_id
      ORDER BY l.created_at DESC
      LIMIT 200
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération journal', error: error.message });
  }
};