async function recalculateProjectStatus(projectId, dbClient) {
  // Fonction asynchrone : recalcule et met à jour le statut d'un projet en fonction du statut de ses tâches
  // Reçoit l'id du projet et un client/pool de base de données (permet de réutiliser une connexion existante)
  const { rows } = await dbClient.query(
    'SELECT status FROM tasks WHERE project_id = $1',
    [projectId]
  );
  // Récupère le statut de toutes les tâches appartenant à ce projet ; $1 = id du projet
  // Déstructure directement la propriété "rows" du résultat

  if (rows.length === 0) {
    // Si le projet ne possède aucune tâche
    await dbClient.query(
      `UPDATE projects SET status = 'todo' WHERE id = $1`,
      [projectId]
    );
    // Met à jour le projet avec le statut 'todo' par défaut (aucune tâche = rien commencé) ; $1 = id du projet
    return 'todo';
    // Retourne directement 'todo' et arrête l'exécution de la fonction
  }

  const statuses = rows.map(r => r.status);
  // Transforme le tableau de lignes en un simple tableau des valeurs de statut (ex: ['todo', 'doing', 'done'])
  let newStatus;
  // Déclare la variable qui contiendra le statut calculé du projet

  if (statuses.every(s => s === 'done')) {
    // Si TOUTES les tâches ont le statut 'done'
    newStatus = 'done';
    // Le projet est considéré comme entièrement terminé
  } else if (statuses.some(s => s === 'doing' || s === 'done')) {
    // Sinon, si AU MOINS UNE tâche est 'doing' ou 'done' (mais pas toutes 'done', vu le else if)
    newStatus = 'doing';
    // Le projet est considéré comme en cours
  } else {
    // Sinon (aucune tâche 'doing' ni 'done', donc toutes en 'todo')
    newStatus = 'todo';
    // Le projet est considéré comme non démarré
  }

  await dbClient.query(
    'UPDATE projects SET status = $1 WHERE id = $2',
    [newStatus, projectId]
  );
  // Enregistre le statut calculé en base de données ; $1 = nouveau statut, $2 = id du projet

  return newStatus;
  // Retourne le statut calculé à l'appelant (ex: pour l'inclure dans une réponse JSON)
}

export { recalculateProjectStatus };
// Exporte la fonction pour qu'elle soit utilisée dans d'autres fichiers (ex: le contrôleur des tâches)