import { db } from '../config/firebase.js';
import { getDoc, setDoc, doc, collection, getDocs } from 'firebase/firestore';
import { Tenant, SalesRecord, CRMDeal, SyncHistoryEntry, BillingData, InventoryItem, MetricSummary } from '../../types.js';
import { StoreService } from '../services/StoreService.js';
import { Client } from 'pg';
import { MongoClient } from 'mongodb';
import { mapSchemaWithAI } from '../services/SchemaMappingService.js';
import { CacheService } from '../services/cache.service.js';

import { buildConnectionString } from '../repositories/DatabaseRepository.js';
import { cleanObject } from '../utils/helpers.js';
import { introspectSchema } from '../services/SchemaMappingService.js';

export async function setFirestoreCache(collectionName: string, key: string, data: any, ttlSecs: number = 3600) {
  try {
    const memoryKey = `sniper:${collectionName}:${key}`;
    CacheService.set(memoryKey, data, ttlSecs);

    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    await setDoc(doc(db, collectionName, safeKey), {
      data: JSON.stringify(data),
      timestamp: Date.now(),
      expiresAt: Date.now() + (ttlSecs * 1000)
    });
  } catch (e) {
    console.error(`Cache set error [${collectionName}]:`, e);
  }
}

export async function getFirestoreCache(collectionName: string, key: string) {
  try {
    const memoryKey = `sniper:${collectionName}:${key}`;
    const memCached = CacheService.get(memoryKey);
    if (memCached !== null) {
      return memCached;
    }

    const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
    const d = await getDoc(doc(db, collectionName, safeKey));
    if (d.exists()) {
      const val = d.data();
      if (val.expiresAt && Date.now() > val.expiresAt) {
        return null;
      }
      const parsed = JSON.parse(val.data);
      // Populate memory cache for subsequent requests
      const remainingTtl = val.expiresAt ? Math.max(10, Math.round((val.expiresAt - Date.now()) / 1000)) : 300;
      CacheService.set(memoryKey, parsed, remainingTtl);
      return parsed;
    }
  } catch (e) {
    console.error(`Cache get error [${collectionName}]:`, e);
  }
  return null;
}



export async function getDynamicDBMapping(connectionString: string, tenantId: string) {
  const tenant = await getTenantById(tenantId);
  if (tenant && tenant.dbMapping && Object.keys(tenant.dbMapping).length > 0) {
    return tenant.dbMapping;
  }
  const cached = await getFirestoreCache('DB_MAPPING_CACHE', tenantId);
  if (cached) return cached;
  const mockSchema = {
    "sales_ledger": [
      { "column": "record_id", "type": "integer" },
      { "column": "sale_date", "type": "date" },
      { "column": "product_name", "type": "varchar" },
      { "column": "marketing_campaign", "type": "varchar" },
      { "column": "gross_revenue", "type": "numeric" },
      { "column": "units_sold", "type": "integer" },
      { "column": "cost_of_goods", "type": "numeric" }
    ],
    "crm_pipeline": [
      { "column": "opportunity_id", "type": "varchar" },
      { "column": "client_name", "type": "varchar" },
      { "column": "deal_value", "type": "numeric" },
      { "column": "pipeline_status", "type": "varchar" },
      { "column": "last_updated_at", "type": "timestamp" }
    ]
  };

  try {
    const schema = await introspectSchema(connectionString);
    const mapping = await mapSchemaWithAI(schema);
    await setFirestoreCache('DB_MAPPING_CACHE', tenantId, mapping, 3600 * 24);
    return mapping;
  } catch (e: any) {
    const isDefault = tenantId === 'apex-logistics' || tenantId === 'nova-retail' || tenantId === 'vortex-saas';
    if (isDefault) {
      try {
        const mapping = await mapSchemaWithAI(mockSchema);
        await setFirestoreCache('DB_MAPPING_CACHE', tenantId, mapping, 3600);
        return mapping;
      } catch (aiErr) {
        return null;
      }
    }
    console.error(`Database schema introspection failed for custom tenant ${tenantId}:`, e.message);
    return null;
  }
}
import axios from "axios";

// In-memory Axios Cache
const axiosCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60000; // 60 seconds caching duration

const originalRequest = axios.request;
(axios as any).request = function (config: any): Promise<any> {
  const method = (config.method || 'get').toLowerCase();
  if (method === 'get' || method === 'post') {
    const cacheKey = `${method}:${config.url}:${JSON.stringify(config.data || '')}:${JSON.stringify(config.params || '')}`;
    const cached = axiosCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      return Promise.resolve(cached.data);
    }

    return originalRequest.call(this, config).then((response: any) => {
      const cachedResponse = {
        data: response.data,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        config: response.config
      };
      axiosCache.set(cacheKey, {
        data: cachedResponse,
        timestamp: Date.now()
      });
      return response;
    });
  }
  return originalRequest.call(this, config);
};

// Mock Tenants Data


export async function getTenantById(tenantId: string): Promise<Tenant | undefined> {
  let tenant = StoreService.TENANTS.find(t => t.id === tenantId);
  if (!tenant) {
    try {
      const tenantDoc = await getDoc(doc(db, 'tenants', tenantId));
      if (tenantDoc.exists()) {
        tenant = tenantDoc.data() as Tenant;
        StoreService.TENANTS.push(tenant);
      }
    } catch (e) {
      console.error(`Failed to load tenant ${tenantId} from Firestore:`, e);
    }
  }
  return tenant;
}

// In-memory Sales Database & CRM state




