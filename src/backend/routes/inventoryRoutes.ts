import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController.js';
import { authorizeRoles } from '../middlewares/auth.middleware.js';

const router = Router();

// Viewing items is open to all validated tenant users
router.get('/:tenantId/items', InventoryController.getItems);

// Adding or modifying stock levels or product information is restricted to contributors, owners, and admins
router.post('/:tenantId/items', authorizeRoles('admin', 'owner', 'contributor'), InventoryController.createItem);
router.put('/:tenantId/items/:itemId', authorizeRoles('admin', 'owner', 'contributor'), InventoryController.updateItem);

export default router;

