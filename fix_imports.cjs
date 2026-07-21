const fs = require('fs');
const glob = require('glob'); // wait, node might not have glob, I'll just hardcode files

const files = [
    'src/backend/controllers/AiAssistantController.ts',
    'src/backend/controllers/AnalyticsController.ts',
    'src/backend/controllers/BillingController.ts',
    'src/backend/controllers/CrmController.ts',
    'src/backend/controllers/InventoryController.ts',
    'src/backend/controllers/ReportController.ts',
    'src/backend/controllers/TenantController.ts',
    'src/backend/utils/serverHelpers.ts'
];

for (const file of files) {
    if (!fs.existsSync(file)) continue;
    let code = fs.readFileSync(file, 'utf8');
    
    // Add missing imports. We can just append them if they are missing.
    // Or we can just import EVERYTHING from serverHelpers in the controllers.
    
    // First, let's fix TenantController
    if (file.includes('TenantController.ts')) {
        code = code.replace(/import \{ introspectSchema \} from '\.\.\/repositories\/DatabaseRepository\.js';/, 
            "import { introspectSchema, buildConnectionString } from '../repositories/DatabaseRepository.js';");
        code = code.replace(/import \{ analyzeAndRouteSchemaWithAI, mapSchemaWithAI, setFirestoreCache, getFirestoreCache \} from '\.\.\/services\/SchemaMappingService\.js';/, 
            "import { analyzeAndRouteSchemaWithAI, mapSchemaWithAI } from '../services/SchemaMappingService.js';\nimport { setFirestoreCache, getFirestoreCache, getTenantById, applyMappingToAnalysis } from '../utils/serverHelpers.js';");
    }

    if (file.includes('AnalyticsController.ts')) {
        code = code.replace(/import \{ getTenantById.*? from '\.\/AnalyticsHelpers\.js';/, "");
        code = code.replace(/import \{ getDynamicDBMapping \} from '\.\.\/services\/SchemaMappingService\.js';/, "");
        code = code.replace(/import \{ StoreService \}.*/, "import { StoreService } from '../services/StoreService.js';\nimport { buildConnectionString } from '../repositories/DatabaseRepository.js';\nimport { getTenantById, getRawRecords, calculateFilteredMetrics, setFirestoreCache, getFirestoreCache, checkTableExistence } from '../utils/serverHelpers.js';\nimport { getAi } from '../config/ai.js';\nimport { executeQuery } from '../repositories/DatabaseRepository.js';");
        code = code.replace(/export class AnalyticsController/, 
            "interface ForecastRecord { date: string; value: number; }\nexport class AnalyticsController");
    }

    if (file.includes('AiAssistantController.ts')) {
        code = code.replace(/import \{ getTenantById \} from '\.\.\/utils\/serverHelpers\.js';/,
            "import { getTenantById, getRawRecords, getCRMRecords } from '../utils/serverHelpers.js';\nimport { buildConnectionString, Client } from '../repositories/DatabaseRepository.js';");
        code = code.replace(/export class AiAssistantController/,
            "type Type = any;\nexport class AiAssistantController");
    }
    
    if (file.includes('CrmController.ts')) {
        code = code.replace(/import \{ getTenantById.*\} from '\.\.\/utils\/serverHelpers\.js';/,
            "import { getTenantById, getCRMSyncHistory, saveCRMSyncHistory, getCRMRecords } from '../utils/serverHelpers.js';\nimport { db } from '../config/firebase.js';\nimport { setDoc, doc } from 'firebase/firestore';\nimport { StoreService } from '../services/StoreService.js';\nimport { cleanObject } from '../utils/helpers.js';\nimport { SyncHistoryEntry } from '../../types.js';");
    }
    
    if (file.includes('InventoryController.ts')) {
        code = code.replace(/import \{ getTenantById, getInventoryRecords \} from '\.\.\/utils\/serverHelpers\.js';/,
            "import { getTenantById, getInventoryRecords } from '../utils/serverHelpers.js';\nimport { StoreService } from '../services/StoreService.js';\nimport { Tenant } from '../../types.js';");
    }

    if (file.includes('ReportController.ts')) {
        code = code.replace(/import \{ getTenantById, getFirestoreCache, setFirestoreCache \} from '\.\.\/utils\/serverHelpers\.js';/,
            "import { getTenantById, getFirestoreCache, setFirestoreCache, calculateFilteredMetrics } from '../utils/serverHelpers.js';");
    }

    if (file.includes('serverHelpers.ts')) {
        code = code.replace(/import \{ MongoClient \} from 'mongodb';\nimport \{ MongoClient \} from 'mongodb';/, "import { MongoClient } from 'mongodb';");
        code = code.replace(/import \{ getDynamicDBMapping \} from '\.\.\/services\/SchemaMappingService\.js';/, "import { mapSchemaWithAI } from '../services/SchemaMappingService.js';");
        code = code.replace(/import \{ generateSalesRecords, generateCRMDeals, getTenantLanguage, decodeUTF8String \} from '\.\/mockGenerators\.js';/, "");
        code = code.replace(/import \{ cleanObject \} from '\.\/helpers\.js';/, "import { cleanObject } from './helpers.js';\nimport { buildConnectionString, introspectSchema } from '../repositories/DatabaseRepository.js';");
    }
    
    fs.writeFileSync(file, code);
}
console.log("Fixed imports");
