const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// clean up multiple blank lines
code = code.replace(/\n\s*\n\s*\n/g, '\n\n');

// remove API Route comments
code = code.replace(/\/\/ API Route for Billing/g, '');
code = code.replace(/\/\/ Checkout flow/g, '');
code = code.replace(/\/\/ Update card flow/g, '');
code = code.replace(/\/\/ Get current deals/g, '');
code = code.replace(/\/\/ --- INVENTORY API ENDPOINTS ---/g, '');
code = code.replace(/\/\/ Get all inventory items for a tenant \(with auto-seeding if empty\)/g, '');
code = code.replace(/\/\/ Add new inventory item \(creates catalog product automatically\)/g, '');
code = code.replace(/\/\/ Update inventory item stock level or other attributes/g, '');

fs.writeFileSync('server.ts', code);
console.log("Cleaned server.ts");
