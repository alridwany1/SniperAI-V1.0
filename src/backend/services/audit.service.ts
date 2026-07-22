import { adminDb } from '../config/firebaseAdmin.js';

export interface AuditLogEntry {
  id?: string;
  userId?: string;
  userEmail?: string;
  tenantId?: string;
  action: string;
  status: 'SUCCESS' | 'FAILED';
  ipAddress?: string;
  details?: Record<string, any>;
  timestamp: Date;
}

const memoryAuditLogs: AuditLogEntry[] = [];

export class AuditService {
  static async log(entry: Omit<AuditLogEntry, 'timestamp'>) {
    const fullEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...entry,
      timestamp: new Date(),
    };

    memoryAuditLogs.unshift(fullEntry);
    if (memoryAuditLogs.length > 500) {
      memoryAuditLogs.pop();
    }

    try {
      await adminDb.collection('audit_logs').add(fullEntry);
      console.log(`[AUDIT LOG] ${entry.action} for ${entry.userEmail || 'anonymous'} - ${entry.status}`);
    } catch (err: any) {
      if (err?.code === 7 || String(err?.message || err).includes('PERMISSION_DENIED')) {
        console.warn(`[AUDIT LOG] ${entry.action} stored in-memory (Firestore permission fallback).`);
      } else {
        console.warn('[AUDIT LOG WARNING] Could not write to Firestore, using memory fallback:', err?.message || err);
      }
    }
  }

  static async getTenantLogs(tenantId: string, limit = 100) {
    try {
      const snapshot = await adminDb.collection('audit_logs')
        .where('tenantId', '==', tenantId)
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
        
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate ? doc.data().timestamp.toDate() : doc.data().timestamp,
      }));
    } catch (err: any) {
      // Fallback to in-memory logs
      return memoryAuditLogs
        .filter(log => !tenantId || log.tenantId === tenantId || log.tenantId === 'root')
        .slice(0, limit);
    }
  }
}
