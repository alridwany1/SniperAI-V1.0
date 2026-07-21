const fs = require('fs');
let fileContent = fs.readFileSync('server.ts', 'utf8');

function extractRoute(routePath) {
    const lines = fileContent.split('\n');
    let output = '';
    let isInside = false;
    let braceCount = 0;
    
    for (let line of lines) {
        if (line.includes(`app.post("${routePath}"`) || line.includes(`app.get("${routePath}"`) || line.includes(`app.put("${routePath}"`)) {
            isInside = true;
            braceCount = 0;
        }
        
        if (isInside) {
            output += line + '\n';
            for (let char of line) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
            }
            if (braceCount === 0 && line.includes('}')) {
                isInside = false;
                output += '\n';
            }
        }
    }
    return output;
}

const crmRoutes = [
    '/api/crm/sync',
    '/api/crm/sync-history/:tenantId',
    '/api/crm/deals/:tenantId'
];

let crmControllersStr = '';
for (const route of crmRoutes) {
    crmControllersStr += extractRoute(route);
}

fs.writeFileSync('crm_routes_extracted.txt', crmControllersStr);
console.log("Extracted crm successfully.");
