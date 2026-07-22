import { Request, Response, NextFunction } from 'express';
import { Client } from "pg";
import { AnalyticsService } from '../services/analytics.service.js';
import { StoreService } from '../services/StoreService.js';
import { buildConnectionString } from '../repositories/DatabaseRepository.js';
import { getAi } from '../config/ai.js';
import { getRawRecords, calculateFilteredMetrics, setFirestoreCache, getFirestoreCache, checkTableExistence, getTenantById } from "../utils/serverHelpers.js";
import { ForecastingService } from '../services/forecasting.service.js';

interface ForecastRecord {
  date: string;
  revenue?: number;
  value?: number;
  upperBound?: number;
  lowerBound?: number;
  isForecast?: boolean;
  expected?: number;
  lowerBoundP10?: number;
  upperBoundP90?: number;
  confidenceScore?: number;
}

export class AnalyticsController {
  private static analyticsService: AnalyticsService = new AnalyticsService();

  static async getTransactions(req: Request, res: Response, next: NextFunction) {
    const { tenantId, date } = req.body;
    if (!tenantId || !date) {
      return res.status(400).json({ error: "Missing tenantId or date" });
    }

    try {
      const rawRecords = await getRawRecords(tenantId);
      const filtered = rawRecords.filter(r => r.date === date);
      res.json({ transactions: filtered });
    } catch (error: any) {
      console.error("Error fetching transactions for date:", error);
      res.status(500).json({ error: "Failed to fetch transaction details", details: error.message });
    }
  }

static async getMetrics(req: Request, res: Response, next: NextFunction) {
  const { tenantId, campaign, product, startDate, endDate } = req.body;
  if (!tenantId) {
    return res.status(400).json({ error: "Missing tenantId" });
  }

  try {
    const cacheKey = `${tenantId}:${campaign || 'All'}:${product || 'All'}:${startDate || ''}:${endDate || ''}`;
    const cached = await getFirestoreCache('DASHBOARD_METRICS_CACHE', cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const summary = await calculateFilteredMetrics(tenantId, campaign, product, startDate, endDate);
    
    // Also get the daily chart data aggregated
    const rawRecords = await getRawRecords(tenantId);
    const dailyMap: Record<string, { revenue: number; cost: number; isAnomaly: boolean; reason?: string }> = {};

    rawRecords.forEach(r => {
      const matchCampaign = campaign === 'All' || r.campaign === campaign;
      const matchProduct = product === 'All' || r.product === product;
      const matchDate = (!startDate || r.date >= startDate) && (!endDate || r.date <= endDate);
      
      if (matchCampaign && matchProduct && matchDate) {
        if (!dailyMap[r.date]) {
          dailyMap[r.date] = { revenue: 0, cost: 0, isAnomaly: false };
        }
        dailyMap[r.date].revenue += r.revenue;
        dailyMap[r.date].cost += r.cost;
        if (r.isAnomaly) {
          dailyMap[r.date].isAnomaly = true;
          dailyMap[r.date].reason = r.anomalyReason;
        }
      }
    });

    const chartData = Object.keys(dailyMap).sort().map(date => ({
      date,
      revenue: Math.round(dailyMap[date].revenue * 100) / 100,
      cost: Math.round(dailyMap[date].cost * 100) / 100,
      isAnomaly: dailyMap[date].isAnomaly,
      anomalyReason: dailyMap[date].reason
    }));

    const dbStatus = await checkTableExistence(tenantId);

    const responseData = {
      summary,
      chartData,
      filterMeta: {
        campaigns: Array.from(new Set(rawRecords.map(r => r.campaign).filter(Boolean))).sort(),
        products: Array.from(new Set(rawRecords.map(r => r.product).filter(Boolean))).sort(),
        minDate: rawRecords.map(r => r.date).filter(d => d && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()[0] || "2026-01-01",
        maxDate: rawRecords.map(r => r.date).filter(d => d && /^\d{4}-\d{2}-\d{2}$/.test(d)).sort().reverse()[0] || "2026-07-03"
      },
      dbStatus
    };

    await setFirestoreCache('DASHBOARD_METRICS_CACHE', cacheKey, responseData, 60);

    res.json(responseData);
  } catch (error: any) {
    console.error("Error calculating dashboard metrics:", error);
    res.status(500).json({ error: "Failed to load dashboard metrics", details: error.message });
  }
  }

static async runQuery(req: Request, res: Response, next: NextFunction) {
  const { tenantId, query, structuredQuery } = req.body;
  if (!tenantId) {
    return res.status(400).json({ success: false, error: "Missing tenant ID" });
  }

  const tenant = await getTenantById(tenantId);
  if (!tenant) {
    return res.status(404).json({ success: false, error: "Tenant not found" });
  }

  const startTime = Date.now();

  // Validate SELECT security
  const qClean = (query || "").trim().toLowerCase();
  if (query) {
    if (!qClean.startsWith('select')) {
      return res.status(400).json({ success: false, error: "Security Restriction: Only SELECT queries are permitted." });
    }
    const forbidden = ["insert", "update", "delete", "drop", "alter", "truncate", "create", "grant", "revoke", "commit", "rollback", "begin", "declare", "exec", "copy"];
    const forbiddenRegex = new RegExp(`\\b(${forbidden.join('|')})\\b`);
    if (forbiddenRegex.test(qClean)) {
      return res.status(400).json({ success: false, error: "Security Restriction: Database modification statements are not permitted." });
    }
    if (qClean.includes(';') && qClean.indexOf(';') < qClean.length - 1) {
      return res.status(400).json({ success: false, error: "Security Restriction: Multiple statements are not permitted." });
    }
  }

  const ds = tenant.dataSource;
  if (ds && ds.provider === 'PostgreSQL') {
    // Run live query in Postgres!
    const connectionString = buildConnectionString(ds);
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: true }, connectionTimeoutMillis: 5000, query_timeout: 10000 });
    try {
      await client.connect();
      await client.query("SET client_encoding TO 'UTF8'");
      const dbRes = await client.query(query);
      const executionTimeMs = Date.now() - startTime;
      
      const columns = dbRes.fields.map(f => f.name);
      const rows = dbRes.rows.map(row => columns.map(col => row[col] !== undefined ? String(row[col]) : ''));

      return res.json({
        success: true,
        columns,
        rows,
        query,
        executionTimeMs
      });
    } catch (err: any) {
      return res.status(200).json({
        success: false,
        error: `Database error: ${err.message || err}`
      });
    } finally {
      await client.end();
    }
  }

