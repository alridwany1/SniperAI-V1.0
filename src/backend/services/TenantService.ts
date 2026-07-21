import { collection, getDocs, doc, getDoc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../config/firebase.js";
import { Tenant } from "../../types.js";
import { StoreService } from "./StoreService.js";
import { cleanObject } from "../utils/helpers.js";

// Hardcoded default generation methods (ideally moved to a mock/seed utility)
import { generateSalesRecords, generateCRMDeals } from "../utils/mockGenerators.js"; // We need to fix this if mockGenerators is removed.

export class TenantService {
  static async getAllTenants(): Promise<Tenant[]> {
    const snapshot = await getDocs(collection(db, 'tenants'));
    const loadedTenants: Tenant[] = [];
    
    const tenantPromises = snapshot.docs.map(async (docDoc) => {
      const data = docDoc.data() as Tenant;
      
      const isDefault = data.id === 'apex-logistics' || data.id === 'nova-retail' || data.id === 'vortex-saas';
      if (isDefault) {
        if (!data.products || data.products.length === 0) {
          data.products = [
            { name: 'Standard Product A', price: 150, costOfGoods: 90 },
            { name: 'Premium Service B', price: 750, costOfGoods: 450 },
            { name: 'Enterprise License C', price: 3200, costOfGoods: 1500 }
          ];
        }
        if (!data.campaigns || data.campaigns.length === 0) {
          data.campaigns = ['Q3 Kickoff Initiative', 'Summer Flash Sale', 'Direct Outreach Focus'];
        }
      } else {
        if (!data.products) data.products = [];
        if (!data.campaigns) data.campaigns = [];
      }
      
      loadedTenants.push(data);
      
      const existingIdx = StoreService.TENANTS.findIndex(t => t.id === data.id);
      if (existingIdx !== -1) {
        StoreService.TENANTS[existingIdx] = data;
      } else {
        StoreService.TENANTS.push(data);
      }
      
      let loadedFromFirestore = false;
      try {
        const dataDoc = await getDoc(doc(db, 'tenant_data', data.id));
        if (dataDoc.exists()) {
          const fileData = dataDoc.data();
          if (fileData?.sales) {
            StoreService.SALES_DB[data.id] = fileData.sales;
            loadedFromFirestore = true;
          }
          if (fileData?.crm) {
            StoreService.CRM_DB[data.id] = fileData.crm;
            loadedFromFirestore = true;
          }
        }
      } catch (e) {
        console.error(`Failed to load tenant_data from Firestore for ${data.id}:`, e);
      }
      
      if (!loadedFromFirestore) {
        if (isDefault) {
          // If mockGenerators doesn't exist, we will have to handle this
          // SALES_DB[data.id] = generateSalesRecords(data);
          // CRM_DB[data.id] = generateCRMDeals(data.id);
        } else {
          StoreService.SALES_DB[data.id] = [];
          StoreService.CRM_DB[data.id] = [];
        }
      }
    });

    await Promise.all(tenantPromises);

    const defaults: Tenant[] = [
      {
        id: 'apex-logistics',
        name: 'Apex Logistics',
        industry: 'Transportation & Supply Chain',
        description: 'Global freight delivery and automated cold-chain logistics routing.',
        accentColor: 'indigo',
        currency: 'USD',
        products: [
          { name: 'Standard Delivery Flatrate', price: 180, costOfGoods: 110 },
          { name: 'Refrigerated Cold-Chain Run', price: 920, costOfGoods: 550 },
          { name: 'Intermodal Deep-Freeze Spot', price: 4200, costOfGoods: 1950 }
        ],
        campaigns: ['Summer Shipping Boost', 'Q2 Direct Carrier Outreach', 'Highway Hub Promo']
      },
      {
        id: 'nova-retail',
        name: 'Nova Retail',
        industry: 'E-commerce & Apparel',
        description: 'Direct-to-consumer fashion marketplace and social commerce engine.',
        accentColor: 'rose',
        currency: 'EUR',
        products: [
          { name: 'Casual Cotton Tee', price: 28, costOfGoods: 7.5 },
          { name: 'Water-Resistant Windbreaker', price: 115, costOfGoods: 42 },
          { name: 'Limited-Edition Leather Boot', price: 290, costOfGoods: 115 }
        ],
        campaigns: ['TikTok Influencer Blast', 'December Checkout Clearance', 'Spring Wardrobe Refresh']
      },
      {
        id: 'vortex-saas',
        name: 'Vortex SaaS',
        industry: 'Software & Technology',
        description: 'Subscription management and machine-learning telemetry metrics.',
        accentColor: 'emerald',
        currency: 'USD',
        products: [
          { name: 'Starter Flow Subscription', price: 49, costOfGoods: 8 },
          { name: 'Developer Api Pro License', price: 399, costOfGoods: 45 },
          { name: 'Custom Telemetry Enterprise Suite', price: 4800, costOfGoods: 620 }
        ],
        campaigns: ['Q3 Developer Hackathon', 'Winter Upgrade Initiative', 'Cloud Migrations Discount']
      }
    ];

    const missingDefaults = defaults.filter(d => !loadedTenants.some(lt => lt.id === d.id));
    for (const d of missingDefaults) {
      try {
        await setDoc(doc(db, 'tenants', d.id), cleanObject(d));
        loadedTenants.push(d);
        const existingIdx = StoreService.TENANTS.findIndex(t => t.id === d.id);
        if (existingIdx !== -1) {
          StoreService.TENANTS[existingIdx] = d;
        } else {
          StoreService.TENANTS.push(d);
        }
      } catch (e) {
        console.error(`Failed to auto-seed missing default tenant ${d.id}:`, e);
      }
    }
    
    const uniqueTenantsMap = new Map<string, Tenant>();
    if (loadedTenants.length === 0) {
      defaults.forEach(t => uniqueTenantsMap.set(t.id, t));
    } else {
      loadedTenants.forEach(t => uniqueTenantsMap.set(t.id, t));
    }
    
    return Array.from(uniqueTenantsMap.values());
  }
}
