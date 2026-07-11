const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Add imports
code = code.replace(
  'import { Client } from "pg";',
  'import { Client } from "pg";\nimport { introspectSchema, mapSchemaWithAI } from "./schema_mapper.js";\nconst DB_MAPPING_CACHE = new Map<string, any>();\n\nasync function getDynamicDBMapping(connectionString: string, tenantId: string) {\n  if (DB_MAPPING_CACHE.has(tenantId)) return DB_MAPPING_CACHE.get(tenantId);\n  try {\n    const schema = await introspectSchema(connectionString);\n    const mapping = await mapSchemaWithAI(schema);\n    DB_MAPPING_CACHE.set(tenantId, mapping);\n    return mapping;\n  } catch (e) {\n    console.error("Failed to map schema:", e);\n    return null;\n  }\n}'
);

const newGetRawRecordsCode = `
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
    
    const mapping = await getDynamicDBMapping(connectionString, tenantId);
    
    if (mapping && mapping.sales && mapping.sales.table) {
      const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
      try {
        await client.connect();
        const sales = mapping.sales;
        const res = await client.query(\`SELECT * FROM "\${sales.table}" LIMIT 1000\`);
        return res.rows.map(row => ({
          date: sales.date && row[sales.date] ? String(row[sales.date]).substring(0, 10) : '2024-01-01',
          product: sales.product && row[sales.product] ? String(row[sales.product]) : 'Standard Product',
          campaign: sales.campaign && row[sales.campaign] ? String(row[sales.campaign]) : 'Organic',
          revenue: sales.revenue && !isNaN(parseFloat(row[sales.revenue])) ? parseFloat(row[sales.revenue]) : 0,
          units: sales.units && !isNaN(parseInt(row[sales.units], 10)) ? parseInt(row[sales.units], 10) : 1,
          cost: sales.cost && !isNaN(parseFloat(row[sales.cost])) ? parseFloat(row[sales.cost]) : 0,
          isAnomaly: false,
          anomalyReason: ''
        }));
      } catch (e) {
        console.error("Dynamic Postgres sales fetch error", e);
      } finally {
        await client.end();
      }
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
    
    const mapping = await getDynamicDBMapping(connectionString, tenantId);
    
    if (mapping && mapping.crm && mapping.crm.table) {
      const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
      try {
        await client.connect();
        const crm = mapping.crm;
        const res = await client.query(\`SELECT * FROM "\${crm.table}" LIMIT 1000\`);
        return res.rows.map(row => ({
          id: crm.id && row[crm.id] ? String(row[crm.id]) : Math.random().toString(),
          customerName: crm.customerName && row[crm.customerName] ? String(row[crm.customerName]) : 'Unknown Customer',
          value: crm.value && !isNaN(parseFloat(row[crm.value])) ? parseFloat(row[crm.value]) : 0,
          status: crm.status && row[crm.status] ? String(row[crm.status]) as any : 'Lead',
          lastUpdated: crm.lastUpdated && row[crm.lastUpdated] ? String(row[crm.lastUpdated]) : new Date().toISOString()
        }));
      } catch (e) {
        console.error("Dynamic Postgres crm fetch error", e);
      } finally {
        await client.end();
      }
    }
  }
  return CRM_DB[tenantId] || [];
}
`;

// Replace the old getRawRecords block
code = code.replace(/async function getRawRecords[\s\S]*?async function getCRMRecords[\s\S]*?return CRM_DB\[tenantId\] \|\| \[\];\n}/, newGetRawRecordsCode);

fs.writeFileSync('server.ts', code);
