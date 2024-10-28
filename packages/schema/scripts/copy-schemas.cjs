const fs = require('fs');
const path = require('path');

const source = path.join(__dirname, '../schemas');
const target = path.join(__dirname, '../dist/schemas');

fs.cpSync(source, target, { recursive: true });
