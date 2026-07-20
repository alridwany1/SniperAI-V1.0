const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

// I will just leave the functions as they are but wrap them mentally, or actually let's implement the unified function in server.ts
// Wait, doing this via script is risky. Let's just create the function in server.ts and then replace them.