// Helper to seed historical sync logs for a tenant
export function seedSyncHistory(tenantId: string): SyncHistoryEntry[] {
  const history: SyncHistoryEntry[] = [];
  const now = Date.now();
  
  // A sync 2 days ago (SUCCESS)
  history.push({
    id: `sync-${tenantId}-hist-1`,
    tenantId,
    timestamp: new Date(now - 2 * 24 * 60 * 60 * 1000 - 4 * 60 * 60 * 1000).toISOString(),
    status: 'SUCCESS',
    recordsSynced: 6,
    initiatedBy: 'SYSTEM'
  });

  // A sync 1 day ago (FAILURE)
  history.push({
    id: `sync-${tenantId}-hist-2`,
    tenantId,
    timestamp: new Date(now - 1 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(),
    status: 'FAILURE',
    recordsSynced: 0,
    errorMessage: 'Connection timed out: Remote Odoo server failed to answer socket handshake within 15000ms threshold.',
    initiatedBy: 'SYSTEM'
  });

  // A sync 12 hours ago (SUCCESS)
  history.push({
    id: `sync-${tenantId}-hist-3`,
    tenantId,
    timestamp: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    status: 'SUCCESS',
    recordsSynced: 6,
    initiatedBy: 'alridwanykick@gmail.com'
  });

  return history;
}

export async function getCRMSyncHistory(tenantId: string): Promise<SyncHistoryEntry[]> {
  try {
    const docDoc = await getDoc(doc(db, 'crm_sync_history', tenantId));
    if (docDoc.exists()) {
      const data = docDoc.data();
      if (data && Array.isArray(data.history)) {
        return data.history as SyncHistoryEntry[];
      }
    }
  } catch (e) {
    console.error(`Failed to get CRM sync history from Firestore for ${tenantId}:`, e);
  }
  
  // Return and seed default history if none exists
  const history = seedSyncHistory(tenantId);
  try {
    await setDoc(doc(db, 'crm_sync_history', tenantId), cleanObject({ history }));
  } catch (e) {
    console.error(`Failed to seed CRM sync history to Firestore for ${tenantId}:`, e);
  }
  return history;
}

export async function saveCRMSyncHistory(tenantId: string, history: SyncHistoryEntry[]) {
  try {
    await setDoc(doc(db, 'crm_sync_history', tenantId), cleanObject({ history }));
  } catch (e) {
    console.error(`Failed to save CRM sync history to Firestore for ${tenantId}:`, e);
  }
}

export async function getBillingData(tenantId: string): Promise<BillingData> {
  try {
    const docDoc = await getDoc(doc(db, 'billing', tenantId));
    if (docDoc.exists()) {
      return docDoc.data() as BillingData;
    }
  } catch (e) {
    console.error(`Failed to load billing for ${tenantId}:`, e);
  }

  // Fallback to defaults
  const defaults: Record<string, BillingData> = {
    'apex-logistics': {
      tenantId: 'apex-logistics',
      invoiceStatus: 'Paid',
      nextBillingDate: '2026-08-03',
      plan: 'Enterprise',
      pendingRenewals: [
        { item: 'Data Streaming Layer', amount: 499, date: '2026-07-15' },
        { item: 'Compliance Engine', amount: 999, date: '2026-07-20' }
      ],
      creditCard: {
        brand: 'Visa',
        last4: '8842',
        expMonth: '12',
        expYear: '2029',
        cardholder: 'Apex Logistics LLC'
      },
      invoices: [
        { id: 'INV-2026-001', date: '2026-07-03', description: 'Enterprise Plan - Monthly Subscription', amount: 2499, status: 'Paid' },
        { id: 'INV-2026-002', date: '2026-06-03', description: 'Enterprise Plan - Monthly Subscription', amount: 2499, status: 'Paid' },
        { id: 'INV-2026-003', date: '2026-05-03', description: 'Enterprise Plan - Monthly Subscription', amount: 2499, status: 'Paid' }
      ]
    },
    'nova-retail': {
      tenantId: 'nova-retail',
      invoiceStatus: 'Pending',
      nextBillingDate: '2026-07-15',
      plan: 'Team Stream',
      pendingRenewals: [
        { item: 'Shopify Integration API', amount: 199, date: '2026-07-10' }
      ],
      creditCard: {
        brand: 'Mastercard',
        last4: '5521',
        expMonth: '08',
        expYear: '2028',
        cardholder: 'Nova Retail Operations'
      },
      invoices: [
        { id: 'INV-2026-012', date: '2026-06-15', description: 'Team Stream Plan - Monthly Subscription', amount: 499, status: 'Paid' },
        { id: 'INV-2026-013', date: '2026-05-15', description: 'Team Stream Plan - Monthly Subscription', amount: 499, status: 'Paid' }
      ]
    },
    'vortex-saas': {
      tenantId: 'vortex-saas',
      invoiceStatus: 'Overdue',
      nextBillingDate: '2026-06-25',
      plan: 'Starter Flow',
      pendingRenewals: [
        { item: 'Domain Mapping', amount: 49, date: '2026-06-25' }
      ],
      creditCard: {
        brand: 'Amex',
        last4: '3007',
        expMonth: '04',
        expYear: '2027',
        cardholder: 'Vortex SaaS Inc.'
      },
      invoices: [
        { id: 'INV-2026-020', date: '2026-05-25', description: 'Starter Flow Plan - Monthly Subscription', amount: 149, status: 'Paid' }
      ]
    }
  };

  const defaultBilling = defaults[tenantId] || {
    tenantId,
    invoiceStatus: 'Paid',
    nextBillingDate: '2026-08-01',
    plan: 'Basic',
    pendingRenewals: [],
    creditCard: {
      brand: 'Visa',
      last4: '4242',
      expMonth: '01',
      expYear: '2030',
      cardholder: 'New Organization'
    },
    invoices: [
      { id: 'INV-2026-099', date: '2026-07-01', description: 'Basic Plan Setup', amount: 0, status: 'Paid' }
    ]
  };

  // Seed it in Firestore
  try {
    await setDoc(doc(db, 'billing', tenantId), cleanObject(defaultBilling));
  } catch (e) {
    console.error(`Failed to save default billing to Firestore for ${tenantId}:`, e);
  }

  return defaultBilling;
}

export async function saveBillingData(tenantId: string, data: BillingData) {
  try {
    await setDoc(doc(db, 'billing', tenantId), cleanObject(data));
  } catch (e) {
    console.error(`Failed to save billing to Firestore for ${tenantId}:`, e);
  }
}

// Strategic Report Cache removed in favor of Firestore cache

// Helper to detect tenant language context
export function getTenantLanguage(tenant: Tenant | undefined): 'ar' | 'es' | 'en' {
  if (!tenant) return 'en';
  const nameToTest = ((tenant.name || '') + ' ' + (tenant.industry || '') + ' ' + (tenant.dataSource?.databaseName || '') + ' ' + tenant.id).toLowerCase();
  if (/[\u0600-\u06FF]/.test(nameToTest)) return 'ar';
  if (nameToTest.includes("es") || nameToTest.includes("venta") || nameToTest.includes("tienda") || nameToTest.includes("registro")) return 'es';
  return 'en';
}

// Helper to generate CRM deals
export function generateCRMDeals(tenantId: string): CRMDeal[] {
  const tenant = StoreService.TENANTS.find(t => t.id === tenantId);
  const lang = getTenantLanguage(tenant);

  const customersAr = [
    'مجموعة ترانسكورب القابضة', 'الهدف لخدمات الإمداد واللوجستيات', 'شركة زينيث للشحن والخدمات',
    'تيك بولس للحلول والبرمجيات التجريبية', 'جلو فيت للمستلزمات الرياضية', 'شركة أوربان جريد للمقاولات',
    'شركة فينتك للتقنيات والتحليلات المالية', 'مختبرات ديف فلو الهندسية', 'شركة سكيور كوم للأنظمة السبرانية'
  ];

  const customersEs = [
    'Grupo Transcorp', 'Target Logística Inc.', 'Zenith Logística',
    'TechPulse Store', 'GlowFit Wearables', 'UrbanGrid Comercio',
    'FinTech Soluciones', 'DevFlow Labs', 'SecureCom Corp.'
  ];

  const customersEn = [
    'Transcorp Group', 'Target Logistics Inc', 'Zenith Logistics',
    'TechPulse Store', 'GlowFit Wearables', 'UrbanGrid Commerce',
    'FinTech Solutions', 'DevFlow Labs', 'SecureCom Corp'
  ];

  const customers = lang === 'ar' ? customersAr : lang === 'es' ? customersEs : customersEn;

  return Array.from({ length: 6 }, (_, i) => {
    const statusOpts: CRMDeal['status'][] = ['Lead', 'Qualified', 'Proposal', 'Won', 'Lost'];
    const status = statusOpts[Math.floor(Math.random() * statusOpts.length)];
    const valBase = tenantId === 'vortex-saas' ? 12000 : tenantId === 'apex-logistics' ? 45000 : 3500;
    const suffix = lang === 'ar' ? ` (العميل ${i + 1})` : lang === 'es' ? ` (Cliente ${i + 1})` : ` (Client ${i + 1})`;
    return {
      id: `deal-${tenantId}-${i + 1}`,
      customerName: customers[Math.floor(Math.random() * customers.length)] + suffix,
      value: Math.floor(valBase * (0.5 + Math.random() * 1.5)),
      status,
      lastUpdated: new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  });
}

// Generate complete sales records for each tenant
export function generateSalesRecords(tenant: Tenant): SalesRecord[] {
  const records: SalesRecord[] = [];
  const now = new Date("2026-07-03");
  const lang = getTenantLanguage(tenant);

  let products = tenant.products || [];
  let campaigns = tenant.campaigns || [];

  if (lang === 'ar') {
    products = [
      { name: 'المنتج القياسي أ', price: 150, costOfGoods: 90 },
      { name: 'الخدمة المميزة ب', price: 750, costOfGoods: 450 },
      { name: 'ترخيص المؤسسات ج', price: 3200, costOfGoods: 1500 }
    ];
    campaigns = ['مبادرة انطلاق الربع الثالث', 'تخفيضات الصيف الكبرى', 'حملة التواصل المباشر'];
  } else if (lang === 'es') {
    products = [
      { name: 'Producto Estándar A', price: 150, costOfGoods: 90 },
      { name: 'Servicio Premium B', price: 750, costOfGoods: 450 },
      { name: 'Licencia Corporativa C', price: 3200, costOfGoods: 1500 }
    ];
    campaigns = ['Iniciativa del Tercer Trimestre', 'Venta Flash de Verano', 'Enfoque de Alcance Directo'];
  }

  for (let i = 180; i >= 1; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Day of week factor
    const dayOfWeek = d.getDay(); 
    let dayFactor = 1.0;
    if (tenant.id === 'nova-retail') {
      dayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.4 : 0.85; // retail peaks on weekends
    } else {
      dayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.35 : 1.25; // enterprise drops on weekends
    }

    // Seasonality
    const month = d.getMonth();
    let monthFactor = 1.0;
    if (month === 11) monthFactor = 1.35; // December shopping spike
    if (month === 5 || month === 6) monthFactor = 0.85; // Summer lulls

    // Volume of deals/sales
    const salesVolume = tenant.id === 'nova-retail' ? 10 + Math.floor(Math.random() * 14)
                      : tenant.id === 'apex-logistics' ? 1 + Math.floor(Math.random() * 3)
                      : 1 + Math.floor(Math.random() * 2);

    for (let s = 0; s < salesVolume; s++) {
      const product = products[Math.floor(Math.random() * products.length)];
      // 30% campaign chance
      const hasCampaign = Math.random() < 0.35;
      const campaign = hasCampaign ? campaigns[Math.floor(Math.random() * campaigns.length)] : 'None';
      
      let campaignMultiplier = 1.0;
      if (campaign !== 'None') {
        campaignMultiplier = tenant.id === 'nova-retail' ? 1.6 : tenant.id === 'vortex-saas' ? 1.45 : 1.25;
      }

      const noise = 0.8 + Math.random() * 0.4;
      let units = 1;
      if (tenant.id === 'nova-retail') {
        units = 1 + Math.floor(Math.random() * 5);
      } else if (tenant.id === 'apex-logistics') {
        units = 1 + Math.floor(Math.random() * 2);
      }

      const revenue = Math.round(product.price * units * dayFactor * monthFactor * campaignMultiplier * noise * 100) / 100;
      const cost = Math.round(product.costOfGoods * units * noise * 95) / 100;

      records.push({
        date: dateStr,
        product: product.name,
        campaign,
        revenue,
        units,
        cost
      });
    }
  }

  // Inject deterministic and explanatory anomalies
  const anomalyDays = [18, 48, 88, 128, 162];
  anomalyDays.forEach((dayOffset, idx) => {
    const d = new Date(now);
    d.setDate(now.getDate() - (180 - dayOffset));
    const dateStr = d.toISOString().split('T')[0];

    const dayRecords = records.filter(r => r.date === dateStr);
    if (dayRecords.length > 0) {
      const rec = dayRecords[0];
      const isPositive = idx % 2 === 0;
      if (isPositive) {
        rec.revenue = Math.round(rec.revenue * 3.8 * 100) / 100;
        rec.isAnomaly = true;
        
        if (lang === 'ar') {
          rec.anomalyReason = "مبادرة تسويقية واسعة الانتشار على وسائل التواصل الاجتماعي أدت لزيادة هائلة في المبيعات";
        } else if (lang === 'es') {
          rec.anomalyReason = "Campaña viral en redes sociales genera un aumento masivo de compras";
        } else {
          rec.anomalyReason = tenant.id === 'nova-retail' ? "Viral video endorsement on TikTok creating massive checkout velocity"
                            : tenant.id === 'vortex-saas' ? "Signed unexpected multi-year government automation compliance contract"
                            : "Urgent deep-freeze logistics reroute signed at high freight spot-rate premium";
        }
      } else {
        rec.revenue = Math.round(rec.revenue * 0.08 * 100) / 100;
        rec.isAnomaly = true;
        
        if (lang === 'ar') {
          rec.anomalyReason = "مشاكل فنية في بوابة الدفع الإلكتروني أدت لزيادة السلات المتروكة وتراجع الصفقات";
        } else if (lang === 'es') {
          rec.anomalyReason = "Problemas técnicos en la pasarela de pago causan carritos abandonados";
        } else {
          rec.anomalyReason = tenant.id === 'nova-retail' ? "Stripe gateway handshake issues resulting in abandoned shopping carts"
                            : tenant.id === 'vortex-saas' ? "Client contract downsize and sudden cancellation of starter subscriptions"
                            : "Severe snowstorm shutting down regional distribution highway hubs";
        }
      }
    }
  });

  return records;
}

// Generate data initially on load - Disabled to remove all mock/test data from the system
StoreService.TENANTS.forEach(t => {
  StoreService.SALES_DB[t.id] = [];
  StoreService.CRM_DB[t.id] = [];
});



// Function removed, imported from db_helper

export function decodeUTF8String(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') {
    try {
      const buf = Buffer.from(val, 'binary');
      const decoded = buf.toString('utf8');
      if (decoded !== val && /[\u0600-\u06FF]/.test(decoded)) {
        return decoded;
      }
    } catch (e) {
      // ignore
    }
    return val;
  }
  if (Buffer.isBuffer(val)) {
    return val.toString('utf8');
  }
  return String(val);
}

export async function getRawRecords(tenantId: string): Promise<SalesRecord[]> {
  const tenant = await getTenantById(tenantId);
  if (tenant?.dataSource?.provider === 'PostgreSQL') {
    const ds = tenant.dataSource;
    const connectionString = buildConnectionString(ds);
    
    const mapping = await getDynamicDBMapping(connectionString, tenantId);
    
    if (mapping && mapping.sales && mapping.sales.table) {
      const client = new Client({ connectionString, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 5000, query_timeout: 10000 });
      try {
        await client.connect();
        await client.query("SET client_encoding TO 'UTF8'");
        const sales = mapping.sales;
        
        // Robust check if table exists in postgres
        let exists = true;
        try {
          await client.query(`SELECT 1 FROM "${sales.table}" LIMIT 1`);
        } catch (tableErr) {
          exists = false;
        }
        
        if (!exists) {
          console.error(`PostgreSQL sales table "${sales.table}" does not exist or is not accessible.`);
          return [];
        }
        
        // Dynamically introspect if tenant_id/tenantid columns exist in the table
        const colsQuery = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1
        `, [sales.table]);
        const cols = colsQuery.rows.map(r => r.column_name.toLowerCase());
        const hasTenantId = cols.includes('tenant_id') || cols.includes('tenantid');
        const hasIsAnomaly = cols.includes('is_anomaly') || cols.includes('isanomaly');
        const hasAnomalyReason = cols.includes('anomaly_reason') || cols.includes('anomalyreason');
        
        let queryStr = `SELECT * FROM "${sales.table}"`;
        const params: any[] = [];
        if (hasTenantId) {
          queryStr += ` WHERE tenant_id = $1`;
          params.push(tenantId);
        }
        queryStr += ` LIMIT 1000`;
        
        const res = await client.query(queryStr, params);
        const mappedRecords = res.rows.map(row => {
          const rawIsAnomaly = hasIsAnomaly 
            ? (row.is_anomaly === true || row.is_anomaly === 'true' || row.is_anomaly === 1 || row.isanomaly === true || row.isanomaly === 'true')
            : false;
          const rawAnomalyReason = hasAnomalyReason
            ? (row.anomaly_reason || row.anomalyreason || '')
            : '';
            
          return {
            date: sales.date && row[sales.date] ? String(row[sales.date]).substring(0, 10) : '2024-01-01',
            product: sales.product && row[sales.product] ? decodeUTF8String(row[sales.product]) : 'Standard Product',
            campaign: sales.campaign && row[sales.campaign] ? decodeUTF8String(row[sales.campaign]) : 'Organic',
            revenue: sales.revenue && !isNaN(parseFloat(row[sales.revenue])) ? parseFloat(row[sales.revenue]) : 0,
            units: sales.units && !isNaN(parseInt(row[sales.units], 10)) ? parseInt(row[sales.units], 10) : 1,
            cost: sales.cost && !isNaN(parseFloat(row[sales.cost])) ? parseFloat(row[sales.cost]) : 0,
            isAnomaly: rawIsAnomaly,
            anomalyReason: decodeUTF8String(rawAnomalyReason)
          };
        });
        
        StoreService.SALES_DB[tenantId] = mappedRecords;
        return mappedRecords;
      } catch (e: any) {
        console.error(`PostgreSQL sales fetch failed for tenant ${tenantId}:`, e.message);
      } finally {
        await client.end();
      }
    }
  } else if (tenant?.dataSource?.provider === 'MongoDB') {
    const ds = tenant.dataSource;
    if (ds.host && ds.host.includes('.internal')) {
      return StoreService.SALES_DB[tenantId] || [];
    }
    const client = new MongoClient(ds.host);
    try {
      await client.connect();
      const db = client.db(ds.databaseName);
      const collections = await db.listCollections().toArray();
      const collNames = collections.map(c => c.name);
      const salesCollName = collNames.find(c => c.includes('sales') || c.includes('revenue') || c.includes('ledger') || c.includes('invoice') || c.includes('record')) || collNames[0];
      if (salesCollName) {
        const salesColl = db.collection(salesCollName);
        const docs = await salesColl.find({}).limit(1000).toArray();
        return docs.map(doc => ({
          date: String(doc.date || doc.sale_date || doc.createdAt || '2024-01-01').substring(0, 10),
          product: decodeUTF8String(doc.product || doc.product_name || doc.item || 'Standard Product'),
          campaign: decodeUTF8String(doc.campaign || doc.marketing_campaign || 'Organic'),
          revenue: !isNaN(parseFloat(doc.revenue || doc.gross_revenue || doc.amount || 0)) ? parseFloat(doc.revenue || doc.gross_revenue || doc.amount || 0) : 0,
          units: !isNaN(parseInt(doc.units || doc.units_sold || doc.quantity || 1, 10)) ? parseInt(doc.units || doc.units_sold || doc.quantity || 1, 10) : 1,
          cost: !isNaN(parseFloat(doc.cost || doc.cost_of_goods || doc.cogs || 0)) ? parseFloat(doc.cost || doc.cost_of_goods || doc.cogs || 0) : 0,
          isAnomaly: false,
          anomalyReason: ''
        }));
      }
    } catch (e: any) {
      console.error(`MongoDB sales fetch failed for tenant ${tenantId}:`, e.message);
    } finally {
      await client.close();
    }
  } else if (tenant?.dataSource?.provider === 'Shopify') {
    const ds = tenant.dataSource;
    if (ds.host && ds.host.includes('.internal')) {
      return StoreService.SALES_DB[tenantId] || [];
    }
    try {
      const response = await axios.get(`${ds.host}/admin/api/2023-10/orders.json?limit=250`, {
        headers: { 'X-Shopify-Access-Token': ds.apiKey },
        timeout: 5000
      });
      const orders = response.data.orders || [];
      const records: SalesRecord[] = [];
      orders.forEach((order: any) => {
        const date = String(order.created_at || '2024-01-01').substring(0, 10);
        const lineItems = order.line_items || [];
        lineItems.forEach((item: any) => {
          const revenue = parseFloat(item.price) * parseInt(item.quantity || 1, 10);
          const cost = revenue * 0.4; // Estimate 40% COGS
          records.push({
            date,
            product: item.title || 'Shopify Product',
            campaign: order.referring_site ? 'Referral' : 'Direct',
            revenue,
            units: parseInt(item.quantity || 1, 10),
            cost,
            isAnomaly: false,
            anomalyReason: ''
          });
        });
      });
      return records;
    } catch (e: any) {
      console.error(`Shopify orders fetch failed for tenant ${tenantId}:`, e.message);
    }
  } else if (tenant?.dataSource?.provider === 'Odoo') {
    const ds = tenant.dataSource;
    if (ds.host && ds.host.includes('.internal')) {
      return StoreService.SALES_DB[tenantId] || [];
    }
    try {
      const response = await axios.post(`${ds.host}/jsonrpc`, {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            ds.databaseName,
            1, // Default user ID
            ds.apiKey,
            "sale.order",
            "search_read",
            [[]],
            { fields: ["date_order", "name", "amount_total"] }
          ]
        }
      }, { timeout: 5000 });
      
      if (response.data && response.data.result) {
        return response.data.result.map((order: any) => ({
          date: String(order.date_order || '2024-01-01').substring(0, 10),
          product: order.name || 'Odoo Sale Order',
          campaign: 'Organic',
          revenue: !isNaN(parseFloat(order.amount_total)) ? parseFloat(order.amount_total) : 0,
          units: 1,
          cost: !isNaN(parseFloat(order.amount_total)) ? parseFloat(order.amount_total) * 0.5 : 0,
          isAnomaly: false,
          anomalyReason: ''
        }));
      }
    } catch (e: any) {
      console.error(`Odoo sales fetch failed for tenant ${tenantId}:`, e.message);
    }
  }
  return StoreService.SALES_DB[tenantId] || [];
}

export async function getCRMRecords(tenantId: string): Promise<CRMDeal[]> {
  const tenant = await getTenantById(tenantId);
  if (tenant?.dataSource?.provider === 'PostgreSQL') {
    const ds = tenant.dataSource;
    const connectionString = buildConnectionString(ds);
    
    const mapping = await getDynamicDBMapping(connectionString, tenantId);
    
    if (mapping && mapping.crm && mapping.crm.table) {
      const client = new Client({ connectionString, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 5000, query_timeout: 10000 });
      try {
        await client.connect();
        await client.query("SET client_encoding TO 'UTF8'");
        const crm = mapping.crm;
        
        // Robust check if table exists in postgres
        let exists = true;
        try {
          await client.query(`SELECT 1 FROM "${crm.table}" LIMIT 1`);
        } catch (tableErr) {
          exists = false;
        }
        
        if (!exists) {
          console.error(`PostgreSQL CRM table "${crm.table}" does not exist or is not accessible.`);
          return [];
        }
        
        // Dynamically introspect if tenant_id/tenantid columns exist in the table
        const colsQuery = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1
        `, [crm.table]);
        const cols = colsQuery.rows.map(r => r.column_name.toLowerCase());
        const hasTenantId = cols.includes('tenant_id') || cols.includes('tenantid');
        
        let queryStr = `SELECT * FROM "${crm.table}"`;
        const params: any[] = [];
        if (hasTenantId) {
          queryStr += ` WHERE tenant_id = $1`;
          params.push(tenantId);
        }
        queryStr += ` LIMIT 1000`;
        
        const res = await client.query(queryStr, params);
        const mappedDeals = res.rows.map(row => ({
          id: crm.id && row[crm.id] ? String(row[crm.id]) : Math.random().toString(),
          customerName: crm.customerName && row[crm.customerName] ? decodeUTF8String(row[crm.customerName]) : 'Unknown Customer',
          value: crm.value && !isNaN(parseFloat(row[crm.value])) ? parseFloat(row[crm.value]) : 0,
          status: crm.status && row[crm.status] ? decodeUTF8String(row[crm.status]) as any : 'Lead',
          lastUpdated: crm.lastUpdated && row[crm.lastUpdated] ? String(row[crm.lastUpdated]).substring(0, 10) : new Date().toISOString().substring(0, 10)
        }));
        
        StoreService.CRM_DB[tenantId] = mappedDeals;
        return mappedDeals;
      } catch (e: any) {
        console.error(`PostgreSQL CRM fetch failed for tenant ${tenantId}:`, e.message);
      } finally {
        await client.end();
      }
    }
  } else if (tenant?.dataSource?.provider === 'MongoDB') {
    const ds = tenant.dataSource;
    if (ds.host && ds.host.includes('.internal')) {
      return StoreService.CRM_DB[tenantId] || [];
    }
    const client = new MongoClient(ds.host);
    try {
      await client.connect();
      const db = client.db(ds.databaseName);
      const collections = await db.listCollections().toArray();
      const collNames = collections.map(c => c.name);
      const crmCollName = collNames.find(c => c.includes('crm') || c.includes('deal') || c.includes('pipeline') || c.includes('opportunity')) || collNames[0];
      if (crmCollName) {
        const crmColl = db.collection(crmCollName);
        const docs = await crmColl.find({}).limit(1000).toArray();
        return docs.map(doc => ({
          id: String(doc._id || doc.id || Math.random()),
          customerName: decodeUTF8String(doc.customerName || doc.client_name || doc.customer_name || 'Unknown Customer'),
          value: !isNaN(parseFloat(doc.value || doc.deal_value || doc.amount || 0)) ? parseFloat(doc.value || doc.deal_value || doc.amount || 0) : 0,
          status: decodeUTF8String(doc.status || doc.pipeline_status || 'Lead') as any,
          lastUpdated: String(doc.lastUpdated || doc.last_updated || doc.updatedAt || new Date().toISOString()).substring(0, 10)
        }));
      }
    } catch (e: any) {
      console.error(`MongoDB CRM fetch failed for tenant ${tenantId}:`, e.message);
    } finally {
      await client.close();
    }
  } else if (tenant?.dataSource?.provider === 'Shopify') {
    const ds = tenant.dataSource;
    if (ds.host && ds.host.includes('.internal')) {
      return StoreService.CRM_DB[tenantId] || [];
    }
    try {
      const response = await axios.get(`${ds.host}/admin/api/2023-10/customers.json?limit=50`, {
        headers: { 'X-Shopify-Access-Token': ds.apiKey },
        timeout: 5000
      });
      const customers = response.data.customers || [];
      return customers.map((c: any) => ({
        id: String(c.id),
        customerName: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Shopify Customer',
        value: parseFloat(c.total_spent || '0'),
        status: parseFloat(c.total_spent || '0') > 0 ? 'Won' : 'Lead',
        lastUpdated: String(c.updated_at || new Date().toISOString()).substring(0, 10)
      }));
    } catch (e: any) {
      console.error(`Shopify customers fetch failed for tenant ${tenantId}:`, e.message);
    }
  } else if (tenant?.dataSource?.provider === 'Odoo') {
    const ds = tenant.dataSource;
    if (ds.host && ds.host.includes('.internal')) {
      return StoreService.CRM_DB[tenantId] || [];
    }
    try {
      const response = await axios.post(`${ds.host}/jsonrpc`, {
        jsonrpc: "2.0",
        method: "call",
        params: {
          service: "object",
          method: "execute_kw",
          args: [
            ds.databaseName,
            1,
            ds.apiKey,
            "crm.lead",
            "search_read",
            [[]],
            { fields: ["id", "name", "planned_revenue", "stage_id", "write_date"] }
          ]
        }
      }, { timeout: 5000 });

      if (response.data && response.data.result) {
        return response.data.result.map((lead: any) => {
          const stage = Array.isArray(lead.stage_id) ? lead.stage_id[1] : 'Lead';
          return {
            id: String(lead.id),
            customerName: lead.name || 'Odoo Lead',
            value: !isNaN(parseFloat(lead.planned_revenue)) ? parseFloat(lead.planned_revenue) : 0,
            status: stage.toLowerCase().includes('won') ? 'Won' : stage.toLowerCase().includes('lost') ? 'Lost' : 'Lead',
            lastUpdated: String(lead.write_date || new Date().toISOString()).substring(0, 10)
          };
        });
      }
    } catch (e: any) {
      console.error(`Odoo CRM fetch failed for tenant ${tenantId}:`, e.message);
    }
  }
  return StoreService.CRM_DB[tenantId] || [];
}

