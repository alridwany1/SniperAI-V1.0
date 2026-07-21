const fs = require('fs');
let code = fs.readFileSync('ai_routes_extracted.txt', 'utf8');

code = code.replace(/app\.post\("\/api\/assistant\/summarize", async \(req, res\) => {/g, 'static async summarize(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/assistant\/chat", async \(req, res\) => {/g, 'static async chat(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/assistant\/tts", async \(req, res\) => {/g, 'static async tts(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/assistant\/analyze-anomaly", async \(req, res\) => {/g, 'static async analyzeAnomaly(req: Request, res: Response, next: NextFunction) {');

const header = `import { Request, Response, NextFunction } from 'express';
import { StoreService } from '../services/StoreService.js';
import { getTenantById } from '../../utils/serverHelpers.js';
// We will mock the rest of the helpers or import them properly
import { getAi } from '../config/ai.js';
// Add other imports as required by compilation

export class AiAssistantController {
`;

fs.writeFileSync('src/backend/controllers/AiAssistantController.ts', header + code + '\n}\n');
console.log("Converted AI.");
