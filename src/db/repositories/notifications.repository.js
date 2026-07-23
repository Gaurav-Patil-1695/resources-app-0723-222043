const db = require('../knex');

const TABLE = 'notifications';

const findById = (id) =>
  db(TABLE).where({ id }).first();

const findByUserId = (userId, { limit = 20, offset = 0 } = {}) =>
  db(TABLE).where({ user_id: userId }).orderBy('created_at', 'desc').limit(limit).offset(offset);

const findUnreadByUserId = (userId) =>
  db(TABLE).where({ user_id: userId, is_read: false }).orderBy('created_at', 'desc');

const countUnreadByUserId = (userId) =>
  db(TABLE).where({ user_id: userId, is_read: false }).count('id as total').first();

const findAll = ({ limit = 20, offset = 0 } = {}) =>
  db(TABLE).orderBy('created_at', 'desc').limit(limit).offset(offset);

const create = (data) =>
  db(TABLE).insert(data).returning('*').then((rows) => rows[0]);

const bulkCreate = (rows) =>
  db(TABLE).insert(rows).returning('*');

const updateById = (id, data) =>
  db(TABLE).where({ id }).update(data).returning('*').then((rows) => rows[0]);

const markAsRead = (id) =>
  db(TABLE).where({ id }).update({ is_read: true, read_at: db.fn.now() });

const markAllAsReadByUserId = (userId) =>
  db(TABLE)
    .where({ user_id: userId, is_read: false })
    .update({ is_read: true, read_at: db.fn.now() });

const deleteById = (id) =>
  db(TABLE).where({ id }).del();

const deleteByUserId = (userId) =>
  db(TABLE).where({ user_id: userId }).del();

module.exports = {
  findById,
  findByUserId,
  findUnreadByUserId,
  countUnreadByUserId,
  findAll,
  create,
  bulkCreate,
  updateById,
  markAsRead,
  markAllAsReadByUserId,
  deleteById,
  deleteByUserId,
};
