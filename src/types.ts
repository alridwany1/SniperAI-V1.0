export interface Product {
  name: string;
  price: number;
  costOfGoods: number;
}

export interface SchemaMapping {
  sourceField: string;
  targetField: string;
}

export interface Tenant {
  id: string;
  name: string;
  industry: string;
  description: string;
  accentColor: string;
  products: Product[];
  campaigns: string[];
  currency?: string;
  ownerEmail?: string;
  createdBy?: string;
  dataSource?: DataSourceConfig;
  schemaMappings?: SchemaMapping[];
  dbMapping?: any;
  localSchema?: any;
}

export interface DataSourceConfig {
  provider: string;
  host?: string;
  apiKey?: string;
  databaseName?: string;
  username?: string;
}

export interface SalesRecord {
  date: string; // YYYY-MM-DD
  product: string;
  campaign: string;
  revenue: number;
  units: number;
  cost: number;
  isAnomaly?: boolean;
  anomalyReason?: string;
}

export interface MetricSummary {
  totalRevenue: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  averageOrderValue: number;
  salesCount: number;
  anomalies: SalesRecord[];
  productDistribution: { name: string; value: number }[];
  totalInventoryValue?: number;
  lowStockAlertsCount?: number;
  outOfStockAlertsCount?: number;
  grossMarginPercent?: number;
  customerLifetimeValue?: number;
  runRate?: number;
  trends?: {
    revenue: number[];
    profit: number[];
    margin: number[];
    aov: number[];
    anomalies: number[];
    dates: string[];
  };
}

export interface ForecastRecord {
  date: string;
  revenue?: number; // legacy
  expected?: number;
  lowerBoundP10?: number;
  upperBoundP90?: number;
  lowerBound: number;
  upperBound: number;
  confidenceScore?: number;
  isForecast: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  tableData?: {
    headers: string[];
    rows: string[][];
    title?: string;
  };
  action?: {
    type: string;
    payload?: any;
  };
  chartData?: { name: string; value: number }[];
  chartType?: 'line' | 'bar' | 'pie';
  confidenceScore?: number;
  citations?: string[];
  executiveJustifications?: { factor: string; impact: string }[];
}

export interface CRMDeal {
  id: string;
  customerName: string;
  value: number;
  status: 'Lead' | 'Qualified' | 'Proposal' | 'Won' | 'Lost';
  lastUpdated: string;
}

export interface SyncHistoryEntry {
  id: string;
  tenantId: string;
  timestamp: string;
  status: 'SUCCESS' | 'FAILURE';
  recordsSynced: number;
  errorMessage?: string;
  initiatedBy: string;
}

export interface BillingData {
  tenantId: string;
  invoiceStatus: 'Paid' | 'Pending' | 'Overdue';
  nextBillingDate: string;
  plan: string;
  pendingRenewals: {
    item: string;
    amount: number;
    date: string;
  }[];
  creditCard?: {
    brand: string;
    last4: string;
    expMonth: string;
    expYear: string;
    cardholder: string;
  };
  invoices?: {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'Paid' | 'Unpaid' | 'Pending';
  }[];
}

export interface AppNotification {
  id: string;
  type: 'ANOMALY' | 'TASK' | 'SYSTEM';
  titleEn: string;
  titleAr: string;
  messageEn: string;
  messageAr: string;
  timestamp: string;
  read: boolean;
  meta?: {
    uniqueId?: string;
    product?: string;
    revenue?: number;
    anomalyReason?: string;
  };
}

export interface InventoryItem {
  id: string;
  sku: string;
  productName: string;
  stockLevel: number;
  safetyStock: number;
  unitCost: number;
  unitPrice: number;
  supplier: string;
  lastRestocked: string;
}


