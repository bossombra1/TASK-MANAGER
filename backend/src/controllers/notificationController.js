import db from '../config/db.js';

// Mes notifications, les plus récentes en premier
export const getMyNotifications = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT n.id, n.type, n.is_read, n.created_at,
              t.id AS task_id, t.title AS task_title, t.project_id,
              p.title AS project_title,
              c.content AS comment_content,
              u.nom AS author_nom
       FROM notifications n
       LEFT JOIN tasks t ON t.id = n.task_id
       LEFT JOIN projects p ON p.id = t.project_id
       LEFT JOIN comments c ON c.id = n.comment_id
       LEFT JOIN users u ON u.id = c.author_id
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération notifications', error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Notification introuvable' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour notification', error: error.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE', [req.user.id]);
    res.json({ message: 'Notifications marquées comme lues' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour notifications', error: error.message });
  }
};