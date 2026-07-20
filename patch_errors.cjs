const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf8');

// Inject useToast if not there
if (!content.includes('useToast()')) {
  content = content.replace(
    /export default function App\(\) \{/,
    `export default function App() {\n  const { showToast } = useToast();\n`
  );
}

// Replace console.error with showToast
content = content.replace(
  /\.catch\(err => console\.error\("Error fetching tenants:", err\)\);/g,
  `.catch(err => { console.error("Error fetching tenants:", err); showToast("Error fetching tenants", "error"); });`
);

content = content.replace(
  /console\.error\("Error loading user profile:", err\);/g,
  `console.error("Error loading user profile:", err); showToast("Error loading user profile", "error");`
);

content = content.replace(
  /\.catch\(err => console\.error\("Error loading metrics:", err\)\);/g,
  `.catch(err => { console.error("Error loading metrics:", err); showToast("Error loading metrics", "error"); });`
);

content = content.replace(
  /\.catch\(err => console\.error\("Error loading CRM deals:", err\)\);/g,
  `.catch(err => { console.error("Error loading CRM deals:", err); showToast("Error loading CRM deals", "error"); });`
);

content = content.replace(
  /console\.error\("Error loading CRM sync history:", err\);/g,
  `console.error("Error loading CRM sync history:", err); showToast("Error loading CRM sync history", "error");`
);

content = content.replace(
  /console\.error\("Manual refresh failed:", err\);/g,
  `console.error("Manual refresh failed:", err); showToast("Manual refresh failed", "error");`
);

content = content.replace(
  /console\.error\("Forecasting failed:", err\);/g,
  `console.error("Forecasting failed:", err); showToast("Forecasting failed", "error");`
);

content = content.replace(
  /console\.error\("Chat failed:", err\);/g,
  `console.error("Chat failed:", err); showToast("Chat failed", "error");`
);

content = content.replace(
  /console\.error\("Auto-summarization failed:", err\);/g,
  `console.error("Auto-summarization failed:", err); showToast("Auto-summarization failed", "error");`
);

content = content.replace(
  /console\.error\("Report generation failed:", err\);/g,
  `console.error("Report generation failed:", err); showToast("Report generation failed", "error");`
);

content = content.replace(
  /console\.error\("CRM Sync failed:", err\);/g,
  `console.error("CRM Sync failed:", err); showToast("CRM Sync failed", "error");`
);

content = content.replace(
  /console\.error\('Failed to link user profile to tenant in Firestore:', err\);/g,
  `console.error('Failed to link user profile to tenant in Firestore:', err); showToast("Failed to link user profile", "error");`
);

content = content.replace(
  /console\.error\("Failed to update tenant products in Firestore:", e\);/g,
  `console.error("Failed to update tenant products in Firestore:", e); showToast("Failed to update tenant products", "error");`
);

// Remove alert() calls
content = content.replace(/alert\(/g, "showToast(");

fs.writeFileSync('src/App.tsx', content);
