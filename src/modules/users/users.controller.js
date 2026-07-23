const usersService = require('./users.service');
const { successResponse, errorResponse } = require('../../utils/response');

/**
 * GET /users/me
 * Returns the authenticated user's profile.
 */
async function getMe(req, res) {
  try {
    const user = await usersService.getUserById(req.user.id);
    if (!user) {
      return errorResponse(res, 404, 'User not found.');
    }
    return successResponse(res, 200, user);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

/**
 * PATCH /users/me
 * Updates the authenticated user's profile.
 */
async function updateMe(req, res) {
  try {
    const updated = await usersService.updateUser(req.user.id, req.body);
    if (!updated) {
      return errorResponse(res, 404, 'User not found.');
    }
    return successResponse(res, 200, updated);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

/**
 * POST /users/me/change-password
 * Changes the authenticated user's password.
 */
async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    await usersService.changePassword(req.user.id, currentPassword, newPassword);
    return successResponse(res, 200, { message: 'Password changed successfully.' });
  } catch (err) {
    if (err.status) {
      return errorResponse(res, err.status, err.message);
    }
    return errorResponse(res, 500, err.message);
  }
}

/**
 * GET /users
 * Admin: Returns a paginated list of all users.
 */
async function getAllUsers(req, res) {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const result = await usersService.getAllUsers({ page: parseInt(page, 10), limit: parseInt(limit, 10), search });
    return successResponse(res, 200, result);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

/**
 * GET /users/:userId
 * Admin: Returns a single user by ID.
 */
async function getUserById(req, res) {
  try {
    const user = await usersService.getUserById(req.params.userId);
    if (!user) {
      return errorResponse(res, 404, 'User not found.');
    }
    return successResponse(res, 200, user);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

/**
 * PATCH /users/:userId
 * Admin: Updates a user by ID (including role assignment).
 */
async function updateUserById(req, res) {
  try {
    const updated = await usersService.adminUpdateUser(req.params.userId, req.body);
    if (!updated) {
      return errorResponse(res, 404, 'User not found.');
    }
    return successResponse(res, 200, updated);
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

/**
 * DELETE /users/:userId
 * Admin: Deletes a user by ID.
 */
async function deleteUserById(req, res) {
  try {
    const deleted = await usersService.deleteUser(req.params.userId);
    if (!deleted) {
      return errorResponse(res, 404, 'User not found.');
    }
    return successResponse(res, 200, { message: 'User deleted successfully.' });
  } catch (err) {
    return errorResponse(res, 500, err.message);
  }
}

module.exports = {
  getMe,
  updateMe,
  changePassword,
  getAllUsers,
  getUserById,
  updateUserById,
  deleteUserById,
};
