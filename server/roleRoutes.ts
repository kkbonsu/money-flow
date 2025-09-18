import { Router } from "express";

// Note: Role and permission system disabled in single-tenant mode
// This is a stub file to prevent import errors

const router = Router();

// All role/permission routes disabled for single-tenant mode
router.get('/roles', (req, res) => {
  res.json({ message: 'Role management disabled in single-tenant mode' });
});

router.get('/roles/:roleId', (req, res) => {
  res.json({ message: 'Role management disabled in single-tenant mode' });
});

router.get('/permissions', (req, res) => {
  res.json({ message: 'Permission management disabled in single-tenant mode' });
});

router.get('/users-roles', (req, res) => {
  res.json({ message: 'Role management disabled in single-tenant mode' });
});

router.post('/users/:userId/assign-role', (req, res) => {
  res.json({ message: 'Role management disabled in single-tenant mode' });
});

router.delete('/users/:userId/role', (req, res) => {
  res.json({ message: 'Role management disabled in single-tenant mode' });
});

router.put('/roles/:roleId/permissions', (req, res) => {
  res.json({ message: 'Role management disabled in single-tenant mode' });
});

router.get('/my-permissions', (req, res) => {
  res.json({ 
    message: 'Role management disabled in single-tenant mode',
    userId: null,
    tenantId: null,
    roleId: null,
    roleName: null,
    hierarchyLevel: 99,
    permissions: [],
    isSuperAdmin: false
  });
});

export default router;