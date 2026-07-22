import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

let configDbId = 'ai-studio-sniperaiv21-8ee02038-98dc-42b7-9275-3cf55e6ffb8d';
let configProjectId = 'project-9b5d1c9a-a93c-4349-b04';

try {
  const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (configData.firestoreDatabaseId) configDbId = configData.firestoreDatabaseId;
    if (configData.projectId) configProjectId = configData.projectId;
  }
} catch (err) {}

const projectId = process.env.FIREBASE_PROJECT_ID || configProjectId;
const dbId = process.env.FIRESTORE_DB_ID || configDbId || process.env.FIREBASE_DATABASE_ID;

let app;
if (getApps().length === 0) {
  try {
    app = initializeApp({
      projectId: projectId,
    });
    console.log('[FIREBASE-ADMIN] Initialized admin SDK successfully.');
  } catch (err) {
    console.error('[FIREBASE-ADMIN] Failed to initialize Firebase Admin SDK:', err);
  }
} else {
  app = getApps()[0];
}

export const adminAuth = getAuth(app);
export const adminDb = getFirestore(app, dbId);
export { app as adminApp };

