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

const aiRoutes = [
    '/api/assistant/summarize',
    '/api/assistant/chat',
    '/api/assistant/tts',
    '/api/assistant/analyze-anomaly'
];

let aiControllersStr = '';
for (const route of aiRoutes) {
    aiControllersStr += extractRoute(route);
}

fs.writeFileSync('ai_routes_extracted.txt', aiControllersStr);
console.log("Extracted AI successfully.");
