const fs = require('fs');
let code = fs.readFileSync('billing_routes_extracted.txt', 'utf8');

code = code.replace(/app\.get\("\/api\/billing\/:tenantId", async \(req, res\) => {/g, 'static async getBilling(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/billing\/:tenantId\/checkout", async \(req, res\) => {/g, 'static async checkout(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/billing\/:tenantId\/update-card", async \(req, res\) => {/g, 'static async updateCard(req: Request, res: Response, next: NextFunction) {');

const header = `import { Request, Response, NextFunction } from 'express';
import { getBillingData, saveBillingData } from '../../utils/serverHelpers.js';

export class BillingController {
`;

fs.writeFileSync('src/backend/controllers/BillingController.ts', header + code + '\n}\n');
console.log("Converted billing.");
