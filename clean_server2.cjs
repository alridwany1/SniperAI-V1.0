const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// clean up remaining comments
code = code.replace(/\/\/ Dashboard metrics cache map removed in favor of Firestore cache\n/g, '');
code = code.replace(/\/\/ Get raw transaction records for a specific date\n/g, '');
code = code.replace(/\/\/ Get metrics with active filters\n/g, '');
code = code.replace(/\/\/ Run mathematical forecasting & trigger Gemini AI explanation\n/g, '');
code = code.replace(/\/\/ Strategic Executive Report with dynamic Cache\n/g, '');
code = code.replace(/\/\/ Summarize Report\n/g, '');
code = code.replace(/\/\/ Auto-Summarize Current Session's Findings\n/g, '');
code = code.replace(/\/\/ AI Financial Assistant Chat Endpoint\n/g, '');
code = code.replace(/\/\/ AI Text-To-Speech \(TTS\) Endpoint\n/g, '');
code = code.replace(/\/\/ AI Forensic Anomaly & Operational Risk Audit Endpoint\n/g, '');
code = code.replace(/\/\/ Mock CRM Sync trigger\n/g, '');
code = code.replace(/\/\/ Get CRM Sync history\n/g, '');
code = code.replace(/\/\/ Billing Data Structure\n/g, '');
code = code.replace(/\/\/ API Routes\n/g, '');
code = code.replace(/\/\/ Get all tenants and active tenant info\n/g, '');
code = code.replace(/\/\/ Test connection to a data source\n/g, '');
code = code.replace(/\/\/ Register a new tenant\n/g, '');
code = code.replace(/\/\/ Update an existing tenant settings\n/g, '');
code = code.replace(/\/\/ Bulk delete tenants\n/g, '');
code = code.replace(/\/\/ Connection Diagnostic endpoint\n/g, '');
code = code.replace(/\/\/ Refresh schema mapping\n/g, '');
code = code.replace(/\/\/ Execute visual \/ custom SQL select queries\n/g, '');
code = code.replace(/\/\/ Get tenant schema tables and columns with AI analysis and custom mapping overlay\n/g, '');
fs.writeFileSync('server.ts', code);
