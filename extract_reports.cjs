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

const reportRoutes = [
    '/api/reports/strategic',
    '/api/reports/summarize'
];

let reportControllersStr = '';
for (const route of reportRoutes) {
    reportControllersStr += extractRoute(route);
}

fs.writeFileSync('report_routes_extracted.txt', reportControllersStr);
console.log("Extracted reports successfully.");
