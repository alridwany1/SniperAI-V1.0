import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

let configDbId = "ai-studio-sniperaiv21-8ee02038-98dc-42b7-9275-3cf55e6ffb8d";
let configProjectId = "project-9b5d1c9a-a93c-4349-b04";
try {
  const configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
    if (configData.firestoreDatabaseId) configDbId = configData.firestoreDatabaseId;
    if (configData.projectId) configProjectId = configData.projectId;
  }
} catch (err) {}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyBWqUM5yEJg_3-VSfRQmNliPj9HUT_cn0c",
  authDomain: `${process.env.FIREBASE_PROJECT_ID || configProjectId}.firebaseapp.com`,
  projectId: process.env.FIREBASE_PROJECT_ID || configProjectId,
  storageBucket: `${process.env.FIREBASE_PROJECT_ID || configProjectId}.firebasestorage.app`,
  appId: process.env.FIREBASE_APP_ID || "1:322173143738:web:9114c8ef9e1b1d4de7d083"
};

const firebaseApp = initializeApp(firebaseConfig);
const dbId = process.env.FIRESTORE_DB_ID || configDbId || process.env.FIREBASE_DATABASE_ID;

export const db = getFirestore(firebaseApp, dbId);
export const serverAuth = getAuth(firebaseApp);
