const db = require('../knex');

const ROLES_TABLE = 'roles';
const USER_ROLES_TABLE = 'user_roles';

// roles table
const findRoleById = (id) =>
  db(ROLES_TABLE).where({ id }).first();

const findRoleByName = (name) =>
  db(ROLES_TABLE).where({ name }).first();

const findAllRoles = () =>
  db(ROLES_TABLE).select('*');

const createRole = (data) =>
  db(ROLES_TABLE).insert(data).returning('*').then((rows) => rows[0]);

const updateRoleById = (id, data) =>
  db(ROLES_TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const deleteRoleById = (id) =>
  db(ROLES_TABLE).where({ id }).del();

// user_roles table
const assignRoleToUser = (userId, roleId) =>
  db(USER_ROLES_TABLE)
    .insert({ user_id: userId, role_id: roleId })
    .returning('*')
    .then((rows) => rows[0]);

const removeRoleFromUser = (userId, roleId) =>
  db(USER_ROLES_TABLE).where({ user_id: userId, role_id: roleId }).del();

const findRolesForUser = (userId) =>
  db(USER_ROLES_TABLE)
    .join(ROLES_TABLE, `${USER_ROLES_TABLE}.role_id`, '=', `${ROLES_TABLE}.id`)
    .where(`${USER_ROLES_TABLE}.user_id`, userId)
    .select(`${ROLES_TABLE}.*`);

const findUsersForRole = (roleId) =>
  db(USER_ROLES_TABLE)
    .join('users', `${USER_ROLES_TABLE}.user_id`, '=', 'users.id')
    .where(`${USER_ROLES_TABLE}.role_id`, roleId)
    .select('users.*');

const removeAllRolesFromUser = (userId) =>
  db(USER_ROLES_TABLE).where({ user_id: userId }).del();

const userHasRole = (userId, roleName) =>
  db(USER_ROLES_TABLE)
    .join(ROLES_TABLE, `${USER_ROLES_TABLE}.role_id`, '=', `${ROLES_TABLE}.id`)
    .where(`${USER_ROLES_TABLE}.user_id`, userId)
    .where(`${ROLES_TABLE}.name`, roleName)
    .first();

module.exports = {
  findRoleById,
  findRoleByName,
  findAllRoles,
  createRole,
  updateRoleById,
  deleteRoleById,
  assignRoleToUser,
  removeRoleFromUser,
  findRolesForUser,
  findUsersForRole,
  removeAllRolesFromUser,
  userHasRole,
};
