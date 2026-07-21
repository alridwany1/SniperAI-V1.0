const fs = require('fs');
let code = fs.readFileSync('inv_routes_extracted.txt', 'utf8');

code = code.replace(/app\.get\("\/api\/inventory\/:tenantId\/items", async \(req, res\) => {/g, 'static async getItems(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/inventory\/:tenantId\/items", async \(req, res\) => {/g, 'static async createItem(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.put\("\/api\/inventory\/:tenantId\/items\/:itemId", async \(req, res\) => {/g, 'static async updateItem(req: Request, res: Response, next: NextFunction) {');

const header = `import { Request, Response, NextFunction } from 'express';
import { getTenantById, getInventoryRecords } from '../../utils/serverHelpers.js';
import { db } from '../config/firebase.js';
import { getDoc, setDoc, doc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { cleanObject } from '../utils/helpers.js';

export class InventoryController {
`;

fs.writeFileSync('src/backend/controllers/InventoryController.ts', header + code + '\n}\n');
console.log("Converted inv.");
