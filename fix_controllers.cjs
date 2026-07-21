const fs = require('fs');

const files = [
    'src/backend/controllers/AiAssistantController.ts',
    'src/backend/controllers/AnalyticsController.ts',
    'src/backend/controllers/BillingController.ts',
    'src/backend/controllers/CrmController.ts',
    'src/backend/controllers/InventoryController.ts',
    'src/backend/controllers/ReportController.ts',
    'src/backend/controllers/TenantController.ts'
];

for (const file of files) {
    let code = fs.readFileSync(file, 'utf8');
    // We want to replace ^});$ with } at the top level
    code = code.replace(/^}\);$/gm, '  }');
    fs.writeFileSync(file, code);
}
console.log("Fixed controllers.");
