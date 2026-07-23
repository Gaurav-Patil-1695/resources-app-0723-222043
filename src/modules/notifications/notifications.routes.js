const express = require('express');
const router = express.Router();
const notificationsController = require('./notifications.controller');

// GET /notifications - fetch notifications for the authenticated user
router.get('/', notificationsController.getNotifications);

// GET /notifications/:id - fetch a single notification
router.get('/:id', notificationsController.getNotificationById);

// PATCH /notifications/read-all - mark all notifications as read
// Must be defined before /:id to avoid route collision
router.patch('/read-all', notificationsController.markAllAsRead);

// PATCH /notifications/:id/read - mark a single notification as read
router.patch('/:id/read', notificationsController.markAsRead);

module.exports = router;
