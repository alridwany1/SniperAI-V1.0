const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const refreshSchemaEndpoint = `
// Refresh schema mapping
app.post("/api/tenants/:id/refresh-schema", async (req, res) => {
  const { id } = req.params;
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) {
    return res.status(404).json({ error: "Tenant not found" });
  }

  if (tenant.dataSource?.provider === 'PostgreSQL') {
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
    
    try {
      const schema = await introspectSchema(connectionString);
      const mapping = await mapSchemaWithAI(schema);
      DB_MAPPING_CACHE.set(tenant.id, mapping);
      return res.json({ success: true, mapping });
    } catch (e: any) {
      console.error("Failed to map schema:", e);
      return res.status(500).json({ error: "Failed to map schema" });
    }
  }

  res.json({ success: false, message: "Only supported for PostgreSQL" });
});
`;

code = code.replace(
  "// Get metrics with active filters",
  refreshSchemaEndpoint + "\n// Get metrics with active filters"
);

fs.writeFileSync('server.ts', code);
