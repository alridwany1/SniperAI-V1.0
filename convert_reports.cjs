const fs = require('fs');
let code = fs.readFileSync('report_routes_extracted.txt', 'utf8');

code = code.replace(/app\.post\("\/api\/reports\/strategic", async \(req, res\) => {/g, 'static async strategic(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/reports\/summarize", async \(req, res\) => {/g, 'static async summarize(req: Request, res: Response, next: NextFunction) {');

const header = `import { Request, Response, NextFunction } from 'express';
import { getTenantById, getFirestoreCache, setFirestoreCache } from '../../utils/serverHelpers.js';
import { getAi } from '../config/ai.js';
// Add other dependencies as needed

export class ReportController {
`;

fs.writeFileSync('src/backend/controllers/ReportController.ts', header + code + '\n}\n');
console.log("Converted reports.");
