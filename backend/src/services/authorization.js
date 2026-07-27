export async function isProjectMember(db, projectId, userId) {
  const { rows } = await db.query(
    'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
    [projectId, userId]
  );
  return rows.length > 0;
}