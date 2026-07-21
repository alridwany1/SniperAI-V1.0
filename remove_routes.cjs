const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const tenantRoutes = [
    '/api/tenants', 
    '/api/tenants/test-connection',
    '/api/tenants/:id',
    '/api/tenants/bulk-delete',
    '/api/tenants/:id/diagnostics',
    '/api/tenants/:id/refresh-schema',
    '/api/tenants/:id/schema'
];

function removeRoute(routePath) {
    const lines = code.split('\n');
    let outputLines = [];
    let isInside = false;
    let braceCount = 0;
    
    for (let line of lines) {
        if (!isInside && (
            line.includes(`app.get("${routePath}"`) || 
            line.includes(`app.post("${routePath}"`) || 
            line.includes(`app.put("${routePath}"`) || 
            line.includes(`app.delete("${routePath}"`))) {
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
                continue; // skip the closing brace line
            }
        } else {
            outputLines.push(line);
        }
    }
    code = outputLines.join('\n');
}

for (const route of tenantRoutes) {
    removeRoute(route);
}

fs.writeFileSync('server.ts', code);
console.log("Removed extracted routes.");
