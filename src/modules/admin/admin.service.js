const db = require('../../config/db');

// ---------------------------------------------------------------------------
// Reports — cross-domain read aggregation
// ---------------------------------------------------------------------------

async function getReports({ from, to, type } = {}) {
  const conditions = [];
  const params = [];

  if (from) {
    params.push(from);
    conditions.push(`created_at >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    conditions.push(`created_at <= $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [ordersResult, usersResult, revenueResult] = await Promise.all([
    db.query(`SELECT COUNT(*) AS total_orders FROM orders ${whereClause}`, params),
    db.query(`SELECT COUNT(*) AS total_users FROM users ${whereClause}`, params),
    db.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS total_revenue FROM orders ${whereClause}`,
      params
    ),
  ]);

  return {
    total_orders: parseInt(ordersResult.rows[0].total_orders, 10),
    total_users: parseInt(usersResult.rows[0].total_users, 10),
    total_revenue: parseFloat(revenueResult.rows[0].total_revenue),
    filters: { from: from || null, to: to || null, type: type || null },
  };
}

// ---------------------------------------------------------------------------
// Permissions
// ---------------------------------------------------------------------------

async function getAllPermissions() {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM permissions ORDER BY name ASC'
  );
  return result.rows;
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

async function getAllRoles() {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM roles ORDER BY name ASC'
  );
  return result.rows;
}

async function createRole({ name, description }) {
  if (!name || name.trim() === '') {
    const err = new Error('Role name is required');
    err.statusCode = 400;
    throw err;
  }

  const existing = await db.query('SELECT id FROM roles WHERE name = $1', [name.trim()]);
  if (existing.rows.length > 0) {
    const err = new Error('A role with this name already exists');
    err.statusCode = 409;
    throw err;
  }

  const result = await db.query(
    'INSERT INTO roles (name, description) VALUES ($1, $2) RETURNING id, name, description, created_at, updated_at',
    [name.trim(), description || null]
  );
  return result.rows[0];
}

async function getRoleById(roleId) {
  const result = await db.query(
    'SELECT id, name, description, created_at, updated_at FROM roles WHERE id = $1',
    [roleId]
  );
  return result.rows[0] || null;
}

async function updateRole(roleId, { name, description }) {
  const existing = await db.query('SELECT id FROM roles WHERE id = $1', [roleId]);
  if (existing.rows.length === 0) {
    return null;
  }

  if (!name || name.trim() === '') {
    const err = new Error('Role name is required');
    err.statusCode = 400;
    throw err;
  }

  const duplicate = await db.query(
    'SELECT id FROM roles WHERE name = $1 AND id != $2',
    [name.trim(), roleId]
  );
  if (duplicate.rows.length > 0) {
    const err = new Error('A role with this name already exists');
    err.statusCode = 409;
    throw err;
  }

  const result = await db.query(
    'UPDATE roles SET name = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, description, created_at, updated_at',
    [name.trim(), description || null, roleId]
  );
  return result.rows[0];
}

async function deleteRole(roleId) {
  const existing = await db.query('SELECT id FROM roles WHERE id = $1', [roleId]);
  if (existing.rows.length === 0) {
    const err = new Error('Role not found');
    err.statusCode = 404;
    throw err;
  }

  await db.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);
  await db.query('DELETE FROM roles WHERE id = $1', [roleId]);
}

// ---------------------------------------------------------------------------
// Role Permissions
// ---------------------------------------------------------------------------

async function getRolePermissions(roleId) {
  const role = await db.query('SELECT id FROM roles WHERE id = $1', [roleId]);
  if (role.rows.length === 0) {
    const err = new Error('Role not found');
    err.statusCode = 404;
    throw err;
  }

  const result = await db.query(
    `SELECT p.id, p.name, p.description, p.created_at, p.updated_at
     FROM permissions p
     INNER JOIN role_permissions rp ON rp.permission_id = p.id
     WHERE rp.role_id = $1
     ORDER BY p.name ASC`,
    [roleId]
  );
  return result.rows;
}

async function addPermissionToRole(roleId, { permission_id }) {
  const role = await db.query('SELECT id FROM roles WHERE id = $1', [roleId]);
  if (role.rows.length === 0) {
    const err = new Error('Role not found');
    err.statusCode = 404;
    throw err;
  }

  if (!permission_id) {
    const err = new Error('permission_id is required');
    err.statusCode = 400;
    throw err;
  }

  const permission = await db.query('SELECT id FROM permissions WHERE id = $1', [permission_id]);
  if (permission.rows.length === 0) {
    const err = new Error('Permission not found');
    err.statusCode = 404;
    throw err;
  }

  const existing = await db.query(
    'SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
    [roleId, permission_id]
  );
  if (existing.rows.length > 0) {
    const err = new Error('Permission is already assigned to this role');
    err.statusCode = 409;
    throw err;
  }

  const result = await db.query(
    'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) RETURNING id, role_id, permission_id',
    [roleId, permission_id]
  );
  return result.rows[0];
}

async function removePermissionFromRole(roleId, permissionId) {
  const role = await db.query('SELECT id FROM roles WHERE id = $1', [roleId]);
  if (role.rows.length === 0) {
    const err = new Error('Role not found');
    err.statusCode = 404;
    throw err;
  }

  const existing = await db.query(
    'SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
    [roleId, permissionId]
  );
  if (existing.rows.length === 0) {
    const err = new Error('Permission not assigned to this role');
    err.statusCode = 404;
    throw err;
  }

  await db.query(
    'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
    [roleId, permissionId]
  );
}

// ---------------------------------------------------------------------------
// Serviceable Pin Codes
// ---------------------------------------------------------------------------

async function getServiceablePinCodes({ active } = {}) {
  const conditions = [];
  const params = [];

  if (active !== undefined) {
    params.push(active === 'true' || active === true);
    conditions.push(`is_active = $${params.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const result = await db.query(
    `SELECT id, pin_code, city, state, is_active, created_at, updated_at
     FROM serviceable_pin_codes
     ${whereClause}
     ORDER BY pin_code ASC`,
    params
  );
  return result.rows;
}

async function createServiceablePinCode({ pin_code, city, state, is_active }) {
  if (!pin_code || pin_code.trim() === '') {
    const err = new Error('pin_code is required');
    err.statusCode = 400;
    throw err;
  }

  const existing = await db.query(
    'SELECT id FROM serviceable_pin_codes WHERE pin_code = $1',
    [pin_code.trim()]
  );
  if (existing.rows.length > 0) {
    const err = new Error('Pin code already exists');
    err.statusCode = 409;
    throw err;
  }

  const result = await db.query(
    `INSERT INTO serviceable_pin_codes (pin_code, city, state, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING id, pin_code, city, state, is_active, created_at, updated_at`,
    [pin_code.trim(), city || null, state || null, is_active !== undefined ? is_active : true]
  );
  return result.rows[0];
}

async function updateServiceablePinCode(pinCodeId, { pin_code, city, state, is_active }) {
  const existing = await db.query(
    'SELECT id FROM serviceable_pin_codes WHERE id = $1',
    [pinCodeId]
  );
  if (existing.rows.length === 0) {
    return null;
  }

  if (!pin_code || pin_code.trim() === '') {
    const err = new Error('pin_code is required');
    err.statusCode = 400;
    throw err;
  }

  const duplicate = await db.query(
    'SELECT id FROM serviceable_pin_codes WHERE pin_code = $1 AND id != $2',
    [pin_code.trim(), pinCodeId]
  );
  if (duplicate.rows.length > 0) {
    const err = new Error('Pin code already exists');
    err.statusCode = 409;
    throw err;
  }

  const result = await db.query(
    `UPDATE serviceable_pin_codes
     SET pin_code = $1, city = $2, state = $3, is_active = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING id, pin_code, city, state, is_active, created_at, updated_at`,
    [pin_code.trim(), city || null, state || null, is_active !== undefined ? is_active : true, pinCodeId]
  );
  return result.rows[0];
}

async function deleteServiceablePinCode(pinCodeId) {
  const existing = await db.query(
    'SELECT id FROM serviceable_pin_codes WHERE id = $1',
    [pinCodeId]
  );
  if (existing.rows.length === 0) {
    const err = new Error('Serviceable pin code not found');
    err.statusCode = 404;
    throw err;
  }

  await db.query('DELETE FROM serviceable_pin_codes WHERE id = $1', [pinCodeId]);
}

module.exports = {
  getReports,
  getAllPermissions,
  getAllRoles,
  createRole,
  getRoleById,
  updateRole,
  deleteRole,
  getRolePermissions,
  addPermissionToRole,
  removePermissionFromRole,
  getServiceablePinCodes,
  createServiceablePinCode,
  updateServiceablePinCode,
  deleteServiceablePinCode,
};
