import { Router } from 'express';
import { AuthController } from '../controllers/AuthController.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Strict rate-limiting policy for authentication and code verification to block brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 15, // Max 15 attempts per IP per 10 minutes
  message: {
    success: false,
    error: 'TOO_MANY_AUTH_ATTEMPTS',
    message: 'Too many login or registration attempts. Please try again in 10 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/proxy-login', authRateLimiter, AuthController.proxyLogin);
router.post('/proxy-register', authRateLimiter, AuthController.proxyRegister);
router.post('/send-code', authRateLimiter, AuthController.sendCode);
router.post('/verify-code', authRateLimiter, AuthController.verifyCode);

export default router;

