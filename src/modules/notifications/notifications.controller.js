const notificationsService = require('./notifications.service');

/**
 * GET /notifications
 * Returns a list of notifications for the authenticated user.
 */
async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, unreadOnly } = req.query;

    const result = await notificationsService.getNotificationsForUser(userId, {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      unreadOnly: unreadOnly === 'true',
    });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /notifications/:id
 * Returns a single notification by ID.
 */
async function getNotificationById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationsService.getNotificationById(id, userId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /notifications/:id/read
 * Marks a single notification as read.
 */
async function markAsRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await notificationsService.markNotificationAsRead(id, userId);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    return res.status(200).json(notification);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /notifications/read-all
 * Marks all notifications for the authenticated user as read.
 */
async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;

    const result = await notificationsService.markAllNotificationsAsRead(userId);

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getNotifications,
  getNotificationById,
  markAsRead,
  markAllAsRead,
};
