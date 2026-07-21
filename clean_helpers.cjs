const fs = require('fs');
let lines = fs.readFileSync('src/backend/utils/serverHelpers.ts', 'utf8').split('\n');

let outLines = [];
let skip = false;
for (let line of lines) {
    if (line.includes('dotenv.config();')) {
        skip = true;
    }
    if (skip && line.includes('// Mock Tenants Data')) {
        skip = false;
    }
    
    if (!skip) {
        outLines.push(line);
    }
}
fs.writeFileSync('src/backend/utils/serverHelpers.ts', outLines.join('\n'));
console.log("Cleaned helpers");
