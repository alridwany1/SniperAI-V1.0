import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController.js';

const router = Router();

router.post('/dashboard/transactions', AnalyticsController.getTransactions);
router.post('/dashboard/metrics', AnalyticsController.getMetrics);
router.post('/query/run', AnalyticsController.runQuery);
router.post('/forecast', AnalyticsController.runForecast);

export default router;
