const fs = require('fs');
let code = fs.readFileSync('src/backend/utils/serverHelpers.ts', 'utf8');

// There is an Express route leftover in serverHelpers.ts:
// app.post("/api/tenants/:tenantId/in-memory-query", ...
// Let's remove it safely using a regex.
code = code.replace(/app\.post\("\/api\/tenants\/:tenantId\/in-memory-query"[\s\S]*?\}\);/g, "");

fs.writeFileSync('src/backend/utils/serverHelpers.ts', code);
console.log("Fixed route");
