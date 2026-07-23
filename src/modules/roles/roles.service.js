// In-memory stores for demonstration; replace with DB repository calls as needed.
let roles = [];
let userRoles = [];
let nextRoleId = 1;

function generateId() {
  return String(nextRoleId++);
}

async function getAllRoles() {
  return roles;
}

async function getRoleById(id) {
  return roles.find((r) => r.id === String(id)) || null;
}

async function createRole({ name, description = '', permissions = [] }) {
  const existing = roles.find((r) => r.name === name);
  if (existing) {
    const err = new Error('A role with this name already exists');
    err.status = 409;
    throw err;
  }
  const role = {
    id: generateId(),
    name,
    description,
    permissions: Array.isArray(permissions) ? permissions : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  roles.push(role);
  return role;
}

async function updateRole(id, { name, description, permissions }) {
  const role = roles.find((r) => r.id === String(id));
  if (!role) return null;

  if (name !== undefined) {
    const conflict = roles.find((r) => r.name === name && r.id !== String(id));
    if (conflict) {
      const err = new Error('A role with this name already exists');
      err.status = 409;
      throw err;
    }
    role.name = name;
  }
  if (description !== undefined) role.description = description;
  if (permissions !== undefined) role.permissions = Array.isArray(permissions) ? permissions : [];
  role.updatedAt = new Date().toISOString();
  return role;
}

async function deleteRole(id) {
  const index = roles.findIndex((r) => r.id === String(id));
  if (index === -1) return null;
  roles.splice(index, 1);
  // Also remove all user-role assignments for this role
  userRoles = userRoles.filter((ur) => ur.roleId !== String(id));
  return true;
}

async function getUsersByRole(roleId) {
  const role = roles.find((r) => r.id === String(roleId));
  if (!role) {
    const err = new Error('Role not found');
    err.status = 404;
    throw err;
  }
  return userRoles
    .filter((ur) => ur.roleId === String(roleId))
    .map((ur) => ({ userId: ur.userId, assignedAt: ur.assignedAt }));
}

async function assignRoleToUser(roleId, userId) {
  const role = roles.find((r) => r.id === String(roleId));
  if (!role) {
    const err = new Error('Role not found');
    err.status = 404;
    throw err;
  }
  const existing = userRoles.find(
    (ur) => ur.roleId === String(roleId) && ur.userId === String(userId)
  );
  if (existing) {
    const err = new Error('User already has this role assigned');
    err.status = 409;
    throw err;
  }
  const assignment = {
    roleId: String(roleId),
    userId: String(userId),
    assignedAt: new Date().toISOString(),
  };
  userRoles.push(assignment);
  return assignment;
}

async function removeRoleFromUser(roleId, userId) {
  const index = userRoles.findIndex(
    (ur) => ur.roleId === String(roleId) && ur.userId === String(userId)
  );
  if (index === -1) return null;
  userRoles.splice(index, 1);
  return true;
}

async function getRolesByUser(userId) {
  const assignedRoleIds = userRoles
    .filter((ur) => ur.userId === String(userId))
    .map((ur) => ur.roleId);
  return roles.filter((r) => assignedRoleIds.includes(r.id));
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUsersByRole,
  assignRoleToUser,
  removeRoleFromUser,
  getRolesByUser,
};
