import { Router } from 'express';
import { TenantController } from '../controllers/TenantController.js';
import { authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Retrieve tenant directories for selected scopes
router.get('/', TenantController.getAllTenants);

// Allow all authorized user roles to onboard/register new workspaces
router.post('/', authorizeRoles('admin', 'owner', 'executive', 'contributor'), TenantController.createTenant);
router.post('/test-connection', authorizeRoles('admin', 'owner', 'executive', 'contributor'), TenantController.testConnection);

// Global administrative bulk cleanups are restricted purely to system super administrators
router.post('/bulk-delete', authorizeRoles('admin'), TenantController.bulkDeleteTenants);

// Tenant configuration changes, schema mappings, and diagnostics require high-clearance administration
router.put('/:id', authorizeRoles('admin', 'owner'), TenantController.updateTenant);
router.post('/:id/diagnostics', authorizeRoles('admin', 'owner', 'executive'), TenantController.diagnosticTenant);
router.post('/:id/refresh-schema', authorizeRoles('admin', 'owner'), TenantController.refreshSchema);
router.get('/:id/schema', TenantController.getSchema);

export default router;