  // Local/Simulated dataset execution!
  try {
    let dataset: any[] = [];
    let tableName = "";
    
    if (structuredQuery && structuredQuery.table) {
      tableName = structuredQuery.table;
    } else {
      // Simple parse of table name from raw SQL: SELECT ... FROM table_name
      const fromMatch = query.match(/from\s+([^\s;]+)/i);
      if (fromMatch) {
        tableName = fromMatch[1].replace(/["'`]/g, '');
      }
    }

    const tNameLower = tableName.toLowerCase();
    const isSales = tNameLower.includes("sales") || tNameLower.includes("ledger") || tNameLower.includes("سجل") || tNameLower.includes("مبيعات") || tNameLower.includes("venta") || (tenant.localSchema && Object.keys(tenant.localSchema).some(t => t.toLowerCase() === tNameLower && (t.toLowerCase().includes('sale') || t.toLowerCase().includes('ledger') || t.toLowerCase().includes('transaction') || t.toLowerCase().includes('مبيعات'))));
    const isCrm = tNameLower.includes("crm") || tNameLower.includes("deal") || tNameLower.includes("pipeline") || tNameLower.includes("عملاء") || tNameLower.includes("صفقات") || tNameLower.includes("cliente") || (tenant.localSchema && Object.keys(tenant.localSchema).some(t => t.toLowerCase() === tNameLower && (t.toLowerCase().includes('crm') || t.toLowerCase().includes('deal') || t.toLowerCase().includes('lead') || t.toLowerCase().includes('عملاء'))));

    if (isSales) {
      const records = StoreService.SALES_DB[tenantId] || [];
      const tableSchema = tenant.localSchema ? tenant.localSchema[Object.keys(tenant.localSchema).find(t => t.toLowerCase() === tNameLower) || ''] : null;
      
      dataset = records.map((r, idx) => {
        if (tableSchema) {
          const row: any = {};
          tableSchema.forEach((col: any) => {
            const cName = col.column;
            const cLower = cName.toLowerCase();
            if (['date', 'time', 'create', 'تاريخ', 'وقت'].some(kw => cLower.includes(kw))) row[cName] = r.date;
            else if (['product', 'item', 'sku', 'منتج', 'سلعة'].some(kw => cLower.includes(kw))) row[cName] = r.product;
            else if (['campaign', 'source', 'medium', 'حملة', 'مصدر'].some(kw => cLower.includes(kw))) row[cName] = r.campaign;
            else if (['revenue', 'amount', 'price', 'total', 'إيراد', 'مبلغ', 'سعر', 'قيمة'].some(kw => cLower.includes(kw))) row[cName] = r.revenue;
            else if (['unit', 'qty', 'quantity', 'count', 'كمية', 'عدد'].some(kw => cLower.includes(kw))) row[cName] = r.units;
            else if (['cost', 'cogs', 'expense', 'تكلفة', 'مصاريف'].some(kw => cLower.includes(kw))) row[cName] = r.cost;
            else if (cLower.includes('id') || cLower.includes('رقم') || cLower.includes('معرف')) row[cName] = idx + 1;
            else row[cName] = '';
          });
          return row;
        }
        
        return {
          id: idx + 1,
          date: r.date,
          product: r.product,
          campaign: r.campaign,
          revenue: r.revenue,
          units: r.units,
          cost: r.cost,
        };
      });
    } else if (isCrm) {
      const deals = StoreService.CRM_DB[tenantId] || [];
      const tableSchema = tenant.localSchema ? tenant.localSchema[Object.keys(tenant.localSchema).find(t => t.toLowerCase() === tNameLower) || ''] : null;
      
      dataset = deals.map((d, idx) => {
        if (tableSchema) {
          const row: any = {};
          tableSchema.forEach((col: any) => {
            const cName = col.column;
            const cLower = cName.toLowerCase();
            if (['id', 'key', 'code', 'معرف', 'رقم'].some(kw => cLower.includes(kw))) row[cName] = d.id;
            else if (['name', 'customer', 'client', 'contact', 'عميل', 'اسم'].some(kw => cLower.includes(kw))) row[cName] = d.customerName;
            else if (['value', 'amount', 'worth', 'revenue', 'قيمة', 'مبلغ'].some(kw => cLower.includes(kw))) row[cName] = d.value;
            else if (['status', 'stage', 'state', 'phase', 'حالة', 'مرحلة'].some(kw => cLower.includes(kw))) row[cName] = d.status;
            else if (['update', 'date', 'time', 'تحديث', 'تاريخ'].some(kw => cLower.includes(kw))) row[cName] = d.lastUpdated;
            else row[cName] = '';
          });
          return row;
        }
        
        return {
          id: d.id,
          customerName: d.customerName,
          value: d.value,
          status: d.status,
          lastUpdated: d.lastUpdated
        };
      });
    } else {
      dataset = [];
    }

    let filteredData = [...dataset];
    
    // Evaluate filters
    if (structuredQuery && Array.isArray(structuredQuery.where)) {
      for (const filter of structuredQuery.where) {
        if (!filter.column || !filter.operator) continue;
        const col = filter.column.toLowerCase();
        const op = filter.operator;
        const val = String(filter.value || '').toLowerCase();
        
        filteredData = filteredData.filter(row => {
          const rowVal = String(row[col] !== undefined ? row[col] : '').toLowerCase();
          const numRowVal = parseFloat(rowVal);
          const numFilterVal = parseFloat(val);

          switch (op) {
            case '=':
              return rowVal === val;
            case '!=':
              return rowVal !== val;
            case '>':
              return !isNaN(numRowVal) && !isNaN(numFilterVal) ? numRowVal > numFilterVal : rowVal > val;
            case '<':
              return !isNaN(numRowVal) && !isNaN(numFilterVal) ? numRowVal < numFilterVal : rowVal < val;
            case '>=':
              return !isNaN(numRowVal) && !isNaN(numFilterVal) ? numRowVal >= numFilterVal : rowVal >= val;
            case '<=':
              return !isNaN(numRowVal) && !isNaN(numFilterVal) ? numRowVal <= numFilterVal : rowVal <= val;
            case 'LIKE':
              return rowVal.includes(val.replace(/%/g, ''));
            case 'IS NULL':
              return row[col] === null || row[col] === undefined;
            case 'IS NOT NULL':
              return row[col] !== null && row[col] !== undefined;
            default:
              return true;
          }
        });
      }
    } else if (query) {
      const whereMatch = query.match(/where\s+(.+?)(?:\s+order\s+by|\s+limit|$)/i);
      if (whereMatch) {
        const whereClause = whereMatch[1];
        const conds = whereClause.split(/\s+and\s+/i);
        for (const cond of conds) {
          const m = cond.match(/([a-zA-Z0-9_]+)\s*(=|!=|>|<|>=|<=|like)\s*(.+)/i);
          if (m) {
            const col = m[1].trim().toLowerCase();
            const op = m[2].trim().toUpperCase();
            let val = m[3].trim().replace(/^['"]|['"]$/g, '');
            filteredData = filteredData.filter(row => {
              const rowVal = String(row[col] !== undefined ? row[col] : '').toLowerCase();
              const numRowVal = parseFloat(rowVal);
              const numFilterVal = parseFloat(val);
              const lowerVal = val.toLowerCase();

              switch (op) {
                case '=':
                  return rowVal === lowerVal;
                case '!=':
                  return rowVal !== lowerVal;
                case '>':
                  return !isNaN(numRowVal) && !isNaN(numFilterVal) ? numRowVal > numFilterVal : rowVal > lowerVal;
                case '<':
                  return !isNaN(numRowVal) && !isNaN(numFilterVal) ? numRowVal < numFilterVal : rowVal < lowerVal;
                case '>=':
                  return !isNaN(numRowVal) && !isNaN(numFilterVal) ? numRowVal >= numFilterVal : rowVal >= lowerVal;
                case '<=':
                  return !isNaN(numRowVal) && !isNaN(numFilterVal) ? numRowVal <= numFilterVal : rowVal <= lowerVal;
                case 'LIKE':
                  return rowVal.includes(lowerVal.replace(/%/g, ''));
                default:
                  return true;
              }
            });
          }
        }
      }
    }

    // Evaluate Order By
    let orderByCol = "";
    let orderByDir = "ASC";
    if (structuredQuery && structuredQuery.orderBy && structuredQuery.orderBy.column) {
      orderByCol = structuredQuery.orderBy.column.toLowerCase();
      orderByDir = structuredQuery.orderBy.direction || "ASC";
    } else if (query) {
      const orderMatch = query.match(/order\s+by\s+([a-zA-Z0-9_]+)(?:\s+(asc|desc))?/i);
      if (orderMatch) {
        orderByCol = orderMatch[1].toLowerCase();
        if (orderMatch[2]) {
          orderByDir = orderMatch[2].toUpperCase();
        }
      }
    }

    if (orderByCol) {
      filteredData.sort((a, b) => {
        let valA = a[orderByCol];
        let valB = b[orderByCol];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return orderByDir === 'DESC' ? valB - valA : valA - valB;
        }
        valA = String(valA || '').toLowerCase();
        valB = String(valB || '').toLowerCase();
        if (valA < valB) return orderByDir === 'DESC' ? 1 : -1;
        if (valA > valB) return orderByDir === 'DESC' ? -1 : 1;
        return 0;
      });
    }

    // Evaluate Limit
    let limitVal = 50;
    if (structuredQuery && structuredQuery.limit !== undefined) {
      limitVal = parseInt(structuredQuery.limit, 10);
    } else if (query) {
      const limitMatch = query.match(/limit\s+(\d+)/i);
      if (limitMatch) {
        limitVal = parseInt(limitMatch[1], 10);
      }
    }
    if (!isNaN(limitVal) && limitVal > 0) {
      filteredData = filteredData.slice(0, limitVal);
    }

    // Evaluate Projected Columns
    let selectCols: string[] = [];
    if (structuredQuery && Array.isArray(structuredQuery.columns) && structuredQuery.columns.length > 0) {
      selectCols = structuredQuery.columns;
    } else if (query) {
      const selectMatch = query.match(/select\s+(.+?)\s+from/i);
      if (selectMatch) {
        const colsStr = selectMatch[1].trim();
        if (colsStr === "*") {
          selectCols = [];
        } else {
          selectCols = colsStr.split(',').map(c => c.trim().replace(/["'`]/g, ''));
        }
      }
    }

    if (selectCols.length === 0 || selectCols.includes("*")) {
      if (filteredData.length > 0) {
        selectCols = Object.keys(filteredData[0]).filter(k => k !== 'id' && !k.startsWith('record_') && !k.startsWith('transaction_') && !k.startsWith('opportunity_') && !k.startsWith('deal_') && !k.startsWith('customer_') && !k.startsWith('account_') && !k.startsWith('projected_') && !k.startsWith('pipeline_') && !k.startsWith('stage_') && !k.endsWith('_at'));
        if (selectCols.length === 0) selectCols = Object.keys(filteredData[0]);
      } else {
        selectCols = isSales ? ["date", "product", "campaign", "revenue", "units", "cost"] : ["id", "customerName", "value", "status", "lastUpdated"];
      }
    }

    const columns = selectCols;
    const rows = filteredData.map(row => {
      return columns.map(col => {
        const val = row[col] !== undefined ? row[col] : row[col.toLowerCase()];
        return val !== undefined && val !== null ? String(val) : '';
      });
    });

    const executionTimeMs = Date.now() - startTime;

    return res.json({
      success: true,
      columns,
      rows,
      query: query || `SELECT ${columns.join(', ')} FROM ${tableName} LIMIT ${limitVal}`,
      executionTimeMs
    });
  } catch (err: any) {
    return res.status(200).json({
      success: false,
      error: `In-memory execution error: ${err.message || err}`
    });
  }
  }

  static async runForecast(req: Request, res: Response, next: NextFunction) {
    try {
      const { tenantId, campaign, product, days = 30 } = req.body;
      if (!tenantId) {
        return res.status(400).json({ error: "Missing tenantId" });
      }

      const tenant = await getTenantById(tenantId);
      if (!tenant) {
        return res.status(404).json({ error: "Tenant not found" });
      }

      // 1. Calculate historical daily aggregates for trend baseline
      const rawRecords = await getRawRecords(tenantId);
      const dailyRev: Record<string, number> = {};
      const dailyCost: Record<string, number> = {};
      let totalHistoricalRevenue = 0;
      let totalHistoricalCost = 0;
      let anomalyCount = 0;

      rawRecords.forEach(r => {
        const matchCampaign = campaign === 'All' || r.campaign === campaign;
        const matchProduct = product === 'All' || r.product === product;
        if (matchCampaign && matchProduct) {
          dailyRev[r.date] = (dailyRev[r.date] || 0) + r.revenue;
          dailyCost[r.date] = (dailyCost[r.date] || 0) + r.cost;
          totalHistoricalRevenue += r.revenue;
          totalHistoricalCost += r.cost;
          if (r.isAnomaly) {
            anomalyCount++;
          }
        }
      });

      const dates = Object.keys(dailyRev).sort();
      if (dates.length === 0) {
        return res.json({ forecast: [], analysis: "Insufficient historical data under current filters to run a forecast model." });
      }

      const values = dates.map(d => dailyRev[d]);
      const n = values.length;

      // Statistical Outlier & Anomaly Management using Z-Score > 3 (Section 2.3)
      const meanValue = values.reduce((sum, v) => sum + v, 0) / n;
      const stdDevValue = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - meanValue, 2), 0) / n);
      
      const cleanedValues = values.filter(v => {
        const zScore = stdDevValue > 0 ? Math.abs(v - meanValue) / stdDevValue : 0;
        return zScore <= 3;
      });

      // Simple MoM growth rate calculation
      const last30Days = values.slice(-30).reduce((sum, v) => sum + v, 0);
      const preceding30Days = values.slice(-60, -30).reduce((sum, v) => sum + v, 0);
      const growthRateMoM = preceding30Days > 0 ? ((last30Days - preceding30Days) / preceding30Days) * 100 : 0;

      // Calculate baseline slope and daily sales average from cleaned values to avoid skewing
      const cleanN = cleanedValues.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      for (let i = 0; i < cleanN; i++) {
        sumX += i;
        sumY += cleanedValues[i];
        sumXY += i * cleanedValues[i];
        sumXX += i * i;
      }
      const slope = cleanN > 1 ? (cleanN * sumXY - sumX * sumY) / (cleanN * sumXX - sumX * sumX) : 0;
      const intercept = cleanN > 0 ? (sumY - slope * sumX) / cleanN : meanValue;

      let forecast: ForecastRecord[] = [];
      let modelName = "";
      let modelMetrics = "";
      let confidenceScore = 0;
      let lowConfidenceWarning = "";

      try {
        const result = ForecastingService.runAutoSelectionEngine(dates, values, days, tenantId);
        forecast = result.forecast as any;
        modelName = result.modelName;
        modelMetrics = `MAE: ${result.metrics.mae.toFixed(2)}, RMSE: ${result.metrics.rmse.toFixed(2)}, MAPE: ${result.metrics.mape.toFixed(2)}%`;
        confidenceScore = result.confidenceScore;
        
        if (result.driftWarning) {
          lowConfidenceWarning += `⚠️ DATA DRIFT ALERT: ${result.driftWarning}\n\n`;
        }
      } catch (err: any) {
        return res.json({ forecast: [], analysis: `Error running predictive engine: ${err.message}` });
      }

      if (n < 30) {
        confidenceScore = Math.max(0.1, confidenceScore - 0.4);
        forecast.forEach(f => {
          f.confidenceScore = confidenceScore;
          // Insufficient history widens the pessimistic/optimistic uncertainty interval bounds by 50%
          const originalMargin = ((f.upperBoundP90 || 0) - (f.lowerBoundP10 || 0)) / 2;
          const widerMargin = originalMargin * 1.5;
          f.lowerBoundP10 = Math.round(Math.max(0, (f.expected || 0) - widerMargin) * 100) / 100;
          f.upperBoundP90 = Math.round(((f.expected || 0) + widerMargin) * 100) / 100;
          f.lowerBound = f.lowerBoundP10;
          f.upperBound = f.upperBoundP90;
        });
        lowConfidenceWarning += `⚠️ LOW HISTORICAL DATA VOLUME DETECTED: Only ${n} historical periods were identified. Time-series algorithms require >= 30 records for robust parameter convergence. Variance boundaries have been statistically widened to protect against overfitting.\n\n`;
      }

      // 3. Structured JSON AI Explanation with Explainable AI & Driver Attribution (Sections 3.2, 4.2)
      const aiPrompt = `
        You are the Chief AI Data Scientist and Quantitative Systems Architect of SniperAI V2.1.
        We have computed a 30-day sales forecast for the tenant "${tenant.name}" (${tenant.industry}).
        
        Tenant description: ${tenant.description}
        Target Product Filter: ${product}
        Target Campaign Filter: ${campaign}
        
        Baseline Trend Slope: ${slope.toFixed(2)} units per day.
        First predicted day expected revenue: $${forecast[0].expected}
        Midpoint predicted day expected revenue: $${forecast[Math.floor(days/2)].expected}
        Terminal predicted day expected revenue: $${forecast[days - 1].expected}
        
        Model Evaluation Metrics: ${modelMetrics}
        
        Analyze this ${modelName} predictive model and output.
        You MUST provide your response as a valid, parsable JSON object matching this TypeScript structure:
        {
          "keyDrivers": [
            { "factor": "name of factor (e.g. Q4 Holiday Seasonality, Campaign Penetration)", "impact": "+X.X% or -X.X% trend attribution" }
          ],
          "insights": "Sleek, elegant, executive business insight explaining the forecast trajectory, cyclic peaks/valleys, and model dynamics."
        }
        Do not output any markdown code blocks, conversational text, or backticks around the JSON. Return raw JSON ONLY.
      `;

      let keyDrivers = [
        { factor: "Historical Trend Vector", impact: slope >= 0 ? `+${(slope * 100 / (meanValue || 1)).toFixed(1)}%` : `${(slope * 100 / (meanValue || 1)).toFixed(1)}%` },
        { factor: "Active Campaign Alignment", impact: campaign !== 'All' ? "+6.4%" : "+0.0%" },
        { factor: "Product Margin Contribution", impact: product !== 'All' ? "+3.8%" : "+1.2%" }
      ];
      let insights = `${lowConfidenceWarning}The time-series forecast model (${modelMetrics}) projects a rolling trend over the next ${days} days with a terminal expected value of $${forecast[days - 1].expected!.toLocaleString()}. Expect minor fluctuations in cyclic patterns corresponding to business-day velocity.`;

      try {
        const geminiRes = await getAi().models.generateContent({
          model: "gemini-2.5-flash",
          contents: aiPrompt,
          config: {
            systemInstruction: "You are the advanced finance engine of SniperAI, specializing in structured, mathematically sound multi-tenant forecasting commentary.",
            temperature: 0.1,
            responseMimeType: "application/json"
          }
        });
        const cleanedText = (geminiRes.text || "").trim().replace(/^```json|```$/g, "");
        const parsed = JSON.parse(cleanedText);
        if (parsed.keyDrivers && parsed.insights) {
          keyDrivers = parsed.keyDrivers;
          insights = lowConfidenceWarning + parsed.insights;
        }
      } catch (geminiError: any) {
        console.log("Strategic backup AI commentary fallback active.");
      }

      // Backward-compatible analysis markdown text
      const commentaryText = `### 📊 ${modelName} Strategic Analysis
${insights}

#### 🎯 Key Driver Attribution Vector (XAI):
${keyDrivers.map(d => `- **${d.factor}**: ${d.impact}`).join('\n')}

#### 💡 Actionable Growth Recommendations:
1. **Optimize Campaign Velocity**: Funnel resources toward adspend channels exhibiting ${slope >= 0 ? 'strong growth' : 'realignment potential'} like **${campaign === 'All' ? tenant.campaigns[0] : campaign}**.
2. **Dynamic Inventory Allocation**: Ensure product buffers are positioned perfectly for **${product === 'All' ? tenant.products[0].name : product}** to lock down max terminal margins.
3. **Upper Bound Capture**: Establish automated discount guards to protect target terminal upper bounds ($${forecast[days - 1].upperBoundP90!.toLocaleString()}).`;

      // Return standardized response envelope (Section 6) alongside backward-compatible properties
      res.json({
        success: true,
        tenantId,
        metric: "sales_revenue",
        granularity: "daily",
        summary: {
          historicalTotal: Math.round(totalHistoricalRevenue * 100) / 100,
          growthRateMoM: Math.round(growthRateMoM * 100) / 100,
          anomalyCount
        },
        forecast,
        explainability: {
          keyDrivers,
          insights
        },
        // Backwards compatibility for frontend rendering
        analysis: commentaryText
      });

    } catch (error: any) {
      console.error("Forecasting endpoint error:", error);
      res.status(500).json({ error: "Forecasting failed", details: error.message });
    }
  }

}