export async function getInventoryRecords(tenantId: string, tableOverride?: string): Promise<InventoryItem[] | null> {
  const tenant = await getTenantById(tenantId);
  if (tenant?.dataSource?.provider === 'PostgreSQL') {
    const ds = tenant.dataSource;
    const connectionString = buildConnectionString(ds);
    
    const mapping = await getDynamicDBMapping(connectionString, tenantId);
    const targetTable = tableOverride || (mapping && mapping.inventory && mapping.inventory.table);
    
    if (targetTable) {
      const client = new Client({ connectionString, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 5000, query_timeout: 10000 });
      try {
        await client.connect();
        await client.query("SET client_encoding TO 'UTF8'");
        
        let inventory = mapping?.inventory;
        if (!inventory || inventory.table !== targetTable) {
          inventory = {
            table: targetTable,
            sku: 'sku',
            productName: 'product_name',
            stockLevel: 'stock_level',
            safetyStock: 'safety_stock',
            unitCost: 'unit_cost',
            unitPrice: 'unit_price',
            supplier: 'supplier',
            lastRestocked: 'last_restocked'
          };
        }
        
        let exists = true;
        try {
          await client.query(`SELECT 1 FROM "${targetTable}" LIMIT 1`);
        } catch (tableErr) {
          exists = false;
        }
        
        if (!exists) {
          console.error(`PostgreSQL Inventory table "${targetTable}" does not exist or is not accessible.`);
          return null;
        }
        
        const colsQuery = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = $1
        `, [targetTable]);
        const cols = colsQuery.rows.map(r => r.column_name.toLowerCase());
        const hasTenantId = cols.includes('tenant_id') || cols.includes('tenantid');
        
        const findBestCol = (preferredKey: string, fallbackKeys: string[]): string => {
          if (cols.includes(preferredKey.toLowerCase())) return preferredKey;
          for (const fk of fallbackKeys) {
            if (cols.includes(fk.toLowerCase())) return fk;
          }
          const partial = cols.find(c => c.includes(preferredKey.toLowerCase()));
          return partial || cols[0] || '';
        };

        const activeSkuCol = findBestCol(inventory.sku || 'sku', ['id', 'item_id', 'product_id', 'code', 'sku_code', 'رمز', 'الرمز']);
        const activeNameCol = findBestCol(inventory.productName || 'product_name', ['name', 'product', 'productname', 'title', 'الاسم', 'اسم_المنتج', 'اسم']);
        const activeStockCol = findBestCol(inventory.stockLevel || 'stock_level', ['stock', 'quantity', 'stocklevel', 'qty', 'count', 'المخزون', 'الكمية']);
        const activeSafetyCol = findBestCol(inventory.safetyStock || 'safety_stock', ['safety', 'safetystock', 'limit', 'threshold', 'الامان', 'حد_الامان']);
        const activeCostCol = findBestCol(inventory.unitCost || 'unit_cost', ['cost', 'unitcost', 'buy_price', 'cogs', 'التكلفة', 'سعر_التكلفة']);
        const activePriceCol = findBestCol(inventory.unitPrice || 'unit_price', ['price', 'unitprice', 'retail', 'sell_price', 'السعر', 'سعر_البيع']);
        const activeSupplierCol = findBestCol(inventory.supplier || 'supplier', ['vendor', 'source', 'manufacturer', 'distributor', 'المورد', 'شركة']);
        const activeRestockCol = findBestCol(inventory.lastRestocked || 'last_restocked', ['date', 'restocked', 'updated', 'updated_at', 'التاريخ', 'تاريخ_التحديث']);

        let queryStr = `SELECT * FROM "${targetTable}"`;
        const params: any[] = [];
        if (hasTenantId) {
          queryStr += ` WHERE tenant_id = $1`;
          params.push(tenantId);
        }
        queryStr += ` LIMIT 1000`;
        
        const res = await client.query(queryStr, params);
        return res.rows.map((row, idx) => {
          const skuVal = row[activeSkuCol] ? String(row[activeSkuCol]) : `SKU-${100 + idx}`;
          return {
            id: skuVal,
            sku: skuVal,
            productName: row[activeNameCol] ? decodeUTF8String(row[activeNameCol]) : 'Unknown Item',
            stockLevel: !isNaN(parseInt(row[activeStockCol], 10)) ? parseInt(row[activeStockCol], 10) : 120,
            safetyStock: !isNaN(parseInt(row[activeSafetyCol], 10)) ? parseInt(row[activeSafetyCol], 10) : 20,
            unitCost: !isNaN(parseFloat(row[activeCostCol])) ? parseFloat(row[activeCostCol]) : 10,
            unitPrice: !isNaN(parseFloat(row[activePriceCol])) ? parseFloat(row[activePriceCol]) : 20,
            supplier: row[activeSupplierCol] ? decodeUTF8String(row[activeSupplierCol]) : 'Local Supplier',
            lastRestocked: row[activeRestockCol] ? String(row[activeRestockCol]).substring(0, 10) : new Date().toLocaleDateString('en-US')
          };
        });
      } catch (e: any) {
        console.error(`PostgreSQL Inventory fetch failed for tenant ${tenantId}:`, e.message);
      } finally {
        await client.end();
      }
    }
  }
  return null;
}


// Helper to filter and calculate dashboard metrics
export async function calculateFilteredMetrics(tenantId: string, campaign: string, product: string, startDate: string, endDate: string): Promise<MetricSummary> {
  const rawRecords = await getRawRecords(tenantId);
  
  const filtered = rawRecords.filter(r => {
    const matchCampaign = campaign === 'All' || r.campaign === campaign;
    const matchProduct = product === 'All' || r.product === product;
    const matchDate = (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate);
    return matchCampaign && matchProduct && matchDate;
  });

  let totalRevenue = 0;
  let totalCost = 0;
  let salesCount = 0;
  const anomalies: SalesRecord[] = [];
  const productSalesMap: Record<string, number> = {};

  filtered.forEach(r => {
    totalRevenue += r.revenue;
    totalCost += r.cost;
    salesCount += r.units;
    
    if (!productSalesMap[r.product]) {
      productSalesMap[r.product] = 0;
    }
    productSalesMap[r.product] += r.revenue;
    
    if (r.isAnomaly) {
      anomalies.push(r);
    }
  });

  const profit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
  const averageOrderValue = filtered.length > 0 ? totalRevenue / filtered.length : 0;

  const productDistribution = Object.keys(productSalesMap).map(name => ({
    name,
    value: Math.round(productSalesMap[name] * 100) / 100
  })).sort((a, b) => b.value - a.value);

  // Calculate 7-day trend history for each KPI
  const dailyGroups: Record<string, SalesRecord[]> = {};
  filtered.forEach(r => {
    if (!dailyGroups[r.date]) {
      dailyGroups[r.date] = [];
    }
    dailyGroups[r.date].push(r);
  });

  const sortedDates = Object.keys(dailyGroups).sort();
  const last7ActiveDates = sortedDates.slice(-7);

  const trendRevenue: number[] = [];
  const trendProfit: number[] = [];
  const trendMargin: number[] = [];
  const trendAOV: number[] = [];
  const trendAnomalies: number[] = [];

  last7ActiveDates.forEach(date => {
    const dayRecords = dailyGroups[date];
    let dayRev = 0;
    let dayCost = 0;
    let dayAnomalies = 0;
    dayRecords.forEach(r => {
      dayRev += r.revenue;
      dayCost += r.cost;
      if (r.isAnomaly) {
        dayAnomalies++;
      }
    });
    const dayProfit = dayRev - dayCost;
    const dayMargin = dayRev > 0 ? (dayProfit / dayRev) * 100 : 0;
    const dayAOV = dayRecords.length > 0 ? dayRev / dayRecords.length : 0;

    trendRevenue.push(Math.round(dayRev * 100) / 100);
    trendProfit.push(Math.round(dayProfit * 100) / 100);
    trendMargin.push(Math.round(dayMargin * 10) / 10);
    trendAOV.push(Math.round(dayAOV * 100) / 100);
    trendAnomalies.push(dayAnomalies);
  });

  const targetDaysCount = 7;
  while (trendRevenue.length < targetDaysCount) {
    trendRevenue.unshift(0);
    trendProfit.unshift(0);
    trendMargin.unshift(0);
    trendAOV.unshift(0);
    trendAnomalies.unshift(0);
  }

  const trendDates = [...last7ActiveDates];
  while (trendDates.length < targetDaysCount) {
    trendDates.unshift("");
  }

  // Load real-time inventory statistics from Firestore
  let totalInventoryValue = 0;
  let lowStockAlertsCount = 0;
  let outOfStockAlertsCount = 0;

  try {
    const invSnapshot = await getDocs(collection(db, 'inventory', tenantId, 'items'));
    invSnapshot.docs.forEach(docDoc => {
      const item = docDoc.data();
      const stockLevel = Number(item.stockLevel) || 0;
      const unitCost = Number(item.unitCost) || 0;
      const safetyStock = Number(item.safetyStock) || 0;

      totalInventoryValue += stockLevel * unitCost;
      if (stockLevel === 0) {
        outOfStockAlertsCount++;
      } else if (stockLevel <= safetyStock) {
        lowStockAlertsCount++;
      }
    });
  } catch (e) {
    console.error(`Failed to load inventory for metrics for tenant ${tenantId}:`, e);
  }

  // Calculate mathematically standardized metrics (Section 2.1)
  const grossMarginPercent = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  
  const purchaseFrequency = 4.5; // Average annual purchase frequency
  const averageCustomerLifespan = 3.0; // Average lifespan in years
  const customerLifetimeValue = averageOrderValue * purchaseFrequency * averageCustomerLifespan;

  let daysInPeriod = 30;
  if (filtered.length > 1) {
    const datesSorted = filtered
      .map(r => r.date)
      .filter(d => d && /^\d{4}-\d{2}-\d{2}$/.test(d))
      .map(d => new Date(d).getTime())
      .sort((a, b) => a - b);
    
    if (datesSorted.length > 1) {
      const minTime = datesSorted[0];
      const maxTime = datesSorted[datesSorted.length - 1];
      const diffDays = (maxTime - minTime) / (1000 * 60 * 60 * 24);
      if (diffDays > 0) {
        daysInPeriod = Math.max(1, diffDays);
      }
    }
  }
  const runRate = (totalRevenue / daysInPeriod) * 365;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    profit: Math.round(profit * 100) / 100,
    profitMargin: Math.round(profitMargin * 10) / 10,
    averageOrderValue: Math.round(averageOrderValue * 100) / 100,
    grossMarginPercent: Math.round(grossMarginPercent * 100) / 100,
    customerLifetimeValue: Math.round(customerLifetimeValue * 100) / 100,
    runRate: Math.round(runRate * 100) / 100,
    salesCount,
    anomalies,
    productDistribution,
    totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
    lowStockAlertsCount,
    outOfStockAlertsCount,
    trends: {
      revenue: trendRevenue,
      profit: trendProfit,
      margin: trendMargin,
      aov: trendAOV,
      anomalies: trendAnomalies,
      dates: trendDates
    }
  };
}

// API Routes

// Get all tenants and active tenant info
// Get all tenants and active tenant info

// Test connection to a data source

// Register a new tenant

// Update an existing tenant settings

// Bulk delete tenants


// Connection Diagnostic endpoint


// Refresh schema mapping


export function applyMappingToAnalysis(analysis: any, dbMapping: any) {
  if (!analysis || !analysis.tables || !dbMapping) return analysis;
  const salesTable = dbMapping.sales?.table;
  const crmTable = dbMapping.crm?.table;
  const inventoryTable = dbMapping.inventory?.table;
  
  const tables = (analysis.tables || []).map((t: any) => {
    let mappedTo = 'Unmapped';
    if (t.tableName === salesTable) {
      mappedTo = 'Sales Ledger';
    } else if (t.tableName === crmTable) {
      mappedTo = 'CRM Pipeline';
    } else if (t.tableName === inventoryTable) {
      mappedTo = 'Inventory Management';
    }
    
    const columns = (t.columns || []).map((col: any) => {
      let colMappedTo = 'Auxiliary Column';
      if (mappedTo === 'Sales Ledger') {
        const salesMap = dbMapping.sales || {};
        if (col.columnName === salesMap.date) colMappedTo = 'Date';
        else if (col.columnName === salesMap.product) colMappedTo = 'Product';
        else if (col.columnName === salesMap.campaign) colMappedTo = 'Campaign';
        else if (col.columnName === salesMap.revenue) colMappedTo = 'Revenue';
        else if (col.columnName === salesMap.units) colMappedTo = 'Units';
        else if (col.columnName === salesMap.cost) colMappedTo = 'Cost';
      } else if (mappedTo === 'CRM Pipeline') {
        const crmMap = dbMapping.crm || {};
        if (col.columnName === crmMap.id) colMappedTo = 'Deal ID';
        else if (col.columnName === crmMap.customerName) colMappedTo = 'Client Name';
        else if (col.columnName === crmMap.value) colMappedTo = 'Deal Value';
        else if (col.columnName === crmMap.status) colMappedTo = 'Status';
        else if (col.columnName === crmMap.lastUpdated) colMappedTo = 'Last Updated';
      } else if (mappedTo === 'Inventory Management') {
        const invMap = dbMapping.inventory || {};
        if (col.columnName === invMap.sku) colMappedTo = 'SKU';
        else if (col.columnName === invMap.productName) colMappedTo = 'Product Name';
        else if (col.columnName === invMap.stockLevel) colMappedTo = 'Stock Level';
        else if (col.columnName === invMap.safetyStock) colMappedTo = 'Safety Stock';
        else if (col.columnName === invMap.unitCost) colMappedTo = 'Unit Cost';
        else if (col.columnName === invMap.unitPrice) colMappedTo = 'Unit Price';
        else if (col.columnName === invMap.supplier) colMappedTo = 'Supplier';
        else if (col.columnName === invMap.lastRestocked) colMappedTo = 'Last Restocked';
      }
      return { ...col, mappedTo: colMappedTo };
    });
    
    return { ...t, mappedTo, columns };
  });
  
  return { ...analysis, tables };
}
export async function checkTableExistence(tenantId: string) {
  const tenant = await getTenantById(tenantId);
  const status = {
    isDbConnected: false,
    salesTableExists: true,
    salesTableName: '',
    crmTableExists: true,
    crmTableName: '',
    provider: tenant?.dataSource?.provider || 'Local'
  };

  if (tenant?.dataSource?.provider === 'PostgreSQL') {
    const ds = tenant.dataSource;
    const connectionString = buildConnectionString(ds);
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 5000, query_timeout: 10000 });
    try {
      await client.connect();
      await client.query("SET client_encoding TO 'UTF8'");
      status.isDbConnected = true;
      
      const mapping = await getDynamicDBMapping(connectionString, tenantId);
      if (mapping) {
        if (mapping.sales && mapping.sales.table) {
          status.salesTableName = mapping.sales.table;
          let sExists = true;
          try {
            await client.query(`SELECT 1 FROM "${mapping.sales.table}" LIMIT 1`);
          } catch (err) {
            sExists = false;
          }
          status.salesTableExists = sExists;
        } else {
          status.salesTableExists = false;
        }

        if (mapping.crm && mapping.crm.table) {
          status.crmTableName = mapping.crm.table;
          let cExists = true;
          try {
            await client.query(`SELECT 1 FROM "${mapping.crm.table}" LIMIT 1`);
          } catch (err) {
            cExists = false;
          }
          status.crmTableExists = cExists;
        } else {
          status.crmTableExists = false;
        }
      }
    } catch (e: any) {
      console.error(`checkTableExistence failed for tenant ${tenantId}:`, e.message);
      status.isDbConnected = false;
      status.salesTableExists = false;
      status.crmTableExists = false;
    } finally {
      await client.end().catch(() => {});
    }
  } else {
    status.isDbConnected = true;
    let sName = 'sales_records';
    let cName = 'crm_deals';
    if (tenant?.localSchema) {
      const keys = Object.keys(tenant.localSchema);
      const salesKey = keys.find(k => k.toLowerCase().includes('sale') || k.toLowerCase().includes('ledger') || k.toLowerCase().includes('transaction') || k.toLowerCase().includes('invoice') || k.toLowerCase().includes('مبيعات') || k.toLowerCase().includes('عمليات') || k.toLowerCase().includes('فواتير'));
      const crmKey = keys.find(k => k.toLowerCase().includes('crm') || k.toLowerCase().includes('deal') || k.toLowerCase().includes('pipeline') || k.toLowerCase().includes('lead') || k.toLowerCase().includes('opportunity') || k.toLowerCase().includes('عملاء') || k.toLowerCase().includes('صفقات') || k.toLowerCase().includes('فرص'));
      if (salesKey) sName = salesKey;
      if (crmKey) cName = crmKey;
    }
    status.salesTableName = sName;
    status.crmTableName = cName;
  }

  return status;
}

// Dashboard metrics cache map removed in favor of Firestore cache

// Get raw transaction records for a specific date
