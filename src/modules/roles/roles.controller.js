const rolesService = require('./roles.service');

async function getAllRoles(req, res, next) {
  try {
    const roles = await rolesService.getAllRoles();
    res.json({ data: roles });
  } catch (err) {
    next(err);
  }
}

async function getRoleById(req, res, next) {
  try {
    const role = await rolesService.getRoleById(req.params.id);
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json({ data: role });
  } catch (err) {
    next(err);
  }
}

async function createRole(req, res, next) {
  try {
    const { name, description, permissions } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Role name is required' });
    }
    const role = await rolesService.createRole({ name, description, permissions });
    res.status(201).json({ data: role });
  } catch (err) {
    next(err);
  }
}

async function updateRole(req, res, next) {
  try {
    const { name, description, permissions } = req.body;
    const role = await rolesService.updateRole(req.params.id, { name, description, permissions });
    if (!role) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.json({ data: role });
  } catch (err) {
    next(err);
  }
}

async function deleteRole(req, res, next) {
  try {
    const deleted = await rolesService.deleteRole(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Role not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getUsersByRole(req, res, next) {
  try {
    const users = await rolesService.getUsersByRole(req.params.id);
    res.json({ data: users });
  } catch (err) {
    next(err);
  }
}

async function assignRoleToUser(req, res, next) {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }
    const assignment = await rolesService.assignRoleToUser(req.params.id, userId);
    res.status(201).json({ data: assignment });
  } catch (err) {
    next(err);
  }
}

async function removeRoleFromUser(req, res, next) {
  try {
    const removed = await rolesService.removeRoleFromUser(req.params.id, req.params.userId);
    if (!removed) {
      return res.status(404).json({ message: 'User-role assignment not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

async function getRolesByUser(req, res, next) {
  try {
    const roles = await rolesService.getRolesByUser(req.params.userId);
    res.json({ data: roles });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getUsersByRole,
  assignRoleToUser,
  removeRoleFromUser,
  getRolesByUser,
};
