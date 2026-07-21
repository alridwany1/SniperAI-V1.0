const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const billingRoutes = [
    '/api/billing/:tenantId',
    '/api/billing/:tenantId/checkout',
    '/api/billing/:tenantId/update-card'
];

function removeRoute(routePath) {
    const lines = code.split('\n');
    let outputLines = [];
    let isInside = false;
    let braceCount = 0;
    
    for (let line of lines) {
        if (!isInside && (
            line.includes(`app.post("${routePath}"`) || 
            line.includes(`app.get("${routePath}"`))) {
            isInside = true;
            braceCount = 0;
        }
        
        if (isInside) {
            for (let char of line) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
            }
            if (braceCount === 0 && line.includes('}')) {
                isInside = false;
                continue; 
            }
        } else {
            outputLines.push(line);
        }
    }
    code = outputLines.join('\n');
}

for (const route of billingRoutes) {
    removeRoute(route);
}

fs.writeFileSync('server.ts', code);
console.log("Removed billing routes.");
