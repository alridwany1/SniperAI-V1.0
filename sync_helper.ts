import { Client } from 'pg';
import { Tenant, SalesRecord, CRMDeal } from './src/types.js';

export async function syncToPostgres(tenant: Tenant, sales: SalesRecord[], crmDeals: CRMDeal[]) {
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
  const encodedUser = encodeURIComponent(ds.username || '');
  const encodedPass = encodeURIComponent(ds.apiKey || '');
  const connectionString = `postgresql://${encodedUser}:${encodedPass}@${host}${port}/${dbName}?sslmode=require`;
  
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query("SET client_encoding TO 'UTF8'");
    
    await client.query(`
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
    `);

    const res = await client.query(`SELECT COUNT(*) FROM sales_records WHERE tenant_id = $1`, [tenant.id]);
    if (parseInt(res.rows[0].count) === 0) {
      for (const r of sales) {
        await client.query(
          `INSERT INTO sales_records (tenant_id, date, product, campaign, revenue, units, cost, is_anomaly, anomaly_reason) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [tenant.id, r.date, r.product, r.campaign, r.revenue, r.units, r.cost, r.isAnomaly || false, r.anomalyReason || '']
        );
      }
    }
  } catch(e) {
    console.error("Failed to sync to postgres", e);
  } finally {
    await client.end();
  }
}
