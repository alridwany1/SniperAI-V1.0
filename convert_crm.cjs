const fs = require('fs');
let code = fs.readFileSync('crm_routes_extracted.txt', 'utf8');

code = code.replace(/app\.post\("\/api\/crm\/sync", async \(req, res\) => {/g, 'static async sync(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.get\("\/api\/crm\/sync-history\/:tenantId", async \(req, res\) => {/g, 'static async getSyncHistory(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.get\("\/api\/crm\/deals\/:tenantId", async \(req, res\) => {/g, 'static async getDeals(req: Request, res: Response, next: NextFunction) {');

const header = `import { Request, Response, NextFunction } from 'express';
import { getTenantById, getCRMSyncHistory, saveCRMSyncHistory, getCRMRecords } from '../../utils/serverHelpers.js';

export class CrmController {
`;

fs.writeFileSync('src/backend/controllers/CrmController.ts', header + code + '\n}\n');
console.log("Converted crm.");
