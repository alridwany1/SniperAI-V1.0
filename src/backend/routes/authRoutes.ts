import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';

const router = Router();

router.post('/proxy-login', AuthController.proxyLogin);
router.post('/proxy-register', AuthController.proxyRegister);
router.post('/send-code', AuthController.sendCode);
router.post('/verify-code', AuthController.verifyCode);

export default router;
