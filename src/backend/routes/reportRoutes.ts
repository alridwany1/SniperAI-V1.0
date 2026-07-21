import { Router } from 'express';
import { ReportController } from '../controllers/ReportController.js';

const router = Router();

router.post('/strategic', ReportController.strategic);
router.post('/summarize', ReportController.summarize);

export default router;
