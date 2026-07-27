async function recalculateProjectStatus(projectId, dbClient) {
  const { rows } = await dbClient.query(
    'SELECT status FROM tasks WHERE project_id = $1',
    [projectId]
  );

  if (rows.length === 0) {
    await dbClient.query(
      `UPDATE projects SET status = 'todo' WHERE id = $1`,
      [projectId]
    );
    return 'todo';
  }

  const statuses = rows.map(r => r.status);
  let newStatus;

  if (statuses.every(s => s === 'done')) {
    newStatus = 'done';
  } else if (statuses.some(s => s === 'doing' || s === 'done')) {
    newStatus = 'doing';
  } else {
    newStatus = 'todo';
  }

  await dbClient.query(
    'UPDATE projects SET status = $1 WHERE id = $2',
    [newStatus, projectId]
  );

  return newStatus;
}

export { recalculateProjectStatus };