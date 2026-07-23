const db = require('../../db');

/**
 * Creates a new notification for a user.
 * Intended to be called by other services.
 *
 * @param {object} params
 * @param {number|string} params.userId        - Recipient user ID
 * @param {string}        params.type          - Notification type identifier
 * @param {string}        params.title         - Short title
 * @param {string}        params.message       - Notification body
 * @param {object}        [params.metadata]    - Optional extra data
 * @returns {Promise<object>} The created notification record
 */
async function createNotification({ userId, type, title, message, metadata = null }) {
  const [notification] = await db('notifications')
    .insert({
      user_id: userId,
      type,
      title,
      message,
      metadata: metadata ? JSON.stringify(metadata) : null,
      is_read: false,
      created_at: db.fn.now(),
      updated_at: db.fn.now(),
    })
    .returning('*');

  return notification;
}

/**
 * Retrieves paginated notifications for a user.
 *
 * @param {number|string} userId
 * @param {object} options
 * @param {number}  options.page
 * @param {number}  options.limit
 * @param {boolean} options.unreadOnly
 * @returns {Promise<{ data: object[], total: number, unreadCount: number }>}
 */
async function getNotificationsForUser(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const offset = (page - 1) * limit;

  const query = db('notifications').where({ user_id: userId });

  if (unreadOnly) {
    query.where({ is_read: false });
  }

  const [{ count: total }] = await query.clone().count('id as count');
  const [{ count: unreadCount }] = await db('notifications')
    .where({ user_id: userId, is_read: false })
    .count('id as count');

  const data = await query
    .orderBy('created_at', 'desc')
    .limit(limit)
    .offset(offset)
    .select('*');

  return {
    data,
    total: parseInt(total, 10),
    unreadCount: parseInt(unreadCount, 10),
    page,
    limit,
  };
}

/**
 * Retrieves a single notification by ID, scoped to a user.
 *
 * @param {number|string} notificationId
 * @param {number|string} userId
 * @returns {Promise<object|null>}
 */
async function getNotificationById(notificationId, userId) {
  const notification = await db('notifications')
    .where({ id: notificationId, user_id: userId })
    .first();

  return notification || null;
}

/**
 * Returns the count of unread notifications for a user.
 *
 * @param {number|string} userId
 * @returns {Promise<number>}
 */
async function getUnreadCount(userId) {
  const [{ count }] = await db('notifications')
    .where({ user_id: userId, is_read: false })
    .count('id as count');

  return parseInt(count, 10);
}

/**
 * Marks a single notification as read, scoped to a user.
 *
 * @param {number|string} notificationId
 * @param {number|string} userId
 * @returns {Promise<object|null>} Updated notification or null if not found
 */
async function markNotificationAsRead(notificationId, userId) {
  const [updated] = await db('notifications')
    .where({ id: notificationId, user_id: userId })
    .update({ is_read: true, updated_at: db.fn.now() })
    .returning('*');

  return updated || null;
}

/**
 * Marks all notifications for a user as read.
 *
 * @param {number|string} userId
 * @returns {Promise<{ updatedCount: number }>}
 */
async function markAllNotificationsAsRead(userId) {
  const updatedRows = await db('notifications')
    .where({ user_id: userId, is_read: false })
    .update({ is_read: true, updated_at: db.fn.now() });

  return { updatedCount: updatedRows };
}

module.exports = {
  createNotification,
  getNotificationsForUser,
  getNotificationById,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
