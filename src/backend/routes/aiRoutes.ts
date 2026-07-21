import { Router } from 'express';
import { AiAssistantController } from '../controllers/AiAssistantController.js';

const router = Router();

router.post('/summarize', AiAssistantController.summarize);
router.post('/chat', AiAssistantController.chat);
router.post('/tts', AiAssistantController.tts);
router.post('/analyze-anomaly', AiAssistantController.analyzeAnomaly);

export default router;
