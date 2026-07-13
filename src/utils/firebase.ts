import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBWqUM5yEJg_3-VSfRQmNliPj9HUT_cn0c",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "project-9b5d1c9a-a93c-4349-b04"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "project-9b5d1c9a-a93c-4349-b04",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "project-9b5d1c9a-a93c-4349-b04"}.firebasestorage.app`,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "322173143738",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:322173143738:web:9114c8ef9e1b1d4de7d083"
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || "ai-studio-sniperaiv21-8ee02038-98dc-42b7-9275-3cf55e6ffb8d";

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, databaseId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null,
  userEmail?: string | null
) {
  const errMsg = error instanceof Error ? error.message : String(error);
  const errInfo: FirestoreErrorInfo = {
    error: errMsg,
    authInfo: {
      userId: userEmail || null,
      email: userEmail || null,
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

