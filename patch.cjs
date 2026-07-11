const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const getRawRecordsCode = `
async function getRawRecords(tenantId: string): Promise<SalesRecord[]> {
  const tenant = TENANTS.find(t => t.id === tenantId);
  if (tenant?.dataSource?.provider === 'PostgreSQL') {
    const ds = tenant.dataSource;
    let host = ds.host!.trim();
    let dbName = ds.databaseName!;
    if (host.includes('/')) {
        const parts = host.split('/');
        host = parts[0];
        if (parts[1] && !ds.databaseName) dbName = parts[1];
    }
    const port = host.includes(':') ? '' : ':5432';
    const connectionString = \`postgresql://\${ds.username}:\${ds.apiKey}@\${host}\${port}/\${dbName}?sslmode=require\`;
    
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      const tableCheck = await client.query(\`SELECT to_regclass('public.sales_records')\`);
      if (tableCheck.rows[0].to_regclass) {
         const res = await client.query(\`SELECT * FROM sales_records WHERE tenant_id = $1\`, [tenantId]);
         return res.rows.map(row => ({
           date: row.date,
           product: row.product,
           campaign: row.campaign,
           revenue: parseFloat(row.revenue),
           units: parseInt(row.units, 10),
           cost: parseFloat(row.cost),
           isAnomaly: row.is_anomaly,
           anomalyReason: row.anomaly_reason
         }));
      }
    } catch (e) {
      console.error("Postgres fetch error", e);
    } finally {
      await client.end();
    }
  }
  return SALES_DB[tenantId] || [];
}

async function getCRMRecords(tenantId: string): Promise<CRMDeal[]> {
  const tenant = TENANTS.find(t => t.id === tenantId);
  if (tenant?.dataSource?.provider === 'PostgreSQL') {
    const ds = tenant.dataSource;
    let host = ds.host!.trim();
    let dbName = ds.databaseName!;
    if (host.includes('/')) {
        const parts = host.split('/');
        host = parts[0];
        if (parts[1] && !ds.databaseName) dbName = parts[1];
    }
    const port = host.includes(':') ? '' : ':5432';
    const connectionString = \`postgresql://\${ds.username}:\${ds.apiKey}@\${host}\${port}/\${dbName}?sslmode=require\`;
    
    const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
    try {
      await client.connect();
      const tableCheck = await client.query(\`SELECT to_regclass('public.crm_deals')\`);
      if (tableCheck.rows[0].to_regclass) {
         const res = await client.query(\`SELECT * FROM crm_deals WHERE tenant_id = $1\`, [tenantId]);
         return res.rows.map(row => ({
           id: row.id,
           customerName: row.customer_name,
           value: parseFloat(row.value),
           status: row.status as any,
           lastUpdated: row.last_updated
         }));
      }
    } catch (e) {
      console.error("Postgres fetch error", e);
    } finally {
      await client.end();
    }
  }
  return CRM_DB[tenantId] || [];
}
`;

code = code.replace(
  "// Helper to filter and calculate dashboard metrics",
  getRawRecordsCode + "\n// Helper to filter and calculate dashboard metrics"
);

code = code.replace(
  "function calculateFilteredMetrics(tenantId: string, campaign: string, product: string, startDate: string, endDate: string): MetricSummary {",
  "async function calculateFilteredMetrics(tenantId: string, campaign: string, product: string, startDate: string, endDate: string): Promise<MetricSummary> {"
);

code = code.replace(
  "const rawRecords = SALES_DB[tenantId] || [];",
  "const rawRecords = await getRawRecords(tenantId);"
);

code = code.replace(
  "app.post(\"/api/dashboard/metrics\", (req, res) => {",
  "app.post(\"/api/dashboard/metrics\", async (req, res) => {"
);

code = code.replace(
  "const summary = calculateFilteredMetrics(tenantId, campaign, product, startDate, endDate);",
  "const summary = await calculateFilteredMetrics(tenantId, campaign, product, startDate, endDate);"
);

code = code.replace(
  "const rawRecords = SALES_DB[tenantId] || [];",
  "const rawRecords = await getRawRecords(tenantId);"
);

code = code.replace(
  "app.post(\"/api/dashboard/predict\", async (req, res) => {",
  "app.post(\"/api/dashboard/predict\", async (req, res) => {"
);

code = code.replace(
  "const metrics = calculateFilteredMetrics(tenantId, campaign, product, startDate, endDate);",
  "const metrics = await calculateFilteredMetrics(tenantId, campaign, product, startDate, endDate);"
);

code = code.replace(
  "app.post(\"/api/dashboard/agent\", async (req, res) => {",
  "app.post(\"/api/dashboard/agent\", async (req, res) => {"
);

code = code.replace(
  "const metrics = calculateFilteredMetrics(tenantId, campaign, product, startDate, endDate);",
  "const metrics = await calculateFilteredMetrics(tenantId, campaign, product, startDate, endDate);"
);

code = code.replace(
  "app.get(\"/api/crm/deals/:tenantId\", (req, res) => {",
  "app.get(\"/api/crm/deals/:tenantId\", async (req, res) => {"
);

code = code.replace(
  "const deals = CRM_DB[tenantId] || [];",
  "const deals = await getCRMRecords(tenantId);"
);

fs.writeFileSync('server.ts', code);
