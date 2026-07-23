'use strict';

/**
 * RBAC middleware factory.
 * Returns a middleware that checks whether req.user has the required role.
 *
 * @param {...string} roles - One or more roles that are permitted to access the route.
 * @returns {Function} Express middleware function.
 */
function authorize(...roles) {
  return function (req, res, next) {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        code: 'UNAUTHORIZED',
        message: 'Authentication required.',
      });
    }

    const userRoles = Array.isArray(req.user.roles)
      ? req.user.roles
      : [req.user.role].filter(Boolean);

    const hasRole = roles.some((role) => userRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        status: 'error',
        code: 'FORBIDDEN',
        message: 'You do not have permission to perform this action.',
      });
    }

    return next();
  };
}

module.exports = authorize;
