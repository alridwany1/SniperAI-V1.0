import { Request, Response, NextFunction } from 'express';
import { getTenantById, getCRMSyncHistory, saveCRMSyncHistory, getCRMRecords } from '../utils/serverHelpers.js';
import { db } from '../config/firebase.js';
import { setDoc, doc } from 'firebase/firestore';
import { StoreService } from '../services/StoreService.js';
import { cleanObject } from '../utils/helpers.js';
import { SyncHistoryEntry } from '../../types.js';

export class CrmController {
static async sync(req: Request, res: Response, next: NextFunction) {
  const { tenantId, userEmail } = req.body;
  if (!tenantId) return res.status(400).json({ error: "Missing tenantId" });
  
  const timestamp = new Date().toISOString();
  
  try {
    // Scramble / update CRM DB slightly to simulate a real live sync
    const deals = await getCRMRecords(tenantId);
    
    // Set probability to 0% to ensure reliable and successful CRM sync
    const isSimulationFailure = false;
    if (isSimulationFailure) {
      throw new Error("Odoo REST Gateway handshake timeout: Remote server did not acknowledge connection on socket port 443.");
    }

    deals.forEach(deal => {
      if (deal.status === 'Lead' && Math.random() < 0.25) {
        deal.status = 'Qualified';
        deal.value = Math.round(deal.value * 1.1);
      } else if (deal.status === 'Qualified' && Math.random() < 0.25) {
        deal.status = 'Proposal';
      } else if (deal.status === 'Proposal' && Math.random() < 0.2) {
        deal.status = 'Won';
      }
      deal.lastUpdated = new Date().toISOString().split('T')[0];
    });

    StoreService.CRM_DB[tenantId] = deals;
    
    // Save updated deals to Firestore tenant_data for durable persistence
    try {
      await setDoc(doc(db, 'tenant_data', tenantId), cleanObject({
        sales: StoreService.SALES_DB[tenantId] || [],
        crm: deals
      }), { merge: true });
    } catch (e) {
      console.error(`Failed to save synced CRM deals to Firestore for tenant ${tenantId}:`, e);
    }
    
    const history = await getCRMSyncHistory(tenantId);
    
    const newLog: SyncHistoryEntry = {
      id: `sync-${tenantId}-${Date.now()}`,
      tenantId,
      timestamp,
      status: 'SUCCESS',
      recordsSynced: deals.length,
      initiatedBy: userEmail || 'SYSTEM'
    };
    history.unshift(newLog);
    await saveCRMSyncHistory(tenantId, history);

    res.json({ 
      success: true, 
      message: "CRM pipelines synchronized successfully with Odoo & Salesforce records.", 
      deals,
      log: newLog
    });
  } catch (error: any) {
    console.error("CRM Sync error:", error);
    
    const history = await getCRMSyncHistory(tenantId);
    
    const newLog: SyncHistoryEntry = {
      id: `sync-${tenantId}-${Date.now()}`,
      tenantId,
      timestamp,
      status: 'FAILURE',
      recordsSynced: 0,
      errorMessage: error.message || 'Transient database pool timeout',
      initiatedBy: userEmail || 'SYSTEM'
    };
    history.unshift(newLog);
    await saveCRMSyncHistory(tenantId, history);
    
    res.status(500).json({ 
      success: false, 
      error: "CRM Sync failed", 
      details: error.message,
      log: newLog
    });
  }
  }

static async getSyncHistory(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  const history = await getCRMSyncHistory(tenantId);
  res.json(history);
  }

static async getDeals(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  try {
    const tenant = await getTenantById(tenantId);
    const isDbTenant = tenant?.dataSource?.provider && tenant.dataSource.provider !== 'Local';
    
    if (isDbTenant) {
      const deals = await getCRMRecords(tenantId);
      return res.json(deals);
    }
    
    if (StoreService.CRM_DB[tenantId] && StoreService.CRM_DB[tenantId].length > 0) {
      return res.json(StoreService.CRM_DB[tenantId]);
    }
    
    const deals = await getCRMRecords(tenantId);
    res.json(deals);
  } catch (e: any) {
    console.error(`Failed to load CRM deals for tenant ${tenantId}:`, e.message);
    res.json(StoreService.CRM_DB[tenantId] || []);
  }
  }


}
