import { Tenant, SalesRecord, CRMDeal, SyncHistoryEntry } from '../../types.js';
import { StoreService } from '../services/StoreService.js';

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

