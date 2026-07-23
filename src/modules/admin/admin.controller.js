const adminService = require('./admin.service');
const { successResponse, errorResponse } = require('../../utils/response.util');

/**
 * GET /admin/reports
 * Orchestrates report aggregation across domains
 */
async function getReports(req, res) {
  try {
    const { from, to, type } = req.query;
    const reports = await adminService.getReports({ from, to, type });
    return res.status(200).json(successResponse('Reports fetched successfully', reports));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * GET /admin/permissions
 */
async function getPermissions(req, res) {
  try {
    const permissions = await adminService.getAllPermissions();
    return res.status(200).json(successResponse('Permissions fetched successfully', permissions));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * GET /admin/roles
 */
async function getRoles(req, res) {
  try {
    const roles = await adminService.getAllRoles();
    return res.status(200).json(successResponse('Roles fetched successfully', roles));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * POST /admin/roles
 */
async function createRole(req, res) {
  try {
    const role = await adminService.createRole(req.body);
    return res.status(201).json(successResponse('Role created successfully', role));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * GET /admin/roles/:roleId
 */
async function getRoleById(req, res) {
  try {
    const role = await adminService.getRoleById(req.params.roleId);
    if (!role) {
      return res.status(404).json(errorResponse('Role not found'));
    }
    return res.status(200).json(successResponse('Role fetched successfully', role));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * PUT /admin/roles/:roleId
 */
async function updateRole(req, res) {
  try {
    const role = await adminService.updateRole(req.params.roleId, req.body);
    if (!role) {
      return res.status(404).json(errorResponse('Role not found'));
    }
    return res.status(200).json(successResponse('Role updated successfully', role));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * DELETE /admin/roles/:roleId
 */
async function deleteRole(req, res) {
  try {
    await adminService.deleteRole(req.params.roleId);
    return res.status(200).json(successResponse('Role deleted successfully', null));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * GET /admin/roles/:roleId/permissions
 */
async function getRolePermissions(req, res) {
  try {
    const permissions = await adminService.getRolePermissions(req.params.roleId);
    return res.status(200).json(successResponse('Role permissions fetched successfully', permissions));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * POST /admin/roles/:roleId/permissions
 */
async function addPermissionToRole(req, res) {
  try {
    const result = await adminService.addPermissionToRole(req.params.roleId, req.body);
    return res.status(201).json(successResponse('Permission added to role successfully', result));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * DELETE /admin/roles/:roleId/permissions/:permissionId
 */
async function removePermissionFromRole(req, res) {
  try {
    await adminService.removePermissionFromRole(req.params.roleId, req.params.permissionId);
    return res.status(200).json(successResponse('Permission removed from role successfully', null));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * GET /admin/serviceable-pin-codes
 */
async function getServiceablePinCodes(req, res) {
  try {
    const pinCodes = await adminService.getServiceablePinCodes(req.query);
    return res.status(200).json(successResponse('Serviceable pin codes fetched successfully', pinCodes));
  } catch (err) {
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * POST /admin/serviceable-pin-codes
 */
async function createServiceablePinCode(req, res) {
  try {
    const pinCode = await adminService.createServiceablePinCode(req.body);
    return res.status(201).json(successResponse('Serviceable pin code created successfully', pinCode));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * PUT /admin/serviceable-pin-codes/:pinCodeId
 */
async function updateServiceablePinCode(req, res) {
  try {
    const pinCode = await adminService.updateServiceablePinCode(req.params.pinCodeId, req.body);
    if (!pinCode) {
      return res.status(404).json(errorResponse('Serviceable pin code not found'));
    }
    return res.status(200).json(successResponse('Serviceable pin code updated successfully', pinCode));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

/**
 * DELETE /admin/serviceable-pin-codes/:pinCodeId
 */
async function deleteServiceablePinCode(req, res) {
  try {
    await adminService.deleteServiceablePinCode(req.params.pinCodeId);
    return res.status(200).json(successResponse('Serviceable pin code deleted successfully', null));
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json(errorResponse(err.message));
    }
    return res.status(500).json(errorResponse(err.message));
  }
}

module.exports = {
  getReports,
  getPermissions,
  getRoles,
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
