const db = require('../../db');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

/**
 * Retrieves a user by ID (excluding password).
 * @param {string|number} userId
 * @returns {Promise<object|null>}
 */
async function getUserById(userId) {
  const [rows] = await db.query(
    'SELECT id, email, first_name, last_name, role, phone, is_active, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL',
    [userId]
  );
  return rows[0] || null;
}

/**
 * Retrieves a user by email (including password hash for auth).
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function getUserByEmail(email) {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL',
    [email]
  );
  return rows[0] || null;
}

/**
 * Returns a paginated list of all non-deleted users.
 * @param {{ page: number, limit: number, search?: string }}
 * @returns {Promise<{ data: object[], total: number, page: number, limit: number }>}
 */
async function getAllUsers({ page, limit, search }) {
  const offset = (page - 1) * limit;
  let baseQuery = 'FROM users WHERE deleted_at IS NULL';
  const params = [];

  if (search) {
    baseQuery += ' AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term);
  }

  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total ${baseQuery}`, params);
  const [rows] = await db.query(
    `SELECT id, email, first_name, last_name, role, phone, is_active, created_at, updated_at ${baseQuery} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return { data: rows, total, page, limit };
}

/**
 * Updates a user's own profile fields (non-privileged).
 * @param {string|number} userId
 * @param {{ first_name?: string, last_name?: string, phone?: string }} data
 * @returns {Promise<object|null>}
 */
async function updateUser(userId, data) {
  const allowedFields = ['first_name', 'last_name', 'phone'];
  const updates = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return getUserById(userId);
  }

  const setClauses = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), userId];

  const [result] = await db.query(
    `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    values
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getUserById(userId);
}

/**
 * Admin update — allows updating role and is_active in addition to profile fields.
 * @param {string|number} userId
 * @param {{ first_name?: string, last_name?: string, phone?: string, role?: string, is_active?: boolean }} data
 * @returns {Promise<object|null>}
 */
async function adminUpdateUser(userId, data) {
  const allowedFields = ['first_name', 'last_name', 'phone', 'role', 'is_active'];
  const updates = {};

  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updates[field] = data[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return getUserById(userId);
  }

  const setClauses = Object.keys(updates).map((key) => `${key} = ?`).join(', ');
  const values = [...Object.values(updates), userId];

  const [result] = await db.query(
    `UPDATE users SET ${setClauses}, updated_at = NOW() WHERE id = ? AND deleted_at IS NULL`,
    values
  );

  if (result.affectedRows === 0) {
    return null;
  }

  return getUserById(userId);
}

/**
 * Soft-deletes a user by setting deleted_at.
 * @param {string|number} userId
 * @returns {Promise<boolean>}
 */
async function deleteUser(userId) {
  const [result] = await db.query(
    'UPDATE users SET deleted_at = NOW() WHERE id = ? AND deleted_at IS NULL',
    [userId]
  );
  return result.affectedRows > 0;
}

/**
 * Changes a user's password after verifying the current password.
 * @param {string|number} userId
 * @param {string} currentPassword
 * @param {string} newPassword
 * @returns {Promise<void>}
 */
async function changePassword(userId, currentPassword, newPassword) {
  const [rows] = await db.query(
    'SELECT id, password_hash FROM users WHERE id = ? AND deleted_at IS NULL',
    [userId]
  );
  const user = rows[0];

  if (!user) {
    const err = new Error('User not found.');
    err.status = 404;
    throw err;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    const err = new Error('Current password is incorrect.');
    err.status = 400;
    throw err;
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await db.query(
    'UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
    [newHash, userId]
  );
}

module.exports = {
  getUserById,
  getUserByEmail,
  getAllUsers,
  updateUser,
  adminUpdateUser,
  deleteUser,
  changePassword,
};
