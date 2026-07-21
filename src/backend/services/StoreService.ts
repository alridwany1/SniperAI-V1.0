import { Tenant, SalesRecord, CRMDeal, SyncHistoryEntry } from '../../types.js';

export const StoreService = {
  TENANTS: [] as Tenant[],
  SALES_DB: {} as Record<string, SalesRecord[]>,
  CRM_DB: {} as Record<string, CRMDeal[]>,
  CRM_SYNC_HISTORY: {} as Record<string, SyncHistoryEntry[]>,

  getTenantById(tenantId: string): Tenant | undefined {
    return this.TENANTS.find(t => t.id === tenantId);
  }
};
