import { Router } from 'express';
import { InventoryController } from '../controllers/InventoryController.js';

const router = Router();

router.get('/:tenantId/items', InventoryController.getItems);
router.post('/:tenantId/items', InventoryController.createItem);
router.put('/:tenantId/items/:itemId', InventoryController.updateItem);

export default router;
