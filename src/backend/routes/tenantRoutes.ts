import { Router } from 'express';
import { TenantController } from '../controllers/TenantController.js';

const router = Router();

router.get('/', TenantController.getAllTenants);
router.post('/', TenantController.createTenant);
router.post('/test-connection', TenantController.testConnection);
router.post('/bulk-delete', TenantController.bulkDeleteTenants);
router.put('/:id', TenantController.updateTenant);
router.post('/:id/diagnostics', TenantController.diagnosticTenant);
router.post('/:id/refresh-schema', TenantController.refreshSchema);
router.get('/:id/schema', TenantController.getSchema);

export default router;
