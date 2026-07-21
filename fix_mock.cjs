const fs = require('fs');
let serverTs = fs.readFileSync('server.ts', 'utf8');
const lines = serverTs.split('\n');

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('export function getTenantLanguage')) startIndex = i;
    if (lines[i].includes('export async function getRawRecords')) {
        endIndex = i - 1;
        break;
    }
}

let code = `import { Tenant, SalesRecord, CRMDeal, SyncHistoryEntry } from '../../types.js';
import { StoreService } from '../services/StoreService.js';\n\n`;
for (let i = startIndex; i <= endIndex; i++) {
    code += lines[i] + '\n';
}

fs.writeFileSync('src/backend/utils/mockGenerators.ts', code);
console.log("Fixed mockGenerators.ts");
