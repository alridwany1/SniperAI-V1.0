import { Router } from 'express';
import crmRoutes from "./crmRoutes.js";
import inventoryRoutes from "./inventoryRoutes.js";
import reportRoutes from "./reportRoutes.js";
import billingRoutes from "./billingRoutes.js";
import aiRoutes from "./aiRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import authRoutes from './authRoutes.js';
import tenantRoutes from './tenantRoutes.js';
import healthRoutes from './healthRoutes.js';
import { authenticateToken, enforceTenantIsolation } from '../middlewares/auth.middleware.js';

const router = Router();

// Publicly available auth and health endpoints
router.use('/auth', authRoutes);
router.use('/v1', healthRoutes);
router.use('/health', healthRoutes);

// Fully secure, isolated, and role-authorized routes
router.use('/tenants', authenticateToken, enforceTenantIsolation, tenantRoutes);
router.use("/", authenticateToken, enforceTenantIsolation, analyticsRoutes);
router.use("/assistant", authenticateToken, enforceTenantIsolation, aiRoutes);
router.use("/billing", authenticateToken, enforceTenantIsolation, billingRoutes);
router.use("/reports", authenticateToken, enforceTenantIsolation, reportRoutes);
router.use("/crm", authenticateToken, enforceTenantIsolation, crmRoutes);
router.use("/sync", authenticateToken, enforceTenantIsolation, crmRoutes);
router.use("/inventory", authenticateToken, enforceTenantIsolation, inventoryRoutes);

export default router;

