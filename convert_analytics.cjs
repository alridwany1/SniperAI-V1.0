const fs = require('fs');
let code = fs.readFileSync('analytics_routes_extracted.txt', 'utf8');

code = code.replace(/app\.post\("\/api\/dashboard\/transactions", async \(req, res\) => {/g, 'static async getTransactions(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/dashboard\/metrics", async \(req, res\) => {/g, 'static async getMetrics(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/query\/run", async \(req, res\) => {/g, 'static async runQuery(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/forecast", async \(req, res\) => {/g, 'static async runForecast(req: Request, res: Response, next: NextFunction) {');

const header = `import { Request, Response, NextFunction } from 'express';
// We will mock the implementations directly referencing the monolithic structure for now,
// or we can import them if we export them from a central services file.
import { StoreService } from '../services/StoreService.js';
import { getRawRecords, calculateFilteredMetrics } from '../../utils/serverHelpers.js';
import { getTenantById } from '../../utils/serverHelpers.js';
// ... we will add missing imports as we compile

export class AnalyticsController {
`;

fs.writeFileSync('src/backend/controllers/AnalyticsController.ts', header + code + '\n}\n');
console.log("Converted analytics.");
