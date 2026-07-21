import { Router } from 'express';
import { CrmController } from '../controllers/CrmController.js';

const router = Router();

router.post('/sync', CrmController.sync);
router.get('/sync-history/:tenantId', CrmController.getSyncHistory);
router.get('/deals/:tenantId', CrmController.getDeals);

export default router;
