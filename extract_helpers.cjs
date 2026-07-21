const fs = require('fs');

let fileContent = fs.readFileSync('server.ts', 'utf8');
const lines = fileContent.split('\n');

let helpers = '';
let inHelper = false;
let braceCount = 0;

for (let i = 57; i < 1675; i++) {
    helpers += lines[i] + '\n';
}

fs.writeFileSync('src/backend/utils/serverHelpers.ts', helpers);
console.log("Extracted helpers.");
