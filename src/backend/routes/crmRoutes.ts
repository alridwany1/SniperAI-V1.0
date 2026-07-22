import { Router } from 'express';
import { CrmController } from '../controllers/CrmController.js';
import { authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Modifying CRM datasets or initiating third-party CRM syncs requires active contributor or administrative roles
router.post('/sync', authorizeRoles('admin', 'owner', 'contributor'), CrmController.sync);

// Retrieval of synchronizations and deal records is open to all validated tenant roles (including executive)
router.get(['/sync-history/:tenantId', '/sync-history', '/sync/history'], CrmController.getSyncHistory);
router.post(['/sync-history', '/sync/history'], CrmController.getSyncHistory);

router.get(['/deals/:tenantId', '/deals'], CrmController.getDeals);
router.post('/deals', CrmController.getDeals);

export default router;

