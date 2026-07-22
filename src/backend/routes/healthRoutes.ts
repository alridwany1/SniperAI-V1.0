import { Router } from 'express';
import { HealthController } from '../controllers/HealthController.js';

const router = Router();

router.get(['/', '/health'], HealthController.getHealth);
router.post(['/flush', '/health/flush'], HealthController.flushCache);

export default router;
