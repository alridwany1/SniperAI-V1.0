import { Request, Response, NextFunction } from 'express';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { serverAuth } from '../config/firebase.js';
import { AppError } from '../errors/AppError.js';
import { logger } from '../utils/logger.js';

// In-memory verification code store (Will be replaced with Redis later)
export const VERIFICATION_CODES = new Map<string, string>();

export class AuthController {
  static async proxyLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }
      
      const userCredential = await signInWithEmailAndPassword(serverAuth, email.trim(), password);
      const user = userCredential.user;
      
      res.json({
        success: true,
        user: { email: user.email, uid: user.uid }
      });
    } catch (error: any) {
      logger.error({ err: error }, '[AUTH PROXY] Login failed');
      res.status(400).json({
        success: false,
        code: error.code || 'auth/unknown',
        message: error.message || 'Authentication failed'
      });
    }
  }

  static async proxyRegister(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }
      
      const userCredential = await createUserWithEmailAndPassword(serverAuth, email.toLowerCase().trim(), password);
      const user = userCredential.user;
      
      res.json({
        success: true,
        user: { email: user.email, uid: user.uid }
      });
    } catch (error: any) {
      logger.error({ err: error }, '[AUTH PROXY] Registration failed');
      res.status(400).json({
        success: false,
        code: error.code || 'auth/unknown',
        message: error.message || 'Registration failed'
      });
    }
  }

  static async sendCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;
      if (!email) {
        throw new AppError('Missing email address', 400);
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        throw new AppError('Invalid email address format', 400);
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      VERIFICATION_CODES.set(email.toLowerCase().trim(), code);

      logger.info(`[AUTH] Verification code for ${email}: ${code}`);

      res.json({
        success: true,
        code,
        message: 'Verification code sent successfully. Please verify to complete sign up.'
      });
    } catch (error: any) {
      next(error);
    }
  }

  static async verifyCode(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, code } = req.body;
      if (!email || !code) {
        throw new AppError('Email and code are required', 400);
      }

      const storedCode = VERIFICATION_CODES.get(email.toLowerCase().trim());
      if (storedCode && storedCode === code.trim()) {
        VERIFICATION_CODES.delete(email.toLowerCase().trim());
        res.json({ success: true, message: 'Email verified successfully' });
      } else {
        throw new AppError('Invalid verification code', 400);
      }
    } catch (error: any) {
      next(error);
    }
  }
}
