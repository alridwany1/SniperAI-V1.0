import { Router } from 'express';
import { BillingController } from '../controllers/BillingController.js';
import { authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Viewing subscription tier and metrics is authorized for all tenant roles
router.get('/:tenantId', BillingController.getBilling);

// Modifying, upgrading, or configuring payment details is strictly restricted to owners and administrators
router.post('/:tenantId/checkout', authorizeRoles('admin', 'owner'), BillingController.checkout);
router.post('/:tenantId/update-card', authorizeRoles('admin', 'owner'), BillingController.updateCard);

export default router;

