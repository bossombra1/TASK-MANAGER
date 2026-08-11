import db from '../config/db.js';
// Importe la connexion/pool à la base de données PostgreSQL configurée dans config/db.js

export const getMyProjects = async (req, res) => {
  // Fonction contrôleur : récupère la liste des projets visibles par l'utilisateur connecté
  try {
    let result;
    // Déclare une variable qui contiendra le résultat de la requête, selon le rôle de l'utilisateur
    if (req.user.role === 'admin') {
      // Si l'utilisateur connecté a le rôle admin
      result = await db.query('SELECT * FROM projects WHERE organization_id = $1 ORDER BY created_at DESC', [req.user.organizationId]);
      // Un admin voit tous les projets, triés du plus récent au plus ancien, sans filtrage
    } else {
      // Sinon (utilisateur non-admin)
      result = await db.query(
        `SELECT p.* FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.user_id = $1 AND pm.organization_id = $2 AND p.organization_id = $2
         ORDER BY p.created_at DESC`,
        // SELECT p.* : sélectionne toutes les colonnes de la table projects (alias p)
        // JOIN project_members pm ON pm.project_id = p.id : jointure interne avec la table des membres,
        //   pour ne retenir que les projets qui ont une entrée d'appartenance
        // WHERE pm.user_id = $1 : filtre pour ne garder que les projets où l'utilisateur courant est membre
        // ORDER BY p.created_at DESC : trie du projet le plus récent au plus ancien
        [req.user.id, req.user.organizationId]
        // Paramètre lié : $1 = id de l'utilisateur connecté (fourni par le middleware d'auth)
      );
    }
    res.json(result.rows);
    // Renvoie au client les lignes obtenues (tous les projets si admin, sinon uniquement ceux où il est membre)
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération projets', error: error.message });
    // En cas d'erreur SQL ou d'exécution, renvoie un statut 500 avec le détail de l'exception
  }
};

export const getProjectById = async (req, res) => {
  // Fonction contrôleur : récupère un projet précis, avec vérification d'accès et liste des membres
  const { id } = req.params;
  // Extrait l'id du projet depuis les paramètres de l'URL (ex: /projects/:id)
  try {
    const project = await db.query('SELECT * FROM projects WHERE id = $1 AND organization_id = $2', [id, req.user.organizationId]);
    // Recherche le projet correspondant à l'id fourni ; $1 = id du projet
    if (project.rows.length === 0) {
      // Si aucune ligne n'est retournée, le projet n'existe pas
      return res.status(404).json({ error: 'Ressource introuvable' });
      // Renvoie une erreur 404 et arrête l'exécution de la fonction
    }

    if (req.user.role !== 'admin') {
      // Si l'utilisateur connecté n'est pas admin, on doit vérifier qu'il a le droit de voir ce projet
      const membership = await db.query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2 AND organization_id = $3',
        // SELECT 1 : ne récupère aucune colonne utile, sert uniquement à tester l'existence d'une ligne
        // WHERE project_id = $1 AND user_id = $2 : vérifie que l'utilisateur est bien membre de ce projet
        [id, req.user.id, req.user.organizationId]
        // Paramètres liés : $1 = id du projet demandé, $2 = id de l'utilisateur connecté
      );
      if (membership.rows.length === 0) {
        // Si aucune ligne trouvée, l'utilisateur n'appartient pas à ce projet
        return res.status(403).json({ message: "Vous n'êtes pas membre de ce projet" });
        // Renvoie une erreur 403 (accès interdit) et arrête l'exécution de la fonction
      }
    }

    const members = await db.query(
      `SELECT u.id, u.nom, u.email, u.avatar_url FROM users u
       JOIN project_members pm ON pm.user_id = u.id
       WHERE pm.project_id = $1 AND pm.organization_id = $2 AND u.organization_id = $2`,
      // SELECT : récupère l'id, le nom, l'email et l'avatar de chaque utilisateur membre
      // JOIN project_members pm ON pm.user_id = u.id : jointure interne pour ne garder que les utilisateurs
      //   ayant une entrée d'appartenance à un projet
      // WHERE pm.project_id = $1 : filtre sur le projet demandé
      [id, req.user.organizationId]
      // Paramètre lié : $1 = id du projet demandé
    );

    res.json({ ...project.rows[0], members: members.rows });
    // Renvoie au client un objet fusionnant les colonnes du projet (premier et unique résultat)
    // avec une propriété "members" contenant la liste des utilisateurs membres du projet
  } catch (error) {
    res.status(500).json({ message: 'Erreur récupération projet', error: error.message });
    // En cas d'erreur SQL ou d'exécution, renvoie un statut 500 avec le détail de l'exception
  }
};