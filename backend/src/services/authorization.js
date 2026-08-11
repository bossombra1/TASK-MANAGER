export async function isProjectMember(db, projectId, userId, organizationId) {
  const { rows } = await db.query(
    'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2 AND organization_id = $3',
    [projectId, userId, organizationId]
  );
  return rows.length > 0;
}