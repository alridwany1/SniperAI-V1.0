export type AuditCategory = 'SECURITY' | 'ADMIN' | 'WORKSPACE' | 'ANALYTICS' | 'SYSTEM';
export type AuditStatus = 'SUCCESS' | 'WARNING' | 'INFO' | 'ERROR';

export interface AuditLogEntry {
  id: string;
  timestamp: string; // ISO String UTC
  user: string; // Email or "SYSTEM"
  category: AuditCategory;
  action: string;
  status: AuditStatus;
  ipAddress?: string;
  meta?: Record<string, any>;
}

const STORAGE_KEY = 'sniper_audit_logs';

const SEED_LOGS: AuditLogEntry[] = [
  {
    id: 'log-seed-1',
    timestamp: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
    user: 'SYSTEM',
    category: 'SYSTEM',
    action: 'SniperAI Kernel Initialization and micro-services deployment completed.',
    status: 'SUCCESS',
    ipAddress: '127.0.0.1'
  },
  {
    id: 'log-seed-2',
    timestamp: new Date(Date.now() - 3600000 * 24 * 2 - 14400000).toISOString(),
    user: 'SYSTEM',
    category: 'WORKSPACE',
    action: 'Autonomic pre-seeding of premium tenant nodes: Acme Corp & Globex Labs.',
    status: 'SUCCESS',
    ipAddress: '10.0.4.15'
  },
  {
    id: 'log-seed-3',
    timestamp: new Date(Date.now() - 3600000 * 18).toISOString(),
    user: 'admin@sniper.ai',
    category: 'SECURITY',
    action: 'Super-Administrator session established. Multi-tenant access token emitted.',
    status: 'SUCCESS',
    ipAddress: '192.168.1.104'
  },
  {
    id: 'log-seed-4',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    user: 'admin@sniper.ai',
    category: 'ADMIN',
    action: 'Promoted subscription configuration matrix to Enterprise Scale for active accounts.',
    status: 'SUCCESS',
    ipAddress: '192.168.1.104'
  },
  {
    id: 'log-seed-5',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    user: 'SYSTEM',
    category: 'ANALYTICS',
    action: 'High-fidelity predictive analytics baseline compiled for Acme Corp.',
    status: 'INFO',
    ipAddress: '10.0.4.15'
  }
];

export function getAuditLogs(): AuditLogEntry[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_LOGS));
    return SEED_LOGS;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return SEED_LOGS;
    return parsed.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (e) {
    console.error('Failed to parse audit logs', e);
    return SEED_LOGS;
  }
}

export function addAuditLog(
  user: string,
  category: AuditCategory,
  action: string,
  status: AuditStatus = 'SUCCESS',
  meta?: Record<string, any>
): AuditLogEntry {
  const logs = getAuditLogs();
  
  // Create realistic mock IP address
  const octet3 = Math.floor(Math.random() * 254) + 1;
  const octet4 = Math.floor(Math.random() * 254) + 1;
  const ipAddress = user === 'SYSTEM' ? '10.0.4.15' : `192.168.${octet3}.${octet4}`;

  const newEntry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    user,
    category,
    action,
    status,
    ipAddress,
    meta
  };

  const updated = [newEntry, ...logs];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return newEntry;
}

export function clearAuditLogs(): void {
  // Rather than clearing totally, reset to seeds so there's always transparency context
  localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_LOGS));
}
