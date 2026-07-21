import { Router } from 'express';
import { BillingController } from '../controllers/BillingController.js';

const router = Router();

router.get('/:tenantId', BillingController.getBilling);
router.post('/:tenantId/checkout', BillingController.checkout);
router.post('/:tenantId/update-card', BillingController.updateCard);

export default router;
