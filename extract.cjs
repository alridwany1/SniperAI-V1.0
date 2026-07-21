const fs = require('fs');

const fileContent = fs.readFileSync('server.ts', 'utf8');

function extractRoute(routePath) {
    const lines = fileContent.split('\n');
    let output = '';
    let isInside = false;
    let braceCount = 0;
    
    for (let line of lines) {
        if (line.includes(`app.get("${routePath}"`) || 
            line.includes(`app.post("${routePath}"`) || 
            line.includes(`app.put("${routePath}"`) || 
            line.includes(`app.delete("${routePath}"`)) {
            isInside = true;
            braceCount = 0;
        }
        
        if (isInside) {
            output += line + '\n';
            
            // simple brace matching
            for (let char of line) {
                if (char === '{') braceCount++;
                if (char === '}') braceCount--;
            }
            
            if (braceCount === 0 && line.includes('}')) {
                // assume end of route
                isInside = false;
                output += '\n';
            }
        }
    }
    return output;
}

const tenantRoutes = [
    '/api/tenants', 
    '/api/tenants/test-connection',
    '/api/tenants/:id',
    '/api/tenants/bulk-delete',
    '/api/tenants/:id/diagnostics',
    '/api/tenants/:id/refresh-schema',
    '/api/tenants/:id/schema'
];

let tenantControllersStr = '';
for (const route of tenantRoutes) {
    tenantControllersStr += extractRoute(route);
}

fs.writeFileSync('tenant_routes_extracted.txt', tenantControllersStr);
console.log("Extracted successfully.");
