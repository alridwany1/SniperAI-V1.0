const fs = require('fs');

// Fix AnalyticsController
let file = 'src/backend/controllers/AnalyticsController.ts';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/import \{ getTenantById, getRawRecords, calculateFilteredMetrics \} from '\.\.\/utils\/serverHelpers\.js';/, "import { getTenantById, getRawRecords, calculateFilteredMetrics, setFirestoreCache, getFirestoreCache, checkTableExistence } from '../utils/serverHelpers.js';");
code = code.replace(/import \{ Client \} from 'pg';\nimport \{ Client \} from 'pg';/, "import { Client } from 'pg';");
code = code.replace(/interface ForecastRecord \{[\s\S]*?\}/, "interface ForecastRecord { date: string; revenue?: number; value?: number; upperBound?: number; lowerBound?: number; isForecast?: boolean; }");
fs.writeFileSync(file, code);

// Fix serverHelpers
file = 'src/backend/utils/serverHelpers.ts';
code = fs.readFileSync(file, 'utf8');
code = code.replace(/import \{ MongoClient \} from 'mongodb';\nimport \{ MongoClient \} from 'mongodb';/g, "import { MongoClient } from 'mongodb';");
code = code.replace(/import \{ buildConnectionString \} from '\.\.\/repositories\/DatabaseRepository\.js';/, "import { buildConnectionString } from '../repositories/DatabaseRepository.js';\nimport { cleanObject } from '../utils/helpers.js';");
code = code.replace(/^app\..*/gm, "");
fs.writeFileSync(file, code);

console.log("Fixed errors");
