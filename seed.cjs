const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const syncHelper = `
async function syncToPostgres(tenant: Tenant, sales: SalesRecord[], crmDeals: CRMDeal[]) {
  if (!tenant.dataSource || tenant.dataSource.provider !== 'PostgreSQL') return;
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
    
    await client.query(\`
      CREATE TABLE IF NOT EXISTS sales_records (
        id SERIAL PRIMARY KEY,
        tenant_id VARCHAR(255),
        date VARCHAR(10),
        product VARCHAR(255),
        campaign VARCHAR(255),
        revenue NUMERIC,
        units INTEGER,
        cost NUMERIC,
        is_anomaly BOOLEAN,
        anomaly_reason TEXT
      )
    \`);
    
    await client.query(\`
      CREATE TABLE IF NOT EXISTS crm_deals (
        id VARCHAR(255) PRIMARY KEY,
        tenant_id VARCHAR(255),
        customer_name VARCHAR(255),
        value NUMERIC,
        status VARCHAR(50),
        last_updated VARCHAR(50)
      )
    \`);

    const res = await client.query(\`SELECT COUNT(*) FROM sales_records WHERE tenant_id = $1\`, [tenant.id]);
    if (parseInt(res.rows[0].count) === 0) {
      for (const r of sales) {
        await client.query(
          \`INSERT INTO sales_records (tenant_id, date, product, campaign, revenue, units, cost, is_anomaly, anomaly_reason) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)\`,
          [tenant.id, r.date, r.product, r.campaign, r.revenue, r.units, r.cost, r.isAnomaly || false, r.anomalyReason || '']
        );
      }
    }
    
    const resCrm = await client.query(\`SELECT COUNT(*) FROM crm_deals WHERE tenant_id = $1\`, [tenant.id]);
    if (parseInt(resCrm.rows[0].count) === 0) {
      for (const r of crmDeals) {
        await client.query(
          \`INSERT INTO crm_deals (id, tenant_id, customer_name, value, status, last_updated) VALUES ($1, $2, $3, $4, $5, $6)\`,
          [r.id, tenant.id, r.customerName, r.value, r.status, r.lastUpdated]
        );
      }
    }
  } catch(e) {
    console.error("Failed to sync to postgres", e);
  } finally {
    await client.end();
  }
}
`;

code = code.replace(
  "// Register a new tenant",
  syncHelper + "\n// Register a new tenant"
);

code = code.replace(
  "CRM_DB[newTenant.id] = generateCRMDeals(newTenant.id);",
  "CRM_DB[newTenant.id] = generateCRMDeals(newTenant.id);\n  syncToPostgres(newTenant, SALES_DB[newTenant.id], CRM_DB[newTenant.id]).catch(e => console.error(e));"
);

fs.writeFileSync('server.ts', code);
