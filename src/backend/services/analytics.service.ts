import { getRawRecords } from '../utils/serverHelpers.js';
import { AppError } from '../errors/AppError.js';

export interface DashboardMetrics {
  totalSales: number;
  totalOrders: number;
  grossMargin: number;
  averageOrderValue: number;
  grossMarginPercent: number;
  customerLifetimeValue: number;
  runRate: number;
}

export class AnalyticsService {
  async getDashboardMetrics(tenantId: string): Promise<DashboardMetrics> {
    if (!tenantId) {
      throw new AppError('tenantId is required', 400);
    }

    const records = await getRawRecords(tenantId);
    
    const totalOrders = records.length;
    let totalSales = 0;
    let totalCost = 0;

    for (const record of records) {
      totalSales += record.revenue || 0;
      totalCost += record.cost || 0;
    }

    const grossMargin = totalSales - totalCost;
    const grossMarginPercent = totalSales > 0 ? (grossMargin / totalSales) * 100 : 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

    // Standardized Customer Lifetime Value (LTV) calculation
    // LTV = AOV * Purchase Frequency * Average Customer Lifespan
    const purchaseFrequency = 4.5; // Average annual purchase frequency
    const averageCustomerLifespan = 3.0; // Average lifespan in years
    const customerLifetimeValue = averageOrderValue * purchaseFrequency * averageCustomerLifespan;

    // Standardized Annualized Run Rate calculation
    // Run Rate = (Period Revenue / Days in Period) * 365
    let daysInPeriod = 30; // Default to 30 days if temporal span is unclear
    if (records.length > 1) {
      const datesSorted = records
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
    const runRate = (totalSales / daysInPeriod) * 365;

    return {
      totalSales: Math.round(totalSales * 100) / 100,
      totalOrders,
      grossMargin: Math.round(grossMargin * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      grossMarginPercent: Math.round(grossMarginPercent * 100) / 100,
      customerLifetimeValue: Math.round(customerLifetimeValue * 100) / 100,
      runRate: Math.round(runRate * 100) / 100,
    };
  }
}
