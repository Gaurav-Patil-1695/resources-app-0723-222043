const express = require('express');
const rolesController = require('./roles.controller');

const router = express.Router();

// Role CRUD
router.get('/', rolesController.getAllRoles);
router.get('/:id', rolesController.getRoleById);
router.post('/', rolesController.createRole);
router.put('/:id', rolesController.updateRole);
router.delete('/:id', rolesController.deleteRole);

// User-role assignments
router.get('/:id/users', rolesController.getUsersByRole);
router.post('/:id/users', rolesController.assignRoleToUser);
router.delete('/:id/users/:userId', rolesController.removeRoleFromUser);
router.get('/users/:userId/roles', rolesController.getRolesByUser);

module.exports = router;
