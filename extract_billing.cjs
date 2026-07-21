const fs = require('fs');
let fileContent = fs.readFileSync('server.ts', 'utf8');

function extractRoute(routePath) {
    const lines = fileContent.split('\n');
    let output = '';
    let isInside = false;
    let braceCount = 0;
    
    for (let line of lines) {
        if (line.includes(`app.post("${routePath}"`) || line.includes(`app.get("${routePath}"`)) {
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

const billingRoutes = [
    '/api/billing/:tenantId',
    '/api/billing/:tenantId/checkout',
    '/api/billing/:tenantId/update-card'
];

let billingControllersStr = '';
for (const route of billingRoutes) {
    billingControllersStr += extractRoute(route);
}

fs.writeFileSync('billing_routes_extracted.txt', billingControllersStr);
console.log("Extracted billing successfully.");
