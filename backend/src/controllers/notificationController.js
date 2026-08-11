import db from '../config/db.js';
// Importe la connexion/pool à la base de données PostgreSQL configurée dans config/db.js

// Mes notifications, les plus récentes en premier
export const getMyNotifications = async (req, res) => {
  // Fonction contrôleur Express asynchrone : récupère les notifications de l'utilisateur connecté
  try {
    // Début du bloc try/catch pour intercepter toute erreur SQL ou d'exécution
    const result = await db.query(
      // Requête SQL paramétrée exécutée via le pool de connexion, résultat attendu de façon asynchrone
      // SELECT : colonnes de la notification (id, type, is_read, created_at)
      // ainsi que les colonnes jointes de la tâche, du projet, du commentaire et de l'auteur du commentaire
      // FROM notifications n : table principale, alias "n"
      // LEFT JOIN tasks t ON t.id = n.task_id : jointure externe vers la tâche liée (peut être NULL)
      // LEFT JOIN projects p ON p.id = t.project_id : jointure externe vers le projet de cette tâche
      // LEFT JOIN comments c ON c.id = n.comment_id : jointure externe vers le commentaire lié à la notification
      // LEFT JOIN users u ON u.id = c.author_id : jointure externe vers l'auteur de ce commentaire
      // WHERE n.user_id = $1 : filtre les notifications appartenant uniquement à l'utilisateur courant
      // ORDER BY n.created_at DESC : trie de la plus récente à la plus ancienne
      // LIMIT 50 : limite le résultat aux 50 dernières notifications
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
       WHERE n.user_id = $1 AND n.organization_id = $2
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [req.user.id, req.user.organizationId] // Paramètre injecté à la place de $1 : l'id de l'utilisateur authentifié (fourni par le middleware d'auth)
    );
    res.json(result.rows); // Renvoie au client les lignes du résultat au format JSON (statut 200 implicite)
  } catch (error) {
    // En cas d'erreur (connexion DB, requête invalide, etc.)
    res.status(500).json({ message: 'Erreur récupération notifications', error: error.message });
    // Renvoie un statut HTTP 500 avec un message générique et le détail de l'exception
  }
};

export const markNotificationRead = async (req, res) => {
  // Fonction contrôleur : marque une notification précise comme lue
  const { id } = req.params;
  // Extrait l'id de la notification depuis les paramètres de l'URL (ex: /notifications/:id)
  try {
    const result = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 AND organization_id = $3 RETURNING *',
      // UPDATE : passe is_read à TRUE pour la notification dont l'id correspond à $1
      // ET dont user_id correspond à $2 (garantit que l'utilisateur ne peut modifier que ses propres notifications)
      // RETURNING * : renvoie la ligne mise à jour telle qu'elle est en base après modification
      [id, req.user.id, req.user.organizationId]
      // Paramètres liés : $1 = id de la notification (depuis l'URL), $2 = id de l'utilisateur connecté
    );
    if (result.rows.length === 0) {
      // Si aucune ligne n'a été mise à jour, la notification n'existe pas ou n'appartient pas à cet utilisateur
      return res.status(404).json({ message: 'Notification introuvable' });
      // Renvoie une erreur 404 et arrête l'exécution de la fonction
    }
    res.json(result.rows[0]);
    // Renvoie au client la notification mise à jour (premier et unique élément du tableau)
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour notification', error: error.message });
    // Renvoie une erreur 500 en cas d'échec de la requête
  }
};

export const markAllNotificationsRead = async (req, res) => {
  // Fonction contrôleur : marque toutes les notifications non lues de l'utilisateur comme lues
  try {
    await db.query('UPDATE notifications SET is_read = TRUE WHERE user_id = $1 AND is_read = FALSE AND organization_id = $2', [req.user.id, req.user.organizationId]);
    // UPDATE : passe is_read à TRUE pour toutes les notifications de l'utilisateur ($1)
    // qui sont encore non lues (is_read = FALSE) ; le résultat n'est pas exploité ici
    res.json({ message: 'Notifications marquées comme lues' });
    // Renvoie une confirmation simple au client, sans détail des lignes affectées
  } catch (error) {
    res.status(500).json({ message: 'Erreur mise à jour notifications', error: error.message });
    // Renvoie une erreur 500 en cas d'échec de la requête
  }
};