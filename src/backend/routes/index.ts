import crmRoutes from "./crmRoutes.js";
import inventoryRoutes from "./inventoryRoutes.js";
import reportRoutes from "./reportRoutes.js";
import billingRoutes from "./billingRoutes.js";
import aiRoutes from "./aiRoutes.js";
import analyticsRoutes from "./analyticsRoutes.js";
import { Router } from 'express';
import authRoutes from './authRoutes.js';
import tenantRoutes from './tenantRoutes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/tenants', tenantRoutes);

router.use("/", analyticsRoutes);

router.use("/assistant", aiRoutes);

router.use("/billing", billingRoutes);

router.use("/reports", reportRoutes);

router.use("/crm", crmRoutes);
router.use("/inventory", inventoryRoutes);

export default router;
