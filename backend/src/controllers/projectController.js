import db from '../config/db.js';

export const getMyProjects = async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await db.query('SELECT * FROM projects ORDER BY created_at DESC');
    } else {
      result = await db.query(
        `SELECT p.* FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.user_id = $1
         ORDER BY p.created_at DESC`,
        [req.user.id]
      );
    }
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération projets', error: error.message });
  }
};

export const getProjectById = async (req, res) => {
  const { id } = req.params;
  try {
    const project = await db.query('SELECT * FROM projects WHERE id = $1', [id]);
    if (project.rows.length === 0) {
      return res.status(404).json({ message: 'Projet introuvable' });
    }

    if (req.user.role !== 'admin') {
      const membership = await db.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [id, req.user.id]
      );
      if (membership.rows.length === 0) {
        return res.status(403).json({ message: "Vous n'êtes pas membre de ce projet" });
      }
    }

    const members = await db.query(
      `SELECT u.id, u.nom, u.email, u.avatar_url FROM users u
       JOIN project_members pm ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [id]
    );

    res.json({ ...project.rows[0], members: members.rows });
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération projet', error: error.message });
  }
};