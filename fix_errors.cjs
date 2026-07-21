const fs = require('fs');

// Fix AiAssistantController
let file = 'src/backend/controllers/AiAssistantController.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/import \{ buildConnectionString, Client \} from '\.\.\/repositories\/DatabaseRepository\.js';/, "import { buildConnectionString } from '../repositories/DatabaseRepository.js';\nimport { Client } from 'pg';");
code = code.replace(/import \{ getTenantById, getRawRecords, getCRMRecords \} from '\.\.\/utils\/serverHelpers\.js';/, "import { getTenantById, getRawRecords, getCRMRecords, calculateFilteredMetrics } from '../utils/serverHelpers.js';\nimport { introspectSchema } from '../services/SchemaMappingService.js';\nimport { getDoc, doc } from 'firebase/firestore';\nimport { db } from '../config/firebase.js';");
code = code.replace(/type Type = any;/, "import { Type } from '@google/genai';");
fs.writeFileSync(file, code);

// Fix AnalyticsController
file = 'src/backend/controllers/AnalyticsController.ts';
code = fs.readFileSync(file, 'utf8');
code = code.replace(/import \{ getTenantById, getRawRecords, calculateFilteredMetrics, setFirestoreCache, getFirestoreCache, checkTableExistence \} from '\.\.\/utils\/serverHelpers\.js';/, "");
code = code.replace(/import \{ getTenantById, buildConnectionString, querySales, getRawRecords, executePostgresQuery, parseForecastQuery, detectTrend, getAi \}.*/, "import { getTenantById, getRawRecords, calculateFilteredMetrics, setFirestoreCache, getFirestoreCache, checkTableExistence } from '../utils/serverHelpers.js';\nimport { getAi } from '../config/ai.js';\nimport { executeQuery, buildConnectionString } from '../repositories/DatabaseRepository.js';\nimport { Client } from 'pg';");
code = code.replace(/interface ForecastRecord \{ date: string; value: number; \}/, "interface ForecastRecord { date: string; revenue?: number; value?: number; upperBound?: number; lowerBound?: number; }");
fs.writeFileSync(file, code);

// Fix TenantController
file = 'src/backend/controllers/TenantController.ts';
code = fs.readFileSync(file, 'utf8');
code = code.replace(/import \{ introspectSchema, buildConnectionString \} from '\.\.\/repositories\/DatabaseRepository\.js';/, "import { buildConnectionString } from '../repositories/DatabaseRepository.js';");
code = code.replace(/import \{ analyzeAndRouteSchemaWithAI, mapSchemaWithAI \} from '\.\.\/services\/SchemaMappingService\.js';/, "import { analyzeAndRouteSchemaWithAI, mapSchemaWithAI, introspectSchema } from '../services/SchemaMappingService.js';");
fs.writeFileSync(file, code);

// Fix serverHelpers
file = 'src/backend/utils/serverHelpers.ts';
code = fs.readFileSync(file, 'utf8');
code = code.replace(/import \{ MongoClient \} from 'mongodb';\nimport \{ MongoClient \} from 'mongodb';/g, "import { MongoClient } from 'mongodb';");
code = code.replace(/import \{ cleanObject \} from '\.\/helpers\.js';\nimport \{ buildConnectionString, introspectSchema \} from '\.\.\/repositories\/DatabaseRepository\.js';/, "import { buildConnectionString } from '../repositories/DatabaseRepository.js';\nimport { introspectSchema } from '../services/SchemaMappingService.js';");
code = code.replace(/export function cleanObject<T>\(obj: T\): T \{[\s\S]*?^}/m, "");
code = code.replace(/app\.use\(errorHandler\);/, "");
fs.writeFileSync(file, code);

// Fix DataService
file = 'src/backend/services/DataService.ts';
code = fs.readFileSync(file, 'utf8');
code = code.replace(/import \{ getDynamicDBMapping \} from '\.\/SchemaMappingService\.js';/, "");
code = code.replace(/import \{ buildConnectionString \} from '\.\.\/utils\/helpers\.js';/, "");
fs.writeFileSync(file, code);

console.log("Fixed errors");
