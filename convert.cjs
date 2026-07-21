const fs = require('fs');
let code = fs.readFileSync('tenant_routes_extracted.txt', 'utf8');

code = code.replace(/app\.get\("\/api\/tenants", async \(req, res\) => {/g, 'static async getAllTenants(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/tenants", async \(req, res\) => {/g, 'static async createTenant(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/tenants\/test-connection", async \(req, res\) => {/g, 'static async testConnection(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.put\("\/api\/tenants\/:id", async \(req, res\) => {/g, 'static async updateTenant(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/tenants\/bulk-delete", async \(req, res\) => {/g, 'static async bulkDeleteTenants(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/tenants\/:id\/diagnostics", async \(req, res\) => {/g, 'static async diagnosticTenant(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.post\("\/api\/tenants\/:id\/refresh-schema", async \(req, res\) => {/g, 'static async refreshSchema(req: Request, res: Response, next: NextFunction) {');
code = code.replace(/app\.get\("\/api\/tenants\/:id\/schema", async \(req, res\) => {/g, 'static async getSchema(req: Request, res: Response, next: NextFunction) {');

// Add wrapper
const header = `import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase.js';
import { StoreService } from '../services/StoreService.js';
import { cleanObject } from '../utils/helpers.js';
import { getDoc, setDoc, doc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { Client } from 'pg';
import { MongoClient } from 'mongodb';
import axios from 'axios';
import { introspectSchema } from '../repositories/DatabaseRepository.js';
import { analyzeAndRouteSchemaWithAI, mapSchemaWithAI, setFirestoreCache, getFirestoreCache } from '../services/SchemaMappingService.js';
import { Tenant } from '../../types.js';

export class TenantController {
`;

fs.writeFileSync('src/backend/controllers/TenantController.ts', header + code + '\n}\n');
console.log("Converted.");
