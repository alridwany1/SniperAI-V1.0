const fs = require('fs');
let lines = fs.readFileSync('src/backend/utils/serverHelpers.ts', 'utf8').split('\n');

// Find the line with `export async function checkTableExistence` and delete everything backwards until `export function applyMappingToAnalysis` ends. Wait, applyMappingToAnalysis ends before this?
let startIdx = -1;
let endIdx = -1;

for(let i=0; i<lines.length; i++) {
   if (lines[i].includes('export function applyMappingToAnalysis')) {
       // Find where it ends
       let braces = 0;
       for(let j=i; j<lines.length; j++) {
           if(lines[j].includes('{')) braces += (lines[j].match(/\{/g) || []).length;
           if(lines[j].includes('}')) braces -= (lines[j].match(/\}/g) || []).length;
           if (braces === 0) {
               startIdx = j + 1; // start deleting after applyMappingToAnalysis
               break;
           }
       }
   }
   if (lines[i].includes('export async function checkTableExistence')) {
       endIdx = i; // stop deleting here
       break;
   }
}

if (startIdx !== -1 && endIdx !== -1 && startIdx < endIdx) {
    lines.splice(startIdx, endIdx - startIdx);
    fs.writeFileSync('src/backend/utils/serverHelpers.ts', lines.join('\n'));
    console.log("Fixed route chunk");
} else {
    console.log("Could not find range", startIdx, endIdx);
}
