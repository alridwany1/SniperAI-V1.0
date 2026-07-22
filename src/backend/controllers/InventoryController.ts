import { Request, Response, NextFunction } from 'express';
import { getTenantById, getInventoryRecords } from '../utils/serverHelpers.js';
import { StoreService } from '../services/StoreService.js';
import { Tenant } from '../../types.js';
import { db } from '../config/firebase.js';
import { getDoc, setDoc, doc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { cleanObject } from '../utils/helpers.js';
import { CacheService } from '../services/cache.service.js';

export class InventoryController {
static async getItems(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  const { table } = req.query;
  try {
    const pgItems = await getInventoryRecords(tenantId, table as string);
    if (pgItems !== null) {
      return res.json(pgItems);
    }

    const snapshot = await getDocs(collection(db, 'inventory', tenantId, 'items'));
    const items: any[] = [];
    snapshot.forEach(docDoc => {
      items.push(docDoc.data());
    });

    if (items.length > 0) {
      return res.json(items);
    }

    // Auto-seed from tenant products if empty
    const tenant = await getTenantById(tenantId);
    if (!tenant) {
      return res.json([]);
    }

    const initialItems = (tenant.products || []).map((prod, i) => {
      const shortName = prod.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      const sku = `${shortName}-${100 + i}`;
      let stockLevel = 120;
      let safetyStock = 30;
      if (i === 1) { stockLevel = 25; safetyStock = 30; }
      if (i === 2) { stockLevel = 0; safetyStock = 10; }

      return {
        id: `item-${Date.now()}-${i}`,
        sku,
        productName: prod.name,
        stockLevel,
        safetyStock,
        unitCost: prod.costOfGoods,
        unitPrice: prod.price,
        supplier: tenantId === 'apex-logistics' ? 'Apex Industrial Corp' : tenantId === 'nova-retail' ? 'Nova Textile Mills' : 'Vortex Cloud Solutions',
        lastRestocked: new Date().toLocaleDateString('en-US')
      };
    });

    for (const item of initialItems) {
      await setDoc(doc(db, 'inventory', tenantId, 'items', item.id), cleanObject(item));
    }

    res.json(initialItems);
  } catch (e: any) {
    console.error(`Failed to load inventory for tenant ${tenantId}:`, e.message);
    res.status(500).json({ error: e.message });
  }
  }

static async createItem(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  const newItem = req.body;
  if (!newItem.id || !newItem.productName) {
    return res.status(400).json({ error: "Missing item details" });
  }

  try {
    // 1. Save item to inventory collection
    await setDoc(doc(db, 'inventory', tenantId, 'items', newItem.id), cleanObject(newItem));

    // 2. Add to tenant products catalog in Firestore
    const tenantRef = doc(db, 'tenants', tenantId);
    const tenantDoc = await getDoc(tenantRef);
    if (tenantDoc.exists()) {
      const tenantData = tenantDoc.data() as Tenant;
      const updatedProducts = [
        ...(tenantData.products || []),
        { name: newItem.productName, price: Number(newItem.unitPrice), costOfGoods: Number(newItem.unitCost) }
      ];
      await setDoc(tenantRef, cleanObject({ ...tenantData, products: updatedProducts }), { merge: true });
      
      // Update in-memory StoreService.TENANTS
      const idx = StoreService.TENANTS.findIndex(t => t.id === tenantId);
      if (idx !== -1) {
        StoreService.TENANTS[idx].products = updatedProducts;
      }
    }

    // Invalidate dashboard metrics cache
    CacheService.invalidateTenant(tenantId);

    res.json({ success: true, item: newItem });
  } catch (e: any) {
    console.error(`Failed to save inventory item for tenant ${tenantId}:`, e.message);
    res.status(500).json({ error: e.message });
  }
  }

static async updateItem(req: Request, res: Response, next: NextFunction) {
  const { tenantId, itemId } = req.params;
  const updatedItem = req.body;
  try {
    await setDoc(doc(db, 'inventory', tenantId, 'items', itemId), cleanObject(updatedItem));

    // Invalidate dashboard metrics cache
    CacheService.invalidateTenant(tenantId);

    res.json({ success: true, item: updatedItem });
  } catch (e: any) {
    console.error(`Failed to update inventory item ${itemId}:`, e.message);
    res.status(500).json({ error: e.message });
  }
  }


}
